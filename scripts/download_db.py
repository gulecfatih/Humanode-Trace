import os
import sys
import zipfile
import urllib.request
import argparse
import time

sys.stdout.reconfigure(encoding='utf-8')

DEFAULT_RELEASE_URL = "https://github.com/gulecfatih/Humanode-Trace/releases/latest/download/humanode_tracker_snapshot.zip"

def download_with_progress(url, dest_path):
    print(f"📥 Downloading snapshot from:\n   {url}")
    start = time.time()

    def report(count, block_size, total_size):
        if total_size > 0:
            percent = int(count * block_size * 100 / total_size)
            downloaded_mb = (count * block_size) / (1024 * 1024)
            total_mb = total_size / (1024 * 1024)
            sys.stdout.write(f"\r   [{percent:3d}%] {downloaded_mb:.1f} MB / {total_mb:.1f} MB")
            sys.stdout.flush()

    try:
        urllib.request.urlretrieve(url, dest_path, reporthook=report)
        print(f"\n✅ Download completed in {time.time() - start:.2f} seconds.")
        return True
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        return False

def extract_snapshot(zip_path, extract_to="."):
    print(f"📦 Extracting {zip_path}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        print("✅ Database successfully extracted to 'humanode_tracker.db'!")
        return True
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Download and extract Humanode Tracker database snapshot.")
    parser.add_argument("--url", default=None, help="Custom snapshot ZIP URL (GitHub Release, S3, or GDrive link).")
    parser.add_argument("--force", action="store_true", help="Overwrite existing humanode_tracker.db if present.")
    parser.add_argument("--keep-zip", action="store_true", help="Do not delete the downloaded zip file after extraction.")
    args = parser.parse_args()

    db_path = "humanode_tracker.db"
    if os.path.exists(db_path) and not args.force:
        print(f"⚠️  '{db_path}' already exists ({os.path.getsize(db_path) / (1024*1024):.2f} MB).")
        confirm = input("Do you want to overwrite it? (y/N): ").strip().lower()
        if confirm != 'y':
            print("Aborted.")
            return

    url = args.url or os.environ.get("SNAPSHOT_URL") or DEFAULT_RELEASE_URL
    zip_dest = "humanode_tracker_snapshot.zip"

    # If local zip file exists, ask to use it
    if os.path.exists(zip_dest) and not args.url:
        print(f"ℹ️  Found local snapshot: '{zip_dest}' ({os.path.getsize(zip_dest)/(1024*1024):.2f} MB).")
        extract_snapshot(zip_dest)
        return

    success = download_with_progress(url, zip_dest)
    if success:
        if extract_snapshot(zip_dest):
            if not args.keep_zip:
                try:
                    os.remove(zip_dest)
                    print(f"🧹 Cleaned up temporary archive '{zip_dest}'.")
                except Exception:
                    pass
            print("\n🎉 Setup complete! You can now start the .NET backend and Next.js frontend.")

if __name__ == "__main__":
    main()
