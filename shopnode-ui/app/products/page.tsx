'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('all');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch('http://localhost:8000/products', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.error);
  }, []);

  const handleAddToCart = async (productId: string) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (res.ok) {
        setCartCount(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <main style={{ padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>Products</h1>
        <div data-testid="cart-badge">Cart Items: {cartCount}</div>
      </header>

      <div style={{ marginBottom: '1rem' }}>
        <button data-testid="filter-all" onClick={() => setFilter('all')}>All</button>
        <button data-testid="filter-electronics" onClick={() => setFilter('electronics')}>Electronics</button>
        <button data-testid="filter-clothing" onClick={() => setFilter('clothing')}>Clothing</button>
        <button data-testid="filter-food" onClick={() => setFilter('food')}>Food</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {filteredProducts.map(p => (
          <div key={p.id} data-testid={`product-card-${p.id}`} style={{ border: '1px solid #ccc', padding: '1rem' }}>
            <h3 data-testid={`product-title-${p.id}`}>{p.name}</h3>
            <p data-testid={`product-price-${p.id}`}>${p.price}</p>
            <button data-testid={`add-to-cart-${p.id}`} onClick={() => handleAddToCart(p.id)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
