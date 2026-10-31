# ShareSpace — Firestore Database Schema

## Design Philosophy
ShareSpace uses Google Cloud Firestore in Datastore/Native mode. All documents follow the TypeScript models defined in `packages/shared/src/types.ts` and are enforced at runtime by Zod schemas in the backend.

---

## Collections

### 1. `users`
(Documentation unchanged – see original file for details.)

---

### 2. `resources`
Represents bookable physical or digital assets (rooms, labs, equipment, etc.).

| Field | Type | Optional? | Default / Server‑controlled | Notes |
|-------|------|-----------|-----------------------------|-------|
| **id** | `string` | No | Derived from the Firestore document ID | Not stored in the document body. |
| **title** | `string` | No | — | Human‑readable title. |
| **description** | `string` | No | — | Detailed markdown / plain‑text description. |
| **category** | `ResourceCategory` (enum) | No | — | One of the defined categories (Electronics, Laboratory, …). |
| **resourceType** | `string` | No | — | Custom type, e.g. "laptop", "microscope". |
| **institutionId** | `string` | No | Set by backend from the caller's profile | Clients cannot supply or modify. |
| **ownerId** | `string` | No | Set by backend from the authenticated UID | Clients cannot supply or modify. |
| **location** | `string` | Yes | — | Physical location description (optional). |
| **quantity** | `number` (int) | No | — | Total number of items owned. |
| **availableQuantity** | `number` (int) | No | Initialized to `quantity`; updated by backend booking logic | Not client‑editable. |
| **condition** | `string` | Yes | — | Optional condition description. |
| **images** | `string[]` | Yes | Initialized to empty array `[]` by backend | Not client‑editable. |
| **specifications** | `Record<string, unknown>` | Yes | — | Arbitrary key/value pairs; JSON‑compatible, ≤ 2 KB when stringified. |
| **eligibilityRequirements** | `string[]` | Yes | — | Optional list of requirements (max 10 items, each ≤ 100 chars). |
| **availabilityStatus** | `'available' | 'unavailable' | 'reserved'` | No | Set by backend (`'available'` on create, `'unavailable'` via `deactivateResource`, `'reserved'` only by privileged operations) | Clients cannot modify via `updateResource`. |
| **approvalRequired** | `boolean` | No | — | Indicates whether a booking needs manager approval. |
| **createdAt** | Firestore `Timestamp` | No | `FieldValue.serverTimestamp()` on create | Server‑generated. |
| **updatedAt** | Firestore `Timestamp` | No | `FieldValue.serverTimestamp()` on each mutation | Server‑generated. |

**Important**: Fields `id`, `availableQuantity`, `ownerId`, `institutionId`, `images`, and `availabilityStatus` are **server‑controlled** and are either derived from the document ID or managed exclusively by backend Cloud Functions. Clients must not attempt to write these fields; they are omitted from the Zod `createResourceSchema` and `updateResourceSchema` and are rejected by Firestore security rules.

---

### 3. `bookings`
Represents reservations for resources placed by students or staff.

| Field | Type | Optional? | Default / Server‑controlled | Notes |
|-------|------|-----------|-----------------------------|-------|
| **id** | `string` | No | Derived from Firestore document ID | Document ID. |
| **resourceId** | `string` | No | Supplied by requester | Reference to `resources/{resourceId}`. |
| **userId** | `string` | No | Inferred from auth context (`auth.uid`) | Requester UID. |
| **userDisplayName** | `string` | No | Set by backend from user profile | Human-readable name. |
| **userEmail** | `string` | No | Set by backend from auth context | Verified email. |
| **ownerId** | `string` | No | Copied from Resource document | Resource owner UID. |
| **quantity** | `number` | No | Client supplied (min 1, max 1000) | Number of units reserved. |
| **startTime** | Firestore `Timestamp` | No | Client supplied | Start time. |
| **endTime** | Firestore `Timestamp` | No | Client supplied | End time (must be after startTime). |
| **purpose** | `string` | No | Client supplied (1-2000 chars) | Reason for reservation. |
| **status** | `BookingStatus` | No | `'pending' \| 'approved' \| 'rejected' \| 'cancelled' \| 'checked_in' \| 'completed'` | Initial status is `'pending'` if approvalRequired, else `'approved'`. |
| **approvalId** | `string` | Yes | Set upon approval | Associated approval record ID. |
| **remarks** | `string` | Yes | Set upon approval | Approval remarks. |
| **rejectionReason** | `string` | Yes | Set upon rejection | Reason for rejection. |
| **cancellationReason** | `string` | Yes | Set upon cancellation | Reason for cancellation. |
| **inventoryReserved** | `boolean` | No | `true` upon creation | Tracks whether inventory is currently deducted from the Resource. Set to `false` on rejection, cancellation, or completion. |
| **checkInTime** | Firestore `Timestamp` | Yes | Set upon check-in | Timestamp of QR check-in. |
| **checkOutTime** | Firestore `Timestamp` | Yes | Set upon check-out/completion | Timestamp of QR check-out. |
| **institutionId** | `string` | No | Verified against caller profile | Campus/institution scope. |
| **createdAt** | Firestore `Timestamp` | No | `FieldValue.serverTimestamp()` | Creation timestamp. |
| **updatedAt** | Firestore `Timestamp` | No | `FieldValue.serverTimestamp()` | Last update timestamp. |

---

### 4. `qr_codes`
Represents cryptographically secure, single-booking QR verification credentials for check-in and check-out.

| Field | Type | Optional? | Server‑controlled | Notes |
|-------|------|-----------|-------------------|-------|
| **id** | `string` | No | Document ID | Unique QR credential record ID. |
| **bookingId** | `string` | No | Yes | Linked booking ID. |
| **resourceId** | `string` | No | Yes | Linked resource ID. |
| **institutionId** | `string` | No | Yes | Institution boundary. |
| **ownerId** | `string` | No | Yes | Resource owner UID. |
| **requesterId** | `string` | No | Yes | Borrower UID. |
| **tokenHash** | `string` | No | Yes | SHA-256 hash of the 256-bit crypto-random token. Raw token is never stored. |
| **status** | `QRCodeStatus` | No | Yes | `'active' \| 'checked_in' \| 'completed' \| 'revoked' \| 'expired'`. |
| **expiresAt** | Firestore `Timestamp` | No | Yes | Expiration timestamp (booking endTime + 2h grace window). |
| **checkInTime** | Firestore `Timestamp` | Yes | Yes | Set upon successful check-in. |
| **checkOutTime** | Firestore `Timestamp` | Yes | Yes | Set upon successful check-out. |
| **createdAt** | Firestore `Timestamp` | No | Yes | Creation timestamp. |
| **updatedAt** | Firestore `Timestamp` | No | Yes | Last update timestamp. |

---

### 5. `approvals`
(Documentation unchanged – see original file for details.)

---

### 6. `incidents`
(Documentation unchanged – see original file for details.)

---

### 7. `notifications`
(Documentation unchanged – see original file for details.)

---

### 8. `audit_logs`
(Documentation unchanged – see original file for details.)

---

## Planned Composite Indexes
(Indexes unchanged – see original file for details.)
