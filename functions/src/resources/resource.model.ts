// Resource validation model and helper
import { z } from 'zod';
import { Resource, ResourceCategory } from '../../../packages/shared/src/types';

/**
 * Schema for creating a resource. All client‑provided fields are validated.
 * Protected fields (id, ownerId, institutionId, timestamps, inventory‑controlled fields,
 * images, availabilityStatus) are NOT accepted. The schema is strict – unknown keys cause validation failure.
 */
export const createResourceSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(2000),
    category: z.nativeEnum(ResourceCategory),
    resourceType: z.string().trim().min(1).max(100),
    location: z.string().trim().max(200).optional(),
    quantity: z.number().int().min(1).max(1000),
    condition: z.string().trim().max(200).optional(),
    // JSON‑compatible specifications with size limit (~2 KB when stringified)
    specifications: z
      .custom<unknown>((val) => typeof val === 'object' && val !== null && JSON.stringify(val).length <= 2000, {
        message: 'Specifications must be a JSON object ≤ 2000 characters',
      })
      .optional(),
    eligibilityRequirements: z
      .array(z.string().trim().max(100))
      .max(10)
      .optional(),
    approvalRequired: z.boolean(),
    // The following fields are intentionally **not** accepted from the client:
    // id, ownerId, institutionId, createdAt, updatedAt, availableQuantity, images, availabilityStatus
  })
  .strict();

/**
 * Schema for updating a resource. All fields are optional but at least one must be supplied.
 * Protected fields are excluded. AvailabilityStatus cannot be changed here – it is managed by privileged backend operations.
 */
export const updateResourceSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    category: z.nativeEnum(ResourceCategory).optional(),
    resourceType: z.string().trim().min(1).max(100).optional(),
    location: z.string().trim().max(200).optional(),
    // quantity / availableQuantity are server‑controlled – not updatable here
    condition: z.string().trim().max(200).optional(),
    specifications: z
      .custom<unknown>((val) => typeof val === 'object' && val !== null && JSON.stringify(val).length <= 2000, {
        message: 'Specifications must be a JSON object ≤ 2000 characters',
      })
      .optional(),
    eligibilityRequirements: z
      .array(z.string().trim().max(100))
      .max(10)
      .optional(),
    approvalRequired: z.boolean().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one updatable field must be provided',
  });

// Runtime schema to validate data read from Firestore
const firestoreResourceSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.nativeEnum(ResourceCategory),
  resourceType: z.string(),
  institutionId: z.string(),
  ownerId: z.string(),
  location: z.string().optional(),
  quantity: z.number().int().min(1),
  availableQuantity: z.number().int().min(0).optional(),
  condition: z.string().optional(),
  images: z.array(z.string()).optional(),
  specifications: z
    .custom<unknown>((val) => typeof val === 'object' && val !== null && JSON.stringify(val).length <= 2000)
    .optional(),
  eligibilityRequirements: z.array(z.string()).optional(),
  availabilityStatus: z.enum(['available', 'unavailable', 'reserved']).optional(),
  approvalRequired: z.boolean(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

/**
 * Convert a Firestore document snapshot into the shared {@link Resource} type.
 * Throws if the document does not exist or the stored data is malformed.
 * Timestamp fields are returned unchanged – they satisfy the {@link Resource} definition.
 */
export function docToResource(
  doc: FirebaseFirestore.DocumentSnapshot
): Resource {
  if (!doc.exists) {
    throw new Error(`Resource document ${doc.id} does not exist`);
  }
  const raw = doc.data();
  const parsed = firestoreResourceSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid resource data for ${doc.id}: ${parsed.error.message}`);
  }
  const data = parsed.data;
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    category: data.category,
    resourceType: data.resourceType,
    institutionId: data.institutionId,
    ownerId: data.ownerId,
    location: data.location,
    quantity: data.quantity,
    availableQuantity: data.availableQuantity ?? data.quantity,
    condition: data.condition,
    images: data.images ?? [],
    specifications: (data.specifications ?? {}) as Record<string, unknown>,
    eligibilityRequirements: data.eligibilityRequirements ?? [],
    availabilityStatus: data.availabilityStatus ?? 'available',
    approvalRequired: data.approvalRequired,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
