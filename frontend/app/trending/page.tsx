'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../components/SearchBar';
import Logo from '../components/Logo';
import { API_BASE_URL } from '../config/api'

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  followerCount: number;
  postCount: number;
}

interface Journal {
  id: string;
  name: string;
  slug: string;
  publisher: string;
  articleCount: number;
  followerCount: number;
}

interface Institution {
  id: string;
  name: string;
  slug: string;
  location: string;
  verifiedUserCount: number;
  postCount: number;
}

interface Post {
  id: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: {
    username: string;
    badgeType: string;
  };
  citation: {
    title: string;
    journal: string;
    year: number;
  };
}

export default function TrendingPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      const [topicsRes, journalsRes, institutionsRes, postsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/topics`),
        fetch(`${API_BASE_URL}/journals`),
        fetch(`${API_BASE_URL}/institutions`),
        fetch(`${API_BASE_URL}/posts`),
      ]);

      const [topicsData, journalsData, institutionsData, postsData] = await Promise.all([
        topicsRes.json(),
        journalsRes.json(),
        institutionsRes.json(),
        postsRes.json(),
      ]);

      // Sort by popularity
      setTopics(topicsData.sort((a: Topic, b: Topic) => b.postCount - a.postCount).slice(0, 6));
      setJournals(journalsData.sort((a: Journal, b: Journal) => b.articleCount - a.articleCount).slice(0, 6));
      setInstitutions(institutionsData.sort((a: Institution, b: Institution) => b.verifiedUserCount - a.verifiedUserCount).slice(0, 6));
      setPosts(postsData.sort((a: Post, b: Post) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount)).slice(0, 8));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching trending data:', err);
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    if (badgeType === 'verified_researcher' || badgeType === 'university_faculty') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading trending content...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex gap-4 text-sm text-gray-600">
            <button onClick={() => router.push('/')} className="hover:text-gray-900">Home</button>
            <button onClick={() => router.push('/topics')} className="hover:text-gray-900">Topics</button>
            <button onClick={() => router.push('/journals')} className="hover:text-gray-900">Journals</button>
            <button onClick={() => router.push('/explore')} className="hover:text-gray-900">Explore</button>
            <button className="text-gray-900 font-semibold">Trending</button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-center">
          <SearchBar />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Trending Now</h2>

        {/* Trending Topics */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Trending Topics</h3>
            <button onClick={() => router.push('/topics')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => router.push(`/topics/${topic.slug}`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{topic.name}</h4>
                  <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{topic.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{topic.postCount} posts</span>
                  <span>{topic.followerCount} followers</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Trending Journals */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Trending Journals</h3>
            <button onClick={() => router.push('/journals')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {journals.map((journal) => (
              <button
                key={journal.id}
                onClick={() => router.push(`/journals/${journal.slug}`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{journal.name}</h4>
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-3">{journal.publisher}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{journal.articleCount} articles</span>
                  <span>{journal.followerCount} followers</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Trending Institutions */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Top Institutions</h3>
            <button onClick={() => router.push('/institutions')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutions.map((institution) => (
              <button
                key={institution.id}
                onClick={() => router.push(`/institutions/${institution.slug}`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{institution.name}</h4>
                  <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-3">{institution.location}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{institution.verifiedUserCount} verified researchers</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Popular Posts */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Posts</h3>
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {post.author.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{post.author.username}</span>
                      {getBadgeIcon(post.author.badgeType)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-3">{post.content}</p>

                {/* Citation */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">{post.citation.title}</h4>
                  <p className="text-xs text-gray-600">
                    {post.citation.journal} ({post.citation.year})
                  </p>
                </div>

                {/* Engagement */}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.commentsCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
