"""
shopnode-api orders router (T013)
Single responsibility: POST /orders (create order, snapshot cart, set pending status), GET /orders/:id
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models import Order, Cart
from main import ORDERS, CARTS

router = APIRouter(prefix="/orders", tags=["orders"])
security = HTTPBearer()


def _get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return "u-001"


@router.post("", response_model=Order)
def create_order(user_id: str = Depends(_get_user_id)):
    cart = CARTS.get(user_id)
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_id = f"ord-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    order = Order(
        id=order_id,
        userId=user_id,
        cart=cart,
        status="pending",
        createdAt=now,
    )
    ORDERS[order_id] = order

    # Clear active cart
    CARTS[user_id] = Cart(userId=user_id)
    return order


@router.get("/{order_id}", response_model=Order)
def get_order(order_id: str, user_id: str = Depends(_get_user_id)):
    order = ORDERS.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Simulate transition to confirmed
    if order.status == "pending":
        order.status = "confirmed"

    return order
