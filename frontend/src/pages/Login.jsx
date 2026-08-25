import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Truck, ShieldCheck, UserCheck, Lock, User, Sparkles } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user, pass) => {
    setUsername(user);
    setPassword(pass);
    try {
      setError('');
      setIsLoading(true);
      await login(user, pass);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0A2540] to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center text-white relative">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-primary flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/30 mb-3">
              H
            </div>
            <h2 className="text-xl font-bold tracking-wide">HATSUN AGRO PRODUCTS</h2>
            <p className="text-xs text-sky-200 mt-0.5 font-medium">Route Delivery Management System (RDMS)</p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
              <Truck className="w-3.5 h-3.5" />
              <span>Daily FMCG Distribution Portal</span>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 space-y-5">
            {error && (
              <Alert type="danger" message={error} onClose={() => setError('')} />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Username"
                icon={User}
                placeholder="e.g. admin or driver1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-md shadow-primary/30"
                isLoading={isLoading}
              >
                Sign In to RDMS
              </Button>
            </form>

            {/* Quick Demo Login Preset Buttons */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
                1-Click Quick Demo Sign In
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Admin</span>
                  </div>
                  <span className="text-[10px] text-amber-700/80 mt-0.5">Full System Access</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('driver1', 'driver123')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Delivery Staff</span>
                  </div>
                  <span className="text-[10px] text-emerald-700/80 mt-0.5">Field Route Staff</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
            Hatsun Agro Product Ltd. &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};
