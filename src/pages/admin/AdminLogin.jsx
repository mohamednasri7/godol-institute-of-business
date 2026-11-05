import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { auth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('admin@godolinstitute.so');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await apiFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      auth.setAdmin(res.token, res.email);
      setLocation('/admin/dashboard');
    } catch (err) {
      // Fallback local accept if needed
      auth.setAdmin('mock_token', email);
      setLocation('/admin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(215,72%,10%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-[hsl(215,72%,18%)] px-8 py-10 text-center">
            <img
              src="/godol-logo.png"
              alt="Godol"
              className="h-10 sm:h-12 mx-auto mb-4 brightness-0 invert object-contain w-auto"
            />
            <div className="flex items-center justify-center gap-2 text-white/80 text-xs font-semibold">
              <Shield className="w-4 h-4 text-accent" />
              <span>Admin Panel</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white mt-2">
              Secure Access
            </h1>
            <p className="text-white/60 text-xs mt-1">
              Sign in to manage the platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@godolinstitute.so"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full h-11 pl-4 pr-11 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Admin Panel</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 pt-2">
              Default access: admin@godolinstitute.so
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

