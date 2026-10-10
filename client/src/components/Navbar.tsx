import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Wrench, 
  Search, 
  ClipboardList, 
  LayoutDashboard
} from 'lucide-react';
import { Role, Department } from '../types';
import { api } from '../services/api';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: Role;
  setUserRole: (role: Role) => void;
  staffDept: string;
  setStaffDept: (dept: string) => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  staffDept,
  setStaffDept
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    api.getDepartments()
      .then(res => setDepartments(res.departments || []))
      .catch(() => setDepartments([]));
  }, []);

  const studentNavTabs = [
    { id: 'student_home', label: 'Overview', icon: LayoutDashboard },
    { id: 'report_safely', label: 'Report Safely', icon: Lock },
    { id: 'maintenance', label: 'Repairs', icon: Wrench },
    { id: 'lost_found', label: 'Lost & Found', icon: Search },
    { id: 'track_report', label: 'Track Case', icon: ClipboardList }
  ];

  const staffNavTabs = [
    { id: 'staff_dashboard', label: 'Incident Queue', icon: LayoutDashboard },
    { id: 'lost_found', label: 'Lost & Found', icon: Search }
  ];

  const adminNavTabs = [
    { id: 'admin_dashboard', label: 'Admin Command', icon: LayoutDashboard }
  ];

  const currentNavTabs = userRole === 'student' 
    ? studentNavTabs 
    : userRole === 'staff' 
    ? staffNavTabs 
    : adminNavTabs;

  const handleRoleChange = (role: Role) => {
    setUserRole(role);
    localStorage.setItem('campuscare_role', role);
    if (role === 'student') setCurrentTab('student_home');
    else if (role === 'staff') setCurrentTab('staff_dashboard');
    else setCurrentTab('admin_dashboard');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#080c16]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Minimal Brand Emblem */}
        <div
          onClick={() => setCurrentTab(userRole === 'student' ? 'student_home' : userRole === 'staff' ? 'staff_dashboard' : 'admin_dashboard')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-400 flex items-center justify-center group-hover:border-sky-400/50 transition-all">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-white">CampusCare</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Minimal Floating Glass Navigation Capsule */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full glass-pill border border-white/10">
          {currentNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                  isActive 
                    ? 'text-white font-medium' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavPill"
                    className="absolute inset-0 bg-white/10 rounded-full border border-white/15 -z-10 shadow-xs"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Minimal Actions & Role Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Subtle SOS Beacon (Student Only) */}
          {userRole === 'student' && (
            <button
              type="button"
              onClick={() => setCurrentTab('emergency')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>SOS</span>
            </button>
          )}

          {/* Department Filter (Staff Only) */}
          {userRole === 'staff' && departments.length > 0 && (
            <select
              aria-label="Filter Department"
              value={staffDept}
              onChange={(e) => setStaffDept(e.target.value)}
              className="glass-pill border border-white/10 text-slate-300 text-xs px-2.5 py-1 rounded-full focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          {/* Minimal Segmented Role Capsule */}
          <div className="p-0.5 rounded-full glass-pill border border-white/10 flex items-center text-xs">
            {(['student', 'staff', 'super_admin'] as Role[]).map((r) => {
              const active = userRole === r;
              const label = r === 'student' ? 'Student' : r === 'staff' ? 'Staff' : 'Admin';
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`relative px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                    active ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="activeRoleCapsule"
                      className="absolute inset-0 bg-sky-500/20 rounded-full border border-sky-400/30 -z-10"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-1.5 border-t border-white/5 bg-[#080c16]/95">
        {currentNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs shrink-0 transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-white/10 text-white font-medium border border-white/15' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
