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
(Documentation unchanged – see original file for details.)

---

### 4. `approvals`
(Documentation unchanged – see original file for details.)

---

### 5. `incidents`
(Documentation unchanged – see original file for details.)

---

### 6. `notifications`
(Documentation unchanged – see original file for details.)

---

### 7. `audit_logs`
(Documentation unchanged – see original file for details.)

---

## Planned Composite Indexes
(Indexes unchanged – see original file for details.)
