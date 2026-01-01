'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../config/api'

interface Journal {
  id: string;
  name: string;
  slug: string;
  description: string;
  impactFactor: number;
  publisher: string;
  followerCount: number;
  articleCount: number;
  disciplines: string[];
}

export default function JournalsPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE_URL}/journals`)
      .then((res) => res.json())
      .then((data) => {
        setJournals(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching journals:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading journals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Journals</h1>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Explore Scientific Journals
          </h2>
          <p className="text-gray-600">
            Browse top-tier journals and discover the latest research publications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.map((journal) => (
            <div
              key={journal.id}
              onClick={() => router.push(`/journals/${journal.slug}`)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex-1">
                  {journal.name}
                </h3>
                {journal.impactFactor && (
                  <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                    IF: {journal.impactFactor}
                  </div>
                )}
              </div>

              {journal.publisher && (
                <p className="text-xs text-gray-500 mb-2">{journal.publisher}</p>
              )}

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {journal.description}
              </p>

              {journal.disciplines && journal.disciplines.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {journal.disciplines.slice(0, 3).map((discipline, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {discipline}
                    </span>
                  ))}
                  {journal.disciplines.length > 3 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                      +{journal.disciplines.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
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
                  {journal.followerCount} followers
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
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
                  {journal.articleCount} articles
                </span>
              </div>
            </div>
          ))}
        </div>

        {journals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No journals available
          </div>
        )}
      </main>
    </div>
  );
}
