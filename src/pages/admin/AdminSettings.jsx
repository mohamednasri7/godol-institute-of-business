import React, { useState, useEffect } from 'react';
import { Save, Phone, Globe, CreditCard, Info, Database, CheckCircle, AlertCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const GROUPS = [
  { key: 'general', label: 'General Settings', icon: Globe },
  { key: 'contact', label: 'Contact & WhatsApp', icon: Phone },
  { key: 'payment', label: 'Mobile Money Payment Providers', icon: CreditCard },
  { key: 'social', label: 'Social Media', icon: Globe },
  { key: 'commerce', label: 'Commerce & Enrollment', icon: Info }
];

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedGroup, setSavedGroup] = useState(null);
  const [toast, setToast] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    apiFetch('/api/admin/settings').then(data => {
      setSettings(data);
      const v = {};
      data.forEach(s => { v[s.key] = s.value; });
      setValues(v);
    }).catch(console.error);

    apiFetch('/api/database/status').then(setDbStatus).catch(() => {});
  }, []);

  const handleSave = async (group) => {
    setIsSaving(true);
    const groupKeys = settings.filter(s => s.group === group).map(s => s.key);
    const updates = {};
    groupKeys.forEach(k => { updates[k] = values[k] || ''; });
    try {
      await apiFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(updates) });
      setSavedGroup(group);
      setTimeout(() => setSavedGroup(null), 2000);
      showToast('Settings saved successfully.');
    } catch (err) { showToast(err.message || 'Save failed', 'error'); }
    finally { setIsSaving(false); }
  };

  return (
    <AdminLayout title="Platform Settings" subtitle="Configure payment providers, contact details, and platform preferences">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Database & Supabase Status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Database & Supabase Engine</h3>
                <p className="text-xs text-gray-500">PostgreSQL schema, migrations, and storage</p>
              </div>
            </div>
            {dbStatus?.configured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Supabase Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <Info className="w-3.5 h-3.5 text-blue-600" /> Active: Local JSON DB (Ready for Supabase)
              </span>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-2">
            <p><strong>Engine:</strong> {dbStatus?.engine || 'Checking...'}</p>
            <p className="text-gray-500">
              To connect your live Supabase project: paste your <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> into the project's <code>.env</code> file, and run the SQL migration in <code>supabase/schema.sql</code> inside the Supabase SQL Editor.
            </p>
          </div>
        </div>

        {/* Payment provider notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Configure your mobile money payment details</p>
            <p className="text-xs text-blue-700 mt-1">Enter your actual EVC Plus, Zaad, Sahal, and Premier Wallet numbers and account names below. These will be displayed to students at checkout so they can send payment to the correct number.</p>
          </div>
        </div>

        {GROUPS.map(({ key, label, icon: Icon }) => {
          const groupSettings = settings.filter(s => s.group === key);
          if (groupSettings.length === 0) return null;
          const isSaved = savedGroup === key;
          return (
            <div key={key} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{label}</h3>
                </div>
                <button onClick={() => handleSave(key)} disabled={isSaving}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSaved ? 'bg-emerald-600 text-white' : 'bg-primary text-white hover:bg-primary/90'} disabled:opacity-60`}>
                  <Save className="w-3.5 h-3.5" />
                  {isSaved ? '✓ Saved!' : (isSaving ? 'Saving...' : 'Save')}
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {groupSettings.map(setting => (
                  <div key={setting.key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{setting.label}</label>
                    {setting.key.includes('instructions') || setting.key.includes('bio') || setting.key.includes('description') ? (
                      <textarea
                        value={values[setting.key] || ''}
                        onChange={e => setValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={values[setting.key] || ''}
                        onChange={e => setValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"
                      />
                    )}
                    {setting.key.includes('phone') || setting.key.includes('merchant') ? (
                      <p className="text-[10px] text-gray-400 mt-1">Enter in international format (no + or spaces), e.g. 252610000000</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
