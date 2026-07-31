"""
shopnode-api models — Pydantic data models (T009)
Single responsibility: type definitions for all shopnode domain objects.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel


# ── Domain Entities ───────────────────────────────────────────────────────────

class Product(BaseModel):
    id: str
    name: str
    price: float
    stock: int
    category: Literal["electronics", "clothing", "food"]


class CartItem(BaseModel):
    productId: str
    quantity: int
    unitPrice: float  # snapshot of price at add time


class Cart(BaseModel):
    userId: str
    items: List[CartItem] = []
    total: float = 0.0


class Order(BaseModel):
    id: str
    userId: str
    cart: Cart
    status: Literal["pending", "confirmed", "failed"] = "pending"
    createdAt: str


class User(BaseModel):
    id: str
    email: str
    passwordHash: str


# ── Request / Response Bodies ─────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str


class AddToCartRequest(BaseModel):
    productId: str
    quantity: int
