import React from 'react';
import { STRINGS } from '../../../constants/strings';

const LOADING_SKELETON_IDS = ['wall-loading-1', 'wall-loading-2', 'wall-loading-3'] as const;

// Loading State
export const WallLoading: React.FC = () => {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label={STRINGS.WALL_STATES.LOADING_LABEL}
    >
      {LOADING_SKELETON_IDS.map((skeletonId) => (
        <div
          key={skeletonId}
          className="animate-pulse rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 rounded bg-gray-200"></div>
              <div className="h-4 w-12 rounded bg-gray-200"></div>
            </div>
            <div className="h-3 w-16 rounded bg-gray-200"></div>
          </div>
          <div className="mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
          <div className="mb-4 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-3 w-12 rounded bg-gray-200"></div>
            <div className="h-3 w-12 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
      <span className="sr-only">{STRINGS.WALL_STATES.LOADING_LABEL}</span>
    </div>
  );
};

// Error State
interface WallErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export const WallError: React.FC<WallErrorProps> = ({
  title = STRINGS.WALL_STATES.ERROR_TITLE,
  message = STRINGS.WALL_STATES.ERROR_DEFAULT,
  onRetry,
  icon = (
    <span className="text-4xl" role="img" aria-hidden="true">
      😵
    </span>
  ),
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="alert">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mb-6 text-gray-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {STRINGS.WALL_STATES.RETRY}
        </button>
      )}
    </div>
  );
};

// Empty State
interface WallEmptyProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export const WallEmpty: React.FC<WallEmptyProps> = ({
  title = STRINGS.WALL_STATES.EMPTY_TITLE,
  message = STRINGS.WALL_STATES.EMPTY_DEFAULT,
  icon = (
    <span className="text-4xl" role="img" aria-hidden="true">
      🍃
    </span>
  ),
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
};
