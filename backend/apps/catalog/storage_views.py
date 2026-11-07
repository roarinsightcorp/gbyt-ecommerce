
from botocore.exceptions import ClientError
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound, StreamingHttpResponse
from django.views.decorators.http import require_GET

from .storage import get_storage_client


@require_GET
def catalog_media(request, key):
    # Only allow product catalogue images.
    if not key.startswith("catalog/") or ".." in key or key.startswith("/"):
        return HttpResponseNotFound()

    try:
        result = get_storage_client().get_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=key,
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "")
        if error_code in ("NoSuchKey", "404", "NotFound"):
            return HttpResponseNotFound()
        return HttpResponse("Storage service unavailable", status=502)

    body = result["Body"]
    response = StreamingHttpResponse(
        body.iter_chunks(chunk_size=64 * 1024),
        content_type=result.get("ContentType", "application/octet-stream"),
    )

    if result.get("ContentLength") is not None:
        response["Content-Length"] = str(result["ContentLength"])

    response["Cache-Control"] = "public, max-age=86400"
    response["X-Content-Type-Options"] = "nosniff"
    response._resource_closers.append(body.close)

    return response
