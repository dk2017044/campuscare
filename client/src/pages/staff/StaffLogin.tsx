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
      setErrorMessage('Please enter your Staff ID and Password.');
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
    } catch (_err: any) {
      setErrorMessage('Invalid Staff ID or Password. Please try again.');
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
              Sign in to access your assigned incident queue.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-700 text-xs flex items-center gap-2.5 shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="font-medium leading-snug">{errorMessage}</p>
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
                placeholder="Staff ID or Official Email"
                required
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                className="w-full min-h-[44px] pl-3.5 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-[#0066FF] outline-none transition-all font-medium"
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
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="w-full min-h-[44px] pl-3.5 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-[#0066FF] outline-none transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[40px]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] mt-2 py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.99] text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

        {onNavigateToAdmin && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="text-xs font-semibold text-slate-500 hover:text-[#0066FF] transition-colors cursor-pointer"
            >
              Administrator Portal →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
