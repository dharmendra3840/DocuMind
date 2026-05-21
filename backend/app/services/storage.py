import os
import uuid
import aiofiles
from pathlib import Path
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def upload_file(file_bytes: bytes, filename: str, doc_id: uuid.UUID) -> str:
    """Upload file and return the storage key."""
    key = f"documents/{doc_id}/{filename}"

    if settings.storage_backend == "s3":
        return await _upload_to_s3(file_bytes, key)
    else:
        return await _upload_to_local(file_bytes, key)


async def delete_file(s3_key: str) -> None:
    if settings.storage_backend == "s3":
        await _delete_from_s3(s3_key)
    else:
        await _delete_from_local(s3_key)


async def _upload_to_local(file_bytes: bytes, key: str) -> str:
    upload_dir = Path(settings.local_upload_dir) / Path(key).parent
    upload_dir.mkdir(parents=True, exist_ok=True)
    full_path = Path(settings.local_upload_dir) / key
    async with aiofiles.open(full_path, "wb") as f:
        await f.write(file_bytes)
    logger.info("file_saved_locally", key=key)
    return key


async def _delete_from_local(key: str) -> None:
    full_path = Path(settings.local_upload_dir) / key
    if full_path.exists():
        full_path.unlink()


async def _upload_to_s3(file_bytes: bytes, key: str) -> str:
    import boto3
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )
    s3.put_object(Bucket=settings.aws_s3_bucket, Key=key, Body=file_bytes)
    logger.info("file_uploaded_s3", key=key)
    return key


async def _delete_from_s3(key: str) -> None:
    import boto3
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )
    s3.delete_object(Bucket=settings.aws_s3_bucket, Key=key)
