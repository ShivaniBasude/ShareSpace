import React, { useState, useEffect, useRef } from 'react';
import {
  type Resource,
  ResourceCategory,
} from '../../../packages/shared/src/types';
import type {
  CreateResourceInput,
  UpdateResourceInput,
} from '../../features/resources';
import {
  Button,
  ImageIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  XIcon,
} from '../common';

export interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateResourceInput | UpdateResourceInput) => Promise<void>;
  initialResource?: Resource | null;
  isSubmitting?: boolean;
}

interface ResourceFormContentProps {
  initialResource?: Resource | null;
  onSubmit: (data: CreateResourceInput | UpdateResourceInput) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

const ResourceFormContent: React.FC<ResourceFormContentProps> = ({
  initialResource,
  onSubmit,
  onClose,
  isSubmitting,
}) => {
  const isEditing = Boolean(initialResource);

  // Initialize state directly from initialResource (Reset via key on parent)
  const [title, setTitle] = useState(initialResource?.title || '');
  const [category, setCategory] = useState<ResourceCategory>(
    initialResource?.category || ResourceCategory.Electronics
  );
  const [resourceType, setResourceType] = useState(initialResource?.resourceType || '');
  const [quantity, setQuantity] = useState<number>(initialResource?.quantity || 1);
  const [location, setLocation] = useState(initialResource?.location || '');
  const [condition, setCondition] = useState(initialResource?.condition || 'Excellent');
  const [approvalRequired, setApprovalRequired] = useState(
    initialResource?.approvalRequired || false
  );
  const [description, setDescription] = useState(initialResource?.description || '');

  // Dynamic Image Previews (Base64 data URLs)
  const [images, setImages] = useState<string[]>(
    initialResource?.images ? [...initialResource.images] : []
  );

  // Eligibility Requirements List
  const [eligibilityList, setEligibilityList] = useState<string[]>(
    initialResource?.eligibilityRequirements ? [...initialResource.eligibilityRequirements] : []
  );
  const [newRequirement, setNewRequirement] = useState('');

  // Key-Value Specifications
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(
    initialResource?.specifications
      ? Object.entries(initialResource.specifications).map(([k, v]) => ({
          key: k,
          value: String(v),
        }))
      : []
  );
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  // Form Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Selection Handler (Local FileReader Preview)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddRequirement = () => {
    if (!newRequirement.trim()) return;
    setEligibilityList((prev) => [...prev, newRequirement.trim()]);
    setNewRequirement('');
  };

  const handleRemoveRequirement = (idx: number) => {
    setEligibilityList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddSpec = () => {
    if (!specKey.trim() || !specVal.trim()) return;
    setSpecs((prev) => [...prev, { key: specKey.trim(), value: specVal.trim() }]);
    setSpecKey('');
    setSpecVal('');
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3) {
      newErrors.title = 'Resource title must be at least 3 characters.';
    }

    if (!resourceType.trim()) {
      newErrors.resourceType = 'Resource type is required (e.g. "Laptop", "Microscope").';
    }

    if (!description.trim() || description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }

    if (!quantity || quantity < 1) {
      newErrors.quantity = 'Total quantity must be at least 1.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const formattedSpecs: Record<string, unknown> = {};
    specs.forEach((s) => {
      formattedSpecs[s.key] = s.value;
    });

    const payload: CreateResourceInput = {
      title: title.trim(),
      description: description.trim(),
      category,
      resourceType: resourceType.trim(),
      quantity: Number(quantity),
      location: location.trim() || undefined,
      condition: condition.trim() || undefined,
      approvalRequired,
      eligibilityRequirements: eligibilityList,
      specifications: formattedSpecs,
      images,
    };

    await onSubmit(payload);
  };

  const categories = Object.values(ResourceCategory);

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Server-managed fields advisory badge */}
        <div className="rounded-lg bg-indigo-50/60 p-3 text-xs text-indigo-800 border border-indigo-200/60 dark:bg-indigo-950/30 dark:border-indigo-900/40 dark:text-indigo-300 flex items-start gap-2">
          <ShieldCheckIcon className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Governance Rule:</strong> System identifiers, institution assignment, and
            availability timestamps are server-managed and protected from direct tampering.
          </span>
        </div>

