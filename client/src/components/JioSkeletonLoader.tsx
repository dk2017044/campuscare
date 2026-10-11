import React from 'react';

interface Props {
  count?: number;
}

export const JioSkeletonLoader: React.FC<Props> = ({ count = 2 }) => {
  return (
    <div className="space-y-2.5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 space-y-2.5 overflow-hidden shadow-2xs"
        >
          {/* Top row: Case ID, Badges, Date */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-5 rounded-md jio-shimmer" />
              <div className="w-24 h-5 rounded-full jio-shimmer" />
              <div className="w-14 h-5 rounded-full jio-shimmer" />
            </div>
            <div className="w-20 h-4 rounded jio-shimmer" />
          </div>

          {/* Middle row: Description bar */}
          <div className="space-y-1.5 py-0.5">
            <div className="w-5/6 h-3.5 rounded jio-shimmer" />
            <div className="w-1/2 h-3 rounded jio-shimmer" />
          </div>

          {/* Bottom row: Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="w-16 h-3.5 rounded jio-shimmer" />
            <div className="w-14 h-3.5 rounded jio-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};
