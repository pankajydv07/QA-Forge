"""
shopnode-api main.py — FastAPI app with in-memory store (T008)
Single responsibility: app factory, in-memory data initialization, router mounting.
"""
import uuid
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import Product, Cart, Order, User

# ── In-Memory Store ────────────────────────────────────────────────────────────

PRODUCTS: dict[str, Product] = {
    "p-001": Product(id="p-001", name="Wireless Headphones", price=79.99, stock=50, category="electronics"),
    "p-002": Product(id="p-002", name="Cotton T-Shirt", price=19.99, stock=200, category="clothing"),
    "p-003": Product(id="p-003", name="Organic Coffee Beans", price=14.99, stock=100, category="food"),
}

USERS: dict[str, dict] = {
    "user@test.com": {
        "id": "u-001",
        "email": "user@test.com",
        "password": "password123",  # plaintext for demo only
    }
}

CARTS: dict[str, Cart] = {}   # keyed by userId
ORDERS: dict[str, Order] = {}  # keyed by orderId


# ── App Factory ────────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(title="shopnode API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from routers.auth import router as auth_router
    from routers.products import router as products_router
    from routers.cart import router as cart_router
    from routers.orders import router as orders_router

    app.include_router(auth_router)
    app.include_router(products_router)
    app.include_router(cart_router)
    app.include_router(orders_router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
