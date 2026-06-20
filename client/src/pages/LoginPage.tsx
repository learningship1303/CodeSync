import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Terminal, Mail, Lock, LogIn } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';


export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Credentials fields are mandatory.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Verifying access keys...');

    try {
      const authenticated = await login(email.trim(), password);
      if (!authenticated) {
        throw new Error('Login did not return an authenticated session.');
      }

      toast.success('Session authenticated successfully!', { id: toastId });
      navigate('/dashboard');

    } catch (error: any) {
      const msg = error.response?.data?.message || 'Access Denied: Invalid configuration signature.';
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all">

        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 mb-3">
            <Terminal className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome Back Node</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Re-establish live stream synchronization parameters
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password Key</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
          >
            {isSubmitting ? 'Connecting...' : 'Establish Session Link'}
            <LogIn className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center mt-4 text-xs">
          <button
            type="button"
            className="text-indigo-500 font-bold hover:underline"
            onClick={async () => {
              const cleanEmail = email.trim();
              if (!cleanEmail) {
                toast.error('Enter your email to receive a reset OTP.');
                return;
              }
              try {
                const resp = await API.post('/auth/forgot-password', { email: cleanEmail });
                toast.success(resp.data?.message || 'Reset OTP request submitted.');
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to request reset OTP.');
              }
            }}
          >
            Forgot password?
          </button>
        </div>

        <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <span className="text-slate-400 font-semibold">New member clusters? </span>
          <Link to="/register" className="text-indigo-500 font-bold hover:underline">Instantiate Profile &rarr;</Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
