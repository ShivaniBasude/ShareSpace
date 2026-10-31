import React, { useEffect } from 'react';
import type { Resource } from '../../../packages/shared/src/types';
import {
  AlertTriangleIcon,
  Button,
} from '../common';

export interface ResourceDeactivateDialogProps {
  isOpen: boolean;
  resource: Resource | null;
  onClose: () => void;
  onConfirm: (resource: Resource) => Promise<void>;
  isProcessing?: boolean;
}

export const ResourceDeactivateDialog: React.FC<ResourceDeactivateDialogProps> = ({
  isOpen,
  resource,
  onClose,
  onConfirm,
  isProcessing = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen || !resource) return null;

  const isAlreadyUnavailable = resource.availabilityStatus === 'unavailable';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="deactivate-dialog-title"
      aria-describedby="deactivate-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => !isProcessing && onClose()}
        aria-hidden="true"
      />

      {/* Dialog box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h3
              id="deactivate-dialog-title"
              className="text-base font-bold text-slate-900 dark:text-white"
            >
              {isAlreadyUnavailable ? 'Reactivate Resource?' : 'Deactivate Resource?'}
            </h3>
            <p
              id="deactivate-dialog-description"
              className="text-xs leading-relaxed text-slate-500 dark:text-slate-400"
            >
              {isAlreadyUnavailable ? (
                <>
                  Are you sure you want to restore <strong>&ldquo;{resource.title}&rdquo;</strong>?
                  This will set its status to <em>available</em> and restore its full inventory for student booking.
                </>
              ) : (
                <>
                  Are you sure you want to deactivate <strong>&ldquo;{resource.title}&rdquo;</strong>?
                  Its status will change to <em>unavailable</em>, its available inventory will be set to 0,
                  and students will not be able to book it. Historical records are preserved.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isProcessing}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant={isAlreadyUnavailable ? 'primary' : 'danger'}
            size="sm"
            isLoading={isProcessing}
            onClick={() => onConfirm(resource)}
          >
            {isAlreadyUnavailable ? 'Confirm Reactivation' : 'Confirm Deactivation'}
          </Button>
        </div>
      </div>
    </div>
  );
};

