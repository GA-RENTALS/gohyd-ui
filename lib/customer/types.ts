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
  /** Alt text and photographer / licence line of the uploaded cover (empty when none). */
  cover_alt?: string;
  cover_credit?: string;
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
  /** A free event takes bookings at ₹0; otherwise ₹0 means the price isn't announced yet. */
  is_free?: boolean;
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
  /** How long a new booking holds its places while it is paid online. */
  hold_minutes: number;
  /** Share of the price paid online when booking (100 = all of it); the rest is paid later from the account. */
  advance_percent: number;
  /** Online cancellation closes this many hours before the start. */
  cancellation_cutoff_hours?: number;
  /** Refund tiers, most generous first. Empty = no refund on cancellation. */
  refund_policy?: EventRefundTier[];
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
  /** Taken off by a coupon (0 when none). */
  discount_amount?: string;
  coupon_code?: string | null;
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
  /** Paid online to confirm the booking; the rest of the total is the balance. */
  advance_amount: string;
  /** Received so far, and still to pay. */
  paid: string;
  outstanding: string;
  /** What can be paid online now (the advance while held, the balance once confirmed), or null. */
  pay_now: { kind: "ADVANCE" | "BALANCE"; amount: string } | null;
  cancelled_at?: string | null;
  cancelled_by_customer?: boolean;
  /** Only while the booking is active: whether it can be cancelled online now, and what that would refund. */
  cancellation?: EventCancellation | null;
  /** The refund on a cancelled, paid booking: back through Cashfree, or (paid by UPI QR before) sent by our team. */
  refund?: EventRefund | null;
};
export type EventCancellation = { allowed: boolean; until: string; refund_percent: number; refund_amount: string; paid: boolean };
export type EventRefund = { status: string; status_label: string; amount: string; upi_reference: string; recorded_at: string | null; online: boolean };
export type EventRefundTier = { hours_before: number; refund_percent: number; note: string };

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
  discount_amount: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  invoice_number: string | null;
  advance_basis_points: number;
  advance_amount: string;
  balance_amount: string;
  balance_due_at: string;
  paid: string | number;
  outstanding: string | number;
  is_overdue: boolean;
  /** The customer may still cancel online (decided on the server: not after the trip starts). */
  can_cancel: boolean;
  /** Server quote at request time; the saved cancellation record remains authoritative. */
  cancellation_quote: { refund_percent: number; refund_amount: string; paid: string; policy_cutoff: string | null } | null;
  participants: Participant[];
};

export type Checkout = {
  id: string;
  reference: string;
  status: string;
  currency: string;
  coupon_code: string | null;
  discount_total: string;
  total_amount: string;
  advance_total: string;
  created_at: string;
  /** When an unpaid checkout releases its seats; null once anything is paid. */
  hold_until: string | null;
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
  /** This operator's settings for the customer (null until first saved). */
  customer_profile: MessagePreferences | null;
};

/** Which channels may carry booking messages and reminders (CustomerProfile; login codes always go by WhatsApp). */
export type MessagePreferences = { notify_whatsapp: boolean; notify_email: boolean; marketing_opt_in: boolean };
export type DeletionRequest = { id: string; kind: "DELETION"; status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED"; created_at: string; completed_at: string | null };

/** A Cashfree order to pay (POST /payments/cashfree/create-order/). The secret key never leaves the server. */
export type PaymentSession = { payment: string; order_id: string; payment_session_id: string; amount: string; currency: string; mode: "sandbox" | "production" };
/** What the server found when it asked Cashfree about an order. */
export type PaymentOutcome = {
  status: "paid" | "pending" | "failed" | "cancelled" | "expired"; order_id: string;
  payment?: string; amount?: string; kind?: PayKind; message?: string; checkout?: string; event_booking?: string;
};
export type PayKind = "ADVANCE" | "BALANCE" | "FULL";

export type CartItem = {
  id: string;
  schedule: string;
  participant_count: number;
  pickup_point: string | null;
  trip: string;
  trip_title: string;
  starts_at: string;
  ends_at: string | null;
  price_per_participant: string;
  seats_left: number;
  is_bookable: boolean;
  pickup_point_name: string;
};

export type CouponPreview = { code: string; discount: string; total_before: string; total_after: string };
export type CheckoutLineInput = { schedule: string; participant_count: number; pickup_point: string | null };

export type Invoice = {
  number: string;
  issued_at: string;
  currency: string;
  seller: { legal_name?: string; gstin?: string; address?: string; state_code?: string };
  billing_name: string;
  billing_gstin: string;
  billing_address: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  tax: { enabled?: boolean; rate_basis_points?: number; price_includes_tax?: boolean; sac_code?: string; components?: { name: string; bp: number }[] };
  booking_reference: string;
  discount_amount: string;
  items: { description: string; quantity: number; unit_amount: string; tax_amount: string; total: string }[];
};
