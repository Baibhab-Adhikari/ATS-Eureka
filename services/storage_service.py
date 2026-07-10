import os
from abc import ABC, abstractmethod
from typing import BinaryIO

class StorageService(ABC):
    @abstractmethod
    async def save(self, file_obj: BinaryIO, filename: str) -> str:
        """Save file and return the access path/URI."""
        pass

    @abstractmethod
    async def get(self, file_path: str) -> BinaryIO:
        """Retrieve the file as a binary stream."""
        pass

    @abstractmethod
    async def delete(self, file_path: str) -> bool:
        """Delete the file from storage."""
        pass

    @abstractmethod
    def get_url(self, file_path: str, expires_in: int = 3600) -> str | None:
        """Get a presigned URL if applicable. Returns None for local storage."""
        pass


class LocalStorageProvider(StorageService):
    def __init__(self, base_dir: str = "uploads/resumes"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    async def save(self, file_obj: BinaryIO, filename: str) -> str:
        file_path = os.path.join(self.base_dir, filename)
        with open(file_path, "wb") as f:
            f.write(file_obj.read())
        return file_path

    async def get(self, file_path: str) -> BinaryIO:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_path} not found.")
        return open(file_path, "rb")

    async def delete(self, file_path: str) -> bool:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

    def get_url(self, file_path: str, expires_in: int = 3600) -> str | None:
        return None
