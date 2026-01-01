'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';
import { API_BASE_URL } from '../../config/api'

interface UserPreferences {
  digestFrequency: 'weekly' | 'daily' | 'disabled';
  deliveryMethod: 'email' | 'in_app' | 'both';
  lastDigestSentAt: string | null;
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const userId = '7af7ae67-4d01-4d97-a81f-c3b329231c7e'; // TODO: Replace with auth
      const response = await fetch(`http://localhost:3001/user-preferences?userId=${userId}`);
      const data = await response.json();
      setPreferences(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const userId = '7af7ae67-4d01-4d97-a81f-c3b329231c7e'; // TODO: Replace with auth
      await fetch(`http://localhost:3001/user-preferences?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          digestFrequency: preferences.digestFrequency,
          deliveryMethod: preferences.deliveryMethod,
        }),
      });
      alert('Preferences saved successfully!');
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading preferences...</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Failed to load preferences</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600 mt-2">Manage how you receive updates about your saved searches</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Digest Frequency Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Digest Frequency</h2>
            <p className="text-sm text-gray-600 mb-4">
              How often would you like to receive email digests for your saved searches?
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value="weekly"
                  checked={preferences.digestFrequency === 'weekly'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, digestFrequency: 'weekly' })
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Weekly</div>
                  <div className="text-sm text-gray-600">
                    Receive a digest every Sunday at midnight (UTC)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value="daily"
                  checked={preferences.digestFrequency === 'daily'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, digestFrequency: 'daily' })
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Daily</div>
                  <div className="text-sm text-gray-600">
                    Receive a digest every day at midnight (UTC)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value="disabled"
                  checked={preferences.digestFrequency === 'disabled'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, digestFrequency: 'disabled' })
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Disabled</div>
                  <div className="text-sm text-gray-600">
                    Don't send me any digest emails
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Delivery Method Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delivery Method</h2>
            <p className="text-sm text-gray-600 mb-4">
              How would you like to receive notifications?
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="email"
                  checked={preferences.deliveryMethod === 'email'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, deliveryMethod: 'email' })
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Email Only</div>
                  <div className="text-sm text-gray-600">
                    Receive notifications via email
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="in_app"
                  checked={preferences.deliveryMethod === 'in_app'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, deliveryMethod: 'in_app' })
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">In-App Only</div>
                  <div className="text-sm text-gray-600">
                    View notifications within the application (coming soon)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="both"
                  checked={preferences.deliveryMethod === 'both'}
                  onChange={(e) =>
                    setPreferences({ ...preferences, deliveryMethod: 'both' })
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Both</div>
                  <div className="text-sm text-gray-600">
                    Receive notifications via email and in-app
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Last Digest Info */}
          {preferences.lastDigestSentAt && (
            <div className="p-6 bg-gray-50">
              <p className="text-sm text-gray-600">
                <strong>Last digest sent:</strong>{' '}
                {new Date(preferences.lastDigestSentAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="p-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
              <button
                onClick={() => router.push('/saved-searches')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Manage Saved Searches
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How Digest Notifications Work
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 ml-7">
            <li>• Digests include new posts matching your saved searches with notifications enabled</li>
            <li>• Each digest shows the top 3 posts from the selected time period</li>
            <li>• You can toggle notifications for individual saved searches on the Saved Searches page</li>
            <li>• Change your preferences here at any time</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
