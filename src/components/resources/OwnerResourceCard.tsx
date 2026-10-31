import React, { useState } from 'react';
import type { Resource } from '../../../packages/shared/src/types';
import {
  Badge,
  Button,
  Card,
  EditIcon,
  EyeIcon,
  MapPinIcon,
  PackageIcon,
  PowerOffIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '../common';

export interface OwnerResourceCardProps {
  resource: Resource;
  onView: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDeactivate: (resource: Resource) => void;
}

export const OwnerResourceCard: React.FC<OwnerResourceCardProps> = ({
  resource,
  onView,
  onEdit,
  onDeactivate,
}) => {
  const [imageError, setImageError] = useState(false);

  const primaryImage =
    resource.images && resource.images.length > 0 && !imageError
      ? resource.images[0]
      : null;

  const isUnavailable = resource.availabilityStatus === 'unavailable';

  return (
    <Card className="flex flex-col overflow-hidden border border-slate-200/90 bg-white transition-all duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row">
        {/* Media Thumbnail */}
        <div className="relative aspect-16/10 sm:aspect-square w-full sm:w-44 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={resource.title}
              onError={() => setImageError(true)}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-slate-400 dark:text-slate-500">
              <PackageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-1" />
              <span className="text-3xs font-medium">{resource.category}</span>
            </div>
          )}

          {/* Status Badge overlay on mobile */}
          <div className="absolute top-2 left-2 sm:hidden">
            <Badge status={resource.availabilityStatus} size="sm">
              {resource.availabilityStatus.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-2xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {resource.category}
              </span>
              <span className="font-mono text-2xs font-semibold text-slate-500 dark:text-slate-400">
                {resource.resourceType}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              {resource.approvalRequired && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <ShieldCheckIcon className="h-3 w-3" />
                  Approval Req.
                </span>
              )}
              <Badge status={resource.availabilityStatus} size="sm">
                {resource.availabilityStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 line-clamp-1 dark:text-white mb-1">
            {resource.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed dark:text-slate-400 mb-3">
            {resource.description}
          </p>

          {/* Meta & Inventory row */}
          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{resource.location || 'Location unassigned'}</span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              {resource.condition && (
                <span className="inline-flex items-center gap-1 text-2xs text-slate-400">
                  <SparklesIcon className="h-3 w-3 text-amber-500" />
                  {resource.condition}
                </span>
              )}
              <span className="font-semibold">
                <span className={resource.availableQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {resource.availableQuantity}
                </span>
                <span className="text-slate-400"> / {resource.quantity} units</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Column */}
        <div className="flex sm:flex-col items-center justify-end sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 p-3 sm:px-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(resource)}
            className="flex-1 sm:flex-initial sm:w-28"
            icon={<EyeIcon className="h-3.5 w-3.5" />}
          >
            Details
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(resource)}
            className="flex-1 sm:flex-initial sm:w-28"
            icon={<EditIcon className="h-3.5 w-3.5" />}
          >
            Edit
          </Button>

          <Button
            variant={isUnavailable ? 'outline' : 'danger'}
            size="sm"
            onClick={() => onDeactivate(resource)}
            className="flex-1 sm:flex-initial sm:w-28"
            icon={<PowerOffIcon className="h-3.5 w-3.5" />}
          >
            {isUnavailable ? 'Reactivate' : 'Deactivate'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
