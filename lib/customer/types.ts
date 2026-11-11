/** What the Django customer API returns. Kept in one place so pages and components agree. */

export type TripSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categories: string[];
  operational_status: string;
  next_departure: string | null;
  from_price: string | number | null;
  cover_url: string | null;
};

export type Schedule = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  seats_left: number;
  price_per_participant: string;
  currency: string;
  is_open: boolean;
  advance_basis_points: number;
  balance_due_days_before: number;
};

export type ItineraryItem = { id: number; time_label: string; text: string; detail?: string };
export type ItineraryDay = { id: number; day_number: number; title: string; items: ItineraryItem[] };

export type EventSchedule = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  /** Capacity minus confirmed bookings and unexpired pending holds; null when the date has no capacity limit. */
  seats_left: number | null;
  is_date_locked: boolean;
  time_tbd: boolean;
};
export type EventRegistrationType = "INDIVIDUAL" | "GROUP" | "BOTH";
export type EventFormatDetail = { label: string; value: string };
export type EventDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  category_slug: string | null;
  price: string | null;
  cover_url: string | null;
  next_date: string | null;
  next_time_tbd: boolean;
  is_featured: boolean;
  booking_whatsapp_number: string;
  venue_name: string;
  venue_address: string;
  schedules: EventSchedule[];
  itineraries: ItineraryDay[];
  things_to_bring: string[];
  inclusions: string[];
  exclusions: string[];
  format_details: EventFormatDetail[];
  rules: string[];
  registration_type: EventRegistrationType;
  max_participants_per_booking: number | null;
  reservation_hold_hours: number;
  highlights: string[];
  faqs: { question: string; answer: string }[];
  headline: string;
  image_caption: string;
  format_note: string;
  schedule_note: string;
  seo_title?: string;
  seo_description?: string;
};

export type EventBookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
export type EventBooking = {
  reference: string;
  status: EventBookingStatus;
  status_label: string;
  contact_name: string;
  participant_count: number;
  unit_price: string | null;
  total_amount: string;
  reserved_until: string | null;
  confirmed_at: string | null;
  created_at: string;
  event_slug: string;
  event_title: string;
  starts_at: string;
  ends_at: string | null;
  time_tbd: boolean;
  venue: string;
  booking_whatsapp_number: string;
  seats_left: number | null;
};

export type PickupPoint = { id: string; name: string; address: string; pickup_time: string | null };
export type RefundTier = { days_before: number; refund_basis_points: number; note: string };

export type TripDetail = TripSummary & {
  body: string;
  schedules: Schedule[];
  pickup_points: PickupPoint[];
  itineraries: ItineraryDay[];
  things_to_bring: string[];
  inclusions: string[];
  exclusions: string[];
  policies: RefundTier[];
  duration_hours: number | null;
  difficulty: string;
  min_age: number | null;
  seo_title?: string;
  seo_description?: string;
};

export type Participant = {
  id?: string;
  full_name: string;
  age: number | null;
  gender?: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_notes?: string;
  waiver_accepted_at?: string | null;
};

export type Booking = {
  id: string;
  reference: string;
  status: string;
  checkout: string;
  trip: string;
  trip_title: string;
  trip_cover: string | null;
  pickup_point_name: string;
  created_at: string;
  starts_at: string;
  participant_count: number;
  currency: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  advance_basis_points: number;
  advance_amount: string;
  balance_amount: string;
  balance_due_at: string;
  paid: string | number;
  outstanding: string | number;
  is_overdue: boolean;
  participants: Participant[];
};

export type Checkout = {
  id: string;
  reference: string;
  status: string;
  currency: string;
  total_amount: string;
  advance_total: string;
  created_at: string;
  bookings: Booking[];
};

export type Profile = {
  id: number;
  phone_number: string;
  full_name: string;
  email: string | null;
  preferred_language: string;
  is_profile_complete: boolean;
  kind: string;
};

export type PaymentOrder = { payment: string; order_id: string; amount: string | number; currency: string; key_id: string };
export type PayKind = "ADVANCE" | "BALANCE" | "FULL";
