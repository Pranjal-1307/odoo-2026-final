import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 1-indexed
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = ''
}) => {
  return (
    <div className={`w-full py-3 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={step.id}
              onClick={() => onStepClick && isCompleted && onStepClick(stepNumber)}
              className={`flex flex-col items-center relative z-10 ${
                onStepClick && isCompleted ? 'cursor-pointer' : ''
              }`}
            >
              {/* Circle indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-xs ${
                  isCompleted
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                    : isCurrent
                    ? 'bg-odoo-purple text-white ring-4 ring-purple-100 ring-offset-1'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNumber}
              </div>

              {/* Title & Description */}
              <div className="mt-2 text-center max-w-[110px] sm:max-w-[140px]">
                <p
                  className={`text-xs font-semibold leading-tight ${
                    isCurrent
                      ? 'text-odoo-purple'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="hidden sm:block text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
