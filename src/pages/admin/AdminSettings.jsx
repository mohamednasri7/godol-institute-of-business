import React, { useState, useEffect } from 'react';
import { Save, Phone, Globe, CreditCard, Info, Database, CheckCircle, AlertCircle, RefreshCw, DownloadCloud, UploadCloud, Layout, BookOpen, Upload } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../../lib/api';

const GROUPS = [
  { key: 'homepage', label: 'Homepage Hero & Announcement', icon: Layout },
  { key: 'about', label: 'About Us Page & Mission Message', icon: BookOpen },
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
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const loadData = () => {
    apiFetch('/api/admin/settings').then(data => {
      setSettings(data);
      const v = {};
      data.forEach(s => { v[s.key] = s.value; });
      setValues(v);
    }).catch(console.error);

    apiFetch('/api/database/status').then(setDbStatus).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePull = async () => {
    setIsSyncing(true);
    try {
      const res = await apiFetch('/api/database/pull', { method: 'POST' });
      showToast(res.message || 'Pulled fresh data from Supabase!');
      loadData();
    } catch (err) {
      showToast(err.message || 'Pull failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePush = async () => {
    setIsSyncing(true);
    try {
      await apiFetch('/api/database/sync', { method: 'POST' });
      showToast('All local tables pushed to Supabase successfully!');
      loadData();
    } catch (err) {
      showToast(err.message || 'Push failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Database & Supabase Live Engine</h3>
                <p className="text-xs text-gray-500">PostgreSQL cloud storage with live two-way dashboard synchronization</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
          </div>

          {/* Counts overview */}
          {dbStatus?.counts && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4 p-3 bg-gray-50 rounded-xl text-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Instructors</p>
                <p className="text-sm font-bold text-gray-800">{dbStatus.counts.instructors}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Courses</p>
                <p className="text-sm font-bold text-gray-800">{dbStatus.counts.courses}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Categories</p>
                <p className="text-sm font-bold text-gray-800">{dbStatus.counts.categories}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Workshops</p>
                <p className="text-sm font-bold text-gray-800">{dbStatus.counts.workshops}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Students</p>
                <p className="text-sm font-bold text-gray-800">{dbStatus.counts.students}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Settings</p>
                <p className="text-sm font-bold text-gray-800">{dbStatus.counts.settings}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handlePull}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all disabled:opacity-50"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>Pull Changes from Supabase</span>
            </button>

            <button
              onClick={handlePush}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white transition-all disabled:opacity-50"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>Push All Local to Supabase</span>
            </button>

            <p className="text-[11px] text-gray-500 ml-auto">
              {isSyncing ? 'Synchronizing with Supabase...' : 'Any change you make in this dashboard automatically saves to Supabase.'}
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
                {groupSettings.map(setting => {
                  const isLongText = setting.key.includes('instructions') || setting.key.includes('bio') || setting.key.includes('description') || setting.key.includes('text') || setting.key.includes('message') || setting.key.includes('subtitle');
                  const isImage = setting.key.includes('image') || setting.key.includes('avatar') || setting.key.includes('photo');

                  return (
                    <div key={setting.key} className={isLongText ? 'md:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{setting.label}</label>

                      {isImage ? (
                        <div className="flex items-center gap-3.5 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                          <img
                            src={values[setting.key] || '/instructor-1.png'}
                            alt="Preview"
                            className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                          />
                          <div className="flex-1 space-y-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => setValues(prev => ({ ...prev, [setting.key]: reader.result }));
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                            <input
                              type="text"
                              value={values[setting.key] || ''}
                              onChange={e => setValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                              placeholder="/instructor-1.png or https://..."
                              className="w-full h-8 px-2.5 text-xs bg-white rounded-lg border border-gray-200 outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      ) : isLongText ? (
                        <textarea
                          value={values[setting.key] || ''}
                          onChange={e => setValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary resize-none leading-relaxed"
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
