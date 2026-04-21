from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Meta(BaseModel):
    total: int
    page: int
    per_page: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: Meta


class ErrorResponse(BaseModel):
    error: str
    detail: str
    code: str
