import React from 'react';
import type { BookingStatus } from '../../../packages/shared/src/types';
import { Badge } from '../common/Badge';

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  checked_in: 'Checked Out',
  completed: 'Completed',
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status, size = 'sm' }) => {
  return (
    <Badge status={status} size={size}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
};

