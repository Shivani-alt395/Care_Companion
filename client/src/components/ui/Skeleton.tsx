import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _SkeletonProps {
  className?: string;
  count?: number;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-24 w-full ${className}`} aria-hidden="true" />;
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-5 w-full rounded-lg ${className}`} aria-hidden="true" />;
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16' };
  return <div className={`skeleton rounded-full ${sizes[size]}`} aria-hidden="true" />;
}

export function DoseCardSkeleton() {
  return (
    <div className="card animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
        </div>
        <div className="skeleton h-14 w-28 rounded-xl" />
      </div>
    </div>
  );
}
