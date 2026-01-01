'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/api'

interface Institution {
  id: string;
  name: string;
  slug: string;
  memberCount?: number;
}

interface InstitutionSettings {
  id: string;
  institutionId: string;
  defaultModel: string;
  moderationPolicy: {
    allowedFlagTypes: string[];
    autoFlagRules: Record<string, any>;
  };
  digestPreferences: {
    enabled: boolean;
    recipients: string[];
    frequency: string;
  };
  searchPreferences: {
    defaultMode: string;
    defaultSemanticWeight: number;
    defaultKeywordWeight: number;
    defaultThreshold: number;
  };
  branding: {
    logoUrl?: string;
    accentColor?: string;
    customDomain?: string;
  };
}

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user?: {
    email: string;
  };
}

interface Invite {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  invitedBy?: {
    email: string;
  };
}

export default function InstitutionAdminPage() {
  const params = useParams();
  const institutionSlug = params.slug as string;

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<InstitutionSettings | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'users' | 'audit'>(
    'overview'
  );

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<InstitutionSettings>>({});

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const response = await fetch(`http://localhost:3001/institutions/${institutionSlug}`);
        const data = await response.json();
        setInstitution(data);
        setInstitutionId(data.id);
      } catch (error) {
        console.error('Error fetching institution:', error);
      }
    };

    fetchInstitution();
  }, [institutionSlug]);

  useEffect(() => {
    if (!institutionId) return;

    const fetchData = async () => {
      try {
        const [settingsRes, membersRes, auditsRes, invitesRes] = await Promise.all([
          fetch(`http://localhost:3001/institutions/${institutionId}/settings`),
          fetch(`http://localhost:3001/institutions/${institutionId}/members`),
          fetch(`http://localhost:3001/institutions/${institutionId}/audit-logs?limit=20`),
          fetch(`http://localhost:3001/institutions/${institutionId}/pending-invites`),
        ]);

        const [settingsData, membersData, auditsData, invitesData] = await Promise.all([
          settingsRes.json(),
          membersRes.json(),
          auditsRes.json(),
          invitesRes.json(),
        ]);

        setSettings(settingsData);
        setSettingsForm(settingsData);
        setMembers(membersData);
        setAuditLogs(auditsData);
        setPendingInvites(invitesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [institutionId]);

  const handleInviteUser = async () => {
    if (!inviteEmail || !institutionId) return;

    try {
      const response = await fetch(`http://localhost:3001/institutions/${institutionId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          invitedBy: 'current-admin-id', // TODO: Get from auth context
        }),
      });

      if (response.ok) {
        setInviteEmail('');
        // Refresh pending invites
        const invitesRes = await fetch(
          `http://localhost:3001/institutions/${institutionId}/pending-invites`
        );
        const invitesData = await invitesRes.json();
        setPendingInvites(invitesData);
        alert('Invite sent successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to send invite'}`);
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Failed to send invite');
    }
  };

  const handleUpdateSettings = async () => {
    if (!institutionId) return;

    try {
      const response = await fetch(
        `http://localhost:3001/institutions/${institutionId}/settings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...settingsForm,
            updatedBy: 'current-admin-id', // TODO: Get from auth context
          }),
        }
      );

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setEditingSettings(false);
        alert('Settings updated successfully!');

        // Refresh audit logs
        const auditsRes = await fetch(
          `http://localhost:3001/institutions/${institutionId}/audit-logs?limit=20`
        );
        const auditsData = await auditsRes.json();
        setAuditLogs(auditsData);
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!institutionId) return;
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      const response = await fetch(
        `http://localhost:3001/institutions/${institutionId}/users/${userId}/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: newRole,
            updatedBy: 'current-admin-id', // TODO: Get from auth context
          }),
        }
      );

      if (response.ok) {
        // Refresh members
        const membersRes = await fetch(
          `http://localhost:3001/institutions/${institutionId}/members`
        );
        const membersData = await membersRes.json();
        setMembers(membersData);
        alert('Role updated successfully!');
      } else {
        alert('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  if (loading || !institution) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
          <p className="text-gray-600 mt-1">Institution Administration</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'settings', label: 'Settings' },
              { id: 'users', label: 'User Management' },
              { id: 'audit', label: 'Audit Log' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Members</h3>
              <p className="text-3xl font-bold text-gray-900">{members.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Invites</h3>
              <p className="text-3xl font-bold text-gray-900">{pendingInvites.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Institution Admins</h3>
              <p className="text-3xl font-bold text-gray-900">
                {members.filter((m) => m.role === 'institution_admin').length}
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && settings && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Institution Settings</h2>
                {!editingSettings ? (
                  <button
                    onClick={() => setEditingSettings(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Edit Settings
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setEditingSettings(false);
                        setSettingsForm(settings);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateSettings}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Default Model */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Model
                </label>
                <select
                  disabled={!editingSettings}
                  value={settingsForm.defaultModel}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, defaultModel: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded disabled:bg-gray-100"
                >
                  <option value="general">General</option>
                  <option value="biomed">Biomedical</option>
                  <option value="legal">Legal</option>
                  <option value="physics">Physics</option>
                </select>
              </div>

              {/* Search Preferences */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Preferences</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Mode
                    </label>
                    <select
                      disabled={!editingSettings}
                      value={settingsForm.searchPreferences?.defaultMode}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          searchPreferences: {
                            ...settingsForm.searchPreferences!,
                            defaultMode: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded disabled:bg-gray-100"
                    >
                      <option value="keyword">Keyword</option>
                      <option value="semantic">Semantic</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      disabled={!editingSettings}
                      value={settingsForm.searchPreferences?.defaultThreshold}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          searchPreferences: {
                            ...settingsForm.searchPreferences!,
                            defaultThreshold: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Digest Preferences */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Digest Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      disabled={!editingSettings}
                      checked={settingsForm.digestPreferences?.enabled}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          digestPreferences: {
                            ...settingsForm.digestPreferences!,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Enable Weekly Digests</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      disabled={!editingSettings}
                      value={settingsForm.digestPreferences?.frequency}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          digestPreferences: {
                            ...settingsForm.digestPreferences!,
                            frequency: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded disabled:bg-gray-100"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      disabled={!editingSettings}
                      value={settingsForm.branding?.logoUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          branding: {
                            ...settingsForm.branding!,
                            logoUrl: e.target.value,
                          },
                        })
                      }
                      placeholder="https://example.com/logo.png"
                      className="w-full p-2 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <input
                      type="color"
                      disabled={!editingSettings}
                      value={settingsForm.branding?.accentColor || '#9333ea'}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          branding: {
                            ...settingsForm.branding!,
                            accentColor: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Invite User Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Invite User</h2>
              <div className="flex space-x-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                <button
                  onClick={handleInviteUser}
                  className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Send Invite
                </button>
              </div>
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Invites</h2>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        <p className="text-sm text-gray-500">
                          Invited {new Date(invite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm text-orange-600">Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Members ({members.length})
              </h2>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.username}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateUserRole(member.id, e.target.value)}
                        className="p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="institution_admin">Institution Admin</option>
                      </select>
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          member.role === 'institution_admin'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'moderator'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Log</h2>
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{log.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Action: {log.action.replace(/_/g, ' ')}
                      </p>
                      {log.user && (
                        <p className="text-sm text-gray-500">By: {log.user.email}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No audit logs yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
