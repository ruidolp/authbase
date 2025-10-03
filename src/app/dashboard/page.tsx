import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-6">Welcome! You are authenticated.</p>
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
            <div className="space-y-2">
              {session.user?.image && (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full"
                />
              )}
              <p><strong>Name:</strong> {session.user?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {session.user?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-6">
            <a 
              href="/api/auth/signout"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
