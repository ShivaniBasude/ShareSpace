import React, { useEffect } from 'react';
import type { BookingWithQuantity } from '../../features/bookings/bookingTypes';
import { Button, CalendarIcon, PackageIcon, QrCodeIcon, UserIcon, XIcon } from '../common';
import { BookingStatusBadge } from './BookingStatusBadge';

interface BookingPassModalProps {
  isOpen: boolean;
  booking: BookingWithQuantity | null;
  studentName: string;
  onClose: () => void;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Generates a deterministic grid pattern that visually resembles a QR code. */
function QrCodeGraphic({ value, size = 160 }: { value: string; size?: number }) {
  // Create a deterministic bit-grid from the reference string
  const cells = 21; // standard QR-like grid
  const cellSize = size / cells;
  const grid: boolean[][] = [];
  for (let r = 0; r < cells; r++) {
    grid[r] = [];
    for (let c = 0; c < cells; c++) {
      const charCode = value.charCodeAt((r * cells + c) % value.length);
      grid[r][c] = ((charCode + r * 3 + c * 7) % 3) === 0;
    }
  }

  // Finder pattern corners (always dark)
  const setFinder = (row: number, col: number) => {
    for (let r = row; r < row + 7; r++) {
      for (let c = col; c < col + 7; c++) {
        if (r < cells && c < cells) {
          const onBorder =
            r === row || r === row + 6 || c === col || c === col + 6;
          const innerSquare =
            r >= row + 2 && r <= row + 4 && c >= col + 2 && c <= col + 4;
          grid[r][c] = onBorder || innerSquare;
        }
      }
    }
  };
  setFinder(0, 0);
  setFinder(0, cells - 7);
  setFinder(cells - 7, 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-lg"
    >
      <rect width={size} height={size} fill="white" />
      {grid.map((row, r) =>
        row.map((dark, c) =>
          dark ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize - 0.5}
              height={cellSize - 0.5}
              fill="#1e293b"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export const BookingPassModal: React.FC<BookingPassModalProps> = ({
  isOpen,
  booking,
  studentName,
  onClose,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const ref = booking.id.toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pass-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 id="pass-title" className="text-sm font-bold text-slate-900 dark:text-white">
              Booking Pass
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Pass card */}
        <div className="p-5 space-y-4">
          {/* Demo notice */}
          <div className="text-center rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-300">
            ⚠ Demo Pass — Not backend-verified. Reference only.
          </div>

          {/* QR graphic */}
          <div className="flex justify-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800">
              <QrCodeGraphic value={booking.id} size={160} />
            </div>
          </div>

          {/* Reference */}
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">Booking Reference</p>
            <p className="font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-white">
              {ref}
            </p>
            <div className="mt-1 flex justify-center">
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Student</span>
              <span className="ml-auto font-semibold text-slate-900 dark:text-white">{studentName}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <PackageIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500">Qty</span>
              <span className="ml-auto font-semibold text-slate-900 dark:text-white">
                {booking.requestedQuantity} unit{booking.requestedQuantity !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-start gap-2 px-3 py-2.5">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-slate-500">Period</span>
              <span className="ml-auto font-semibold text-slate-900 dark:text-white text-right">
                {fmtDate(booking.startTime)}<br />
                <span className="text-slate-400 font-normal">→ {fmtDate(booking.endTime)}</span>
              </span>
            </div>
          </div>

          <p className="text-center text-3xs text-slate-400">
            Present this pass at the resource location for physical checkout. Backend QR verification will be enabled in a future phase.
          </p>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="outline" size="sm" fullWidth onClick={onClose}>
            Close Pass
          </Button>
        </div>
      </div>
    </div>
  );
};

