'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config/api'

interface Institution {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  location: string;
  website: string;
  logoUrl: string;
  verifiedUserCount: number;
  postCount: number;
  isVerified: boolean;
}

interface Citation {
  id: string;
  doi: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  impactFactor: number;
  citationCount: number;
  url: string;
  aiSummary: string;
  abstract: string;
}

interface Author {
  id: string;
  username: string;
  expertiseTags: string[];
  badgeType: string;
  institutionId: string;
}

interface Post {
  id: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  citation: Citation;
  author: Author;
}

export default function InstitutionFeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch institution details and posts in parallel
    Promise.all([
      fetch(`http://localhost:3001/institutions/${slug}`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/posts`).then((res) => res.json()),
    ])
      .then(([institutionData, allPosts]) => {
        setInstitution(institutionData);

        // Filter posts from users at this institution
        const filteredPosts = allPosts.filter(
          (post: Post) => post.author.institutionId === institutionData.id
        );
        setPosts(filteredPosts);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Institution not found</div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      university: 'University',
      research_institute: 'Research Institute',
      government: 'Government Agency',
      sme: 'SME',
      non_profit: 'Non-Profit',
    };
    return labels[type] || type;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
                {institution.isVerified && (
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              <p className="text-gray-600 mb-2">{institution.location}</p>
              <p className="text-gray-700 mb-4">{institution.description}</p>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <strong>{institution.verifiedUserCount}</strong> verified researchers
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <strong>{posts.length}</strong> posts
                </span>
                {institution.website && (
                  <a
                    href={institution.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Posts Feed */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Research from {institution.name}
        </h2>

        {posts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            No posts yet from this institution
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Post Author */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
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
                </div>

                {/* Post Content */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4">{post.content}</p>

                  {/* Citation Card */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">{post.citation.title}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Authors:</strong> {post.citation.authors.slice(0, 3).join(', ')}
                        {post.citation.authors.length > 3 && ` +${post.citation.authors.length - 3} more`}
                      </p>
                      <p>
                        <strong>Journal:</strong> {post.citation.journal} ({post.citation.year})
                      </p>
                      {post.citation.citationCount > 0 && (
                        <p>
                          <strong>Citations:</strong> {post.citation.citationCount.toLocaleString()}
                        </p>
                      )}
                      <p className="text-gray-500 mt-2">{post.citation.aiSummary}</p>
                    </div>
                    <a
                      href={post.citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                    >
                      View Paper →
                    </a>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="px-6 pb-4 flex items-center gap-6 text-gray-500">
                  <button className="flex items-center gap-2 hover:text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{post.likesCount}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>{post.commentsCount}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
