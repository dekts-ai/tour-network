// Base Package interface
export interface Package {
  id: number;
  name: string;
  short_description: string;
  long_description: string;
  hours: number;
  minutes: number;
  min_pax_allowed: number;
  max_pax_allowed: number | null;
  category_id: string;
  frontend_enabled: number;
  status: string;
  is_combo_package: number;
  package_has_waiver: number;
  package_has_permit: number;
  is_group_rate_enabled: number;
  checkin: number;
  things_to_bring: string;
  important_notes: string;
  timezone?: string;
  service_commission_percentage: string;
}

// Time Slot interface
export interface TimeSlot {
  id: number;
  time: string;
  seats: number;
  bookable_status: 'Open' | 'Closed';
  custom_rate: number;
}

// Rate Group interface
export interface RateGroup {
  id: number;
  rate_for: string;
  rate: string;
  tax?: string;
  permit_fee?: string;
  additional_charge?: string;
  partner_fee_amount?: string;
  description?: string;
  size?: number;
}

// Rate Group Selection interface
export interface RateGroupSelection {
  rateGroup: RateGroup;
  quantity: number;
  subtotal: number;
  commission: number;
  total: number;
}

// Form Field interfaces
export interface FormFieldOption {
  id: string;
  name: string;
  value: string;
}

export interface FormFieldAttrs {
  options?: FormFieldOption[];
  min?: string;
  max?: string;
}

export interface FormFieldPriceInfo {
  enabled: string;
  price: string;
  unit: 'setprice' | 'priceperpax' | 'n';
}

export interface FormField {
  id: string;
  name: string;
  type: 'checkbox' | 'radio' | 'select' | 'number' | 'text' | 'textarea';
  required: string;
  visibility: 'frontend' | 'backend' | 'both';
  order: string;
  default?: string;
  description?: string;
  attrs?: FormFieldAttrs;
  priceInfo: FormFieldPriceInfo;
}

export interface CustomForm {
  id: number;
  form_fields: FormField[];
}

// Promo Code interface
export interface PromoCode {
  id: number;
  coupon_code: string;
  discount_value: string;
  discount_value_type: 'Percent' | 'Money';
  description?: string;
}

// Add-on Selection interface
export interface AddOnSelection {
  fieldId: string;
  value: any;
  pricing: {
    subtotal: number;
    commission: number;
    total: number;
  };
}

// Filter Options interface
export interface FilterOptions {
  tenant: string;
  duration: string;
  priceRange: string;
  category: string;
  searchTerm: string;
}

// API Response interfaces
export interface PackageDetailsResponse {
  code: number;
  data: {
    package: Package;
    tenant_id: string;
  };
}

export interface PackagesResponse {
  code: number;
  data: Array<{
    tenant_id: string;
    packages: Package[];
  }>;
}

export interface TimeSlotsResponse {
  code: number;
  data: {
    slots: TimeSlot[];
  };
}

export interface RateGroupsResponse {
  code: number;
  data: {
    rate_groups: RateGroup[];
    service_commission_percentage: number;
  };
}

export interface CustomFormResponse {
  code: number;
  data: {
    custom_form: CustomForm;
  } | null;
}

export interface PromoCodeRequest {
  coupon: string;
  date: string;
}

export interface PromoCodeResponse {
  code: number;
  data: {
    coupon: PromoCode;
  };
}