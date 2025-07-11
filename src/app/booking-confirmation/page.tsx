"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TimezoneManager } from '@/utils/timezoneUtils';

interface BookingData {
  cartItems: any[];
  customerInfo: any;
  totalAmount: number;
  paymentIntentId: string;
  bookingId: string;
  bookingDate: string;
  bookings?: any[];
  serviceFees: number;
}

export default function BookingConfirmationPage() {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBooking = localStorage.getItem('completed_booking');
      if (savedBooking) {
        try {
          setBookingData(JSON.parse(savedBooking));
          // Clear the booking data after loading
          localStorage.removeItem('completed_booking');
        } catch (error) {
          console.error('Error loading booking data:', error);
        }
      }
    }
  }, []);

  const formatDate = (dateStr: string, timezone?: string) => {
    const packageTimezone = TimezoneManager.getPackageTimezone(timezone);
    return TimezoneManager.formatDateForDisplay(dateStr, packageTimezone);
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No booking found</h2>
          <p className="text-gray-600 mb-6">It looks like you haven't completed a booking yet.</p>
          <Link
            href="/packages"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Browse Packages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-2">Thank you for your booking, {bookingData.customerInfo.firstName}!</p>
          <p className="text-gray-600">Your confirmation number is: <span className="font-bold text-blue-600">{bookingData.bookingId}</span></p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>
          
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium">Name:</span> {bookingData.customerInfo.firstName} {bookingData.customerInfo.lastName}</p>
                <p><span className="font-medium">Email:</span> {bookingData.customerInfo.email}</p>
                <p><span className="font-medium">Phone:</span> {bookingData.customerInfo.phone}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium">Payment Method:</span> Credit Card</p>
                <p><span className="font-medium">Payment ID:</span> {bookingData.paymentIntentId}</p>
                <p><span className="font-medium">Total Amount:</span> <span className="text-green-600 font-bold">${bookingData.totalAmount.toFixed(2)}</span></p>
                <p><span className="font-medium">Service Fees:</span> ${bookingData.serviceFees.toFixed(2)}</p>
                <p><span className="font-medium">Booking Date:</span> {new Date(bookingData.bookingDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Booked Tours */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Tours</h3>
            <div className="space-y-4">
              {bookingData.cartItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{item.packageName}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><span className="font-medium">Date:</span> {formatDate(item.selectedDate)}</p>
                          {item.selectedSlot && (
                            <p><span className="font-medium">Time:</span> {item.selectedSlot.time}</p>
                          )}
                          <p><span className="font-medium">Guests:</span> {item.totalGuests}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Operator:</span> {item.tenantId.toUpperCase()}</p>
                          <p><span className="font-medium">Total:</span> <span className="text-green-600 font-bold">${item.pricing.totalAmount.toFixed(2)}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rate Group Details */}
                  {item.rateGroupSelections.filter((rg: any) => rg.quantity > 0).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Guest Details:</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        {item.rateGroupSelections
                          .filter((rg: any) => rg.quantity > 0)
                          .map((rg: any, rgIndex: number) => (
                            <p key={rgIndex}>
                              {rg.quantity}x {rg.rateGroup.rate_for} - ${rg.total.toFixed(2)}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Promo Code */}
                  {item.appliedPromoCode && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Promo Applied:</span> 
                        {item.appliedPromoCode.discount_value_type === 'Percent' 
                          ? ` ${item.appliedPromoCode.discount_value}% discount`
                          : ` $${item.appliedPromoCode.discount_value} off`
                        } - Saved ${item.pricing.promoDiscount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8">
          <h3 className="text-xl font-bold text-blue-900 mb-4">What's Next?</h3>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <p>You'll receive a confirmation email with your booking details and vouchers.</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <p>Please arrive 15 minutes before your scheduled tour time.</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <p>Contact the tour operator directly if you need to make any changes.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.print()}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H3a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Confirmation
            </button>
            
            <Link
              href="/packages"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Book Another Tour
            </Link>
          </div>
          
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@tournetwork.com" className="text-blue-600 hover:text-blue-800 underline">
              support@tournetwork.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}