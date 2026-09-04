import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { API_BASE_URL } from '../api/client';
import { checkHealthApi } from '../api/endpoints';
import { Truck, ShieldCheck, UserCheck, Lock, User, Server, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [serverStatus, setServerStatus] = useState('checking'); // 'online', 'offline', 'checking'
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check backend server connectivity on load
  const testServerConnection = async () => {
    setServerStatus('checking');
    try {
      await checkHealthApi();
      setServerStatus('online');
    } catch (err) {
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    testServerConnection();
  }, []);

  // Timer to show cold-start message if request takes > 2.5 seconds
  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const formatNetworkError = (err) => {
    const isHosted = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
    const rawEnvUrl = import.meta.env.VITE_API_BASE_URL;

    if (!err.response) {
      // No HTTP response received -> Network / DNS / CORS / Cold start issue
      if (isHosted && (!rawEnvUrl || rawEnvUrl.trim() === '')) {
        return {
          title: 'Backend API Not Configured',
          message: 'The frontend cannot reach your backend REST API because VITE_API_BASE_URL was not set during deployment.',
          solution: 'Go to your Vercel (or Netlify) Project Settings → Environment Variables → Add VITE_API_BASE_URL with your live Render backend URL (e.g., https://your-backend.onrender.com/api) → Then click Redeploy.'
        };
      }

      return {
        title: 'Network / Server Connection Error',
        message: `Unable to reach the backend API at: ${API_BASE_URL}`,
        solution: 'If your backend is hosted on Render Free Tier, it spins down after inactivity and requires 30–50 seconds to wake up. Please wait a moment and click Sign In again, or verify your backend is active in the Render Dashboard.'
      };
    }

    return {
      title: 'Authentication Error',
      message: err.response?.data?.message || err.message || 'Login failed. Check credentials.',
      solution: null
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please enter username, email, and password.');
      setErrorDetails(null);
      return;
    }

    try {
      setError('');
      setErrorDetails(null);
      setIsLoading(true);
      await login(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      const formatted = formatNetworkError(err);
      setError(formatted.message);
      setErrorDetails(formatted);
      setServerStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user, emailVal, pass) => {
    setUsername(user);
    setEmail(emailVal);
    setPassword(pass);
    try {
      setError('');
      setErrorDetails(null);
      setIsLoading(true);
      await login(user, emailVal, pass);
      navigate('/dashboard');
    } catch (err) {
      const formatted = formatNetworkError(err);
      setError(formatted.message);
      setErrorDetails(formatted);
      setServerStatus('offline');
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
            {/* Server Status Pill */}
            <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 font-medium">API Endpoint:</span>
                <span className="font-mono text-[11px] text-slate-700 truncate max-w-[140px]" title={API_BASE_URL}>
                  {API_BASE_URL}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  serverStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                  serverStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-400 animate-ping'
                }`} />
                <span className={`font-semibold capitalize text-[11px] ${
                  serverStatus === 'online' ? 'text-emerald-700' :
                  serverStatus === 'offline' ? 'text-rose-600' : 'text-amber-600'
                }`}>
                  {serverStatus}
                </span>
                <button
                  type="button"
                  onClick={testServerConnection}
                  className="ml-1 text-slate-400 hover:text-slate-700 transition-colors"
                  title="Check API Status"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="space-y-2">
                <Alert
                  type="danger"
                  title={errorDetails?.title || 'Login Failed'}
                  message={error}
                  onClose={() => { setError(''); setErrorDetails(null); }}
                />
                {errorDetails?.solution && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Recommended Resolution:</span>
                      <p className="text-amber-800 leading-relaxed">{errorDetails.solution}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cold Start Notice during long loading */}
            {isLoading && loadingTime >= 3 && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5 animate-spin" />
                <div>
                  <span className="font-bold">Connecting to backend server ({loadingTime}s)...</span>
                  <p className="text-sky-800 mt-0.5 text-[11px]">
                    If your backend is hosted on Render free-tier, it may take 30–50 seconds to wake up from idle sleep. Please keep this page open.
                  </p>
                </div>
              </div>
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
                label="Email"
                type="email"
                icon={User}
                placeholder="e.g. admin@hatsun.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? 'Signing In...' : 'Sign In to RDMS'}
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
                  onClick={() => handleQuickLogin('admin', 'admin@hatsun.com', 'Admin@123')}
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
                  onClick={() => handleQuickLogin('driver1', 'driver1@hatsun.com', 'Driver@123')}
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
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-between px-6">
            <span>Hatsun Agro Product Ltd. &copy; {new Date().getFullYear()}</span>
            <span className="text-[11px] text-slate-400">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

