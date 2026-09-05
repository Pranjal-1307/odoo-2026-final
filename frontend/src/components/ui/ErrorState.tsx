import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this data. Please try again.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`p-6 rounded-xl bg-rose-50/70 border border-rose-200 text-center ${className}`}>
      <div className="mx-auto w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-rose-900">{title}</h3>
      <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            onClick={onRetry}
            variant="secondary"
            size="xs"
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
