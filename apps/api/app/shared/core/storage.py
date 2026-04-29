import logging
import uuid
from datetime import datetime

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)
_s3_client = None


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
    return _s3_client


def upload_file(
    file_bytes: bytes,
    content_type: str,
    folder: str = "avatars",
) -> str:
    client = get_s3_client()
    key = f"{folder}/{datetime.utcnow().strftime('%Y/%m')}/{uuid.uuid4().hex}"
    ext = content_type.split("/")[-1]
    if ext in ("jpeg", "jpg", "png", "gif", "webp"):
        key = f"{key}.{ext}"

    try:
        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        logger.info(
            "Uploaded file to R2: bucket=%s key=%s", settings.R2_BUCKET_NAME, key
        )
    except ClientError as exc:
        logger.error("Failed to upload to R2: %s", exc)
        raise

    if settings.R2_PUBLIC_URL:
        url = f"{settings.R2_PUBLIC_URL.rstrip('/')}/{key}"
        logger.info("Returning public URL: %s", url)
        return url
    url = f"{settings.R2_ENDPOINT.rstrip('/')}/{settings.R2_BUCKET_NAME}/{key}"
    logger.info("Returning endpoint URL: %s", url)
    return url


def delete_file(url: str) -> None:
    if not settings.R2_PUBLIC_URL:
        return
    prefix = settings.R2_PUBLIC_URL.rstrip("/") + "/"
    if not url.startswith(prefix):
        return
    key = url[len(prefix) :]
    client = get_s3_client()
    try:
        client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
    except ClientError:
        pass
