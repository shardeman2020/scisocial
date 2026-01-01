'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api'

interface ModerationEvent {
  id: string;
  entityType: 'post' | 'topic' | 'journal' | 'user';
  entityId: string;
  flagType: 'misinformation' | 'spam' | 'harassment' | 'low-quality' | 'other';
  description: string;
  flaggedBy: string;
  flagger?: {
    id: string;
    username: string;
    email: string;
  };
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy: string;
  reviewer?: {
    id: string;
    username: string;
    email: string;
  };
  reviewNote: string;
  createdAt: string;
  updatedAt: string;
}

interface ModerationStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  byFlagType: Array<{ flagType: string; count: number }>;
  byEntityType: Array<{ entityType: string; count: number }>;
}

export default function ModerationDashboard() {
  const [events, setEvents] = useState<ModerationEvent[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<ModerationEvent | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterEntityType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterEntityType) params.append('entityType', filterEntityType);

      const [eventsRes, statsRes] = await Promise.all([
        fetch(`http://localhost:3001/moderation/events?${params.toString()}`),
        fetch(`${API_BASE_URL}/moderation/stats`),
      ]);

      const eventsData = await eventsRes.json();
      const statsData = await statsRes.json();

      setEvents(eventsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    eventId: string,
    newStatus: 'reviewed' | 'resolved' | 'dismissed'
  ) => {
    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:3001/moderation/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reviewedBy: 'current-user-id', // TODO: Get from auth context
          reviewNote: reviewNote || undefined,
        }),
      });

      if (response.ok) {
        setSelectedEvent(null);
        setReviewNote('');
        fetchData();
      }
    } catch (error) {
      console.error('Error updating moderation event:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getFlagTypeColor = (flagType: string) => {
    switch (flagType) {
      case 'misinformation':
        return 'bg-red-100 text-red-800';
      case 'spam':
        return 'bg-orange-100 text-orange-800';
      case 'harassment':
        return 'bg-purple-100 text-purple-800';
      case 'low-quality':
        return 'bg-yellow-100 text-yellow-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'post':
        return 'bg-blue-100 text-blue-800';
      case 'topic':
        return 'bg-green-100 text-green-800';
      case 'journal':
        return 'bg-indigo-100 text-indigo-800';
      case 'user':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 font-medium">Loading moderation dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Moderation Dashboard</h1>
          <p className="mt-2 text-gray-600">Review and manage flagged content</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Reviewed</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.reviewed}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolved}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Dismissed</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">{stats.dismissed}</p>
              </div>
            </div>

            {/* Flag Type Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-md font-bold text-gray-900 mb-4">By Flag Type</h3>
                <div className="space-y-2">
                  {stats.byFlagType.map((item) => (
                    <div key={item.flagType} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 capitalize">{item.flagType}</span>
                      <span className="text-sm font-semibold text-purple-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-md font-bold text-gray-900 mb-4">By Entity Type</h3>
                <div className="space-y-2">
                  {stats.byEntityType.map((item) => (
                    <div key={item.entityType} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 capitalize">{item.entityType}</span>
                      <span className="text-sm font-semibold text-purple-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Types</option>
                <option value="post">Post</option>
                <option value="topic">Topic</option>
                <option value="journal">Journal</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Flagged Content</h2>
          </div>

          {events.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No events found with the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flag Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flagged By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEntityTypeColor(event.entityType)} w-fit`}>
                            {event.entityType}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            ID: {event.entityId.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFlagTypeColor(event.flagType)}`}>
                          {event.flagType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.flagger ? event.flagger.username : 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'pending'
                            ? 'bg-orange-100 text-orange-800'
                            : event.status === 'reviewed'
                            ? 'bg-blue-100 text-blue-800'
                            : event.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="text-purple-600 hover:text-purple-900 font-medium"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Review Flagged Content</h3>
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setReviewNote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Entity Type</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEntityTypeColor(selectedEvent.entityType)}`}>
                    {selectedEvent.entityType}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Entity ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{selectedEvent.entityId}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Flag Type</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFlagTypeColor(selectedEvent.flagType)}`}>
                    {selectedEvent.flagType}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedEvent.description || 'No description provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Flagged By</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedEvent.flagger ? selectedEvent.flagger.username : 'Anonymous'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedEvent.createdAt)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Note</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add notes about your review decision..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => handleUpdateStatus(selectedEvent.id, 'dismissed')}
                disabled={updating}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Dismiss'}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedEvent.id, 'reviewed')}
                disabled={updating}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Mark Reviewed'}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedEvent.id, 'resolved')}
                disabled={updating}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
