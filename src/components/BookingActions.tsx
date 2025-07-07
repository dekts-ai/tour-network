"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/types/cart';

interface BookingActionsProps {
  cartItem: CartItem;
  disabled?: boolean;
}

const BookingActions: React.FC<BookingActionsProps> = ({ cartItem, disabled = false }) => {
  const router = useRouter();
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(cartItem);
    // Show success message or redirect to cart
    router.push('/cart');
  };

  const handleContinueToBooking = () => {
    // Add to cart and go directly to checkout
    addToCart(cartItem);
    router.push('/checkout');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleAddToCart}
          disabled={disabled}
          className="w-full bg-white border-2 border-blue-600 text-blue-600 py-4 px-6 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15" />
          </svg>
          Add to Cart
        </button>
        
        <button
          onClick={handleContinueToBooking}
          disabled={disabled}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Continue to Booking
        </button>
      </div>
      
      <p className="text-sm text-gray-500 text-center">
        Secure booking • Instant confirmation • No hidden fees
      </p>
    </div>
  );
};

export default BookingActions;