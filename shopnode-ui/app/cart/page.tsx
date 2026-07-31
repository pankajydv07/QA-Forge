'use client';

import { useEffect, useState } from 'react';

interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface Cart {
  items: CartItem[];
  total: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });

  const fetchCart = async () => {
    const token = localStorage.getItem('access_token');
    // Fetch via dummy endpoint / order preview if cart fetch isn't explicit
  };

  const handleRemove = async (productId: string) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`http://localhost:8000/cart/remove/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const updated = await res.json();
      setCart(updated);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('access_token');
    const apiUrl = process.env.NEXT_PUBLIC_SHOPNODE_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const order = await res.json();
      window.location.href = `/orders/${order.id}`;
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Shopping Cart</h1>
      {cart.items.length === 0 ? (
        <p data-testid="empty-cart-msg">Your cart is empty</p>
      ) : (
        <div>
          {cart.items.map(item => (
            <div key={item.productId} data-testid={`cart-item-${item.productId}`} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <span>Product: {item.productId}</span>
              <span>Qty: {item.quantity}</span>
              <span>Price: ${item.unitPrice}</span>
              <button data-testid={`remove-${item.productId}`} onClick={() => handleRemove(item.productId)}>
                Remove
              </button>
            </div>
          ))}
          <h3 data-testid="cart-total">Total: ${cart.total}</h3>
          <button data-testid="checkout-btn" onClick={handleCheckout}>Checkout</button>
        </div>
      )}
    </main>
  );
}
