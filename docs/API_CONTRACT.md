# ShareSpace — API & Cloud Functions Contract

## Overview
This document defines the interface boundary between the **React Frontend** and **Firebase Cloud Functions (Backend)**.
All functions use Firebase `https.onCall` (Callable Functions), which provide automated authentication context verification, CSRF mitigation, and JSON serialization.

---

## Callable Functions Specifications

---

### Phase 1: Authentication & User Management

#### 1. `completeUserRegistration`
**Trigger Type**: `onCall`  
**Purpose**: Finalizes registration after client creates an account using Firebase Authentication (email/password). Initializes user profile in Firestore with default role `'student'` and active status, and sets Custom Claims on the Auth token.  
**Caller Auth Requirement**: Authenticated user.

- **Request Input (`CompleteUserRegistrationInput`)**:
  ```typescript
  {
    fullName: string;        // Required, min 2 chars
    institutionId: string;   // Required, e.g. "univ-main"
    department?: string;     // Optional, e.g. "Computer Science"
    phoneNumber?: string;    // Optional, e.g. "+1-555-0199"
    profileImageUrl?: string;// Optional, avatar URL
  }
  ```
- **Response Payload (`CompleteUserRegistrationResponse`)**:
  ```typescript
  {
    success: boolean;
    profile: UserProfile;
    message: string;
  }
  ```
- **Error Codes**:
  - `unauthenticated`: Caller has no valid Firebase Auth token.
  - `invalid-argument`: `fullName` or `institutionId` missing or too short.
  - `permission-denied`: Account was previously disabled.
- **Frontend Integration Example**:
  ```typescript
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { CompleteUserRegistrationInput, CompleteUserRegistrationResponse } from '@/types';

  const functions = getFunctions();
  const completeReg = httpsCallable<CompleteUserRegistrationInput, CompleteUserRegistrationResponse>(
    functions,
    'completeUserRegistration'
  );

  const result = await completeReg({
    fullName: 'Jane Doe',
    institutionId: 'campus-north',
    department: 'Electrical Engineering',
  });
  console.log('Registered Profile:', result.data.profile);
  ```

---

#### 2. `getMyProfile`
**Trigger Type**: `onCall`  
**Purpose**: Retrieves the canonical user profile for the currently signed-in user. Verifies that the account is not disabled.  
**Caller Auth Requirement**: Authenticated user.

- **Request Input**: None (`void`).
- **Response Payload (`GetMyProfileResponse`)**:
  ```typescript
  {
    profile: UserProfile;
  }
  ```
- **Error Codes**:
  - `unauthenticated`: Caller is not signed in.
  - `not-found`: User document does not exist in Firestore (registration incomplete).
  - `permission-denied`: Account status is `'disabled'`.
- **Frontend Integration Example**:
  ```typescript
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { GetMyProfileResponse } from '@/types';

  const functions = getFunctions();
  const fetchProfile = httpsCallable<void, GetMyProfileResponse>(functions, 'getMyProfile');
  const { data } = await fetchProfile();
  console.log('Current User Role:', data.profile.role);
  ```

---

#### 3. `updateMyProfile`
**Trigger Type**: `onCall`  
**Purpose**: Updates mutable profile details for the authenticated user. Strictly rejects any attempt to modify `role`, `accountStatus`, `institutionId`, `email`, `uid`, or `createdAt`.  
**Caller Auth Requirement**: Authenticated user with active account status.

- **Request Input (`UpdateMyProfileInput`)**:
  ```typescript
  {
    fullName?: string;
    department?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
  }
  ```
- **Response Payload (`UpdateMyProfileResponse`)**:
  ```typescript
  {
    success: boolean;
    profile: UserProfile;
    message: string;
  }
  ```
- **Error Codes**:
  - `unauthenticated`: Caller is not authenticated.
  - `permission-denied`: Caller is disabled or attempted to modify protected fields (`role`, `accountStatus`, `institutionId`, etc.).
  - `invalid-argument`: Invalid field types or `fullName` is shorter than 2 characters.
  - `not-found`: User profile does not exist.
- **Frontend Integration Example**:
  ```typescript
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { UpdateMyProfileInput, UpdateMyProfileResponse } from '@/types';

  const functions = getFunctions();
  const updateProfile = httpsCallable<UpdateMyProfileInput, UpdateMyProfileResponse>(
    functions,
    'updateMyProfile'
  );

  const { data } = await updateProfile({
    phoneNumber: '+1-555-9876',
    department: 'Data Science',
  });
  console.log('Updated:', data.profile);
  ```

---

#### 4. `assignUserRole` (Admin Only)
**Trigger Type**: `onCall`  
**Purpose**: Assigns an elevated or different role (`owner`, `institution_manager`, `admin`, `student`) to a user and updates their Auth Custom Claims.  
**Caller Auth Requirement**: Authenticated user with `role === 'admin'`.

- **Request Input**:
  ```typescript
  {
    targetUid: string;
    newRole: 'student' | 'owner' | 'institution_manager' | 'admin';
  }
  ```
- **Response Payload**:
  ```typescript
  {
    success: boolean;
    targetUid: string;
    role: string;
    message: string;
  }
  ```
- **Error Codes**:
  - `unauthenticated`: Caller is not authenticated.
  - `permission-denied`: Caller does not possess `admin` privileges.
  - `invalid-argument`: Invalid `targetUid` or unsupported role.
  - `not-found`: Target user does not exist.

---

### Subsequent Phase Callable Placeholders (Phase 2+)

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
