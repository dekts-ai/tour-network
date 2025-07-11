"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';
import { TimezoneManager } from '@/utils/timezoneUtils';
import api from '@/services/api';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, customerInfo, clearCart } = useCart();
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Check if customer info exists
    if (!customerInfo) {
      router.push('/cart');
      return;
    }

    // Check if cart has items
    if (cartItems.length === 0) {
      router.push('/packages');
      return;
    }

    // Create payment intent
    if (!hasInitialized) {
      createPaymentIntent();
      setHasInitialized(true);
    }
  }, [cartItems, customerInfo, router, hasInitialized]);

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/create-payment-intent', {
        amount: Math.round(getCartTotal() * 100), // Convert to cents
        currency: 'usd',
        serviceFees: Math.round(cartItems.reduce((sum, item) => sum + item.pricing.totalFees, 0) * 100), // Service fees in cents
        tourFees: Math.round(cartItems.reduce((sum, item) => sum + item.pricing.tourSubtotal, 0) * 100), // Tour fees in cents
        addOnsFees: Math.round(cartItems.reduce((sum, item) => sum + item.pricing.addOnSubtotal, 0) * 100), // Add-ons fees in cents
        cartItems: cartItems,
        customerInfo: customerInfo
      });

      if (response.data.code === 200 && response.data.data.clientSecret) {
        setClientSecret(response.data.data.clientSecret);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (err: any) {
      console.error('Error creating payment intent:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string, timezone?: string) => {
    const packageTimezone = TimezoneManager.getPackageTimezone(timezone);
    return TimezoneManager.formatDateForDisplay(dateStr, packageTimezone);
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      // Prepare booking payload
      const bookingPayload = {
        paymentIntentId: paymentIntent.id,
        customerInfo: customerInfo,
        cartItems: cartItems.map(item => ({
          packageId: item.packageId,
          tenantId: item.tenantId,
          packageName: item.packageName,
          selectedDate: item.selectedDate,
          selectedSlot: item.selectedSlot,
          rateGroupSelections: item.rateGroupSelections,
          addOnSelections: item.addOnSelections,
          appliedPromoCode: item.appliedPromoCode,
          pricing: {
            ...item.pricing,
            tourFees: item.pricing.tourSubtotal - item.pricing.promoDiscount,
            addOnFees: item.pricing.addOnSubtotal
          },
          totalGuests: item.totalGuests
        })),
        totalAmount: getCartTotal(),
        serviceFees: cartItems.reduce((sum, item) => sum + item.pricing.totalFees, 0),
        bookingDate: new Date().toISOString()
      };

      // Call create-bookings API
      const bookingResponse = await api.post('/create-bookings', bookingPayload);
      
      if (bookingResponse.data.code === 200) {
        // Store booking data for thank you page
        const bookingData = {
          ...bookingPayload,
          bookingId: bookingResponse.data.data.bookingId || `TN-${Date.now()}`,
          bookings: bookingResponse.data.data.bookings || []
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('completed_booking', JSON.stringify(bookingData));
        }

        // Clear cart
        clearCart();

        // Redirect to thank you page
        router.push('/booking-confirmation');
      } else {
        throw new Error(bookingResponse.data.message || 'Failed to create booking');
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create booking. Please contact support.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No items to checkout</h2>
          <p className="text-gray-600 mb-6">Your cart is empty. Add some tour packages first!</p>
          <button
            onClick={() => router.push('/packages')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Browse Packages
          </button>
        </div>
      </div>
    );
  }

  if (!customerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Information Required</h2>
          <p className="text-gray-600 mb-6">Please fill in your customer information first.</p>
          <button
            onClick={() => router.push('/cart')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Initializing secure payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Payment Initialization Failed</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={createPaymentIntent}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Secure Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your booking with secure payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>
            
            {clientSecret && (
              <Elements options={options} stripe={stripePromise}>
                <StripeCheckoutForm 
                  onPaymentSuccess={handlePaymentSuccess}
                  totalAmount={getCartTotal()}
                />
              </Elements>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-8">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium">Name:</span> {customerInfo.firstName} {customerInfo.lastName}</p>
                <p><span className="font-medium">Email:</span> {customerInfo.email}</p>
                <p><span className="font-medium">Phone:</span> {customerInfo.phone}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="border-b border-gray-200 pb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.packageName}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Date: {formatDate(item.selectedDate)}</p>
                      {item.selectedSlot && <p>Time: {item.selectedSlot.time}</p>}
                      <p>Guests: {item.totalGuests}</p>
                      <p>Operator: {item.tenantId.toUpperCase()}</p>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="font-semibold text-green-600">
                        ${item.pricing.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Summary */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ${cartItems.reduce((sum, item) => sum + item.pricing.totalSubtotal, 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fees:</span>
                  <span className="font-medium">
                    ${cartItems.reduce((sum, item) => sum + item.pricing.totalFees, 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="pt-3 border-t border-gray-300">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Your payment is secured with 256-bit SSL encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}