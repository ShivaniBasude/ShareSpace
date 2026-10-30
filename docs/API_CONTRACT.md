# ShareSpace — API & Cloud Functions Contract

## Overview
This document defines the interface boundary between the **React Frontend** and **Firebase Cloud Functions (Backend)**.
All functions use Firebase `https.onCall` (Callable Functions), which provide automated authentication context verification, CSRF mitigation, and JSON serialization.

---

## Callable Functions Specifications (Placeholders)

### 1. `createBookingRequest`
**Trigger Type**: `onCall`  
**Purpose**: Creates a booking reservation after checking for slot collisions and user authorization.  
**Caller Auth Requirement**: Authenticated user (`student` or `faculty`).

- **Input Payload**:
  ```typescript
  {
    resourceId: string;
    startTime: string; // ISO 8601 string
    endTime: string;   // ISO 8601 string
    purpose: string;
  }
  ```
- **Success Response**:
  ```typescript
  {
    success: boolean;
    bookingId: string;
    status: 'approved' | 'pending';
    message: string;
  }
  ```
- **Error Codes**:
  - `unauthenticated`: User is not signed in.
  - `invalid-argument`: Start/End times are invalid or in the past.
  - `already-exists`: Time slot collides with an existing booking.
  - `permission-denied`: User role is not permitted to reserve this resource.

---

### 2. `decideApproval`
**Trigger Type**: `onCall`  
**Purpose**: Approves or rejects a pending booking request.  
**Caller Auth Requirement**: Authenticated `faculty` or `admin`.

- **Input Payload**:
  ```typescript
  {
    approvalId: string;
    decision: 'approved' | 'rejected';
    remarks?: string;
  }
  ```
- **Success Response**:
  ```typescript
  {
    success: boolean;
    bookingId: string;
    decision: 'approved' | 'rejected';
    updatedAt: string;
  }
  ```
- **Error Codes**:
  - `unauthenticated`: Missing user auth token.
  - `permission-denied`: Caller is neither faculty nor administrator.
  - `not-found`: The specified approval record does not exist.
  - `failed-precondition`: The approval has already been finalized.

---

### 3. `verifyAndCheckIn`
**Trigger Type**: `onCall`  
**Purpose**: Validates physical QR code scanning for on-site check-in.  
**Caller Auth Requirement**: Authenticated user or `security` role.

- **Input Payload**:
  ```typescript
  {
    qrPayload: string;
    resourceId: string;
    timestamp: string;
  }
  ```
- **Success Response**:
  ```typescript
  {
    success: boolean;
    bookingId: string;
    checkedInAt: string;
    message: string;
  }
  ```
- **Error Codes**:
  - `invalid-argument`: QR token is expired, corrupted, or does not match resource.
  - `permission-denied`: Caller is neither the booking owner nor security personnel.
  - `failed-precondition`: Check-in window has not started yet or has expired.

---

### 4. `reportIncident`
**Trigger Type**: `onCall`  
**Purpose**: Logs a damage or maintenance report for a resource and flags its status.  
**Caller Auth Requirement**: Authenticated user.

- **Input Payload**:
  ```typescript
  {
    resourceId?: string;
    bookingId?: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    attachments?: string[];
  }
  ```
- **Success Response**:
  ```typescript
  {
    success: boolean;
    incidentId: string;
    status: 'open';
    createdAt: string;
  }
  ```
- **Error Codes**:
  - `unauthenticated`: Caller is not authenticated.
  - `invalid-argument`: Required fields missing or title too short.

---

## Reactive Background Triggers (Event-Driven)

These functions do not have an HTTP API endpoint; they trigger on backend database events:

1. **`onBookingCreated`** (`firestore.onDocumentCreated('bookings/{bookingId}')`):
   - Dispatches a confirmation notification to the user.
   - If approval is required, creates an entry in `approvals` and notifies the designated approvers.
   - Appends an entry into `audit_logs`.

2. **`onBookingStatusUpdated`** (`firestore.onDocumentUpdated('bookings/{bookingId}')`):
   - Notifies the requester when their booking transitions to `approved`, `rejected`, or `cancelled`.
   - Records transition in `audit_logs`.

3. **`onUserCreated`** (`auth.user().onCreate`):
   - Seeds the default user document in `users/{uid}` with role `'student'`.
