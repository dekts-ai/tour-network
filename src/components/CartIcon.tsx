"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

const CartIcon: React.FC = () => {
  const { getCartItemCount, getCartTotal } = useCart();
  const itemCount = getCartItemCount();
  const total = getCartTotal();

  return (
    <Link 
      href="/cart"
      className="relative flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
    >
      <div className="relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </div>
      <div className="hidden sm:block">
        <div className="text-sm">Cart</div>
        {itemCount > 0 && (
          <div className="text-xs text-gray-600">${total.toFixed(2)}</div>
        )}
      </div>
    </Link>
  );
};

export default CartIcon;