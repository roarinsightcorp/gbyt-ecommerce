
import boto3
from botocore.config import Config
from django.conf import settings


def get_storage_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_DEFAULT_REGION,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
    )
