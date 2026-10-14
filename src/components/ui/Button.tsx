import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

const variants = {
  primary: 'bg-indigo-700 text-white hover:bg-indigo-800 disabled:bg-indigo-300',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
  danger: 'bg-rose-700 text-white hover:bg-rose-800 disabled:bg-rose-300',
}

const sizes = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-9 px-3 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
