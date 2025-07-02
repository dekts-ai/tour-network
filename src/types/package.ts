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

export interface FilterOptions {
  tenant: string;
  duration: string;
  priceRange: string;
  category: string;
  searchTerm: string;
}