"""
shopnode-api cart router (T012)
Single responsibility: POST /cart/add, DELETE /cart/remove/:id — in-memory cart per user.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models import Cart, CartItem, AddToCartRequest
from main import CARTS, PRODUCTS

router = APIRouter(prefix="/cart", tags=["cart"])
security = HTTPBearer()


def _get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from token (simplified — uses 'u-001' for all valid tokens)."""
    if not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return "u-001"


def _compute_total(items: list[CartItem]) -> float:
    return round(sum(i.quantity * i.unitPrice for i in items), 2)


@router.post("/add", response_model=Cart)
def add_to_cart(body: AddToCartRequest, user_id: str = Depends(_get_user_id)):
    product = PRODUCTS.get(body.productId)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = CARTS.get(user_id, Cart(userId=user_id))
    # Check if product already in cart
    for item in cart.items:
        if item.productId == body.productId:
            item.quantity += body.quantity
            cart.total = _compute_total(cart.items)
            CARTS[user_id] = cart
            return cart

    new_item = CartItem(productId=body.productId, quantity=body.quantity, unitPrice=product.price)
    cart.items.append(new_item)
    cart.total = _compute_total(cart.items)
    CARTS[user_id] = cart
    return cart


@router.delete("/remove/{product_id}", response_model=Cart)
def remove_from_cart(product_id: str, user_id: str = Depends(_get_user_id)):
    cart = CARTS.get(user_id, Cart(userId=user_id))
    original_len = len(cart.items)
    cart.items = [i for i in cart.items if i.productId != product_id]
    if len(cart.items) == original_len:
        raise HTTPException(status_code=404, detail="Item not in cart")
    cart.total = _compute_total(cart.items)
    CARTS[user_id] = cart
    return cart
