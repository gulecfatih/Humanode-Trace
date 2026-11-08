import os
import sys
import zipfile
import hashlib
import time

sys.stdout.reconfigure(encoding='utf-8')

def compress_db():
    db_file = "humanode_tracker.db"
    zip_file = "humanode_tracker_snapshot.zip"
    
    if not os.path.exists(db_file):
        print(f"Error: {db_file} not found!")
        return

    orig_size_mb = os.path.getsize(db_file) / (1024 * 1024)
    print(f"📦 Compressing {db_file} ({orig_size_mb:.2f} MB)...")
    start = time.time()

    sha256 = hashlib.sha256()
    with open(db_file, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    db_hash = sha256.hexdigest()

    with zipfile.ZipFile(zip_file, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        zipf.write(db_file, arcname="humanode_tracker.db")

    comp_size_mb = os.path.getsize(zip_file) / (1024 * 1024)
    duration = time.time() - start

    print("=" * 60)
    print("✅ SNAPSHOT COMPRESSION COMPLETE")
    print("=" * 60)
    print(f"Original DB Size : {orig_size_mb:,.2f} MB")
    print(f"Compressed Size  : {comp_size_mb:,.2f} MB ({comp_size_mb / orig_size_mb * 100:.1f}% of original)")
    print(f"Output File      : {zip_file}")
    print(f"DB SHA-256       : {db_hash}")
    print(f"Elapsed Time     : {duration:.2f} seconds")
    print("=" * 60)
    print("\n👉 Upload 'humanode_tracker_snapshot.zip' to GitHub Releases as a Release Asset.")

if __name__ == "__main__":
    compress_db()
