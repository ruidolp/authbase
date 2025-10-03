import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Auth Template</h1>
        <p className="text-gray-600">Universal authentication base project</p>
        
        <div className="flex gap-4 justify-center">
          {session ? (
            <>
              <Link 
                href="/dashboard"
                className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
              <Link 
                href="/api/auth/signout"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Sign Out
              </Link>
            </>
          ) : (
            <Link 
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign In
            </Link>
          )}
        </div>

        {session && (
          <p className="text-sm text-gray-500">
            Logged in as: {session.user?.email}
          </p>
        )}
      </div>
    </div>
  )
}
