// Canonical Shared Domain Models & Types for ShareSpace

export type UserRole = 'student' | 'owner' | 'institution_manager' | 'admin';

export type AccountStatus = 'active' | 'disabled';

export type TimestampField = string | { seconds: number; nanoseconds: number } | unknown;

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  institutionId: string;
  department?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  accountStatus: AccountStatus;
  createdAt: TimestampField;
  updatedAt: TimestampField;
}

// Request and Response contracts for Authentication & User Management
export interface CompleteUserRegistrationInput {
  fullName: string;
  institutionId: string;
  department?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface CompleteUserRegistrationResponse {
  success: boolean;
  profile: UserProfile;
  message: string;
}

export interface GetMyProfileResponse {
  profile: UserProfile;
}

export interface UpdateMyProfileInput {
  fullName?: string;
  department?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface UpdateMyProfileResponse {
  success: boolean;
  profile: UserProfile;
  message: string;
}

// ---------- Resource Management Types (Phase 2) ----------
export const ResourceCategory = {
  Electronics: "Electronics",
  Laboratory: "Laboratory Equipment",
  Sports: "Sports Equipment",
  Books: "Books and Study Materials",
  Creative: "Creative Equipment",
  Rooms: "Rooms and Spaces",
  Other: "Other",
} as const;

export type ResourceCategory =
  (typeof ResourceCategory)[keyof typeof ResourceCategory];

/** Availability status of a resource */
export type ResourceAvailabilityStatus = "available" | "unavailable" | "reserved";

/** Canonical Resource model stored in Firestore */
export interface Resource {
  /** Auto‑generated document ID */
  id: string;
  /** Human‑readable title */
  title: string;
  /** Detailed description (markdown / plain text) */
  description: string;
  /** Category of the resource */
  category: ResourceCategory;
  /** Custom resource type, e.g. "laptop", "microscope" */
  resourceType: string;
  /** Institution that owns the resource */
  institutionId: string;
  /** UID of the user who created / owns the resource */
  ownerId: string;
  /** Optional physical location description */
  location?: string;
  /** Total quantity owned */
  quantity: number;
  /** How many are currently available */
  availableQuantity: number;
  /** Optional condition description */
  condition?: string;
  /** URLs of stored images */
  images?: string[];
  /** Arbitrary key/value specifications */
  specifications?: Record<string, unknown>;
  /** Eligibility requirements for borrowing */
  eligibilityRequirements?: string[];
  /** Availability state */
  availabilityStatus: ResourceAvailabilityStatus;
  /** Whether borrowing requires manager approval */
  approvalRequired: boolean;
  /** Server‑timestamp when created */
  createdAt: TimestampField;
  /** Server‑timestamp when last updated */
  updatedAt: TimestampField;
}


export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in' | 'completed';

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  ownerId?: string;
  quantity?: number;
  startTime: TimestampField;
  endTime: TimestampField;
  purpose: string;
  status: BookingStatus;
  approvalId?: string;
  remarks?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  inventoryReserved?: boolean;
  checkInTime?: TimestampField;
  checkOutTime?: TimestampField;
  institutionId: string;
  createdAt: TimestampField;
  updatedAt: TimestampField;
}

export type QRCodeStatus = 'active' | 'checked_in' | 'completed' | 'revoked' | 'expired';

export interface QRCodeRecord {
  id: string;
  bookingId: string;
  resourceId: string;
  institutionId: string;
  ownerId: string;
  requesterId: string;
  tokenHash: string;
  status: QRCodeStatus;
  expiresAt: TimestampField;
  checkInTime?: TimestampField;
  checkOutTime?: TimestampField;
  createdAt: TimestampField;
  updatedAt: TimestampField;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  bookingId: string;
  resourceId: string;
  requestedBy: string;
  approverId?: string;
  status: ApprovalStatus;
  remarks?: string;
  decidedAt?: TimestampField;
  institutionId: string;
  createdAt: TimestampField;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  resourceId?: string;
  bookingId?: string;
  reportedBy: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  attachments?: string[];
  institutionId: string;
  createdAt: TimestampField;
  updatedAt: TimestampField;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'booking' | 'approval' | 'incident' | 'system';
  linkUrl?: string;
  createdAt: TimestampField;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetCollection: string;
  targetId: string;
  institutionId?: string;
  metadata?: Record<string, unknown>;
  timestamp: TimestampField;
}
