'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReportButton from '../../components/ReportButton'

import { API_BASE_URL } from '../../config/api'
interface Author {
  id: string
  username: string
  email: string
  expertiseTags: string[]
  bio?: string
  createdAt: string
}

interface Citation {
  id: string
  doi: string
  title: string
  authors: string[]
  journal: string
  year: number
  impactFactor: number
  url: string
  aiSummary: string
  imageUrl: string
}

interface Post {
  id: string
  content: string
  mediaUrls: string[]
  likesCount: number
  commentsCount: number
  createdAt: string
  citation: Citation
  author: Author
}

export default function UserProfile() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<Author | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/profile`)
      const data = await response.json()
      setUser(data.user)
      setPosts(data.posts)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-gray-500">User not found</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go back home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🔬 Scientific Social</h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <button onClick={() => router.push('/')} className="hover:text-gray-900">Home</button>
            <button className="hover:text-gray-900">Explore</button>
            <button className="hover:text-gray-900">Profile</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* User Profile Header */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-semibold">
              {user.username[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                  <p className="text-gray-600 mt-1">{user.email}</p>
                </div>
                <ReportButton entityType="user" entityId={userId} />
              </div>
              {user.bio && (
                <p className="text-gray-700 mt-2">{user.bio}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {user.expertiseTags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {posts.reduce((sum, post) => sum + post.likesCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Likes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {posts.reduce((sum, post) => sum + post.commentsCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Comments</div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Posts</h3>
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center text-gray-500">
              <div className="text-5xl mb-4">📚</div>
              <p>No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                {/* Paper Title */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                    {post.citation.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {post.citation.authors?.slice(0, 3).join(', ')}
                    {post.citation.authors?.length > 3 ? ' et al.' : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="font-medium text-blue-600">{post.citation.journal}</span>
                    <span>•</span>
                    <span>{post.citation.year}</span>
                    {post.citation.impactFactor && (
                      <>
                        <span>•</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                          IF: {post.citation.impactFactor}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Paper Image */}
                <div className="relative w-full aspect-[4/3] bg-gray-100">
                  <img
                    src={post.mediaUrls?.[0] || post.citation.imageUrl || 'https://source.unsplash.com/800x600/?science,research'}
                    alt={post.citation.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://source.unsplash.com/800x600/?science,laboratory'
                    }}
                  />
                </div>

                {/* Engagement Bar */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-semibold">{post.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-semibold">{post.commentsCount}</span>
                    </div>
                  </div>
                  <ReportButton entityType="post" entityId={post.id} />
                </div>

                {/* AI Summary */}
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {post.citation.aiSummary || post.content}
                  </p>
                  <a
                    href={post.citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center gap-1"
                  >
                    Read full paper
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {/* Timestamp */}
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
