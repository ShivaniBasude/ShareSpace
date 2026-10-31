import React, { useEffect } from 'react';
import type { Resource } from '../../../packages/shared/src/types';
import {
  Badge,
  Button,
  CheckIcon,
  InfoIcon,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XIcon,
} from '../common';

export interface ResourceDetailsModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceDetailsModal: React.FC<ResourceDetailsModalProps> = ({
  resource,
  isOpen,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !resource) return null;

  const isAvailable = resource.availabilityStatus === 'available';
  const primaryImage = resource.images && resource.images.length > 0 ? resource.images[0] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal Dialog Window ── */}
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        {/* Header bar with close button */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {resource.category}
            </span>
            <Badge status={resource.availabilityStatus} size="sm">
              {resource.availabilityStatus.toUpperCase()}
            </Badge>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Visual Banner */}
          {primaryImage && (
            <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
              <img
                src={primaryImage}
                alt={resource.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Title & Resource Type */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
              <span>{resource.resourceType}</span>
              {resource.condition && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-sans text-slate-500 dark:text-slate-400">
                    <SparklesIcon className="h-3 w-3 text-amber-500" />
                    Condition: {resource.condition}
                  </span>
                </>
              )}
            </div>
            <h2 id="resource-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {resource.title}
            </h2>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {resource.description}
            </p>
          </div>

          {/* Location & Stock details */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <MapPinIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Physical Location
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {resource.location || 'Location provided upon booking confirmation'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <PackageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Inventory & Availability
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong className={resource.availableQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {resource.availableQuantity}
                </strong>{' '}
                of {resource.quantity} units currently available
              </p>
            </div>
          </div>

          {/* Specifications Table */}
          {resource.specifications && Object.keys(resource.specifications).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Technical Specifications
              </h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/30 overflow-hidden text-xs">
                {Object.entries(resource.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between px-4 py-2.5">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{key}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eligibility Requirements */}
          {resource.eligibilityRequirements && resource.eligibilityRequirements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Eligibility & Usage Requirements
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {resource.eligibilityRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Governance Notice Banner */}
          <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/60 p-4 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200 flex items-start gap-3">
            {resource.approvalRequired ? (
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            ) : (
              <InfoIcon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-semibold">
                {resource.approvalRequired
                  ? 'Faculty / Manager Approval Required'
                  : 'Direct Booking Available'}
              </span>
              <p className="text-2xs leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
                {resource.approvalRequired
                  ? 'Reservations for this asset route automatically to authorized lab supervisors for review. Reservation workflows and schedule picking will be activated in Phase 3.'
                  : 'This resource is available for instant checkout. Online reservation calendar integration will be fully active in Phase 3.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={!isAvailable || resource.availableQuantity === 0}
            onClick={() => {
              alert(
                `Resource reservation calendar and time-slot selection will be activated in Phase 3 for "${resource.title}".`
              );
            }}
          >
            {isAvailable && resource.availableQuantity > 0
              ? 'Request Reservation (Phase 3)'
              : 'Currently Unavailable'}
          </Button>
        </div>
      </div>
    </div>
  );
};

