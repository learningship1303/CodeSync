import React from 'react';
import { Terminal, Code2, Users2, Shield, Activity, Sparkles } from 'lucide-react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ThemeToggle } from '../components/ThemeToggle';

interface LandingLayoutProps {
  view: 'login' | 'register';
}

export const LandingLayout: React.FC<LandingLayoutProps> = ({ view }) => {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative overflow-hidden transition-colors duration-500">
      
      {/* 🌌 High-ROI SaaS Geometric Blueprint Background Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]"></div>
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[160px]"></div>
      <div className="absolute bottom-[-15%] right-[-5%] h-[600px] w-[600px] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[160px]"></div>

      {/* 🧭 Top Tier Header Global Navbar Menu */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-900 relative z-30">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="p-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Terminal className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-slate-950 to-slate-800 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            codesync<span className="text-indigo-500 font-extrabold">/&gt;</span>
          </span>
        </div>
        
        {/* Controlled Utilities Ring */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-slate-900 border border-slate-300/40 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold shadow-inner hidden sm:inline-block">
            Cluster Core V1.0.4: Online
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* 📊 Split Panel Layout Framework Main Body Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 py-12 relative z-20">
        
        {/* Left Column Bracket: Informative SaaS Feature Set Sheets */}
        <div className="lg:col-span-7 space-y-8 text-left max-w-2xl lg:max-w-none pr-0 lg:pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="h-3.5 w-3.5 animate-spin duration-1000" /> Real-Time Collaboration Engine
          </div>

          {/* 🚀 UPGRADED: Expanded screen visibility matrix with text-5xl to text-6xl scaling */}
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white">
            Real-Time Collaborative Coding, <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">Redefined.</span>
          </h2>

          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Sync, edit, and deploy code together from any location with integrated infrastructure controls, custom environment states, and lightning-fast websocket clusters.
          </p>

          {/* Grid Cards Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex gap-3 shadow-sm">
              <div className="p-2.5 h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex justify-center items-center shadow-inner">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Monaco Architecture</h4>
                <p className="text-xs text-slate-400 mt-0.5">VS-Code engine directly embedded in browser panels.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex gap-3 shadow-sm">
              <div className="p-2.5 h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex justify-center items-center shadow-inner">
                <Users2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Instant Streaming Sync</h4>
                <p className="text-xs text-slate-400 mt-0.5">State synchronization pools driven by native socket networks.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex gap-3 shadow-sm">
              <div className="p-2.5 h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex justify-center items-center shadow-inner">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Secure Cluster Locks</h4>
                <p className="text-xs text-slate-400 mt-0.5">Cryptographic passwords constraint configuration rooms.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex gap-3 shadow-sm">
              <div className="p-2.5 h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex justify-center items-center shadow-inner">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Persistent Handshakes</h4>
                <p className="text-xs text-slate-400 mt-0.5">Automated reconnection loops logic recovery systems.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Bracket: Cards Container */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end relative w-full">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-3xl blur-2xl transform scale-95 opacity-60"></div>
          <div className="w-full max-w-md relative z-10">
            {view === 'login' ? <LoginPage /> : <RegisterPage />}
          </div>
        </div>

      </main>
    </div>
  );
};

// 🚀 Core Fix: Named and default map binding alignment passed successfully
export default LandingLayout;