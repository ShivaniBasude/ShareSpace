# ShareSpace — Firestore Database Schema

## Design Philosophy
ShareSpace uses Google Cloud Firestore in Datastore/Native Mode. All documents follow typed TypeScript models defined in `src/types/index.ts` and `functions/src/shared/types.ts`.

---

## Planned Collections

### 1. `users`
Represents registered users in the platform. Synced upon authentication creation.
- **Document ID**: `uid` (Matches Firebase Auth UID)
- **Planned Fields**:
  - `uid` (`string`): Firebase Auth unique user identifier.
  - `email` (`string`): Institutional or personal email.
  - `displayName` (`string`): Full name.
  - `role` (`string`): `'student' | 'faculty' | 'admin' | 'security'`.
  - `department` (`string`, optional): Department or unit name.
  - `phoneNumber` (`string`, optional): Contact number.
  - `photoURL` (`string`, optional): Avatar URL.
  - `createdAt` (`timestamp` / `ISO string`): Record creation timestamp.
  - `updatedAt` (`timestamp` / `ISO string`): Last update timestamp.

### 2. `resources`
Represents bookable physical or digital assets (rooms, labs, equipment, conference halls, vehicles).
- **Document ID**: Auto-generated (`resourceId`)
- **Planned Fields**:
  - `id` (`string`): Unique resource ID.
  - `name` (`string`): Name/label of the resource.
  - `category` (`string`): `'room' | 'lab' | 'equipment' | 'hall' | 'vehicle'`.
  - `capacity` (`number`, optional): Maximum occupancy/headcount.
  - `location` (`string`): Building/room number or storage location.
  - `description` (`string`): Description and technical specifications.
  - `images` (`string[]`): Cloud Storage URLs for photos.
  - `status` (`string`): `'available' | 'maintenance' | 'reserved' | 'decommissioned'`.
  - `requiresApproval` (`boolean`): If true, bookings require approver sign-off.
  - `amenities` (`string[]`): List of available features (e.g. `['projector', 'whiteboard', 'ac']`).
  - `qrCodeUrl` (`string`, optional): URL or encoded string for quick check-in.
  - `createdAt` (`timestamp` / `ISO string`): Creation timestamp.
  - `updatedAt` (`timestamp` / `ISO string`): Update timestamp.

### 3. `bookings`
Represents an active, pending, or historic reservation for a resource.
- **Document ID**: Auto-generated (`bookingId`)
- **Planned Fields**:
  - `id` (`string`): Unique booking ID.
  - `resourceId` (`string`): Foreign reference to `resources/{resourceId}`.
  - `userId` (`string`): Foreign reference to `users/{userId}`.
  - `userDisplayName` (`string`): Denormalized user name for fast display.
  - `userEmail` (`string`): Denormalized user email.
  - `startTime` (`timestamp` / `ISO string`): Scheduled start time.
  - `endTime` (`timestamp` / `ISO string`): Scheduled end time.
  - `purpose` (`string`): Stated purpose of use.
  - `status` (`string`): `'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in' | 'completed'`.
  - `approvalId` (`string`, optional): Foreign reference to `approvals/{approvalId}`.
  - `checkInTime` (`timestamp` / `ISO string`, optional): Timestamp of physical check-in.
  - `checkOutTime` (`timestamp` / `ISO string`, optional): Timestamp of check-out/return.
  - `createdAt` (`timestamp` / `ISO string`): Creation timestamp.
  - `updatedAt` (`timestamp` / `ISO string`): Status update timestamp.

### 4. `approvals`
Tracks the approval decision process for bookings requiring admin or faculty permission.
- **Document ID**: Auto-generated (`approvalId`)
- **Planned Fields**:
  - `id` (`string`): Unique approval record ID.
  - `bookingId` (`string`): Foreign reference to `bookings/{bookingId}`.
  - `resourceId` (`string`): Foreign reference to `resources/{resourceId}`.
  - `requestedBy` (`string`): UID of the requesting user.
  - `approverId` (`string`, optional): UID of the reviewer (faculty or admin).
  - `status` (`string`): `'pending' | 'approved' | 'rejected'`.
  - `remarks` (`string`, optional): Approval/rejection comment.
  - `decidedAt` (`timestamp` / `ISO string`, optional): Timestamp of decision.
  - `createdAt` (`timestamp` / `ISO string`): Request creation timestamp.

### 5. `incidents`
Tracks reported issues or maintenance requirements on resources.
- **Document ID**: Auto-generated (`incidentId`)
- **Planned Fields**:
  - `id` (`string`): Unique incident ID.
  - `resourceId` (`string`, optional): Reference to affected resource.
  - `bookingId` (`string`, optional): Reference to associated booking if applicable.
  - `reportedBy` (`string`): UID of reporting user.
  - `title` (`string`): Brief summary of the issue.
  - `description` (`string`): Detailed description.
  - `severity` (`string`): `'low' | 'medium' | 'high' | 'critical'`.
  - `status` (`string`): `'open' | 'investigating' | 'resolved' | 'closed'`.
  - `attachments` (`string[]`, optional): Photos or error logs uploaded to Storage.
  - `createdAt` (`timestamp` / `ISO string`): Report creation timestamp.
  - `updatedAt` (`timestamp` / `ISO string`): Status update timestamp.

### 6. `notifications`
User notifications for booking status updates, reminders, and alerts.
- **Document ID**: Auto-generated (`notificationId`)
- **Planned Fields**:
  - `id` (`string`): Unique notification ID.
  - `userId` (`string`): Recipient user UID.
  - `title` (`string`): Short headline.
  - `message` (`string`): Body text.
  - `read` (`boolean`): Read status indicator.
  - `type` (`string`): `'booking' | 'approval' | 'incident' | 'system'`.
  - `linkUrl` (`string`, optional): Action link in the app.
  - `createdAt` (`timestamp` / `ISO string`): Timestamp of creation.

### 7. `audit_logs`
Immutable audit records for compliance, administrative visibility, and security.
- **Document ID**: Auto-generated (`logId`)
- **Planned Fields**:
  - `id` (`string`): Unique log entry ID.
  - `action` (`string`): e.g. `'CREATE_BOOKING'`, `'APPROVE_BOOKING'`, `'CHECK_IN'`.
  - `performedBy` (`string`): UID of the acting user or `'system'`.
  - `targetCollection` (`string`): Collection name affected.
  - `targetId` (`string`): Document ID affected.
  - `metadata` (`map`, optional): Additional contextual parameters.
  - `timestamp` (`timestamp` / `ISO string`): Timestamp of the event.

---

## Planned Composite Indexes

The following composite indexes will be configured in `firestore.indexes.json` as queries are added:
1. `bookings`: `resourceId` (ASC) + `startTime` (ASC) + `endTime` (ASC)
2. `bookings`: `userId` (ASC) + `createdAt` (DESC)
3. `approvals`: `status` (ASC) + `createdAt` (DESC)
4. `notifications`: `userId` (ASC) + `createdAt` (DESC) + `read` (ASC)
5. `incidents`: `resourceId` (ASC) + `status` (ASC) + `severity` (DESC)
