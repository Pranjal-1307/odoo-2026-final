import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'teal' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-odoo-purple hover:bg-odoo-purpleDark text-white border-transparent shadow-xs hover:shadow focus:ring-odoo-purple/30',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs hover:border-slate-400 focus:ring-slate-300',
  teal: 'bg-odoo-teal hover:bg-odoo-tealDark text-white border-transparent shadow-xs hover:shadow focus:ring-odoo-teal/30',
  outline: 'bg-transparent hover:bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-300',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border-transparent focus:ring-slate-300 shadow-none',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-xs hover:shadow focus:ring-rose-500/30',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs hover:shadow focus:ring-emerald-500/30'
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5'
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
