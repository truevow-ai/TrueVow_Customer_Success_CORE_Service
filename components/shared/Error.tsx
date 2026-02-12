import { ReactNode } from 'react'

interface ErrorProps {
  message: string
  children?: ReactNode
}

export function Error({ message, children }: ErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-800 font-medium">{message}</p>
      {children}
    </div>
  )
}

