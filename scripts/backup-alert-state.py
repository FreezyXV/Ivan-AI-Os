"""Online SQLite snapshot plus its immutable evidence blobs. Never overwrite live state."""
import argparse
import hashlib
import gzip
import io
import json
import os
from pathlib import Path
import re
import sqlite3
import stat


def private_file(file):
    s = file.lstat()
    if not stat.S_ISREG(s.st_mode) or s.st_nlink != 1 or s.st_uid != os.getuid() or s.st_mode & 0o077:
        raise ValueError('ALERT_BACKUP_SOURCE_INVALID')


def private_dir(directory):
    s = directory.lstat()
    if not stat.S_ISDIR(s.st_mode) or s.st_uid != os.getuid() or s.st_mode & 0o077:
        raise ValueError('ALERT_BACKUP_DIRECTORY_INVALID')
    if any((parent / '.git').exists() for parent in (directory, *directory.parents)):
        raise ValueError('ALERT_BACKUP_IN_REPOSITORY')


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def verify(directory):
    directory = Path(directory)
    private_dir(directory)
    manifest_file = directory / 'backup.json'
    private_file(manifest_file)
    manifest = json.loads(manifest_file.read_text())
    if manifest.get('version') != 1 or not isinstance(manifest.get('archives'), dict):
        raise ValueError('ALERT_BACKUP_INVALID')
    database = directory / 'alerts.sqlite'
    private_file(database)
    if digest(database) != manifest.get('database_sha256'):
        raise ValueError('ALERT_BACKUP_CHECKSUM_FAILED')
    for name, sha in manifest['archives'].items():
        if not re.fullmatch(r'[a-f0-9]{64}\.json\.gz', name):
            raise ValueError('ALERT_BACKUP_INVALID')
        private_dir(directory / 'archive')
        file = directory / 'archive' / name
        private_file(file)
        if digest(file) != sha:
            raise ValueError('ALERT_BACKUP_CHECKSUM_FAILED')
        with gzip.GzipFile(fileobj=io.BytesIO(file.read_bytes())) as compressed:
            raw = compressed.read(1_000_001)
        if len(raw) > 1_000_000 or json.loads(raw).get('version') != 1:
            raise ValueError('ALERT_BACKUP_INVALID')
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as db:
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('ALERT_BACKUP_INVALID')
        refs = [json.loads(r[0]) for r in db.execute('SELECT archive FROM alerts WHERE archive IS NOT NULL')]
        if {r['filename']: r['sha256'] for r in refs} != manifest['archives']:
            raise ValueError('ALERT_BACKUP_INVALID')
        if dict(db.execute('SELECT state,count(*) FROM alerts GROUP BY state')) != manifest['counts']:
            raise ValueError('ALERT_BACKUP_INVALID')
    return {'status': 'VERIFIED', 'counts': manifest['counts'], 'archives': len(manifest['archives'])}


def backup(source, output):
    source, output = Path(source), Path(output)
    if not source.is_absolute() or not output.is_absolute():
        raise ValueError('ALERT_BACKUP_PATH_INVALID')
    private_dir(source)
    private_file(source / 'alerts.sqlite')
    private_dir(output.parent)
    output.mkdir(mode=0o700)  # New directory only; repeated commands never replace a backup.
    database = output / 'alerts.sqlite'
    with database.open('xb'):
        os.chmod(database, 0o600)
    with sqlite3.connect((source / 'alerts.sqlite').as_uri() + '?mode=ro', uri=True) as live:
        with sqlite3.connect(database) as saved:
            live.backup(saved)
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as saved:
        refs = [json.loads(r[0]) for r in saved.execute('SELECT archive FROM alerts WHERE archive IS NOT NULL')]
        counts = dict(saved.execute('SELECT state, count(*) FROM alerts GROUP BY state'))
    archives = {}
    if refs:
        private_dir(source / 'archive')
        (output / 'archive').mkdir(mode=0o700)
    for ref in refs:
        name, sha = ref['filename'], ref['sha256']
        if not re.fullmatch(r'[a-f0-9]{64}\.json\.gz', name):
            raise ValueError('ALERT_BACKUP_INVALID')
        src = source / 'archive' / name
        private_file(src)
        if digest(src) != sha:
            raise ValueError('ALERT_BACKUP_CHECKSUM_FAILED')
        if name not in archives:
            with (output / 'archive' / name).open('xb') as dest:
                os.chmod(dest.name, 0o600)
                dest.write(src.read_bytes())
            archives[name] = sha
    manifest = {'version': 1, 'database_sha256': digest(database), 'archives': archives, 'counts': counts}
    with (output / 'backup.json').open('x') as file:
        os.chmod(file.name, 0o600)
        json.dump(manifest, file)
    return verify(output)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source')
    parser.add_argument('--output')
    parser.add_argument('--verify')
    args = parser.parse_args()
    try:
        if args.verify and not args.source and not args.output:
            result = verify(args.verify)
        elif args.source and args.output and not args.verify:
            result = backup(args.source, args.output)
        else:
            raise ValueError('ALERT_BACKUP_USAGE')
        print(json.dumps(result))
    except Exception as error:
        print(str(error) if re.fullmatch(r'ALERT_[A-Z_]+', str(error)) else 'ALERT_BACKUP_FAILED')
        raise SystemExit(1)
