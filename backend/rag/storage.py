import os
import mimetypes
import urllib.request
import urllib.error
import json
from typing import Optional, Tuple

class SupabaseStorageManager:
    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        self.service_key = os.environ.get("SUPABASE_SERVICE_KEY", "")
        self.anon_key = os.environ.get("SUPABASE_ANON_KEY", "")
        self.bucket = os.environ.get("SUPABASE_BUCKET", "documents")

    @property
    def is_configured(self) -> bool:
        return bool(self.supabase_url and (self.service_key or self.anon_key))

    def _get_headers(self, content_type: str = "application/octet-stream") -> dict:
        key = self.service_key or self.anon_key
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": content_type
        }

    def upload_file(self, file_bytes: bytes, filename: str, doc_id: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Uploads binary file to Supabase Storage bucket.
        Returns (storage_path, public_or_signed_url) or (None, None) if not configured.
        """
        if not self.is_configured:
            return None, None

        mime_type, _ = mimetypes.guess_type(filename)
        mime_type = mime_type or "application/octet-stream"

        # Safe storage path: doc_id/filename
        safe_filename = filename.replace(" ", "_")
        storage_path = f"{doc_id}/{safe_filename}"
        upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_path}"

        try:
            headers = self._get_headers(content_type=mime_type)
            req = urllib.request.Request(upload_url, data=file_bytes, headers=headers, method="POST")
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 201):
                    # Public URL
                    public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{storage_path}"
                    return storage_path, public_url
        except urllib.error.HTTPError as e:
            # If already exists (409), try updating via PUT
            if e.code == 409 or e.code == 400:
                try:
                    req_put = urllib.request.Request(upload_url, data=file_bytes, headers=headers, method="PUT")
                    with urllib.request.urlopen(req_put) as resp_put:
                        public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{storage_path}"
                        return storage_path, public_url
                except Exception as inner_e:
                    print(f"Supabase storage update error: {inner_e}")
            print(f"Supabase storage upload error ({e.code}): {e.read().decode('utf-8', errors='ignore')}")
        except Exception as e:
            print(f"Failed to upload file to Supabase Storage: {e}")

        return None, None

    def download_file(self, storage_path: str) -> Optional[bytes]:
        """Downloads raw binary file bytes directly from Supabase Storage."""
        if not self.is_configured or not storage_path:
            return None

        download_url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_path}"
        try:
            headers = self._get_headers()
            req = urllib.request.Request(download_url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                if resp.status == 200:
                    return resp.read()
        except Exception as e:
            print(f"Failed to download from Supabase Storage: {e}")
        return None

    def get_signed_url(self, storage_path: str, expires_in: int = 3600) -> Optional[str]:
        """Generates a signed download URL for private files."""
        if not self.is_configured or not storage_path:
            return None

        url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket}/{storage_path}"
        try:
            data = json.dumps({"expiresIn": expires_in}).encode("utf-8")
            headers = self._get_headers(content_type="application/json")
            req = urllib.request.Request(url, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                signed_path = res.get("signedURL")
                if signed_path:
                    return f"{self.supabase_url}/storage/v1{signed_path}"
        except Exception as e:
            print(f"Failed to create signed URL: {e}")
        return None
