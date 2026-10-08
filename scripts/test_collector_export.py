import unittest
import urllib.error
from datetime import datetime, timezone
from collector_export import export_candidates, parse_feed, ExportError, fetch_feed

NOW = datetime(2026,10,5,9,tzinfo=timezone.utc)
RSS = b'''<rss><channel><item><title>Un changement utile</title><link>https://example.org/article?utm_source=feed</link>
<pubDate>Mon, 05 Oct 2026 08:00:00 GMT</pubDate><description>Un extrait RSS public avec une preuve.</description></item></channel></rss>'''
ATOM = b'''<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Un article ancien</title><link rel="self" href="https://example.org/self"/>
<link rel="alternate" href="https://example.org/article"/><published>2026-09-23T10:00:00Z</published><updated>2026-10-05T08:00:00Z</updated></entry></feed>'''


class ExportTests(unittest.TestCase):
    def test_rate_limits_timeout_and_changed_feeds_have_distinct_safe_causes(self):
        cfg={'themes':{'tech':{'flux':['https://example.org/feed']}}}
        for error,code in [(urllib.error.HTTPError('https://example.org/feed',429,'PRIVATE',{},None),'FEED_RATE_LIMITED'),
                           (urllib.error.HTTPError('https://example.org/feed',503,'PRIVATE',{},None),'FEED_HTTP_UNAVAILABLE'),
                           (TimeoutError('PRIVATE'),'FEED_TIMEOUT'),(ExportError('FEED_TOO_LARGE'),'FEED_TOO_LARGE')]:
            def fetcher(_):raise error
            value=export_candidates(cfg,fetcher=fetcher,now=NOW)
            self.assertEqual(value['errors'][0]['code'],code)
            self.assertNotIn('PRIVATE',str(value))

    def test_security_and_central_bank_windows_are_applied_before_feed_exclusion(self):
        old = RSS.replace(b'05 Oct', b'30 Sep').replace(b'Mon, ', b'Wed, ')
        config = {'themes': {'tech': {'flux': ['https://example.org/rss']}}}
        for url, expected in [('https://nextjs.org/blog/september-2026-security-release', 1),
            ('https://www.ecb.europa.eu/press/key/date/2026/html/example.html', 1),
            ('https://example.org/security-update', 0)]:
            with self.subTest(url=url):
                page = old.replace(b'https://example.org/article?utm_source=feed', url.encode())
                value = export_candidates(config, fetcher=lambda _: page, now=NOW)
                self.assertEqual(len(value['items']), expected)

    def test_rss_and_atom_preserve_publication_dates_and_canonical_links(self):
        rss = list(parse_feed(RSS))[0]
        self.assertEqual(rss["url"],"https://example.org/article")
        atom = list(parse_feed(ATOM))[0]
        self.assertEqual(atom["publishedAt"],"2026-09-23T10:00:00.000Z")
        self.assertEqual(atom["url"],"https://example.org/article")

    def test_export_never_contains_profile_credentials_or_claims_page_read(self):
        cfg = {"profil":"DO_NOT_EXPORT_PRIVATE_CONTEXT","themes":{"ia":{"flux":["https://example.org/rss"],"description":"DO_NOT_EXPORT"}}}
        result = export_candidates(cfg,fetcher=lambda _:RSS,now=NOW)
        self.assertEqual(len(result["items"]),1)
        self.assertEqual(result["items"][0]["sourceStatus"],"title-only")
        self.assertNotIn("readAt",result["items"][0])
        self.assertNotIn("DO_NOT_EXPORT",str(result))
        self.assertEqual(result["decision_calls"],0)
        self.assertEqual(result["telegram_messages"],0)

    def test_stale_unknown_future_duplicate_and_failed_feeds_remain_visible(self):
        cfg = {"themes":{"tech":{"flux":["https://example.org/a","https://example.org/b","https://example.org/c"]}}}
        def fetcher(url):
            if url.endswith('/c'): raise RuntimeError('secret diagnostic')
            return RSS if url.endswith('/a') else RSS+ b''
        value = export_candidates(cfg,fetcher=fetcher,now=NOW)
        self.assertEqual(value["excluded"]["duplicate"],1)
        self.assertEqual(len(value["errors"]),1)
        self.assertNotIn('secret diagnostic',str(value))
        for data,key in [(ATOM,'stale'),(RSS.replace(b'05 Oct',b'06 Oct'),'unverified'),(RSS.replace(b'pubDate',b'unknown'),'unverified')]:
            value=export_candidates({"themes":{"tech":{"flux":["https://example.org/a"]}}},fetcher=lambda _:data,now=NOW)
            self.assertEqual(value["excluded"][key],1)
            self.assertEqual(value["items"],[])

    def test_expanding_entities_and_oversized_feeds_are_refused(self):
        for data in [b'<!DOCTYPE feed><feed/>',b'<!ENTITY x "secret"><feed/>',b'x'*800001]:
            with self.assertRaises(Exception): list(parse_feed(data))

    def test_overall_deadline_is_not_swallowed_as_one_feed_failure(self):
        def timeout(_): raise ExportError('COLLECTION_TIMEOUT')
        with self.assertRaises(ExportError):
            export_candidates({'themes':{'tech':{'flux':['https://example.org/a']}}},fetcher=timeout,now=NOW)
        with self.assertRaises(ExportError): fetch_feed('https://unknown.example.org/feed')


if __name__ == '__main__':
    unittest.main()
