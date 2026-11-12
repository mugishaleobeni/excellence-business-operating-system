"""
In-memory PyMongo collection & database fallback adapter.
Used automatically when running in an offline/sandboxed environment or when
MongoDB Atlas DNS/network is temporarily unreachable so the application never crashes.
"""

import copy
from typing import Any
from bson import ObjectId


def _matches_filter(doc: dict[str, Any], query: dict[str, Any]) -> bool:
    if not query:
        return True
    for key, expected in query.items():
        if doc.get(key) != expected:
            return False
    return True


class InMemoryCursor:
    def __init__(self, docs: list[dict[str, Any]]):
        self._docs = docs

    def sort(self, key: str, direction: int = 1) -> "InMemoryCursor":
        reverse = direction < 0
        self._docs.sort(key=lambda d: str(d.get(key, "")), reverse=reverse)
        return self

    def limit(self, count: int) -> "InMemoryCursor":
        self._docs = self._docs[:count]
        return self

    def __iter__(self):
        return iter(self._docs)


class DeleteResult:
    def __init__(self, count: int):
        self.deleted_count = count


class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self._rows: list[dict[str, Any]] = []

    def create_index(self, *args, **kwargs) -> str:
        return kwargs.get("name", "idx_mem")

    def count_documents(self, query: dict[str, Any]) -> int:
        return sum(1 for r in self._rows if _matches_filter(r, query))

    def find_one(self, query: dict[str, Any] | None = None, *args, **kwargs) -> dict[str, Any] | None:
        q = query or {}
        matched = [r for r in self._rows if _matches_filter(r, q)]
        sort = kwargs.get("sort")
        if sort:
            for field, direction in reversed(sort):
                matched.sort(key=lambda x: str(x.get(field, "")), reverse=(direction < 0))
        if matched:
            return copy.deepcopy(matched[0])
        return None

    def find(self, query: dict[str, Any] | None = None) -> InMemoryCursor:
        q = query or {}
        matched = [copy.deepcopy(r) for r in self._rows if _matches_filter(r, q)]
        return InMemoryCursor(matched)

    def insert_one(self, doc: dict[str, Any]):
        stored = copy.deepcopy(doc)
        if "_id" not in stored:
            stored["_id"] = ObjectId()
        self._rows.append(stored)
        doc["_id"] = stored["_id"]
        return stored["_id"]

    def update_one(
        self, query: dict[str, Any], update: dict[str, Any], upsert: bool = False
    ):
        set_fields = update.get("$set", {})
        for idx, r in enumerate(self._rows):
            if _matches_filter(r, query):
                self._rows[idx].update(copy.deepcopy(set_fields))
                return
        if upsert:
            new_doc = {**copy.deepcopy(query), **copy.deepcopy(set_fields)}
            if "_id" not in new_doc:
                new_doc["_id"] = ObjectId()
            self._rows.append(new_doc)

    def delete_one(self, query: dict[str, Any]) -> DeleteResult:
        for idx, r in enumerate(self._rows):
            if _matches_filter(r, query):
                del self._rows[idx]
                return DeleteResult(1)
        return DeleteResult(0)

    def delete_many(self, query: dict[str, Any]) -> DeleteResult:
        initial_len = len(self._rows)
        if not query:
            self._rows.clear()
        else:
            self._rows = [r for r in self._rows if not _matches_filter(r, query)]
        return DeleteResult(initial_len - len(self._rows))


class InMemoryDatabase:
    def __init__(self, name: str = "exbos_db"):
        self.name = name
        self._collections: dict[str, InMemoryCollection] = {}

    def __getattr__(self, item: str) -> InMemoryCollection:
        if item not in self._collections:
            self._collections[item] = InMemoryCollection(item)
        return self._collections[item]

    def command(self, cmd: str):
        return {"ok": 1.0, "mode": "in_memory_fallback"}

