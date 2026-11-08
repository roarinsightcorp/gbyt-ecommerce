import mimetypes
import uuid
from pathlib import Path
from urllib.parse import quote

import requests
from django.conf import settings


class BunnyStorageError(Exception):
    """Raised when a Bunny Storage operation fails."""


class BunnyStorageService:
    """
    Server-side service for Bunny Storage and Bunny CDN.

    Bunny credentials never leave the backend.
    """

    def __init__(self):
        self.storage_zone = settings.BUNNY_STORAGE_ZONE
        self.access_key = settings.BUNNY_STORAGE_ACCESS_KEY
        self.storage_endpoint = settings.BUNNY_STORAGE_ENDPOINT.rstrip("/")
        self.cdn_hostname = settings.BUNNY_CDN_HOSTNAME.rstrip("/")

        if not self.storage_zone:
            raise BunnyStorageError(
                "BUNNY_STORAGE_ZONE is not configured."
            )

        if not self.access_key:
            raise BunnyStorageError(
                "BUNNY_STORAGE_ACCESS_KEY is not configured."
            )

        if not self.cdn_hostname:
            raise BunnyStorageError(
                "BUNNY_CDN_HOSTNAME is not configured."
            )

    def _storage_url(self, object_key: str) -> str:
        """
        Build the Bunny Storage API URL.

        Example:
        https://storage.bunnycdn.com/gbyt-production-media/products/1/image.jpg
        """
        clean_key = object_key.strip("/")

        return (
            f"{self.storage_endpoint}/"
            f"{quote(self.storage_zone, safe='')}/"
            f"{quote(clean_key, safe='/')}"
        )

    def _cdn_url(self, object_key: str) -> str:
        """
        Build the public Bunny CDN URL.
        """
        clean_key = object_key.strip("/")

        return (
            f"https://{self.cdn_hostname}/"
            f"{quote(clean_key, safe='/')}"
        )

    @staticmethod
    def _content_type(filename: str) -> str:
        """
        Determine MIME type from filename.

        Falls back to application/octet-stream when
        the extension is unknown.
        """
        content_type, _ = mimetypes.guess_type(filename)

        return content_type or "application/octet-stream"

    @staticmethod
    def _safe_filename(filename: str) -> str:
        """
        Keep only the filename component and normalize whitespace.
        """
        name = Path(filename).name.strip()

        if not name:
            raise BunnyStorageError(
                "A valid filename is required."
            )

        return name.replace(" ", "-")

    def build_object_key(
        self,
        *,
        product_id: int,
        filename: str,
        directory: str = "products",
    ) -> str:
        """
        Generate a unique Bunny object path.

        Example:
        products/12/550e8400-e29b-41d4-a716-446655440000-image.jpg
        """
        safe_filename = self._safe_filename(filename)
        unique_id = uuid.uuid4()

        return (
            f"{directory.strip('/')}/"
            f"{product_id}/"
            f"{unique_id}-{safe_filename}"
        )

    def upload(
        self,
        *,
        object_key: str,
        content: bytes,
        content_type: str | None = None,
    ) -> str:
        """
        Upload bytes to Bunny Storage.

        Returns the public Bunny CDN URL.
        """
        if not content:
            raise BunnyStorageError(
                "Cannot upload an empty file."
            )

        url = self._storage_url(object_key)

        headers = {
            "AccessKey": self.access_key,
            "Content-Type": (
                content_type
                or self._content_type(object_key)
            ),
        }

        try:
            response = requests.put(
                url,
                headers=headers,
                data=content,
                timeout=60,
            )
        except requests.RequestException as exc:
            raise BunnyStorageError(
                f"Bunny Storage upload failed: {exc}"
            ) from exc

        if not response.ok:
            raise BunnyStorageError(
                "Bunny Storage upload failed "
                f"with HTTP {response.status_code}: "
                f"{response.text[:500]}"
            )

        return self._cdn_url(object_key)

    def delete(self, object_key: str) -> None:
        """
        Delete an object from Bunny Storage.
        """
        url = self._storage_url(object_key)

        headers = {
            "AccessKey": self.access_key,
        }

        try:
            response = requests.delete(
                url,
                headers=headers,
                timeout=60,
            )
        except requests.RequestException as exc:
            raise BunnyStorageError(
                f"Bunny Storage delete failed: {exc}"
            ) from exc

        if response.status_code not in (200, 204):
            raise BunnyStorageError(
                "Bunny Storage delete failed "
                f"with HTTP {response.status_code}: "
                f"{response.text[:500]}"
            )

    def get_cdn_url(self, object_key: str) -> str:
        """
        Return the public CDN URL for an existing object.
        """
        return self._cdn_url(object_key)


bunny_storage = BunnyStorageService()