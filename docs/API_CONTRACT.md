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


---

### Phase 3: Booking & Approval Management

#### 1. `createBooking`
**Trigger Type**: `onCall`  
**Purpose**: Creates a booking reservation and reserves inventory atomically via a Firestore transaction. If `approvalRequired` is true on the resource, status is set to `'pending'`; otherwise `'approved'`. In both cases, inventory is reserved immediately upon creation.  
**Caller Auth Requirement**: Authenticated user with active status in the same institution.

- **Request Input (`createBookingSchema`)**:
  ```typescript
  {
    resourceId: string;
    quantity: number;        // integer, min 1, max 1000
    startTime: string | Date; // ISO 8601 string or Date
    endTime: string | Date;   // Must be after startTime
    purpose: string;         // 1-2000 chars
  }
  ```
- **Response Payload**: `Booking` object.
- **Error Codes**:
  - `unauthenticated`: Caller is not logged in.
  - `invalid-argument`: Invalid input format, endTime before startTime, etc.
  - `not-found`: Resource or user profile does not exist.
  - `permission-denied`: Caller belongs to a different institution or account disabled.
  - `failed-precondition`: Resource unavailable or requested quantity exceeds available quantity.

---

#### 2. `getBooking`
**Trigger Type**: `onCall`  
**Purpose**: Retrieves details for a specific booking.  
**Caller Auth Requirement**: Requester, resource owner, institution manager, or administrator.

- **Request Input**:
  ```typescript
  {
    bookingId: string;
  }
  ```
- **Response Payload**: `Booking` object.
- **Error Codes**:
  - `unauthenticated`: Caller is not logged in.
  - `not-found`: Booking does not exist.
  - `permission-denied`: Caller is not authorized to inspect this booking.

---

#### 3. `listMyBookings`
**Trigger Type**: `onCall`  
**Purpose**: Lists paginated bookings requested by the authenticated caller.  
**Caller Auth Requirement**: Authenticated active user.

- **Request Input**:
  ```typescript
  {
    limit?: number;        // default 20, max 50
    startAfterId?: string; // document ID cursor
    status?: BookingStatus;// optional filter
  }
  ```
- **Response Payload**:
  ```typescript
  {
    bookings: Booking[];
    nextPageToken?: string;
  }
  ```

---

#### 4. `listOwnerBookingRequests`
**Trigger Type**: `onCall`  
**Purpose**: Lists incoming booking requests for resources owned by the caller (or all requests in institution for managers/admins).  
**Caller Auth Requirement**: User with role `'owner'`, `'institution_manager'`, or `'admin'`.

- **Request Input**:
  ```typescript
  {
    limit?: number;        // default 20, max 50
    startAfterId?: string; // document ID cursor
    status?: BookingStatus;// optional filter
  }
  ```
- **Response Payload**:
  ```typescript
  {
    bookings: Booking[];
    nextPageToken?: string;
  }
  ```

---

#### 5. `approveBooking`
**Trigger Type**: `onCall`  
**Purpose**: Transitions a booking from `'pending'` to `'approved'`. Inventory is already reserved at creation and is NOT decremented again.  
**Caller Auth Requirement**: Resource owner, institution manager, or admin.

- **Request Input**:
  ```typescript
  {
    bookingId: string;
    remarks?: string;
  }
  ```
- **Response Payload**: Updated `Booking` object.
- **Error Codes**:
  - `failed-precondition`: Booking is not in `'pending'` status.
  - `permission-denied`: Caller is not the owner/manager/admin.

---

#### 6. `rejectBooking`
**Trigger Type**: `onCall`  
**Purpose**: Rejects a pending booking request and restores reserved inventory exactly once.  
**Caller Auth Requirement**: Resource owner, institution manager, or admin.

- **Request Input**:
  ```typescript
  {
    bookingId: string;
    reason: string;
  }
  ```
- **Response Payload**: Updated `Booking` object.

---

#### 7. `cancelBooking`
**Trigger Type**: `onCall`  
**Purpose**: Cancels a pending or approved booking. Restores reserved inventory exactly once and invalidates any active QR code.  
**Caller Auth Requirement**: Requester, resource owner, institution manager, or admin.

- **Request Input**:
  ```typescript
  {
    bookingId: string;
    reason?: string;
  }
  ```
- **Response Payload**: Updated `Booking` object.

---

#### 8. `completeBooking`
**Trigger Type**: `onCall`  
**Purpose**: Marks a booking completed directly (if not completed through QR checkout) and restores reserved inventory.  
**Caller Auth Requirement**: Resource owner, institution manager, or admin.

- **Request Input**:
  ```typescript
  {
    bookingId: string;
  }
  ```
- **Response Payload**: Updated `Booking` object.

---

### Phase 4: QR Code Management

#### 1. `generateBookingQRCode`
**Trigger Type**: `onCall`  
**Purpose**: Generates a cryptographically secure 256-bit token for an approved booking, stores its SHA-256 hash in `qr_codes`, and returns a Data URL QR code image.  
**Caller Auth Requirement**: Booking requester, resource owner, institution manager, or admin.

- **Request Input**:
  ```typescript
  {
    bookingId: string;
  }
  ```
- **Response Payload**:
  ```typescript
  {
    qrCodeId: string;
    token: string;
    qrCodeDataUrl: string;
    expiresAt: string;
  }
  ```
- **Error Codes**:
  - `failed-precondition`: Booking status is not `'approved'`.
  - `permission-denied`: Caller is not authorized.

---

#### 2. `verifyQRCode`
**Trigger Type**: `onCall`  
**Purpose**: Verifies token hash against Firestore, checking expiration, institution, and booking state without modifying database state.  
**Caller Auth Requirement**: Authenticated user in the same institution.

- **Request Input**:
  ```typescript
  {
    token: string;
  }
  ```
- **Response Payload**:
  ```typescript
  {
    valid: boolean;
    booking: Booking;
    qrStatus: QRCodeStatus;
    message: string;
  }
  ```

---

#### 3. `checkInWithQRCode`
**Trigger Type**: `onCall`  
**Purpose**: Scans student QR code on-site, transitioning booking from `'approved'` to `'checked_in'` and QR from `'active'` to `'checked_in'`. Does not revoke the token, allowing the same credential to be used for checkout.  
**Caller Auth Requirement**: Resource owner, institution manager, or admin.

- **Request Input**:
  ```typescript
  {
    token: string;
  }
  ```
- **Response Payload**:
  ```typescript
  {
    success: boolean;
    booking: Booking;
    message: string;
  }
  ```
- **Error Codes**:
  - `already-exists`: Booking is already checked in.
  - `failed-precondition`: Booking not approved or QR expired/revoked.

---

#### 4. `checkOutWithQRCode`
**Trigger Type**: `onCall`  
**Purpose**: Completes check-out using the verified QR token. Transitions booking from `'checked_in'` to `'completed'`, transitions QR to `'completed'`, and restores reserved inventory to the Resource.  
**Caller Auth Requirement**: Resource owner, institution manager, or admin.

- **Request Input**:
  ```typescript
  {
    token: string;
  }
  ```
- **Response Payload**:
  ```typescript
  {
    success: boolean;
    booking: Booking;
    message: string;
  }
  ```
- **Error Codes**:
  - `already-exists`: Booking has already completed checkout.
  - `failed-precondition`: Booking or QR is not currently in `'checked_in'` state.
