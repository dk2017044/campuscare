import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, KeyRound, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles, UserCheck, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { StaffUser } from '../../types';

interface Props {
  onLoginSuccess: (user: StaffUser) => void;
  onNavigateToAdmin?: () => void;
}

export const StaffLogin: React.FC<Props> = ({ onLoginSuccess, onNavigateToAdmin }) => {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !password.trim()) {
      setErrorMessage('Please enter both your Staff ID / Email and Password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.loginStaff({
        staffId: staffId.trim(),
        password: password.trim()
      });

      if (res.success && res.user) {
        localStorage.setItem('campuscare_staff_session', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid Staff ID or Password. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xl shadow-slate-900/5 relative overflow-hidden"
      >
        {/* Top luminous accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0066FF] via-[#0E9384] to-[#0066FF]" />

        {/* Header Icon & Title */}
        <div className="text-center space-y-3 mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#0066FF] shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Authorized Personnel Only</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Staff & Officer Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with your University Staff ID and Password created by Administrator.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold leading-snug">{errorMessage}</p>
              {onNavigateToAdmin && (
                <button
                  type="button"
                  onClick={onNavigateToAdmin}
                  className="text-[#0066FF] font-bold underline hover:text-blue-800 block cursor-pointer"
                >
                  Go to Admin Portal to create staff accounts →
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Staff ID / Official Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. STAFF001 or officer@campus.edu"
                required
                className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-[#0066FF] outline-none transition-all font-medium"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your staff password"
                required
                className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-[#0066FF] outline-none transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.99] text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating Officer...</span>
            ) : (
              <>
                <span>Sign In to Staff Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice & Admin Prompt */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Staff accounts are provisioned exclusively by the <strong>University Administrator</strong>. If you do not have credentials, please contact your Campus Administrator.
          </p>

          {onNavigateToAdmin && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
              <span className="font-medium text-slate-700">Are you the Administrator?</span>
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="font-bold text-[#0066FF] hover:underline cursor-pointer"
              >
                Open Admin Portal →
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
