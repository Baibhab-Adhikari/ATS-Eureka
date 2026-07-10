import logging
from typing import BinaryIO
import boto3
from botocore.exceptions import ClientError
from services.storage_service import StorageService

logger = logging.getLogger(__name__)

class S3StorageProvider(StorageService):
    def __init__(self, bucket_name: str, access_key_id: str, secret_access_key: str, region_name: str):
        self.bucket_name = bucket_name
        from botocore.config import Config
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name=region_name,
            config=Config(signature_version="s3v4")
        )

    async def save(self, file_obj: BinaryIO, filename: str) -> str:
        s3_key = f"uploads/{filename}"
        
        # Determine content type based on extension
        content_type = "application/octet-stream"
        lower = filename.lower()
        if lower.endswith(".pdf"):
            content_type = "application/pdf"
        elif lower.endswith(".docx"):
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_obj.read(),
                ContentType=content_type,
            )
            return s3_key
        except ClientError as exc:
            logger.error(f"Failed to upload file to S3: {exc}")
            raise RuntimeError(f"Failed to upload file to S3: {exc}") from exc

    async def get(self, file_path: str) -> BinaryIO:
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_path)
            return response['Body']
        except ClientError as exc:
            logger.error(f"Failed to get file from S3: {exc}")
            raise FileNotFoundError(f"File {file_path} not found in S3.") from exc

    async def delete(self, file_path: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_path)
            return True
        except ClientError as exc:
            logger.error(f"Failed to delete file from S3: {exc}")
            return False

    def get_url(self, file_path: str, expires_in: int = 3600) -> str | None:
        try:
            filename = file_path.split('/')[-1]
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.bucket_name, 
                    "Key": file_path,
                    "ResponseContentDisposition": f"attachment;filename={filename}"
                },
                ExpiresIn=expires_in,
            )
            return url
        except ClientError as exc:
            logger.error(f"Failed to generate presigned URL: {exc}")
            return None
