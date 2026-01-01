'use client';

import { useState } from 'react';
import { API_BASE_URL } from '../config/api'

interface ReportButtonProps {
  entityType: 'post' | 'topic' | 'journal' | 'user';
  entityId: string;
  className?: string;
}

export default function ReportButton({ entityType, entityId, className = '' }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flagType, setFlagType] = useState<'misinformation' | 'spam' | 'harassment' | 'low-quality' | 'other'>('other');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/moderation/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          flagType,
          description,
          flaggedBy: null, // TODO: Get from auth context, null for anonymous
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setDescription('');
          setFlagType('other');
        }, 2000);
      }
    } catch (error) {
      console.error('Error reporting content:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors ${className}`}
        title="Report this content"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
          />
        </svg>
        <span>Report</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Report Content</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {success ? (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h4>
                  <p className="text-sm text-gray-600">Thank you for helping keep our community safe.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What type of issue are you reporting?
                    </label>
                    <select
                      value={flagType}
                      onChange={(e) => setFlagType(e.target.value as any)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={submitting}
                    >
                      <option value="misinformation">Misinformation</option>
                      <option value="spam">Spam</option>
                      <option value="harassment">Harassment</option>
                      <option value="low-quality">Low Quality</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Please provide additional details about your report..."
                      disabled={submitting}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600">
                      Your report will be reviewed by our moderation team. False reports may result in account restrictions.
                    </p>
                  </div>
                </>
              )}
            </div>

            {!success && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
