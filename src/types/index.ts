// Canonical Shared Domain Models & Types for ShareSpace (frontend copy)
// Keep synchronized with packages/shared/src/types.ts

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

export type ResourceCategory = 'room' | 'lab' | 'equipment' | 'hall' | 'vehicle';
export type ResourceStatus = 'available' | 'maintenance' | 'reserved' | 'decommissioned';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  capacity?: number;
  location: string;
  description: string;
  images: string[];
  status: ResourceStatus;
  requiresApproval: boolean;
  amenities: string[];
  qrCodeUrl?: string;
  institutionId: string;
  createdAt: TimestampField;
  updatedAt: TimestampField;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in' | 'completed';

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  startTime: TimestampField;
  endTime: TimestampField;
  purpose: string;
  status: BookingStatus;
  approvalId?: string;
  checkInTime?: TimestampField;
  checkOutTime?: TimestampField;
  institutionId: string;
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
