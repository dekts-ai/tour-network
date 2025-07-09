"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { CustomerInfo, PaymentMethod } from '@/types/cart';
import { TimezoneManager } from '@/utils/timezoneUtils';

const paymentMethods: PaymentMethod[] = [
  { id: 'card', name: 'Credit/Debit Card', type: 'card', icon: '💳' },
  { id: 'paypal', name: 'PayPal', type: 'paypal', icon: '🅿️' },
  { id: 'bank', name: 'Bank Transfer', type: 'bank', icon: '🏦' }
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, customerInfo, setCustomerInfo, clearCart } = useCart();
  
  const [formData, setFormData] = useState<CustomerInfo>(customerInfo || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agreeToTerms: false,
    subscribeToNewsletter: false
  });
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Save customer info
      setCustomerInfo(formData);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create booking data
      const bookingData = {
        cartItems,
        customerInfo: formData,
        totalAmount: getCartTotal(),
        paymentMethod: selectedPaymentMethod,
        bookingId: `TN-${Date.now()}`,
        bookingDate: new Date().toISOString()
      };

      console.log('Booking data:', bookingData);

      // Store booking data for thank you page
      if (typeof window !== 'undefined') {
        localStorage.setItem('completed_booking', JSON.stringify(bookingData));
      }

      // Clear cart
      clearCart();

      // Redirect to thank you page
      router.push('/booking-confirmation');

    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string, timezone?: string) => {
    const packageTimezone = TimezoneManager.getPackageTimezone(timezone);
    return TimezoneManager.formatDateForDisplay(dateStr, packageTimezone);
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your booking information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Customer Information Form */}
          <div className="space-y-8">
            {/* Customer Details */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                {/* Terms and Newsletter */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                      I agree to the{' '}
                      <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                        Privacy Policy
                      </a>{' '}
                      *
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
                  )}

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="subscribeToNewsletter"
                      checked={formData.subscribeToNewsletter}
                      onChange={(e) => handleInputChange('subscribeToNewsletter', e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="subscribeToNewsletter" className="text-sm text-gray-700">
                      Subscribe to our newsletter for exclusive deals and travel tips
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
              
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id={method.id}
                        name="paymentMethod"
                        checked={selectedPaymentMethod === method.id}
                        onChange={() => setSelectedPaymentMethod(method.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <label htmlFor={method.id} className="font-medium text-gray-900 cursor-pointer">
                        {method.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
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

              {/* Complete Booking Button */}
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Complete Booking - ${getCartTotal().toFixed(2)}
                  </>
                )}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secure SSL encrypted payment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}