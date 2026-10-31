import React, { useState, useEffect } from 'react';
import type { Resource } from '../../../packages/shared/src/types';
import {
  Button,
  CalendarIcon,
  InfoIcon,
  PackageIcon,
  ShieldCheckIcon,
  XIcon,
} from '../common';

export interface BookingRequestModalProps {
  isOpen: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSubmit: (data: {
    requestedQuantity: number;
    startTime: string;
    endTime: string;
    purpose: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

interface BookingRequestFormProps {
  resource: Resource;
  onClose: () => void;
  onSubmit: (data: {
    requestedQuantity: number;
    startTime: string;
    endTime: string;
    purpose: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const BookingRequestForm: React.FC<BookingRequestFormProps> = ({
  resource,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(tomorrowIso());
  const [endDate, setEndDate] = useState(tomorrowIso());
  const [purpose, setPurpose] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const maxQty = resource.availableQuantity;
  const isUnavailable = resource.availabilityStatus !== 'available' || maxQty === 0;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!Number.isInteger(quantity) || quantity < 1) {
      newErrors.quantity = 'Quantity must be a whole number of at least 1.';
    } else if (quantity > maxQty) {
      newErrors.quantity = `Only ${maxQty} unit(s) available. Please reduce the quantity.`;
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required.';
    } else if (startDate < todayIso()) {
      newErrors.startDate = 'Start date cannot be in the past.';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required.';
    } else if (endDate < startDate) {
      newErrors.endDate = 'End date must be on or after the start date.';
    }

    if (!purpose.trim() || purpose.trim().length < 10) {
      newErrors.purpose = 'Please provide a purpose of at least 10 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      requestedQuantity: quantity,
      startTime: new Date(`${startDate}T00:00:00`).toISOString(),
      endTime: new Date(`${endDate}T23:59:59`).toISOString(),
      purpose: purpose.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Demo notice */}
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-300">
          <InfoIcon className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            <strong>Demo Mode:</strong> This is a mock booking. No real reservation is created.
          </span>
        </div>

        {/* Resource summary */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {resource.category}
            </span>
            <span className="text-slate-500 font-mono">{resource.resourceType}</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{resource.title}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <PackageIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              <strong className="text-emerald-600">{maxQty}</strong> of {resource.quantity} units available
            </span>
          </div>
        </div>

        {/* Unavailable warning */}
        {isUnavailable && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 dark:bg-rose-950/30 dark:border-rose-800/60 dark:text-rose-300">
            This resource is currently unavailable. Booking requests cannot be submitted.
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-1">
          <label htmlFor="bk-quantity" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Requested Quantity <span className="text-rose-500">*</span>
          </label>
          <input
            id="bk-quantity"
            type="number"
            min="1"
            max={maxQty}
            value={quantity}
            onChange={(e) => setQuantity(Math.floor(Number(e.target.value)))}
            disabled={isUnavailable || isSubmitting}
            className={`w-full rounded-lg border py-2 px-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
              errors.quantity ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
            }`}
          />
          {errors.quantity && <p className="text-xs text-rose-600">{errors.quantity}</p>}
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="bk-start" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <CalendarIcon className="h-3.5 w-3.5" />
              </div>
              <input
                id="bk-start"
                type="date"
                min={todayIso()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isUnavailable || isSubmitting}
                className={`w-full rounded-lg border py-2 pl-8 pr-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                  errors.startDate ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                }`}
              />
            </div>
            {errors.startDate && <p className="text-xs text-rose-600">{errors.startDate}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="bk-end" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              End Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                <CalendarIcon className="h-3.5 w-3.5" />
              </div>
              <input
                id="bk-end"
                type="date"
                min={startDate || todayIso()}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isUnavailable || isSubmitting}
                className={`w-full rounded-lg border py-2 pl-8 pr-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                  errors.endDate ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                }`}
              />
            </div>
            {errors.endDate && <p className="text-xs text-rose-600">{errors.endDate}</p>}
          </div>
        </div>

        {/* Purpose */}
        <div className="space-y-1">
          <label htmlFor="bk-purpose" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Purpose / Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="bk-purpose"
            rows={3}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            disabled={isUnavailable || isSubmitting}
            placeholder="Describe your project, assignment, or reason for borrowing this resource..."
            className={`w-full rounded-lg border py-2 px-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 resize-none ${
              errors.purpose ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
            }`}
          />
          {errors.purpose && <p className="text-xs text-rose-600">{errors.purpose}</p>}
        </div>

        {/* Approval notice */}
        {resource.approvalRequired && (
          <div className="flex items-start gap-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/60 p-3 text-xs text-indigo-800 dark:bg-indigo-950/30 dark:border-indigo-900/40 dark:text-indigo-300">
            <ShieldCheckIcon className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Approval Required:</strong> This resource requires owner approval before it can be checked out. You will be notified of the decision.
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          disabled={isUnavailable}
        >
          Submit Request
        </Button>
      </div>
    </form>
  );
};

export const BookingRequestModal: React.FC<BookingRequestModalProps> = ({
  isOpen,
  resource,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !resource) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-request-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 id="booking-request-title" className="text-base font-bold text-slate-900 dark:text-white">
              Request Resource Booking
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{resource.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content with key to cleanly reset form state without setState in effect */}
        <BookingRequestForm
          key={resource.id}
          resource={resource}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

