import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Mail, Tag, Download, Eye, EyeOff, Plus, Trash2, ToggleLeft, ToggleRight,
  RefreshCw, AlertCircle, CheckCircle, Loader, Copy, Shield
} from 'lucide-react';

const ADMIN_EMAIL = 'sexyresumeai@gmail.com';

interface CapturedEmail {
  id: string;
  email: string;
  full_name: string | null;
  source: string;
  created_at: string;
}

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  is_active: boolean;
  max_uses_total: number | null;
  max_uses_per_email: number;
  max_uses_per_ip: number;
  times_used: number;
  expires_at: string | null;
  created_at: string;
}

type AdminTab = 'emails' | 'codes';

export default function AdminTab() {
  const { user, session } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [activeTab, setActiveTab] = useState<AdminTab>('emails');
  const [emailsPrivacy, setEmailsPrivacy] = useState(false); // false = visible
  const [emails, setEmails] = useState<CapturedEmail[]>([]);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New code form
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMaxTotal, setNewMaxTotal] = useState('');
  const [newMaxEmail, setNewMaxEmail] = useState('1');
  const [newMaxIp, setNewMaxIp] = useState('1');
  const [newExpiry, setNewExpiry] = useState('');
  const [showNewCodeForm, setShowNewCodeForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  };

  const loadEmails = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('captured_emails')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEmails(data || []);
    } catch (e: any) { flash(e.message, 'error'); }
    finally { setLoading(false); }
  }, [session]);

  const loadCodes = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCodes(data || []);
    } catch (e: any) { flash(e.message, 'error'); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'emails') loadEmails();
    else loadCodes();
  }, [activeTab, isAdmin, loadEmails, loadCodes]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    return `${'*'.repeat(local.length)}@${domain}`;
  };

  const downloadEmailsCSV = () => {
    const rows = [
      ['Email', 'Full Name', 'Source', 'Signed Up'],
      ...emails.map(e => [e.email, e.full_name || '', e.source, new Date(e.created_at).toLocaleString()])
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sexyresume-emails-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createCode = async () => {
    if (!newCode.trim()) { flash('Code text is required', 'error'); return; }
    setCreating(true);
    try {
      const { error } = await supabase.from('promo_codes').insert({
        code: newCode.trim().toUpperCase(),
        description: newDesc.trim() || null,
        is_active: true,
        max_uses_total: newMaxTotal ? parseInt(newMaxTotal) : null,
        max_uses_per_email: parseInt(newMaxEmail) || 1,
        max_uses_per_ip: parseInt(newMaxIp) || 1,
        expires_at: newExpiry || null,
        times_used: 0,
      });
      if (error) throw error;
      flash('Code created!', 'success');
      setNewCode(''); setNewDesc(''); setNewMaxTotal(''); setNewMaxEmail('1');
      setNewMaxIp('1'); setNewExpiry(''); setShowNewCodeForm(false);
      loadCodes();
    } catch (e: any) { flash(e.message, 'error'); }
    finally { setCreating(false); }
  };

  const toggleCode = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) flash(error.message, 'error');
    else loadCodes();
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Delete this code permanently?')) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) flash(error.message, 'error');
    else { flash('Code deleted', 'success'); loadCodes(); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    flash(`Copied: ${code}`, 'success');
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <Shield className="w-12 h-12 text-gray-300 mb-4" />
        <p className="font-bold text-gray-500">Admin access only</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}>
          <Shield size={20} color="white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">Admin Panel</h2>
          <p className="text-xs text-gray-400">Logged in as {user?.email}</p>
        </div>
      </div>

      {/* Flash messages */}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'emails' as AdminTab, label: 'Captured Emails', icon: Mail },
          { id: 'codes' as AdminTab, label: 'Promo Codes', icon: Tag },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === id
                ? 'border-purple-500 text-purple-700'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── EMAILS TAB ── */}
      {activeTab === 'emails' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{emails.length} email{emails.length !== 1 ? 's' : ''} collected</p>
            <div className="flex gap-2">
              <button
                onClick={() => setEmailsPrivacy(!emailsPrivacy)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                style={{ borderColor: emailsPrivacy ? '#7c3aed' : '#d1d5db', color: emailsPrivacy ? '#7c3aed' : '#6b7280' }}
              >
                {emailsPrivacy ? <EyeOff size={13} /> : <Eye size={13} />}
                {emailsPrivacy ? 'Hidden' : 'Visible'}
              </button>
              <button
                onClick={downloadEmailsCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
              >
                <Download size={13} /> Download CSV
              </button>
              <button onClick={loadEmails} className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader size={24} className="animate-spin text-purple-400" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No emails captured yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Source</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e, i) => (
                    <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800">
                        {emailsPrivacy ? maskEmail(e.email) : e.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{e.full_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {e.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(e.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── CODES TAB ── */}
      {activeTab === 'codes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{codes.length} code{codes.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewCodeForm(!showNewCodeForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
              >
                <Plus size={13} /> New Code
              </button>
              <button onClick={loadCodes} className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* New code form */}
          {showNewCodeForm && (
            <div className="mb-6 rounded-xl p-5 border-2 border-purple-200" style={{ background: '#faf5ff' }}>
              <p className="font-bold text-purple-800 text-sm mb-4">Create New Code</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Code *</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FRIEND2026"
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Beta tester freebie"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Total uses (blank = unlimited)</label>
                  <input
                    type="number"
                    value={newMaxTotal}
                    onChange={(e) => setNewMaxTotal(e.target.value)}
                    placeholder="e.g. 10"
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Max uses per email</label>
                  <input
                    type="number"
                    value={newMaxEmail}
                    onChange={(e) => setNewMaxEmail(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Max uses per IP</label>
                  <input
                    type="number"
                    value={newMaxIp}
                    onChange={(e) => setNewMaxIp(e.target.value)}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Expiry date (optional)</label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={createCode}
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
                >
                  {creating ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create Code
                </button>
                <button
                  onClick={() => setShowNewCodeForm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader size={24} className="animate-spin text-purple-400" />
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No codes yet — create your first one above</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600">Used</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600">Limit</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600">Expires</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-700 text-xs tracking-widest">{c.code}</span>
                          <button onClick={() => copyCode(c.code)} className="text-gray-300 hover:text-gray-500">
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{c.description || '—'}</td>
                      <td className="px-3 py-3 text-center font-semibold text-gray-700">{c.times_used}</td>
                      <td className="px-3 py-3 text-center text-gray-500 text-xs">
                        {c.max_uses_total !== null ? `${c.times_used}/${c.max_uses_total}` : 'Unlimited'}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-400 text-xs">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.is_active ? 'Active' : 'Off'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggleCode(c.id, c.is_active)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title={c.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {c.is_active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} className="text-gray-400" />}
                          </button>
                          <button
                            onClick={() => deleteCode(c.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
