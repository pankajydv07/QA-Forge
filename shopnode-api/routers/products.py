"""
shopnode-api products router (T011)
Single responsibility: GET /products (list), GET /products/:id (detail), auth required.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List

from models import Product
from main import PRODUCTS

router = APIRouter(prefix="/products", tags=["products"])
security = HTTPBearer()


def _require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Minimal JWT presence check — real validation is in auth router."""
    if not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return credentials.credentials


@router.get("", response_model=List[Product])
def list_products(token: str = Depends(_require_auth)):
    return list(PRODUCTS.values())


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: str, token: str = Depends(_require_auth)):
    product = PRODUCTS.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
