import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export default async function Home() {
  const { userId } = await auth()
  
  if (userId) {
    redirect('/dashboard')
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Customer Success CORE</h1>
        <p className="text-lg text-gray-600 mb-2">
          Internal Customer Success CORE Service for TrueVow
        </p>
        <p className="text-sm text-gray-500">
          Access requires administrator provisioning
        </p>
        <div className="mt-8">
          <a
            href="/sign-in"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-medium"
          >
            Access Internal Portal
          </a>
        </div>
      </div>
    </main>
  )
}

