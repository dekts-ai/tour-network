export interface Package {
  id: number;
  tour_operator_id: number;
  name: string;
  email: string | null;
  from_name: string;
  from_email: string;
  api_key: string | null;
  stripe_destination_id: string;
  overbook_seats: number;
  short_description: string;
  long_description: string;
  service_commission_percentage: string;
  stripe_commission_percentage: string;
  hours: number;
  minutes: number;
  duration: number;
  block_ctb_duration: number;
  ctb_description: string | null;
  day_hours: number;
  things_to_bring: string;
  important_notes: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  waiver_content: string | null;
  cancellation: string | null;
  iframe_url: string;
  status: string;
  Order_by: number;
  pos_order: number;
  viator_tags: string | null;
  destinationId: string | null;
  productCode: string;
  get_your_guide_product_code: string | null;
  bokun_product_code: string | null;
  viator_flags: string | null;
  frontend_enabled: number;
  category_id: string;
  type: string;
  show_in_pos: number;
  is_combo_package: number;
  is_group_rate_enabled: number;
  bundle_package: number;
  checkin: number;
  checkin_type: number;
  package_has_slots: number;
  package_has_waiver: number;
  package_has_permit: number;
  show_in_agenda: number;
  tax_applicable: number;
  slot_close_on_booking: number;
  show_seat_availability: number;
  is_partner_package: number;
  latitude: string;
  longitude: string;
  travel_duration: string;
  min_pax_allowed: number;
  max_pax_allowed: number | null;
  package_colour: string;
  has_contacts: number;
  expire_in_days: number;
  timezone?: string; // Added timezone field
  created_at: string;
  created_by: number;
  created_by_user_type: string;
  updated_at: string;
  updated_by: number;
  updated_by_user_type: string;
  deleted_at: string | null;
  deleted_by: number;
  deleted_by_user_type: string;
}

export interface TenantPackages {
  tenant_id: string;
  packages: Package[];
}

export interface PackagesResponse {
  message: string;
  code: number;
  data: TenantPackages[];
}

export interface PackageDetailsResponse {
  message: string;
  code: number;
  data: {
    tenant_id: string;
    package: Package;
  };
}

export interface TimeSlot {
  id: number;
  date: string;
  time: string;
  slot_time: string;
  seats: number;
  bookable_status: 'Open' | 'Closed';
  custom_rate: number;
}

export interface TimeSlotsResponse {
  message: string;
  code: number;
  data: {
    tenant_id: string;
    slots: TimeSlot[];
  };
}

export interface RateGroup {
  id: number;
  rate_for: string;
  rate: string;
  tour_package_id: number;
  custom_date_id: number | null;
  processing_charge_percentage: string;
  additional_charge: string;
  partner_fee_type: string | null;
  partner_fee_percentage: string;
  partner_fee_amount: string;
  permit_fee: string;
  description: string;
  min_pax_allowed: number;
  max_pax_allowed: number;
  is_group_rate: number;
  min_group_size: number;
  max_group_size: number;
  processing_fee: string;
  tax: string;
  size?: number; // For group rate packages
}

export interface RateGroupsResponse {
  message: string;
  code: number;
  data: {
    tenant_id: string;
    service_commission_percentage: number;
    rate_groups: RateGroup[];
  };
}

export interface RateGroupSelection {
  rateGroup: RateGroup;
  quantity: number;
  subtotal: number;
  commission: number;
  total: number;
}

export interface FilterOptions {
  tenant: string;
  duration: string;
  priceRange: string;
  category: string;
  searchTerm: string;
}

// Custom Form Types
export interface FormFieldOption {
  id: string;
  name: string;
  value: string;
}

export interface FormFieldAttrs {
  options?: FormFieldOption[];
  max?: string;
  min?: string;
}

export interface FormFieldPriceInfo {
  type: string;
  unit: 'setprice' | 'priceperpax' | 'n';
  price: string;
  enabled: string;
  inventory: string;
}

export interface FormField {
  id: string;
  name: string;
  type: 'checkbox' | 'radio' | 'select' | 'text' | 'textarea' | 'number';
  order: string;
  default: string;
  required: string;
  priceInfo: FormFieldPriceInfo;
  visibility: 'frontend' | 'backend' | 'both';
  description: string;
  attrs?: FormFieldAttrs;
}

export interface CustomForm {
  id: number;
  form_name: string;
  description: string;
  status: string;
  form_package_id: number;
  form_fields: FormField[];
}

export interface CustomFormResponse {
  message: string;
  code: number;
  data: {
    tenant_id: string;
    custom_form: CustomForm;
  };
}

export interface AddOnSelection {
  field: FormField;
  value: any;
  quantity?: number;
  subtotal: number;
  commission: number;
  total: number;
}

// Promo Code Types
export interface PromoCode {
  id: number;
  max_allowed_usages: number;
  discount_value: string;
  discount_value_type: 'Percent' | 'Fixed Money';
}

export interface PromoCodeResponse {
  message: string;
  code: number;
  data: {
    tenant_id: string;
    coupon: PromoCode;
  };
}

export interface PromoCodeRequest {
  coupon: string;
  date: string;
}