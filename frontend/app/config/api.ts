/**
 * API Configuration
 *
 * Uses NEXT_PUBLIC_API_URL from environment variables in production,
 * falls back to localhost for local development.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const API_ENDPOINTS = {
  // Posts
  posts: `${API_BASE_URL}/posts`,

  // Search
  search: `${API_BASE_URL}/citations/search`,
  semanticSearch: `${API_BASE_URL}/semantic-search`,

  // Users
  users: `${API_BASE_URL}/users`,

  // Institutions
  institutions: `${API_BASE_URL}/institutions`,

  // Topics & Journals
  topics: `${API_BASE_URL}/topics`,
  journals: `${API_BASE_URL}/journals`,

  // Analytics
  analytics: `${API_BASE_URL}/analytics`,

  // Moderation
  moderation: `${API_BASE_URL}/moderation`,

  // Onboarding
  onboarding: `${API_BASE_URL}/onboarding`,

  // Digest
  digest: `${API_BASE_URL}/digest`,

  // Health
  health: `${API_BASE_URL}/health`,
}
