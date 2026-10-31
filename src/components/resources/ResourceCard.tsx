import React, { useState } from 'react';
import type { Resource } from '../../../packages/shared/src/types';
import {
  Badge,
  Button,
  Card,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '../common';

export interface ResourceCardProps {
  resource: Resource;
  onSelect?: (resource: Resource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onSelect }) => {
  const [imageError, setImageError] = useState(false);

  const primaryImage =
    resource.images && resource.images.length > 0 && !imageError
      ? resource.images[0]
      : null;

  // Format availability text
  const isAvailable = resource.availabilityStatus === 'available';
  const isReserved = resource.availabilityStatus === 'reserved';

  const availabilityLabel = isAvailable
    ? 'Available'
    : isReserved
    ? 'Reserved'
    : 'Unavailable';

  return (
    <Card
      hoverable
      className="group flex h-full flex-col overflow-hidden border border-slate-200/90 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {/* ── Media Header with Badge Overlays ── */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={resource.title}
            onError={() => setImageError(true)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-500">
            <PackageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-1" />
            <span className="text-xs font-medium">{resource.category}</span>
          </div>
        )}

        {/* Top-left: Category Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold tracking-tight text-slate-800 shadow-xs backdrop-blur-xs dark:bg-slate-900/90 dark:text-slate-200">
            {resource.category}
          </span>
        </div>

        {/* Top-right: Availability Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge status={resource.availabilityStatus} size="sm" className="shadow-xs font-semibold">
            {availabilityLabel}
          </Badge>
        </div>

        {/* Bottom-right: Approval Required Pill */}
        {resource.approvalRequired && (
          <div className="absolute bottom-2.5 right-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-xs">
              <ShieldCheckIcon className="h-3 w-3" />
              Approval Req.
            </span>
          </div>
        )}
      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-1 flex-col p-5">
        {/* Resource Type & Condition Tags */}
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {resource.resourceType}
          </span>

          {resource.condition && (
            <span className="inline-flex items-center gap-1 text-2xs font-medium text-slate-500 dark:text-slate-400">
              <SparklesIcon className="h-3 w-3 text-amber-500" />
              {resource.condition}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="mb-2 line-clamp-1 text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400"
          title={resource.title}
        >
          {resource.title}
        </h3>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {resource.description}
        </p>

        {/* Meta Grid: Location & Quantity */}
        <div className="mt-auto space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800/80 dark:text-slate-300">
          {resource.location && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="truncate" title={resource.location}>
                {resource.location}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-500 dark:text-slate-400">Stock Availability</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              <span
                className={
                  resource.availableQuantity > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }
              >
                {resource.availableQuantity}
              </span>
              <span className="text-slate-400"> / {resource.quantity} in inventory</span>
            </span>
          </div>
        </div>

        {/* ── Actions Footer ── */}
        <div className="mt-4 flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => onSelect?.(resource)}
            aria-label={`View details for ${resource.title}`}
          >
            View Details
          </Button>

          <Button
            variant={isAvailable && resource.availableQuantity > 0 ? 'primary' : 'secondary'}
            size="sm"
            fullWidth
            disabled={!isAvailable || resource.availableQuantity === 0}
            onClick={() => onSelect?.(resource)}
            aria-label={`Reserve ${resource.title}`}
          >
            {isAvailable && resource.availableQuantity > 0 ? 'Reserve' : 'Unavailable'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

