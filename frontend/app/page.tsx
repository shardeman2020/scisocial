'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from './components/SearchBar'
import Logo from './components/Logo'
import PostComposer from './components/PostComposer'
import { API_BASE_URL } from './config/api'

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
  abstract?: string
}

interface Author {
  id: string
  username: string
  expertiseTags: string[]
}

interface Comment {
  id: string
  content: string
  createdAt: string
  author: Author
  likesCount: number
  parentCommentId?: string
}

interface Post {
  id: string
  content: string
  images: { url: string; altText: string | null }[]
  likesCount: number
  commentsCount: number
  createdAt: string
  citation: Citation
  author: Author
}

// Helper function to render text with @ mentions
const renderTextWithMentions = (text: string, router: any) => {
  const mentionRegex = /@(\w+)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Add the mention as a clickable element
    const username = match[1]
    parts.push(
      <span
        key={match.index}
        onClick={(e) => {
          e.stopPropagation()
          // For MVP, we'll just show it's clickable - in production you'd look up user ID
          console.log('Clicked mention:', username)
        }}
        className="text-blue-600 font-semibold cursor-pointer hover:underline"
      >
        @{username}
      </span>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

export default function Home() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [replies, setReplies] = useState<Record<string, Comment[]>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set())
  const [feedType, setFeedType] = useState<'all' | 'following'>('all')
  const [followedTopicIds, setFollowedTopicIds] = useState<Set<string>>(new Set())
  const [followedJournalNames, setFollowedJournalNames] = useState<Set<string>>(new Set())
  const [allPosts, setAllPosts] = useState<Post[]>([])

  useEffect(() => {
    fetchPosts()
  }, [])

  // Get the current user ID from the first post's author (for MVP)
  useEffect(() => {
    if (allPosts.length > 0 && !currentUserId) {
      const userId = allPosts[0].author.id
      setCurrentUserId(userId)
      fetchUserFollows(userId)
    }
  }, [allPosts, currentUserId])

  // Update displayed posts when feed type or follows change
  useEffect(() => {
    if (feedType === 'all') {
      setPosts(allPosts)
    } else {
      // Filter posts by followed topics and journals
      const filteredPosts = allPosts.filter((post) => {
        // TODO: Add topics relationship to Post entity
        // const hasFollowedTopic = post.topics?.some((topicId) => followedTopicIds.has(topicId))
        const hasFollowedJournal = post.citation?.journal && followedJournalNames.has(post.citation.journal)
        return hasFollowedJournal  // || hasFollowedTopic
      })
      setPosts(filteredPosts)
    }
  }, [feedType, allPosts, followedTopicIds, followedJournalNames])

  const fetchUserFollows = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/follows/user/${userId}`)
      const follows = await response.json()

      // Separate topic and journal follows
      const topicIds = new Set<string>(
        follows
          .filter((f: any) => f.entityType === 'topic')
          .map((f: any) => f.entityId as string)
      )
      setFollowedTopicIds(topicIds)

      // For journals, we need to fetch the journal names
      const journalFollows = follows.filter((f: any) => f.entityType === 'journal')
      if (journalFollows.length > 0) {
        const journalIds = journalFollows.map((f: any) => f.entityId)
        const journalsResponse = await fetch('${API_BASE_URL}/journals')
        const journals = await journalsResponse.json()
        const journalNames = new Set<string>(
          journals
            .filter((j: any) => journalIds.includes(j.id))
            .map((j: any) => j.name as string)
        )
        setFollowedJournalNames(journalNames)
      }
    } catch (err) {
      console.error('Failed to fetch user follows:', err)
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/posts')
      const data = await response.json()
      setAllPosts(data)
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    }
  }

  const toggleLike = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/likes/${postId}/toggle?userId=${currentUserId}`, {
        method: 'POST',
      })
      const data = await response.json()

      // Update local state
      const newLikedPosts = new Set(likedPosts)
      if (data.liked) {
        newLikedPosts.add(postId)
      } else {
        newLikedPosts.delete(postId)
      }
      setLikedPosts(newLikedPosts)

      // Update post likes count
      setPosts(posts.map(post =>
        post.id === postId ? { ...post, likesCount: data.likesCount } : post
      ))
    } catch (err) {
      console.error('Failed to toggle like:', err)
    }
  }

  const fetchComments = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments?postId=${postId}`)
      const data = await response.json()
      setComments({ ...comments, [postId]: data })
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    }
  }

  const toggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
      // Fetch comments if not already fetched
      if (!comments[postId]) {
        await fetchComments(postId)
      }
    }
    setExpandedComments(newExpanded)
  }

  const addComment = async (postId: string) => {
    const content = newComment[postId]?.trim()
    if (!content) return

    try {
      const response = await fetch('${API_BASE_URL}/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, authorId: currentUserId, content }),
      })
      const comment = await response.json()

      // Update comments locally
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), comment]
      })

      // Update post comments count
      setPosts(posts.map(post =>
        post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post
      ))

      // Clear input
      setNewComment({ ...newComment, [postId]: '' })
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
      })

      // Update comments locally
      setComments({
        ...comments,
        [postId]: comments[postId].filter(c => c.id !== commentId)
      })

      // Update post comments count
      setPosts(posts.map(post =>
        post.id === postId ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) } : post
      ))
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  const toggleCommentLike = async (commentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      })
      const data = await response.json()

      // Update liked state
      const newLikedComments = new Set(likedComments)
      if (data.liked) {
        newLikedComments.add(commentId)
      } else {
        newLikedComments.delete(commentId)
      }
      setLikedComments(newLikedComments)

      // Update comment likes count in all comment lists
      const updateCommentLikes = (commentsList: Comment[]) =>
        commentsList.map(c => c.id === commentId ? { ...c, likesCount: data.likesCount } : c)

      setComments(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(key => {
          updated[key] = updateCommentLikes(updated[key])
        })
        return updated
      })

      setReplies(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(key => {
          updated[key] = updateCommentLikes(updated[key])
        })
        return updated
      })
    } catch (err) {
      console.error('Failed to toggle comment like:', err)
    }
  }

  const fetchReplies = async (commentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/replies`)
      const data = await response.json()
      setReplies({ ...replies, [commentId]: data })
    } catch (err) {
      console.error('Failed to fetch replies:', err)
    }
  }

  const toggleReplies = async (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
      // Fetch replies if not already fetched
      if (!replies[commentId]) {
        await fetchReplies(commentId)
      }
    }
    setExpandedReplies(newExpanded)
  }

  const addReply = async (postId: string, parentCommentId: string) => {
    const content = replyContent.trim()
    if (!content) return

    try {
      const response = await fetch('${API_BASE_URL}/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          authorId: currentUserId,
          content,
          parentCommentId,
        }),
      })
      const reply = await response.json()

      // Update replies locally
      setReplies({
        ...replies,
        [parentCommentId]: [...(replies[parentCommentId] || []), reply]
      })

      // Clear input and close reply box
      setReplyContent('')
      setReplyingTo(null)
    } catch (err) {
      console.error('Failed to add reply:', err)
    }
  }

  const toggleAbstract = (postId: string) => {
    const newExpanded = new Set(expandedAbstracts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedAbstracts(newExpanded)
  }

  const copyPaperForAI = async (post: Post) => {
    const formattedText = `
RESEARCH PAPER INFORMATION

Title: ${post.citation.title}

Authors: ${post.citation.authors?.join(', ') || 'N/A'}

Journal: ${post.citation.journal}
Year: ${post.citation.year}
${post.citation.impactFactor ? `Impact Factor: ${post.citation.impactFactor}` : ''}

DOI: ${post.citation.doi}
URL: ${post.citation.url}

Abstract:
${post.citation.abstract || 'No abstract available'}

AI Summary:
${post.citation.aiSummary || post.content}

---
This paper was shared by ${post.author.username} on Social Science
    `.trim()

    try {
      await navigator.clipboard.writeText(formattedText)
      alert('Paper information copied! Paste it into your AI assistant.')
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback: show text in alert
      alert('Copy this text to share with your AI:\n\n' + formattedText.substring(0, 500) + '...')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex gap-4 text-sm text-gray-600">
            <button className="text-gray-900 font-semibold">Home</button>
            <button onClick={() => router.push('/trending')} className="hover:text-gray-900">Trending</button>
            <button onClick={() => router.push('/topics')} className="hover:text-gray-900">Topics</button>
            <button onClick={() => router.push('/journals')} className="hover:text-gray-900">Journals</button>
            <button onClick={() => router.push('/explore')} className="hover:text-gray-900">Explore</button>
            {currentUserId && (
              <button onClick={() => router.push(`/users/${currentUserId}`)} className="hover:text-gray-900">Profile</button>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-center">
          <SearchBar />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Post Composer */}
        <PostComposer onPostCreated={fetchPosts} />

        {/* Feed Type Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2">
          <button
            onClick={() => setFeedType('all')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              feedType === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              feedType === 'following'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Following
          </button>
        </div>

        {/* Posts Grid - Instagram Style */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center text-gray-500">
              <div className="text-5xl mb-4">📚</div>
              {feedType === 'following' ? (
                <div>
                  <p className="mb-3">No posts from topics or journals you follow yet.</p>
                  <p className="text-sm">
                    Visit <button onClick={() => router.push('/topics')} className="text-blue-600 hover:underline">Topics</button> or <button onClick={() => router.push('/journals')} className="text-blue-600 hover:underline">Journals</button> to start following!
                  </p>
                </div>
              ) : (
                <p>No posts yet. Share the first scientific paper!</p>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                data-post-id={post.id}
                data-paper-doi={post.citation.doi}
                data-paper-title={post.citation.title}
                itemScope
                itemType="https://schema.org/ScholarlyArticle"
              >
                {/* Author Header */}
                <div
                  className="flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/users/${post.author.id}`)}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {post.author.username[0]}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-sm">{post.author.username}</p>
                    <p className="text-xs text-gray-500">
                      {post.author.expertiseTags?.join(' • ')}
                    </p>
                  </div>
                </div>

                {/* Paper Title */}
                <header className="px-4 pb-3" role="banner">
                  <h3
                    className="font-bold text-lg text-gray-900 leading-tight"
                    itemProp="headline name"
                    data-paper-title
                  >
                    {post.citation.title}
                  </h3>
                  <p
                    className="text-sm text-gray-600 mt-1"
                    itemProp="author"
                    data-authors
                    aria-label={`Authors: ${post.citation.authors?.join(', ')}`}
                  >
                    <span className="sr-only">Authors: </span>
                    {post.citation.authors?.slice(0, 3).join(', ')}
                    {post.citation.authors?.length > 3 ? ' et al.' : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500" role="contentinfo">
                    <span className="font-medium text-blue-600" itemProp="publisher" data-journal>
                      <span className="sr-only">Journal: </span>
                      {post.citation.journal}
                    </span>
                    <span aria-hidden="true">•</span>
                    <span itemProp="datePublished" data-year>
                      <span className="sr-only">Year: </span>
                      {post.citation.year}
                    </span>
                    {post.citation.impactFactor && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span
                          className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium"
                          data-impact-factor={post.citation.impactFactor}
                          aria-label={`Impact Factor: ${post.citation.impactFactor}`}
                        >
                          IF: {post.citation.impactFactor}
                        </span>
                      </>
                    )}
                  </div>
                </header>

                {/* Paper Image */}
                <div className="relative w-full aspect-[4/3] bg-gray-100">
                  <img
                    src={post.images?.[0]?.url || post.citation.imageUrl || 'https://source.unsplash.com/800x600/?science,research'}
                    alt={post.images?.[0]?.altText || post.citation.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://source.unsplash.com/800x600/?science,laboratory'
                    }}
                  />
                </div>

                {/* Engagement Bar */}
                <div className="px-4 py-3 flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      likedPosts.has(post.id) ? 'text-red-500' : 'hover:text-red-500'
                    }`}
                    aria-label={`Like this paper (${post.likesCount} likes)`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill={likedPosts.has(post.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-semibold">{post.likesCount}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      expandedComments.has(post.id) ? 'text-blue-500' : 'hover:text-blue-500'
                    }`}
                    aria-label={`View comments (${post.commentsCount} comments)`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-semibold">{post.commentsCount}</span>
                  </button>
                  <button
                    onClick={() => copyPaperForAI(post)}
                    className="flex items-center gap-2 hover:text-purple-500 transition-colors"
                    aria-label="Copy paper information for AI assistant"
                    title="Ask AI - Copy formatted paper info"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-sm font-medium">Ask AI</span>
                  </button>
                  <button className="ml-auto hover:text-blue-500 transition-colors" aria-label="Save paper">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>

                {/* AI Summary */}
                <div className="px-4 pb-4">
                  <p className="text-sm font-semibold mb-1">
                    <span className="text-gray-900">{post.author.username}</span>
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {post.citation.aiSummary || post.content}
                  </p>

                  {/* Abstract Section */}
                  {post.citation.abstract && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleAbstract(post.id)}
                        className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                      >
                        {expandedAbstracts.has(post.id) ? 'Hide' : 'Show'} Abstract
                        <svg
                          className={`w-3 h-3 transition-transform ${
                            expandedAbstracts.has(post.id) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedAbstracts.has(post.id) && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {post.citation.abstract}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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

                {/* Comments Section */}
                {expandedComments.has(post.id) && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    {/* Comments List */}
                    <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                      {comments[post.id]?.map((comment) => (
                        <div key={comment.id}>
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {comment.author?.username?.[0] || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                <p className="text-xs font-semibold text-gray-900">
                                  {comment.author?.username || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {renderTextWithMentions(comment.content, router)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-1 px-3 text-xs text-gray-500">
                                <span>
                                  {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                <button
                                  onClick={() => toggleCommentLike(comment.id)}
                                  className={`hover:text-red-500 flex items-center gap-1 ${
                                    likedComments.has(comment.id) ? 'text-red-500 font-semibold' : ''
                                  }`}
                                >
                                  {likedComments.has(comment.id) ? '❤' : '🤍'} {comment.likesCount || 0}
                                </button>
                                <button
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                  className="hover:text-blue-500"
                                >
                                  Reply
                                </button>
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="hover:text-blue-500"
                                >
                                  {expandedReplies.has(comment.id)
                                    ? `Hide replies`
                                    : `View replies (${replies[comment.id]?.length || 0})`}
                                </button>
                                <button
                                  onClick={() => deleteComment(post.id, comment.id)}
                                  className="hover:text-red-500"
                                >
                                  Delete
                                </button>
                              </div>

                              {/* Reply Input */}
                              {replyingTo === comment.id && (
                                <div className="mt-2 flex gap-2 pl-3">
                                  <input
                                    type="text"
                                    placeholder="Write a reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        addReply(post.id, comment.id)
                                      }
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => addReply(post.id, comment.id)}
                                    disabled={!replyContent.trim()}
                                    className="text-blue-600 font-semibold text-sm disabled:text-gray-400"
                                  >
                                    Reply
                                  </button>
                                </div>
                              )}

                              {/* Nested Replies */}
                              {expandedReplies.has(comment.id) && replies[comment.id] && (
                                <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
                                  {replies[comment.id].map((reply) => (
                                    <div key={reply.id} className="flex gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                        {reply.author?.username?.[0] || 'U'}
                                      </div>
                                      <div className="flex-1">
                                        <div className="bg-gray-50 rounded-xl px-2 py-1.5">
                                          <p className="text-xs font-semibold text-gray-900">
                                            {reply.author?.username || 'Unknown User'}
                                          </p>
                                          <p className="text-sm text-gray-700">
                                            {renderTextWithMentions(reply.content, router)}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 px-2 text-xs text-gray-500">
                                          <span>
                                            {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                          <button
                                            onClick={() => toggleCommentLike(reply.id)}
                                            className={`hover:text-red-500 flex items-center gap-1 ${
                                              likedComments.has(reply.id) ? 'text-red-500 font-semibold' : ''
                                            }`}
                                          >
                                            {likedComments.has(reply.id) ? '❤' : '🤍'} {reply.likesCount || 0}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment Input */}
                    <div className="mt-4 flex gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        D
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addComment(post.id)
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          disabled={!newComment[post.id]?.trim()}
                          className="text-blue-600 font-semibold text-sm disabled:text-gray-400"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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
