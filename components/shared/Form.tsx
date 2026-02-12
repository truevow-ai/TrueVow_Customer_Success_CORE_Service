'use client'

import { ReactNode, FormHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
}

export function Form({ children, onSubmit, className, ...props }: FormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await onSubmit?.(e)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)} {...props}>
      {children}
    </form>
  )
}

interface FormGroupProps {
  children: ReactNode
  className?: string
}

export function FormGroup({ children, className }: FormGroupProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>
}

interface FormLabelProps {
  children: ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export function FormLabel({ children, htmlFor, required, className }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('block text-sm font-medium text-foreground', className)}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}

interface FormErrorProps {
  children: ReactNode
  className?: string
}

export function FormError({ children, className }: FormErrorProps) {
  if (!children) return null

  return (
    <p className={cn('text-sm text-red-600', className)} role="alert">
      {children}
    </p>
  )
}

interface FormHelpTextProps {
  children: ReactNode
  className?: string
}

export function FormHelpText({ children, className }: FormHelpTextProps) {
  return <p className={cn('text-sm text-foreground-secondary', className)}>{children}</p>
}

interface FormFieldProps {
  children: ReactNode
  error?: string
  helpText?: string
  className?: string
}

export function FormField({ children, error, helpText, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {children}
      {error && <FormError>{error}</FormError>}
      {helpText && !error && <FormHelpText>{helpText}</FormHelpText>}
    </div>
  )
}