        {/* Title & Resource Type */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1">
            <label
              htmlFor="resource-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Resource Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="resource-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Precision GPU Workstation — Dell 7920"
              className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                errors.title
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
              }`}
            />
            {errors.title && <p className="text-2xs text-rose-600">{errors.title}</p>}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="resource-type"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Resource Type <span className="text-rose-500">*</span>
            </label>
            <input
              id="resource-type"
              type="text"
              required
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              placeholder="e.g. Workstation, Camera"
              className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                errors.resourceType
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
              }`}
            />
            {errors.resourceType && (
              <p className="text-2xs text-rose-600">{errors.resourceType}</p>
            )}
          </div>
        </div>

        {/* Category & Quantity & Condition */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label
              htmlFor="resource-category"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="resource-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:outline-hidden"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="resource-quantity"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Total Inventory Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              id="resource-quantity"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                errors.quantity
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
              }`}
            />
            {errors.quantity && <p className="text-2xs text-rose-600">{errors.quantity}</p>}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="resource-condition"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Physical Condition
            </label>
            <select
              id="resource-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Like New">Like New</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>
        </div>

        {/* Location & Approval Toggle */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-center">
          <div className="sm:col-span-2 space-y-1">
            <label
              htmlFor="resource-location"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Physical Campus Location (Optional)
            </label>
            <input
              id="resource-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Complex, Lab Room 304"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Require Manager Approval
              </span>
            </label>
            <p className="text-3xs text-slate-400 mt-0.5 pl-6.5">
              Route reservation requests through approval review
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label
            htmlFor="resource-description"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="resource-description"
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe equipment capabilities, accessories included, and checkout procedures..."
            className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
              errors.description
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
            }`}
          />
          {errors.description && (
            <p className="text-2xs text-rose-600">{errors.description}</p>
          )}
        </div>

        {/* Image Upload & Preview Section */}
        <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Resource Images
              </h4>
              <p className="text-2xs text-slate-400">
                Select images from your device to preview. (Local previews active; Storage
                uploads activate in Phase 2.6)
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              icon={<ImageIcon className="h-4 w-4" />}
            >
              Upload Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              multiple
              onChange={handleImageFileChange}
              className="hidden"
            />
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-16/10 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800 shadow-2xs"
                >
                  <img
                    src={imgUrl}
                    alt={`Preview ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    aria-label={`Remove image ${idx + 1}`}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
              No images selected. Standard category artwork will be displayed if omitted.
            </div>
          )}
        </div>

        {/* Eligibility Requirements Section */}
        <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Eligibility & Usage Requirements
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRequirement();
                }
              }}
              placeholder="e.g. Enrolled in ECE Circuit Lab, Signed Safety Waiver"
              className="flex-1 rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:outline-hidden"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddRequirement}
              icon={<PlusIcon className="h-3.5 w-3.5" />}
            >
              Add
            </Button>
          </div>

          {eligibilityList.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {eligibilityList.map((req, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-md bg-slate-50 py-1.5 px-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <span>• {req}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    aria-label={`Remove requirement: ${req}`}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Technical Specifications Section */}
        <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Technical Specifications (Key / Value)
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            <input
              type="text"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              placeholder="Attribute (e.g. RAM, Bandwidth)"
              className="sm:col-span-2 rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:outline-hidden"
            />
            <input
              type="text"
              value={specVal}
              onChange={(e) => setSpecVal(e.target.value)}
              placeholder="Value (e.g. 64GB DDR5, 200 MHz)"
              className="sm:col-span-2 rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-indigo-500 focus:outline-hidden"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddSpec}
              icon={<PlusIcon className="h-3.5 w-3.5" />}
            >
              Add Spec
            </Button>
          </div>

          {specs.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800 overflow-hidden text-xs">
              {specs.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-1.5 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {item.key}: <span className="font-normal text-slate-600">{item.value}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    aria-label={`Remove spec: ${item.key}`}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
        >
          {isEditing ? 'Save Changes' : 'Create Resource'}
        </Button>
      </div>
    </form>
  );
};

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialResource,
  isSubmitting = false,
}) => {
  const isEditing = Boolean(initialResource);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Window */}
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="resource-form-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {isEditing ? 'Edit Managed Resource' : 'Add New Campus Resource'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? 'Update resource specifications, inventory quantity, and booking requirements.'
                : 'Publish an asset to your department inventory for campus student and faculty discovery.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content with key to reset state cleanly without useEffect syncing */}
        <ResourceFormContent
          key={initialResource ? initialResource.id : 'new-resource'}
          initialResource={initialResource}
          onSubmit={onSubmit}
          onClose={onClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
