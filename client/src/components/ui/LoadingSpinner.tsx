import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin" />
        <p className="text-teal-700 font-semibold text-lg">Loading...</p>
      </div>
    </div>
  );
}
