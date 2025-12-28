import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, CreditCard as Edit, Trash2, Lock, Unlock, UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  resumeCount: number;
  exportCount: number;
  exportUnlocked: boolean;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'free'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get users with their auth metadata
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Get all user profiles
      const { data: profiles } = await supabase
        .from('users')
        .select('id, full_name, created_at');

      // Get entitlements
      const { data: entitlements } = await supabase
        .from('user_entitlements')
        .select('user_id, export_unlocked');

      // Get resume counts
      const { data: resumeCounts } = await supabase
        .from('resumes')
        .select('user_id')
        .eq('deleted_at', null);

      // Get export counts
      const { data: exportCounts } = await supabase
        .from('resume_exports')
        .select('user_id');

      // Combine data
      const userList: User[] = (authUsers?.users || []).map((authUser) => {
        const profile = profiles?.find((p) => p.id === authUser.id);
        const entitlement = entitlements?.find((e) => e.user_id === authUser.id);
        const resumeCount = resumeCounts?.filter((r) => r.user_id === authUser.id).length || 0;
        const exportCount = exportCounts?.filter((e) => e.user_id === authUser.id).length || 0;

        return {
          id: authUser.id,
          email: authUser.email || 'No email',
          fullName: profile?.full_name || authUser.user_metadata?.full_name || 'Unknown',
          createdAt: authUser.created_at,
          resumeCount,
          exportCount,
          exportUnlocked: entitlement?.export_unlocked || false,
        };
      });

      setUsers(userList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'paid' && user.exportUnlocked) ||
                         (filterStatus === 'free' && !user.exportUnlocked);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'paid' | 'free')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="paid">Paid Users</option>
              <option value="free">Free Users</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Resumes</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Exports</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.resumeCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.exportCount}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.exportUnlocked 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.exportUnlocked ? 'Paid' : 'Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-sexy-pink-600 transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No users found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}