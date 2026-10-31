import React, { useState, useEffect } from 'react';
import type { BookingWithQuantity, IncidentCategory, MockIncident } from '../../features/bookings/bookingTypes';
import { Button, AlertTriangleIcon, XIcon } from '../common';

const INCIDENT_CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: 'damaged', label: 'Resource Damaged' },
  { value: 'missing', label: 'Resource Missing / Lost' },
  { value: 'late_return', label: 'Late Return' },
  { value: 'malfunction', label: 'Equipment Malfunction' },
  { value: 'other', label: 'Other Issue' },
];

const SEVERITIES: { value: MockIncident['severity']; label: string }[] = [
  { value: 'low', label: 'Low — Minor, no urgent action' },
  { value: 'medium', label: 'Medium — Moderate impact' },
  { value: 'high', label: 'High — Significant issue' },
  { value: 'critical', label: 'Critical — Immediate action needed' },
];

interface IncidentReportModalProps {
  isOpen: boolean;
  booking: BookingWithQuantity | null;
  onClose: () => void;
  onSubmit: (data: {
    bookingId: string;
    resourceId: string;
    resourceTitle: string;
    category: IncidentCategory;
    title: string;
    description: string;
    severity: MockIncident['severity'];
  }) => Promise<void>;
  isSubmitting?: boolean;
}

interface IncidentReportFormProps {
  booking: BookingWithQuantity;
  onClose: () => void;
  onSubmit: (data: {
    bookingId: string;
    resourceId: string;
    resourceTitle: string;
    category: IncidentCategory;
    title: string;
    description: string;
    severity: MockIncident['severity'];
  }) => Promise<void>;
  isSubmitting: boolean;
}

const IncidentReportForm: React.FC<IncidentReportFormProps> = ({
  booking,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [category, setCategory] = useState<IncidentCategory>('damaged');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<MockIncident['severity']>('low');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters.';
    if (!description.trim() || description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      bookingId: booking.id,
      resourceId: booking.resourceId,
      resourceTitle: booking.resourceTitle,
      category,
      title: title.trim(),
      description: description.trim(),
      severity,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Demo notice */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-300">
          <strong>Demo Mode:</strong> This incident report is stored locally for this session only. No real backend report is created.
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Issue Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {INCIDENT_CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer text-xs transition-colors ${
                  category === cat.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={category === cat.value}
                  onChange={() => setCategory(cat.value)}
                  className="sr-only"
                />
                <span className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  category === cat.value ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {category === cat.value && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                </span>
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div className="space-y-1">
          <label htmlFor="incident-severity" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Severity <span className="text-rose-500">*</span>
          </label>
          <select
            id="incident-severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as MockIncident['severity'])}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label htmlFor="incident-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Short Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="incident-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Screen cracked on workstation unit 3"
            className={`w-full rounded-lg border py-2 px-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
              errors.title ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
            }`}
          />
          {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="incident-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="incident-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            placeholder="Describe the issue in detail, including when it was noticed and its impact..."
            className={`w-full rounded-lg border py-2 px-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 resize-none ${
              errors.description ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
            }`}
          />
          {errors.description && <p className="text-xs text-rose-600">{errors.description}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
          Submit Report
        </Button>
      </div>
    </form>
  );
};

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  booking,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
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

  if (!isOpen || !booking) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertTriangleIcon className="h-4 w-4" />
            </div>
            <div>
              <h2 id="incident-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">Report an Issue</h2>
              <p className="text-xs text-slate-500 line-clamp-1">Booking: {booking.resourceTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <IncidentReportForm
          key={booking.id}
          booking={booking}
          onClose={onClose}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

