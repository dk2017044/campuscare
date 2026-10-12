import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Home, 
  FileText, 
  LayoutGrid, 
  Search, 
  ClipboardList, 
  ChevronDown, 
  User, 
  GraduationCap, 
  Briefcase, 
  ShieldAlert,
  Check,
  BarChart3,
  Building2,
  Users
} from 'lucide-react';
import { Role, StaffUser } from '../types';
import { getPathForTab } from '../services/router';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: Role;
  setUserRole: (role: Role) => void;
  staffDept: string;
  setStaffDept: (dept: string) => void;
  activeStaffUser?: StaffUser | null;
  isAdminAuthenticated?: boolean;
  onOpenCommand?: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  activeStaffUser,
  isAdminAuthenticated
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically compute tabs based on current active user role
  const getNavTabs = () => {
    if (userRole === 'student') {
      return [
        { id: 'student_home', label: 'Home', icon: Home },
        { id: 'report_safely', label: 'Report', icon: FileText },
        { id: 'maintenance', label: 'Services', icon: LayoutGrid },
        { id: 'lost_found', label: 'Lost & Found', icon: Search },
        { id: 'track_report', label: 'Track Case', icon: ClipboardList }
      ];
    }
    if (userRole === 'staff') {
      if (!activeStaffUser) {
        return [
          { id: 'staff_dashboard', label: 'Officer Sign In', icon: ClipboardList }
        ];
      }
      return [
        { id: 'staff_dashboard', label: 'Incident Queue', icon: ClipboardList },
        { id: 'lost_found', label: 'Lost & Found', icon: Search }
      ];
    }
    // super_admin (LOCKED UNTIL ADMIN LOGS IN)
    if (!isAdminAuthenticated) {
      return [
        { id: 'admin_dashboard', label: 'Administrator Sign In', icon: ShieldAlert }
      ];
    }
    return [
      { id: 'admin_queue', label: 'Incident Queue', icon: ClipboardList },
      { id: 'admin_analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'admin_departments', label: 'Departments', icon: Building2 },
      { id: 'admin_staff', label: 'Faculty & Staff', icon: Users },
      { id: 'admin_audit', label: 'Audit Trail', icon: FileText }
    ];
  };

  const navTabs = getNavTabs();

  const handleRoleSelect = (role: Role) => {
    setUserRole(role);
    localStorage.setItem('campuscare_role', role);
    if (role === 'student') setCurrentTab('student_home');
    else if (role === 'staff') setCurrentTab('staff_dashboard');
    else setCurrentTab(isAdminAuthenticated ? 'admin_queue' : 'admin_dashboard');
    setRoleDropdownOpen(false);
  };

  const getRoleLabel = () => {
    if (userRole === 'student') return 'Student';
    if (userRole === 'staff') return 'Staff';
    return 'Admin';
  };

  const RoleIcon = userRole === 'student' ? GraduationCap : userRole === 'staff' ? Briefcase : ShieldAlert;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Slogan */}
        <a
          href={getPathForTab(userRole === 'student' ? 'student_home' : userRole === 'staff' ? 'staff_dashboard' : isAdminAuthenticated ? 'admin_queue' : 'admin_dashboard', userRole)}
          onClick={(e) => {
            e.preventDefault();
            if (userRole === 'student') setCurrentTab('student_home');
            else if (userRole === 'staff') setCurrentTab('staff_dashboard');
            else setCurrentTab(isAdminAuthenticated ? 'admin_queue' : 'admin_dashboard');
          }}
          className="flex items-center gap-3 cursor-pointer group shrink-0 no-underline text-inherit"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#0047BA] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <div className="text-xl font-bold tracking-tight leading-none">
              <span className="text-[#0F172A] font-heading font-extrabold">Campus</span>
              <span className="text-[#0066FF] font-heading font-extrabold">Care</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-1 leading-none tracking-tight">
              Safe Campus. Support Always.
            </span>
          </div>
        </a>

        {/* Center: Role-Aware Floating Pill Dock */}
        <nav className="hidden md:flex items-center gap-1 bg-white border border-slate-200/80 rounded-full px-2 py-1 shadow-sm">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id || 
              (userRole === 'super_admin' && !isAdminAuthenticated && tab.id === 'admin_dashboard') ||
              (userRole === 'staff' && !activeStaffUser && tab.id === 'staff_dashboard');
            return (
              <a
                key={tab.id}
                href={getPathForTab(tab.id, userRole)}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab(tab.id);
                }}
                className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer no-underline ${
                  isActive
                    ? 'bg-[#EBF3FF] text-[#0050C8] font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0050C8]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Role Switcher & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-slate-300 font-light text-lg">|</span>

          {/* Role Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(prev => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF3FF] hover:bg-[#DCEBFF] text-[#0050C8] text-xs font-semibold border border-blue-200/60 shadow-xs transition-all cursor-pointer"
            >
              <RoleIcon className="w-4 h-4" />
              <span>{getRoleLabel()}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {roleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 text-xs"
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Institutional Role
                  </div>
                  {[
                    { id: 'student', label: 'Student Portal', icon: GraduationCap },
                    { id: 'staff', label: 'Staff / Guard Portal', icon: Briefcase },
                    { id: 'super_admin', label: 'Executive Admin', icon: ShieldAlert }
                  ].map((roleItem) => {
                    const isSelected = userRole === roleItem.id;
                    const Icon = roleItem.icon;
                    return (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => handleRoleSelect(roleItem.id as Role)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#EBF3FF] text-[#0050C8] font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-500" />
                          <span>{roleItem.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0050C8]" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#EBF3FF] border border-blue-200/60 text-[#0050C8] flex items-center justify-center cursor-pointer hover:bg-[#DCEBFF] transition-colors shadow-xs">
            {userRole === 'staff' && activeStaffUser ? (
              <span className="font-bold text-xs">{activeStaffUser.name.charAt(0)}</span>
            ) : userRole === 'super_admin' && isAdminAuthenticated ? (
              <span className="font-bold text-xs">A</span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-100 bg-white">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id || 
            (userRole === 'super_admin' && !isAdminAuthenticated && tab.id === 'admin_dashboard') ||
            (userRole === 'staff' && !activeStaffUser && tab.id === 'staff_dashboard');
          return (
            <a
              key={tab.id}
              href={getPathForTab(tab.id, userRole)}
              onClick={(e) => {
                e.preventDefault();
                setCurrentTab(tab.id);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full text-xs shrink-0 transition-colors cursor-pointer no-underline ${
                isActive 
                  ? 'bg-[#EBF3FF] text-[#0050C8] font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </a>
          );
        })}
      </div>
    </header>
  );
};
