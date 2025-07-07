export interface CartItem {
  id: string; // Unique cart item ID
  packageId: number;
  tenantId: string;
  packageName: string;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  rateGroupSelections: RateGroupSelection[];
  addOnSelections: { [key: string]: any };
  appliedPromoCode: PromoCode | null;
  pricing: {
    tourSubtotal: number;
    promoDiscount: number;
    addOnSubtotal: number;
    totalSubtotal: number;
    totalFees: number;
    totalAmount: number;
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