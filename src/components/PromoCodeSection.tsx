"use client";

import React, { useState } from 'react';
import { PromoCode } from '@/types/package';

interface PromoCodeSectionProps {
  onApplyPromoCode: (code: string) => Promise<void>;
  appliedPromoCode: PromoCode | null;
  promoCodeLoading: boolean;
  promoCodeError: string | null;
  onRemovePromoCode: () => void;
  tourSubtotal: number;
}

const PromoCodeSection: React.FC<PromoCodeSectionProps> = ({
  onApplyPromoCode,
  appliedPromoCode,
  promoCodeLoading,
  promoCodeError,
  onRemovePromoCode,
  tourSubtotal
}) => {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApplyCode = async () => {
    if (!promoCodeInput.trim()) return;
    await onApplyPromoCode(promoCodeInput.trim());
  };

  const handleRemoveCode = () => {
    setPromoCodeInput('');
    onRemovePromoCode();
    setIsExpanded(false);
  };

  const calculateDiscount = () => {
    if (!appliedPromoCode) return 0;
    
    const discountValue = parseFloat(appliedPromoCode.discount_value);
    
    if (appliedPromoCode.discount_value_type === 'Percent') {
      return (tourSubtotal * discountValue) / 100;
    } else {
      // Fixed Money
      return Math.min(discountValue, tourSubtotal); // Don't exceed tour subtotal
    }
  };

  const discountAmount = calculateDiscount();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          Promo Code
        </h3>
        
        {!appliedPromoCode && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {isExpanded ? 'Hide' : 'Have a promo code?'}
          </button>
        )}
      </div>

      {/* Applied Promo Code Display */}
      {appliedPromoCode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">Promo Code Applied!</p>
                <p className="text-sm text-green-600">
                  {appliedPromoCode.discount_value_type === 'Percent' 
                    ? `${appliedPromoCode.discount_value}% discount`
                    : `$${parseFloat(appliedPromoCode.discount_value).toFixed(2)} off`
                  }
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-bold text-green-800">
                -${discountAmount.toFixed(2)}
              </p>
              <button
                onClick={handleRemoveCode}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Code Input */}
      {isExpanded && !appliedPromoCode && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled={promoCodeLoading}
              />
            </div>
            <button
              onClick={handleApplyCode}
              disabled={!promoCodeInput.trim() || promoCodeLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {promoCodeLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Applying...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {/* Error Message */}
          {promoCodeError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{promoCodeError}</p>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-blue-800 font-medium">Promo Code Tips:</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Enter your promo code exactly as provided</li>
                  <li>• Discount applies only to tour pricing, not add-ons</li>
                  <li>• Some codes may have usage limits or expiration dates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeSection;