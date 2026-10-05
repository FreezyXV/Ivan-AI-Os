"""Export public RSS candidates for Ivan AI OS; never decide or send messages.

The existing scheduled sender stays unchanged until a coordinated cutover.
Only configured public feed URLs enter this adapter, never config.profil.
"""
import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
import html
import json
import re
import signal
from pathlib import Path
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

MAX_BYTES = 800_000
TOPICS = {"ia": "engineering", "tech": "engineering", "finance": "finance", "business": "business"}
FEED_HOSTS = {"hnrss.org", "huggingface.co", "simonwillison.net", "nextjs.org", "www.ecb.europa.eu", "www.producthunt.com"}


class ExportError(Exception):
    pass


def public_url(value):
    u = urllib.parse.urlsplit(value)
    if u.scheme != "https" or not u.hostname or u.username or u.password or u.port or any(c.isspace() for c in value):
        raise ExportError("URL_UNSUPPORTED")
    if u.hostname in {"localhost"} or u.hostname.endswith(".local") or ":" in u.hostname or re.fullmatch(r"[\d.]+", u.hostname):
        raise ExportError("URL_UNSUPPORTED")
    query = [(k,v) for k,v in urllib.parse.parse_qsl(u.query) if not re.match(r"utm_|^(fbclid|gclid|ref)$", k, re.I)]
    return urllib.parse.urlunsplit((u.scheme,u.netloc,u.path,urllib.parse.urlencode(query),""))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        raise ExportError("FEED_REDIRECT_REFUSED")


def fetch_feed(url):
    if urllib.parse.urlsplit(url).hostname not in FEED_HOSTS:
        raise ExportError("FEED_HOST_UNSUPPORTED")
    req = urllib.request.Request(public_url(url), headers={"User-Agent": "Ivan-AI-OS-Sentinelle-collector/1"})
    with urllib.request.build_opener(NoRedirect).open(req, timeout=12) as response:
        data = response.read(MAX_BYTES+1)
        if len(data)>MAX_BYTES:
            raise ExportError("FEED_TOO_LARGE")
        return data


def local(tag):
    return tag.rsplit("}",1)[-1].lower()


def child(entry, names):
    return next((e for e in entry if local(e.tag) in names), None)


def parse_feed(data):
    if not isinstance(data,bytes) or len(data)>MAX_BYTES:
        raise ExportError("FEED_TOO_LARGE")
    if re.search(br"<!DOCTYPE|<!ENTITY",data,re.I):
        raise ExportError("FEED_ENTITY_REFUSED")
    root = ET.fromstring(data)
    for entry in [e for e in root.iter() if local(e.tag) in {"item","entry"}][:30]:
        title = child(entry,{"title"})
        links = [e for e in entry if local(e.tag)=="link" and e.get("rel","alternate")=="alternate"]
        link = links[0] if links else None
        published = child(entry,{"pubdate","published","date"})  # updated is not publication
        content = child(entry,{"description","summary","content","encoded"})
        if title is None or link is None:
            continue
        try:
            url = public_url((link.text or "").strip() or link.get("href",""))
            raw = (published.text or "").strip() if published is not None else ""
            try:
                date = datetime.fromisoformat(raw.replace("Z","+00:00"))
            except ValueError:
                date = parsedate_to_datetime(raw)
            if date.tzinfo is None:
                raise ValueError("missing time zone")
            date = date.astimezone(timezone.utc)
        except (ValueError,TypeError,ExportError):
            yield {"error":"CANDIDATE_DATE_OR_URL_UNVERIFIED"}
            continue
        title_text = " ".join("".join(title.itertext()).split())[:200]
        excerpt = "".join(content.itertext()) if content is not None else ""
        excerpt = " ".join(re.sub(r"<[^>]+>"," ",html.unescape(excerpt)).split())[:1200]
        if title_text:
            yield {"url":url,"title":title_text,"publishedAt":date.isoformat(timespec="milliseconds").replace("+00:00","Z"),"excerpt":excerpt}


def export_candidates(config, *, fetcher=fetch_feed, now=None, max_age_hours=72):
    now = now or datetime.now(timezone.utc)
    result = {"version":1,"producer":"sentinelle","observedAt":now.isoformat(timespec="milliseconds").replace("+00:00","Z"),
              "items":[],"errors":[],"excluded":{"stale":0,"unverified":0,"duplicate":0},"decision_calls":0,"telegram_messages":0}
    seen = set()
    for name,theme in config.get("themes",{}).items():
        if name not in TOPICS:
            continue
        for feed in theme.get("flux",[]):
            try:
                for item in parse_feed(fetcher(public_url(feed))):
                    if "error" in item:
                        result["excluded"]["unverified"]+=1
                        continue
                    published = datetime.fromisoformat(item["publishedAt"].replace("Z","+00:00"))
                    age = (now-published).total_seconds()
                    if age>max_age_hours*3600:
                        result["excluded"]["stale"]+=1
                        continue
                    if age < -300:
                        result["excluded"]["unverified"]+=1
                        continue
                    if item["url"] in seen:
                        result["excluded"]["duplicate"]+=1
                        continue
                    seen.add(item["url"])
                    result["items"].append({**item,"producer":"sentinelle","scope":"public","topic":TOPICS[name],
                                            "observedAt":result["observedAt"],"sourceStatus":"title-only","feedUrl":feed})
            except Exception as exc:
                if isinstance(exc, ExportError) and str(exc)=="COLLECTION_TIMEOUT":
                    raise
                result["errors"].append({"feedId":hashlib.sha256(str(feed).encode()).hexdigest()[:16],"code":"FEED_UNAVAILABLE"})
    result["items"].sort(key=lambda i:i["publishedAt"],reverse=True)
    result["items"] = result["items"][:100]
    return result


if __name__ == "__main__":
    cli = argparse.ArgumentParser()
    cli.add_argument("--config",default=str(Path(__file__).with_name("config.json")))
    cli.add_argument("--output",required=True)
    args = cli.parse_args()
    def deadline(_signum,_frame):
        raise ExportError("COLLECTION_TIMEOUT")
    signal.signal(signal.SIGALRM,deadline)
    signal.alarm(120)
    try:
        value = export_candidates(json.loads(Path(args.config).read_text()))
        # Never overwrite an earlier artifact; the workflow uses a fresh folder.
        with Path(args.output).open("x",encoding="utf-8") as out:
            json.dump(value,out,ensure_ascii=False)
        print(json.dumps({"exported":len(value["items"]),"failed_feeds":len(value["errors"]),"excluded":value["excluded"],"decision_calls":0,"telegram_messages":0}))
    except Exception:
        print('{"error":"CANDIDATE_EXPORT_FAILED"}')
        raise SystemExit(1)
    finally:
        signal.alarm(0)
