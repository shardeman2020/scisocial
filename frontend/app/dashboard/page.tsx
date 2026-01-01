'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBranding } from '../contexts/BrandingContext'

import { API_BASE_URL } from '../config/api'
interface Topic {
  id: string
  name: string
  followersCount: number
}

interface Query {
  query: string
  count: number
}

interface Journal {
  id: string
  name: string
  impactFactor: number
}

interface DigestSummary {
  topQuery: string
  mostUsedModel: string
  moderationActivity: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { branding, fetchBranding } = useBranding()

  const [userName, setUserName] = useState('Researcher')
  const [recommendedTopics, setRecommendedTopics] = useState<Topic[]>([])
  const [trendingQueries, setTrendingQueries] = useState<Query[]>([])
  const [suggestedJournals, setSuggestedJournals] = useState<Journal[]>([])
  const [digestSummary, setDigestSummary] = useState<DigestSummary | null>(null)
  const [followedTopics, setFollowedTopics] = useState<Set<string>>(new Set())

  useEffect(() => {
    // For MVP, fetch with a default user ID
    // In production, get from auth context
    const userId = '1' // Replace with actual user ID from auth
    const institutionId = '1' // Replace with actual institution ID

    fetchDashboardData(userId, institutionId)
    fetchBranding(institutionId)
  }, [fetchBranding])

  const fetchDashboardData = async (userId: string, institutionId: string) => {
    try {
      // Fetch recommended topics (based on research interests)
      const topicsResponse = await fetch(`${API_BASE_URL}/topics`)
      if (topicsResponse.ok) {
        const allTopics = await topicsResponse.json()
        setRecommendedTopics(allTopics.slice(0, 5))
      }

      // Fetch trending queries (institution-specific)
      const queriesResponse = await fetch(`http://localhost:3001/search-analytics/institutions/${institutionId}/top-queries?limit=5`)
      if (queriesResponse.ok) {
        const queries = await queriesResponse.json()
        setTrendingQueries(queries)
      }

      // Fetch suggested journals
      const journalsResponse = await fetch(`${API_BASE_URL}/journals`)
      if (journalsResponse.ok) {
        const journals = await journalsResponse.json()
        setSuggestedJournals(journals.slice(0, 5))
      }

      // Fetch digest summary (mock for now)
      setDigestSummary({
        topQuery: 'machine learning applications',
        mostUsedModel: 'biomed',
        moderationActivity: 12,
      })

      // Fetch user's followed topics
      const followsResponse = await fetch(`http://localhost:3001/follows/user/${userId}`)
      if (followsResponse.ok) {
        const follows = await followsResponse.json()
        const topicIds = new Set<string>(
          follows
            .filter((f: any) => f.entityType === 'topic')
            .map((f: any) => f.entityId as string)
        )
        setFollowedTopics(topicIds)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const toggleFollowTopic = async (topicId: string) => {
    try {
      const userId = '1' // Replace with actual user ID from auth

      const response = await fetch(`${API_BASE_URL}/follows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          entityId: topicId,
          entityType: 'topic',
        }),
      })

      if (response.ok) {
        setFollowedTopics(prev => {
          const newSet = new Set(prev)
          if (newSet.has(topicId)) {
            newSet.delete(topicId)
          } else {
            newSet.add(topicId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Header */}
      <div
        className="shadow-md"
        style={{ backgroundColor: branding.accentColor }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt="Institution logo"
                  className="h-16 bg-white rounded-lg p-2"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Welcome back, {userName}
                </h1>
                <p className="text-white text-opacity-90">
                  {branding.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recommended Topics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: branding.accentColor }}>
                Recommended Topics
              </h2>
              <p className="text-gray-600 mb-4">
                Based on your research interests
              </p>
              <div className="space-y-3">
                {recommendedTopics.map(topic => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                      <p className="text-sm text-gray-500">
                        {topic.followersCount} followers
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFollowTopic(topic.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        followedTopics.has(topic.id)
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'text-white hover:opacity-90'
                      }`}
                      style={!followedTopics.has(topic.id) ? {
                        backgroundColor: branding.accentColor,
                      } : {}}
                    >
                      {followedTopics.has(topic.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Queries */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: branding.accentColor }}>
                Trending at Your Institution
              </h2>
              <p className="text-gray-600 mb-4">
                Top searches from your institution this week
              </p>
              <div className="space-y-3">
                {trendingQueries.length > 0 ? (
                  trendingQueries.map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
                      onClick={() => router.push(`/search?q=${encodeURIComponent(query.query)}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold"
                          style={{ backgroundColor: branding.accentColor }}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{query.query}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {query.count} searches
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No trending queries yet</p>
                )}
              </div>
            </div>

            {/* Suggested Journals */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: branding.accentColor }}>
                Suggested Journals
              </h2>
              <p className="text-gray-600 mb-4">
                Based on your interests and global popularity
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedJournals.map(journal => (
                  <div
                    key={journal.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/journals/${journal.id}`)}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{journal.name}</h3>
                    <p className="text-sm text-gray-500">
                      Impact Factor: {journal.impactFactor.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: branding.accentColor }}>
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/search')}
                  className="w-full px-4 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ backgroundColor: branding.accentColor }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Start a Search
                </button>

                <button
                  onClick={() => router.push('/')}
                  className="w-full px-4 py-3 rounded-lg border-2 font-medium hover:bg-gray-50 transition-colors"
                  style={{ borderColor: branding.accentColor, color: branding.accentColor }}
                >
                  Create a Post
                </button>

                <button
                  onClick={() => router.push('/topics')}
                  className="w-full px-4 py-3 rounded-lg border-2 font-medium hover:bg-gray-50 transition-colors"
                  style={{ borderColor: branding.accentColor, color: branding.accentColor }}
                >
                  Browse Topics
                </button>

                <button
                  onClick={() => router.push('/analytics')}
                  className="w-full px-4 py-3 rounded-lg border-2 font-medium hover:bg-gray-50 transition-colors"
                  style={{ borderColor: branding.accentColor, color: branding.accentColor }}
                >
                  View Analytics
                </button>
              </div>
            </div>

            {/* Digest Summary Card */}
            {digestSummary && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4" style={{ color: branding.accentColor }}>
                  This Week's Digest
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Top Query</div>
                    <div className="font-semibold text-gray-900">
                      "{digestSummary.topQuery}"
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Most Used Model</div>
                    <div
                      className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: branding.accentColor }}
                    >
                      {digestSummary.mostUsedModel}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Moderation Activity</div>
                    <div className="font-semibold text-gray-900">
                      {digestSummary.moderationActivity} items reviewed
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    Manage Digest Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
