"""Bounded reader for one explicitly supported public source; no feed polling.

stdout is a JSON evidence envelope, never a generated summary. Publication day
comes from the page and must agree with its dated permalink. Future adapters
must supply their own parser; unsupported sites are refused, not guessed.
"""
import argparse
import datetime as dt
import hashlib
import json
import re
import signal
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

MAX_BYTES = 400_000
MONTHS = {name: number for number, name in enumerate(
    ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], 1)}


class SourceError(Exception):
    pass


def supports_source(value):
    try:
        u = urllib.parse.urlsplit(value)
        if u.scheme != "https" or u.username or u.password or u.port or u.fragment:
            return False
        if u.hostname == "simonwillison.net":
            return bool(re.fullmatch(r"/\d{4}/[A-Z][a-z]{2}/\d{1,2}/[a-z0-9-]+/", u.path)) and not u.query
        if u.hostname == "huggingface.co":
            return u.path.startswith("/blog/") and not u.query
        if u.hostname == "nextjs.org":
            return u.path.startswith("/blog/") and not u.query
        if u.hostname == "www.ecb.europa.eu":
            return u.path.startswith(("/press/", "//press/")) and u.path.endswith(".html") and not u.query
        if u.hostname == "news.ycombinator.com":
            return u.path == "/item" and bool(re.fullmatch(r"id=\d{1,12}", u.query))
    except ValueError:
        pass
    return False


def source_url(value):
    u = urllib.parse.urlsplit(value)
    if u.scheme != "https" or u.netloc != "simonwillison.net" or u.query or u.fragment:
        raise SourceError("PUBLIC_SOURCE_UNSUPPORTED")
    match = re.fullmatch(r"/(\d{4})/([A-Z][a-z]{2})/(\d{1,2})/([a-z0-9-]+)/", u.path)
    if not match:
        raise SourceError("PUBLIC_SOURCE_UNSUPPORTED")
    try:
        day = dt.datetime.strptime("/".join(match.groups()[:3]), "%Y/%b/%d").date()
    except ValueError as exc:
        raise SourceError("PUBLIC_SOURCE_DATE_INVALID") from exc
    return value, day


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SourceError("PUBLIC_SOURCE_REDIRECT_REFUSED")


def fetch_source(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Ivan-AI-OS-public-reader/1", "Accept": "text/html"})
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=12) as response:
            if response.status != 200 or response.headers.get_content_type() != "text/html":
                raise SourceError("PUBLIC_SOURCE_UNAVAILABLE")
            body = response.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES:
                raise SourceError("PUBLIC_SOURCE_TOO_LARGE")
            return body
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise SourceError("PUBLIC_SOURCE_UNAVAILABLE") from exc


class BlogParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = None
        self.depth = 0
        self.date_depth = 0
        self.paragraph_depth = 0
        self.ignored = 0
        self.date_parts = []
        self.parts = []
        self.stack = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("property") == "og:title":
            self.title = attrs.get("content")
        if tag in {"meta", "img", "br", "hr", "link", "input", "source", "wbr"}:
            return
        classes = attrs.get("class", "").split()
        self.stack.append((self.depth, self.date_depth, self.paragraph_depth, self.ignored))
        if tag == "div" and "entryPage" in classes:
            self.depth = 1
        elif self.depth:
            self.depth += 1
        if self.depth and "entryFooter" in classes:
            self.ignored += 1
        if tag in {"script", "style", "nav", "noscript"}:
            self.ignored += 1
        if self.depth and tag == "p":
            if {"mobile-date", "mobile-date-eyebrow"}.intersection(classes):
                self.date_depth = self.depth
            else:
                self.paragraph_depth = self.depth
                self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"meta", "img", "br", "hr", "link", "input", "source", "wbr"}:
            return
        if self.stack:
            self.depth, self.date_depth, self.paragraph_depth, self.ignored = self.stack.pop()

    def handle_data(self, value):
        if self.depth and not self.ignored:
            if self.date_depth:
                self.date_parts.append(value)
            elif self.paragraph_depth:
                self.parts.append(value)


class ArticleParser(HTMLParser):
    """Extract the explicit content container, never the page's navigation."""
    def __init__(self, host):
        super().__init__(convert_charrefs=True)
        self.host, self.title, self.page_date = host, None, None
        self.stack, self.parts = [], []
        self.active, self.ignored = False, False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            if attrs.get("property") == "og:title": self.title = attrs.get("content")
            if attrs.get("property") == "article:published_time": self.page_date = attrs.get("content")
        if tag in {"meta", "img", "br", "hr", "link", "input", "source", "wbr"}: return
        self.stack.append((self.active, self.ignored))
        classes = set(attrs.get("class", "").split())
        starts = ((self.host == "www.ecb.europa.eu" and tag == "main") or
                  (self.host == "huggingface.co" and "blog-content" in classes) or
                  (self.host == "nextjs.org" and "prose" in classes) or
                  (self.host == "news.ycombinator.com" and "toptext" in classes))
        self.active = self.active or starts
        self.ignored = self.ignored or tag in {"script", "style", "nav", "footer", "aside", "noscript"} or "not-prose" in classes
        if self.active and tag in {"p", "li", "h1", "h2", "h3", "blockquote", "div"}: self.parts.append("\n")
        if self.host == "news.ycombinator.com" and tag == "span" and "age" in classes and self.page_date is None:
            self.page_date = attrs.get("title", "").split(" ")[0]

    def handle_endtag(self, tag):
        if tag in {"meta", "img", "br", "hr", "link", "input", "source", "wbr"}: return
        if self.stack: self.active, self.ignored = self.stack.pop()

    def handle_data(self, value):
        if self.active and not self.ignored: self.parts.append(value)


def read_article(url, *, published_at, title, topic, producer, fetcher=fetch_source, now=None):
    if not supports_source(url): raise SourceError("PUBLIC_SOURCE_UNSUPPORTED")
    host = urllib.parse.urlsplit(url).hostname
    if host == "simonwillison.net":
        return read_source(url, topic=topic, producer=producer, fetcher=fetcher, now=now)
    try:
        published = dt.datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        if published.utcoffset() != dt.timedelta(0): raise ValueError()
    except (ValueError, AttributeError): raise SourceError("PUBLIC_SOURCE_DATE_INVALID")
    body = fetcher(url)
    if not isinstance(body, bytes) or len(body) > MAX_BYTES: raise SourceError("PUBLIC_SOURCE_TOO_LARGE")
    try:
        parser = ArticleParser(host)
        parser.feed(body.decode("utf-8", errors="strict"))
        text = " ".join("".join(parser.parts).split())
        if len(text) < 40: raise SourceError("PUBLIC_SOURCE_CONTENT_UNAVAILABLE")
        page_date = parser.page_date
        if not page_date:
            match = re.search(r'"datePublished"\s*:\s*"([^"<]+)"', body.decode("utf-8"))
            page_date = match[1] if match else None
        if not page_date or page_date[:10] != published_at[:10]: raise SourceError("PUBLIC_SOURCE_DATE_UNVERIFIED")
        if not title or len(title) > 200: raise SourceError("PUBLIC_SOURCE_INPUT_INVALID")
    except (UnicodeError, ValueError): raise SourceError("PUBLIC_SOURCE_CONTENT_UNAVAILABLE")
    observed = (now or dt.datetime.now(dt.timezone.utc)).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    return {"item": {"producer": producer, "url": url, "title": parser.title or title, "topic": topic,
            "scope": "public", "publishedAt": published_at, "observedAt": observed, "readAt": observed,
            "sourceStatus": "read", "excerpt": text[:1200]},
            "sourceReceipt": {"url": url, "readAt": observed, "publicationPrecision": "feed-and-page-day",
            "publishedDay": published_at[:10], "responseSha256": hashlib.sha256(body).hexdigest(),
            "bodyBytes": len(body), "extractor": "public-article-v1"}}


def read_source(url, *, topic="system", producer="sentinelle-pilot", fetcher=fetch_source, now=None):
    url, day = source_url(url)
    if topic not in {"business", "finance", "engineering", "system", "other"} or not re.fullmatch(r"[a-z][a-z0-9-]{1,31}", producer):
        raise SourceError("PUBLIC_SOURCE_INPUT_INVALID")
    body = fetcher(url)
    if not isinstance(body, bytes) or len(body) > MAX_BYTES:
        raise SourceError("PUBLIC_SOURCE_TOO_LARGE")
    try:
        parser = BlogParser()
        parser.feed(body.decode("utf-8", errors="strict"))
        date_text = " ".join("".join(parser.date_parts).split())
        match = re.fullmatch(r"(\d{1,2})(?:st|nd|rd|th)? ([A-Za-z]+) (\d{4})", date_text)
        page_day = dt.date(int(match[3]), MONTHS[match[2]], int(match[1])) if match else None
        if page_day != day:
            raise SourceError("PUBLIC_SOURCE_DATE_UNVERIFIED")
        text = " ".join("".join(parser.parts).split())
        if not parser.title or len(parser.title) > 200 or len(text) < 20:
            raise SourceError("PUBLIC_SOURCE_CONTENT_UNAVAILABLE")
    except (UnicodeError, ValueError, KeyError) as exc:
        raise SourceError("PUBLIC_SOURCE_CONTENT_UNAVAILABLE") from exc
    observed = (now or dt.datetime.now(dt.timezone.utc)).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    item = {"producer": producer, "url": url, "title": parser.title, "topic": topic, "scope": "public",
            "publishedAt": day.isoformat() + "T00:00:00Z", "observedAt": observed, "readAt": observed,
            "sourceStatus": "read", "excerpt": text[:1200]}
    receipt = {"url": url, "readAt": observed, "publicationPrecision": "day", "publishedDay": day.isoformat(),
               "responseSha256": hashlib.sha256(body).hexdigest(), "bodyBytes": len(body), "extractor": "simon-blog-v1"}
    return {"item": item, "sourceReceipt": receipt}


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("url")
    args.add_argument("--topic", default="system")
    args.add_argument("--producer", default="sentinelle-pilot")
    args.add_argument("--published-at")
    args.add_argument("--title")
    value = args.parse_args()
    # Mac/Linux CLI deadline covers DNS and a server dripping response bytes.
    def deadline(_signum, _frame):
        raise SourceError("PUBLIC_SOURCE_TIMEOUT")
    signal.signal(signal.SIGALRM, deadline)
    signal.alarm(15)
    try:
        evidence = read_article(value.url, published_at=value.published_at, title=value.title,
                    topic=value.topic, producer=value.producer) if value.published_at else read_source(
                    value.url, topic=value.topic, producer=value.producer)
        print(json.dumps(evidence, ensure_ascii=False))
    except SourceError as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('{"error":"PUBLIC_SOURCE_UNAVAILABLE"}', file=sys.stderr)
        sys.exit(1)
    finally:
        signal.alarm(0)
