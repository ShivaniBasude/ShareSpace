// Shared TypeScript interfaces for Cloud Functions backend
// Keep synchronized with src/types/index.ts

export type UserRole = 'student' | 'faculty' | 'admin' | 'security';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in' | 'completed';

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: BookingStatus;
  approvalId?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  updatedAt: string;
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
  decidedAt?: string;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'booking' | 'approval' | 'incident' | 'system';
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetCollection: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
