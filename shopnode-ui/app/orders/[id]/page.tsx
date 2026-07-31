'use client';

import { useEffect, useState } from 'react';

interface Order {
  id: string;
  status: string;
  cart: { total: number };
}

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`http://localhost:8000/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOrder(data))
      .catch(console.error);
  }, [params.id]);

  if (!order) return <div>Loading order...</div>;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Order Details</h1>
      <p data-testid="order-id">Order ID: {order.id}</p>
      <p data-testid="order-status">Status: {order.status}</p>
      <p data-testid="order-total">Total Paid: ${order.cart.total}</p>
    </main>
  );
}
