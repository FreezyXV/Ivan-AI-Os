import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
import hashlib
import gzip

spec = importlib.util.spec_from_file_location('backup_alert_state', Path(__file__).with_name('backup-alert-state.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / 'source'
        self.source.mkdir(mode=0o700)
        self.db = self.source / 'alerts.sqlite'
        self.db.touch(mode=0o600)
        self.live = sqlite3.connect(self.db)
        self.live.execute('PRAGMA journal_mode=WAL')
        self.live.execute('CREATE TABLE alerts(id TEXT, state TEXT, archive TEXT, receipt TEXT)')
        self.live.executemany('INSERT INTO alerts VALUES(?,?,NULL,?)', [
            ('delivered', 'delivered', '{"messageId":"one"}'), ('unknown', 'delivery_unknown', None)])
        self.live.commit()

    def tearDown(self):
        self.live.close()
        self.temp.cleanup()

    def test_live_wal_snapshot_keeps_receipts_and_unknown_sends_and_never_replaces(self):
        self.live.execute('CREATE TABLE business_fiches(id TEXT PRIMARY KEY, fiche TEXT, score TEXT)')
        self.live.execute('INSERT INTO business_fiches VALUES(?,?,?)',('opportunity','{"statut":"exploratoire"}',None))
        self.live.commit()
        output = self.root / 'backup'
        result = module.backup(self.source, output)
        self.assertEqual(result['counts'], {'delivered': 1, 'delivery_unknown': 1})
        with sqlite3.connect(output / 'alerts.sqlite') as restored:
            self.assertEqual(restored.execute('SELECT receipt FROM alerts WHERE id="delivered"').fetchone()[0], '{"messageId":"one"}')
            self.assertEqual(restored.execute('SELECT fiche,score FROM business_fiches').fetchone(),('{"statut":"exploratoire"}',None))
        before = (output / 'alerts.sqlite').read_bytes()
        with self.assertRaises(FileExistsError):
            module.backup(self.source, output)
        self.assertEqual((output / 'alerts.sqlite').read_bytes(), before)

    def test_only_referenced_archives_are_copied_and_checksum_damage_is_detected(self):
        archives = self.source / 'archive'
        archives.mkdir(mode=0o700)
        content = gzip.compress(json.dumps({'version': 1, 'row': {'id': 'delivered'}}).encode())
        sha = hashlib.sha256(content).hexdigest()
        name = sha + '.json.gz'
        (archives / name).write_bytes(content)
        os.chmod(archives / name, 0o600)
        (archives / 'orphan').write_text('unreferenced interruption')
        self.live.execute('UPDATE alerts SET archive=? WHERE id="delivered"', (json.dumps({'filename': name, 'sha256': sha}),))
        self.live.commit()
        output = self.root / 'backup'
        self.assertEqual(module.backup(self.source, output)['archives'], 1)
        self.assertFalse((output / 'archive/orphan').exists())
        (output / 'archive' / name).write_bytes(b'corrupted')
        with self.assertRaisesRegex(ValueError, 'CHECKSUM'):
            module.verify(output)


if __name__ == '__main__':
    unittest.main()
