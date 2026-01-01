'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ReportButton from '../../components/ReportButton';
import { API_BASE_URL } from '../../config/api'

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  followerCount: number;
  postCount: number;
}

interface Citation {
  id: string;
  doi: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  impactFactor: number;
  url: string;
  aiSummary: string;
  abstract: string;
}

interface Author {
  id: string;
  username: string;
  expertiseTags: string[];
}

interface Post {
  id: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  citation: Citation;
  author: Author;
  topics: string[];
}

export default function TopicFeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Fetch topic details and posts in parallel
    Promise.all([
      fetch(`http://localhost:3001/topics/${slug}`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/posts`).then((res) => res.json()),
    ])
      .then(([topicData, allPosts]) => {
        setTopic(topicData);

        // Filter posts that include this topic's ID
        const filteredPosts = allPosts.filter((post: Post) =>
          post.topics && post.topics.includes(topicData.id)
        );
        setPosts(filteredPosts);

        // Get current user ID from first post (MVP approach)
        if (allPosts.length > 0) {
          const userId = allPosts[0].author.id;
          setCurrentUserId(userId);

          // Check if user is following this topic
          fetch(`http://localhost:3001/follows/check/${userId}/topic/${topicData.id}`)
            .then((res) => res.json())
            .then((data) => setIsFollowing(data.isFollowing))
            .catch((err) => console.error('Error checking follow status:', err));
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, [slug]);

  const handleFollow = async () => {
    if (!currentUserId || !topic) return;

    try {
      if (isFollowing) {
        // Unfollow
        await fetch(`${API_BASE_URL}/follows`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            entityType: 'topic',
            entityId: topic.id,
          }),
        });
        setIsFollowing(false);

        // Update local follower count
        setTopic({ ...topic, followerCount: topic.followerCount - 1 });
      } else {
        // Follow
        await fetch(`${API_BASE_URL}/follows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            entityType: 'topic',
            entityId: topic.id,
          }),
        });
        setIsFollowing(true);

        // Update local follower count
        setTopic({ ...topic, followerCount: topic.followerCount + 1 });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Topic not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/topics')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Topics
            </button>
            <h1 className="text-xl font-bold text-gray-900">{topic.name}</h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Home
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Topic Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {topic.name}
              </h2>
              <p className="text-gray-600 mb-6 text-lg">{topic.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-semibold">{topic.followerCount.toLocaleString()}</span> followers
                </span>
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="font-semibold">{topic.postCount.toLocaleString()}</span> posts
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ReportButton entityType="topic" entityId={topic.id} />
              <button
                onClick={handleFollow}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? 'Following' : '+ Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900">
            Latest Research in {topic.name}
          </h3>

          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">
                No posts yet in this topic. Be the first to share!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Post Author */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {post.author.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      @{post.author.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Citation */}
                <div className="mb-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">
                    {post.citation.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {post.citation.authors?.slice(0, 3).join(', ')} • {post.citation.journal} ({post.citation.year})
                    {post.citation.impactFactor && ` • IF: ${post.citation.impactFactor}`}
                  </p>
                  {post.citation.aiSummary && (
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      {post.citation.aiSummary}
                    </p>
                  )}
                </div>

                {/* Post Content */}
                <p className="text-gray-800 mb-4">{post.content}</p>

                {/* Engagement */}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    ❤️ {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    💬 {post.commentsCount}
                  </span>
                  <a
                    href={post.citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 ml-auto"
                  >
                    View Paper →
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
