export interface AddOnFieldDetails {
  id: string;
  name: string;
  type: string;
  order: string;
  default: string;
  required: string;
  priceInfo: {
    type: string;
    unit: string;
    price: number;
    enabled: boolean;
    inventory: string;
    fee: number;
  };
  visibility: string;
  description: string;
  value: any;
  error: boolean;
  form_id: number;
  attrs?: {
    options?: Array<{
      id: string;
      name: string;
      value: string;
    }>;
    min?: string;
    max?: string;
  };
}

export interface CartItem {
  id: string; // Unique cart item ID
  packageId: number;
  tenantId: string;
  packageName: string;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  rateGroupSelections: RateGroupSelection[];
  addOnSelections: { [key: string]: any };
  addOnFieldDetails: AddOnFieldDetails[]; // Detailed form field information
  appliedPromoCode: PromoCode | null;
  pricing: {
    tourSubtotal: number;
    promoDiscount: number;
    addOnSubtotal: number;
    totalSubtotal: number;
    totalFees: number;
    totalAmount: number;
    tourFees: number;
    addOnFees: number;
  };
  totalGuests: number;
  createdAt: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agreeToTerms: boolean;
  subscribeToNewsletter: boolean;
}

export interface BookingData {
  cartItems: CartItem[];
  customerInfo: CustomerInfo;
  totalAmount: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'paypal' | 'bank';
  icon: string;
}

// Import types from package.ts
import { TimeSlot, RateGroupSelection, PromoCode } from './package';