'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { API_BASE_URL } from '../config/api'
interface User {
  id: string
  username: string
  email: string
  expertiseTags: string[]
  bio?: string
}

export default function Explore() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    searchUsers('')
  }, [])

  const searchUsers = async (query: string) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/users/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error('Failed to search users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchUsers(searchQuery)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🔬 Scientific Social</h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <button onClick={() => router.push('/')} className="hover:text-gray-900">Home</button>
            <button className="text-gray-900 font-semibold">Explore</button>
            <button onClick={() => router.push('/profile')} className="hover:text-gray-900">Profile</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Explore Researchers</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium transition-all"
            >
              Search
            </button>
          </form>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              Searching...
            </div>
          ) : users.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              <div className="text-5xl mb-4">👥</div>
              <p>No users found</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                onClick={() => router.push(`/users/${user.id}`)}
                className="bg-white rounded-2xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
                    {user.username[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate">
                      {user.username}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    {user.bio && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {user.expertiseTags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {user.expertiseTags?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{user.expertiseTags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
