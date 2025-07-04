import { FormField, FormFieldPriceInfo, AddOnSelection } from '@/types/package';

export class FormFieldManager {
  /**
   * Filter form fields based on visibility
   */
  static getVisibleFields(fields: FormField[]): FormField[] {
    return fields
      .filter(field => field.visibility === 'frontend' || field.visibility === 'both')
      .sort((a, b) => parseInt(a.order) - parseInt(b.order));
  }

  /**
   * Check if a field has pricing enabled
   */
  static hasPricing(field: FormField): boolean {
    return field.priceInfo.enabled === 'true' && parseFloat(field.priceInfo.price) > 0;
  }

  /**
   * Get default value for a field
   */
  static getDefaultValue(field: FormField): any {
    switch (field.type) {
      case 'checkbox':
        return field.default === 'true';
      case 'radio':
      case 'select':
        return field.default || '';
      case 'number':
        return field.default ? parseInt(field.default) : 0;
      case 'text':
      case 'textarea':
        return field.default || '';
      default:
        return '';
    }
  }

  /**
   * Validate field value
   */
  static validateField(field: FormField, value: any): boolean {
    if (field.required === 'true') {
      if (field.type === 'checkbox') {
        return value === true;
      }
      if (field.type === 'number') {
        return value > 0;
      }
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      return value !== null && value !== undefined;
    }
    return true;
  }

  /**
   * Check if radio field value should be priced (not "0")
   */
  static shouldPriceRadioValue(value: string): boolean {
    return value !== '0' && value !== '' && value !== null && value !== undefined;
  }

  /**
   * Calculate pricing for an add-on field
   */
  static calculateAddOnPricing(
    field: FormField,
    value: any,
    quantity: number = 1,
    totalGuests: number,
    serviceCommissionPercentage: number
  ): { subtotal: number; commission: number; total: number } {
    if (!this.hasPricing(field)) {
      return { subtotal: 0, commission: 0, total: 0 };
    }

    const price = parseFloat(field.priceInfo.price);
    let subtotal = 0;

    // Calculate subtotal based on unit type
    switch (field.priceInfo.unit) {
      case 'setprice':
        // Fixed price regardless of guests
        if (field.type === 'checkbox' && value === true) {
          subtotal = price;
        } else if (field.type === 'radio' && value && this.shouldPriceRadioValue(value)) {
          // Only apply pricing if radio value is not "0"
          subtotal = price;
        } else if (field.type === 'number' && value > 0) {
          subtotal = price * value;
        }
        break;

      case 'priceperpax':
        // Price per person
        if (field.type === 'checkbox' && value === true) {
          subtotal = price * totalGuests;
        } else if (field.type === 'radio' && value && this.shouldPriceRadioValue(value)) {
          // Only apply pricing if radio value is not "0"
          subtotal = price * totalGuests;
        } else if (field.type === 'number' && value > 0) {
          subtotal = price * value;
        }
        break;

      case 'n':
      default:
        // No pricing
        subtotal = 0;
        break;
    }

    // Calculate commission based on subtotal
    const commission = this.roundout((subtotal * serviceCommissionPercentage) / 100);
    const total = subtotal + commission;

    return { subtotal, commission, total };
  }

  /**
   * Round up to 2 decimal places
   */
  static roundout(amount: number, places: number = 2): number {
    if (places < 0) places = 0;
    const x = Math.pow(10, places);
    const formul = (amount * x).toFixed(10);
    return (amount >= 0 ? Math.ceil(parseFloat(formul)) : Math.floor(parseFloat(formul))) / x;
  }

  /**
   * Get field display label
   */
  static getFieldLabel(field: FormField): string {
    let label = field.name;
    if (field.required === 'true') {
      label += ' *';
    }
    return label;
  }

  /**
   * Get pricing display text
   */
  static getPricingDisplay(field: FormField, totalGuests: number): string {
    if (!this.hasPricing(field)) {
      return '';
    }

    const price = parseFloat(field.priceInfo.price);
    
    switch (field.priceInfo.unit) {
      case 'setprice':
        return `+$${price.toFixed(2)}`;
      case 'priceperpax':
        return `+$${price.toFixed(2)} per person`;
      default:
        return '';
    }
  }

  /**
   * Check if field should show quantity input
   */
  static shouldShowQuantityInput(field: FormField): boolean {
    return field.type === 'number' && this.hasPricing(field);
  }

  /**
   * Get maximum allowed value for number fields
   */
  static getMaxValue(field: FormField): number {
    if (field.attrs?.max) {
      return parseInt(field.attrs.max);
    }
    return 999; // Default max
  }

  /**
   * Get minimum allowed value for number fields
   */
  static getMinValue(field: FormField): number {
    if (field.attrs?.min) {
      return parseInt(field.attrs.min);
    }
    return 0; // Default min
  }
}