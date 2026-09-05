import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import type { UserRole } from '../types';

interface DemoAccount {
  role: UserRole;
  title: string;
  email: string;
  password: string;
  description: string;
  color: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Admin',
    title: 'Admin',
    email: 'admin@peoplepay360.com',
    password: 'admin123',
    description: 'Full system access & User Management',
    color: 'border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 text-purple-900',
  },
  {
    role: 'HR Payroll Manager',
    title: 'Payroll Manager',
    email: 'payroll.manager@peoplepay360.com',
    password: 'payrollmgr123',
    description: 'Full HR + Salary config & Validate/Pay',
    color: 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900',
  },
  {
    role: 'HR Payroll User',
    title: 'Payroll User',
    email: 'payroll.user@peoplepay360.com',
    password: 'payrolluser123',
    description: 'Operational payroll & Read-only rules',
    color: 'border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900',
  },
  {
    role: 'HR Manager',
    title: 'HR Manager',
    email: 'hr.manager@peoplepay360.com',
    password: 'hrmanager123',
    description: 'Employees, Contracts, Leaves, Attendance',
    color: 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900',
  },
  {
    role: 'Employee',
    title: 'Employee',
    email: 'employee@peoplepay360.com',
    password: 'employee123',
    description: 'Self-service: Profile, Attendance, Payslip',
    color: 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-800',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.login(email.trim(), password);
      login(response.access_token, response.user, response.permissions);
      navigate(from, { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#3a2034] to-[#221020] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left / Main Card: Login Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
          {/* Top accent bar in Odoo Purple */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-odoo-purple via-purple-600 to-emerald-500" />

          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-odoo-purple flex items-center justify-center text-white shadow-md">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                People<span className="text-emerald-600">Pay</span>360
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Integrated HR & Payroll Operations
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Sign in to your account</h2>
            <p className="text-sm text-slate-500">Access your HR records, attendance, and payroll workspace.</p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-odoo-purple hover:bg-[#5e3d55] text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security footnote */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              256-bit JWT RBAC Enforced
            </span>
            <span>PeoplePay360 Enterprise</span>
          </div>
        </div>

        {/* Right Side: Demo Role Quick Switcher */}
        <div className="lg:col-span-5 text-white space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
              Demo Accounts & Role Switcher
            </span>
          </div>
          <p className="text-xs text-purple-200/80 mb-3">
            Click any role below to prefill credentials and verify permissions instantly:
          </p>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between group ${acc.color}`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{acc.title}</span>
                  </div>
                  <div className="text-[11px] opacity-80 font-normal truncate mt-0.5">
                    {acc.email}
                  </div>
                  <div className="text-[10px] opacity-70 italic mt-0.5">
                    {acc.description}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-white/60 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0 ml-2">
                  Auto Fill
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
