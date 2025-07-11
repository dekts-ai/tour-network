"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import CustomerInfoForm from '@/components/CustomerInfoForm';
import { TimezoneManager } from '@/utils/timezoneUtils';

export default function CartPage() {
  const { cartItems, removeFromCart, getCartTotal, clearCart, customerInfo } = useCart();

  const formatDate = (dateStr: string, timezone?: string) => {
    const packageTimezone = TimezoneManager.getPackageTimezone(timezone);
    return TimezoneManager.formatDateForDisplay(dateStr, packageTimezone);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Start exploring our amazing tour packages!</p>
            <Link 
              href="/packages"
              className="mt-6 inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Browse Tour Packages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-2">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              Clear Cart
            </button>
            <Link 
              href="/packages"
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.packageName}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {formatDate(item.selectedDate)}
                      </span>
                      {item.selectedSlot && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {item.selectedSlot.time}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        {item.totalGuests} {item.totalGuests === 1 ? 'guest' : 'guests'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>Operator: {item.tenantId.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-800 p-2 transition-colors"
                    title="Remove from cart"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tour Subtotal:</span>
                      <span className="font-medium">${(item.pricing.tourSubtotal - item.pricing.promoDiscount).toFixed(2)}</span>
                    </div>
                    
                    {item.pricing.promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promo Discount:</span>
                        <span>-${item.pricing.promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {item.pricing.addOnSubtotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Add-ons:</span>
                        <span className="font-medium">${item.pricing.addOnSubtotal.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Fees:</span>
                      <span className="font-medium">${item.pricing.totalFees.toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-300">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">${item.pricing.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({cartItems.length}):</span>
                  <span className="font-medium">${cartItems.reduce((sum, item) => sum + item.pricing.totalSubtotal, 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fees:</span>
                  <span className="font-medium">${cartItems.reduce((sum, item) => sum + item.pricing.totalFees, 0).toFixed(2)}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-300">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link 
                href="/checkout"
                className={`block w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center ${
                  customerInfo 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!customerInfo) {
                    e.preventDefault();
                    alert('Please fill in your customer information first.');
                  }
                }}
              >
                Proceed to Checkout
              </Link>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                Secure checkout • SSL encrypted • Money-back guarantee
              </p>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className="lg:col-span-3 mt-8">
            <CustomerInfoForm />
          </div>
        </div>
      </div>
    </div>
  );
}