import React from 'react';
import { ArrowRight, ArrowLeft, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export interface WorkflowFooterProps {
  currentStep: number; // 1 to 5
  totalSteps?: number; // default 5
  stepName: string;
  previousStep?: {
    label?: string;
    onNavigate: () => void;
  };
  nextStep?: {
    label?: string;
    onNavigate: () => void;
    disabled?: boolean;
    disabledReason?: string;
  };
  finishAction?: {
    label: string;
    onNavigate: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onNavigate: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const WorkflowFooter: React.FC<WorkflowFooterProps> = ({
  currentStep,
  totalSteps = 5,
  stepName,
  previousStep,
  nextStep,
  finishAction,
  secondaryAction,
  className,
}) => {
  const { language } = useStudy();

  return (
    <div className={className || "mt-8 pt-6 border-t border-slate-800/80"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const stepIdx = idx + 1;
              const isPast = stepIdx < currentStep;
              const isCurrent = stepIdx === currentStep;
              return (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    isCurrent
                      ? 'w-6 bg-purple-500'
                      : isPast
                      ? 'w-3 bg-purple-900/80'
                      : 'w-2 bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-xs text-slate-400 font-medium ml-2">
            {language === 'hi'
              ? `चरण ${currentStep}/${totalSteps}: ${stepName}`
              : `Step ${currentStep} of ${totalSteps}: ${stepName}`}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Previous Step button */}
          {previousStep && (
            <button
              type="button"
              onClick={previousStep.onNavigate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>{previousStep.label || (language === 'hi' ? '← पिछला चरण' : '← Previous Step')}</span>
            </button>
          )}

          {/* Secondary Action */}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onNavigate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-purple-300 hover:text-purple-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {/* Finish Action (for final step) */}
          {finishAction && (
            <button
              type="button"
              onClick={finishAction.onNavigate}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-emerald-950/60 active:scale-95 cursor-pointer"
            >
              {finishAction.icon || <RotateCcw className="w-4 h-4" />}
              <span>{finishAction.label}</span>
            </button>
          )}

          {/* Next Step button */}
          {nextStep && (
            <div className="relative group">
              <button
                type="button"
                onClick={nextStep.disabled ? undefined : nextStep.onNavigate}
                disabled={nextStep.disabled}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg active:scale-95 ${
                  nextStep.disabled
                    ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/60 cursor-pointer'
                }`}
              >
                <span>{nextStep.label || (language === 'hi' ? 'अगला चरण →' : 'Next Step →')}</span>
                <ArrowRight className={`w-4 h-4 ${nextStep.disabled ? 'text-slate-600' : 'text-purple-200'}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Explanatory note when disabled */}
      {nextStep?.disabled && nextStep.disabledReason && (
        <div className="mt-3 flex items-center gap-2 text-[11px] sm:text-xs text-amber-400/90 bg-amber-950/20 border border-amber-500/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>{nextStep.disabledReason}</span>
        </div>
      )}
    </div>
  );
};
