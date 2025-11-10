from motor.motor_asyncio import AsyncIOMotorClient

from config import MONGO_URI

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set.")

client = AsyncIOMotorClient(MONGO_URI)  # type: ignore


def get_db():
    return client.get_database("ATS_Test")
