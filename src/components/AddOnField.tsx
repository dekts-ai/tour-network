"use client";

import React from 'react';
import { FormField } from '@/types/package';
import { FormFieldManager } from '@/utils/formUtils';
import { NumberManager } from '@/utils/numberUtils';

interface AddOnFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onFieldDetailsChange?: (fieldDetails: any) => void;
  totalGuests: number;
  serviceCommissionPercentage: number;
}

const AddOnField: React.FC<AddOnFieldProps> = ({
  field,
  value,
  onChange,
  onFieldDetailsChange,
  totalGuests,
  serviceCommissionPercentage
}) => {
  // Memoize all calculations to prevent unnecessary recalculations
  const hasPricing = React.useMemo(() => FormFieldManager.hasPricing(field), [field.id, field.attrs]);
  const pricingDisplay = React.useMemo(() => FormFieldManager.getPricingDisplay(field, totalGuests), [field.id, field.attrs, totalGuests]);
  const label = React.useMemo(() => FormFieldManager.getFieldLabel(field), [field.id, field.name]);

  const memoizedPricing = React.useMemo(() => {
    return FormFieldManager.calculateAddOnPricing(
      field,
      value,
      1,
      totalGuests,
      serviceCommissionPercentage
    );
  }, [field.id, field.type, field.attrs, value, totalGuests, serviceCommissionPercentage]);

  const memoizedShouldShowPricing = React.useMemo(() => {
    if (!hasPricing || !value) return false;

    if (field.type === 'radio') {
      return FormFieldManager.shouldPriceRadioValue(value);
    }

    if (field.type === 'checkbox') {
      return value === true;
    }

    if (field.type === 'number') {
      return value > 0;
    }

    return false;
  }, [hasPricing, value, field.type]);

  // Emit field details only when relevant values actually change
  React.useEffect(() => {
    if (onFieldDetailsChange) {
      // Calculate fee as commission amount - always include pricing info even if not enabled
      const fee = hasPricing && memoizedShouldShowPricing ? NumberManager.roundout(memoizedPricing.commission) : 0;
      const subtotal = hasPricing && memoizedShouldShowPricing ? NumberManager.roundout(memoizedPricing.subtotal) : 0;
      
      const fieldDetails = {
        id: field.id,
        name: field.name,
        type: field.type,
        order: field.order,
        default: field.default || "",
        required: field.required,
        priceInfo: {
          type: "USD",
          unit: field.priceInfo?.unit || "n",
          price: subtotal,
          enabled: field.priceInfo?.enabled === "1" || field.priceInfo?.enabled === 'true',
          inventory: (field.priceInfo?.unit === "n" || !field.priceInfo?.unit) ? "" : "0",
          fee: fee
        },
        visibility: field.visibility,
        description: field.description || "",
        value: value,
        error: false,
        form_id: 1,
        ...(field.attrs && { attrs: field.attrs })
      };
      onFieldDetailsChange(fieldDetails);
    }
  }, [
    field.id,
    field.name,
    field.type,
    field.order,
    field.default,
    field.required,
    field.priceInfo,
    field.visibility,
    field.description,
    field.attrs,
    value,
    hasPricing,
    memoizedShouldShowPricing,
    memoizedPricing,
    onFieldDetailsChange
  ]);

  const renderField = () => {
    switch (field.type) {
      case 'checkbox':
        return (
          <div className="flex items-start gap-3">
            <div className="flex items-center h-5">
              <input
                id={field.id}
                type="checkbox"
                checked={value || false}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
            <div className="flex-1">
              <label htmlFor={field.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                {label}
                {hasPricing && (
                  <span className="ml-2 text-green-600 font-semibold">
                    {pricingDisplay}
                  </span>
                )}
              </label>
              {field.description && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          </div>
        );

      case 'radio':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {label}
              {hasPricing && (
                <span className="ml-2 text-green-600 font-semibold">
                  {pricingDisplay}
                </span>
              )}
            </label>
            <div className="space-y-2">
              {field.attrs?.options?.map((option) => {
                const isSelected = value === option.value;
                const willHavePrice = hasPricing && FormFieldManager.shouldPriceRadioValue(option.value);

                return (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      id={option.id}
                      type="radio"
                      name={field.id}
                      value={option.value}
                      checked={isSelected}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor={option.id} className="text-sm text-gray-700 cursor-pointer flex items-center gap-2">
                      {option.name}
                      {willHavePrice && (
                        <span className="text-xs text-green-600 font-medium">
                          ({pricingDisplay})
                        </span>
                      )}
                      {option.value === '0' && hasPricing && (
                        <span className="text-xs text-gray-500">
                          (No charge)
                        </span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div>
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-900 mb-2">
              {label}
            </label>
            <select
              id={field.id}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an option</option>
              {field.attrs?.options?.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      case 'number':
        const maxValue = FormFieldManager.getMaxValue(field);
        const minValue = FormFieldManager.getMinValue(field);

        return (
          <div>
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-900 mb-2">
              {label}
              {hasPricing && (
                <span className="ml-2 text-green-600 font-semibold">
                  {pricingDisplay}
                </span>
              )}
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                type="button"
                onClick={() => onChange(Math.max(minValue, (value || 0) - 1))}
                disabled={(value || 0) <= minValue}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>

              <input
                id={field.id}
                type="number"
                min={minValue}
                max={maxValue}
                value={value || 0}
                onChange={(e) => onChange(Math.max(minValue, Math.min(maxValue, parseInt(e.target.value) || 0)))}
                className="flex-1 px-3 py-2 text-center border-l border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() => onChange(Math.min(maxValue, (value || 0) + 1))}
                disabled={(value || 0) >= maxValue}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <div>
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-900 mb-2">
              {label}
            </label>
            <input
              id={field.id}
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={field.description}
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div>
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-900 mb-2">
              {label}
            </label>
            <textarea
              id={field.id}
              rows={3}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={field.description}
            />
            {field.description && (
              <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {renderField()}

      {/* Pricing Display - Only show if value should be priced */}
      {memoizedShouldShowPricing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-green-700">Add-on Total:</span>
            <div className="text-right">
              <div className="font-semibold text-green-800">
                ${memoizedPricing.total.toFixed(2)}
              </div>
              <div className="text-xs text-green-600">
                ${memoizedPricing.subtotal.toFixed(2)} + ${memoizedPricing.commission.toFixed(2)} fees
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOnField;