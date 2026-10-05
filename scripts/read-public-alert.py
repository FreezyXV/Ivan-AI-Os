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
    value = args.parse_args()
    # Mac/Linux CLI deadline covers DNS and a server dripping response bytes.
    def deadline(_signum, _frame):
        raise SourceError("PUBLIC_SOURCE_TIMEOUT")
    signal.signal(signal.SIGALRM, deadline)
    signal.alarm(15)
    try:
        print(json.dumps(read_source(value.url, topic=value.topic, producer=value.producer), ensure_ascii=False))
    except SourceError as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('{"error":"PUBLIC_SOURCE_UNAVAILABLE"}', file=sys.stderr)
        sys.exit(1)
    finally:
        signal.alarm(0)
