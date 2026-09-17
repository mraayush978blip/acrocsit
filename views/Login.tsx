import React, { useState } from 'react';
import { db } from '../services/db';
import { User, SystemSettings } from '../types';
import { Button, Card, Input, AcropolisLogo, Select, AboutDeveloperModal } from '../components/UI';
import { Lock, Mail, Eye, EyeOff, Users, ArrowLeft, GraduationCap, BookOpen, Layers } from 'lucide-react';
import { getYearMode, setYearMode, YearMode, isYearConfigured, getYearUnavailableMessage } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({ studentLoginEnabled: true });
  const [selectedRole, setSelectedRole] = useState<'FACULTY' | 'COORDINATOR' | 'STUDENT'>('FACULTY');
  
  // New State for Two-Step Flow
  const [step, setStep] = useState<'year' | 'form'>('year');
  const [yearMode, setYearModeState] = useState<YearMode>(getYearMode());

  React.useEffect(() => {
    db.getSystemSettings().then(setSettings).catch(console.error);
    if (sessionStorage.getItem('acro_login_step') === 'form') {
      sessionStorage.removeItem('acro_login_step');
    }
  }, []);

  const handleYearSelect = (mode: YearMode) => {
    if (!isYearConfigured(mode)) {
      setError(getYearUnavailableMessage(mode));
      return;
    }
    setError('');
    if (mode === getYearMode()) {
       setStep('form');
    } else {
       sessionStorage.setItem('acro_login_step', 'form');
       setYearMode(mode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isYearConfigured(yearMode)) {
      setError(getYearUnavailableMessage(yearMode));
      return;
    }
    setLoading(true);
    try {
      if (selectedRole === 'STUDENT' && !settings.studentLoginEnabled) {
        throw new Error("Student login is currently disabled by administrator.");
      }

      let loginUser = email.trim().toLowerCase();
      if (selectedRole === 'STUDENT' && !loginUser.includes('@')) {
        loginUser = `${loginUser}@acropolis.in`;
      }

      const user = await db.login(loginUser, password);

      if (user.role === 'ADMIN' || user.role === 'DEVELOPER') {
        sessionStorage.removeItem('login_intent');
        onLogin(user);
        return;
      }

      if (selectedRole === 'STUDENT') {
        if (user.role !== 'STUDENT') {
          throw new Error("This account is not a Student account.");
        }
        if (user.studentData?.branchId) {
          const branches = await db.getBranches();
          const branch = branches.find(b => b.id === user.studentData!.branchId);
          if (branch && branch.hide_from_teacher_student) {
            throw new Error("Your class is currently hidden by the administrator.");
          }
        }
      }
      
      if (selectedRole === 'FACULTY' && user.role !== 'FACULTY') {
        throw new Error("This account is not a Faculty account.");
      }

      if (selectedRole === 'COORDINATOR') {
        if (user.role !== 'FACULTY') {
          throw new Error("This account is not a Faculty/Coordinator account.");
        }
        sessionStorage.setItem('login_intent', 'COORDINATOR');
      } else {
        sessionStorage.removeItem('login_intent');
      }

      onLogin(user);
    } catch (err: any) {
      console.error(err);
      const isNetworkError =
        err?.message === 'Failed to fetch' ||
        err?.message?.includes('NetworkError') ||
        err?.name === 'TypeError';
      setError(
        isNetworkError
          ? "Connection error — the server took too long to respond. Please try again in a moment."
          : (err.message || "Login failed. Please check your credentials.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Card animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    })
  };

  const years: { id: YearMode; label: string; icon: React.ReactNode }[] = [
    { id: '2nd', label: '2nd Year', icon: <BookOpen className="w-8 h-8 mb-2 opacity-80" /> },
    { id: '3rd', label: '3rd Year', icon: <Layers className="w-8 h-8 mb-2 opacity-80" /> },
    { id: '4th', label: '4th Year', icon: <GraduationCap className="w-8 h-8 mb-2 opacity-80" /> }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 to-indigo-100 p-4 overflow-hidden">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-indigo-600 relative overflow-hidden bg-white/90 backdrop-blur-xl">
        <AnimatePresence mode="wait" custom={step === 'form' ? 1 : -1}>
          
          {step === 'year' && (
            <motion.div
              key="year-step"
              custom={-1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="py-4"
            >
              <div className="absolute top-4 left-4">
                <button 
                  onClick={() => navigate('/')}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all shadow-sm"
                  title="Back to Landing Page"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-24 w-24 mb-6 bg-white rounded-full p-2 shadow-sm border border-slate-100">
                  <AcropolisLogo className="h-full w-full" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Acropolis AMS</h1>
                <p className="text-slate-500 font-medium bg-slate-100 py-1.5 px-4 rounded-full inline-block text-sm">
                  Select your academic year
                </p>
              </div>

              {error && (
                <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-4 mb-6 text-sm rounded-r-lg font-medium animate-in fade-in" role="alert">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-2">
                {years.map((y) => {
                  const configured = isYearConfigured(y.id);
                  return (
                    <button
                      key={y.id}
                      onClick={() => handleYearSelect(y.id)}
                      className="group relative flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-indigo-600 border border-slate-200/60 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-600/0 group-hover:from-white/10 group-hover:to-transparent transition-colors duration-300" />
                      <div className="text-indigo-600 group-hover:text-white transition-colors duration-300 relative z-10">
                        {y.icon}
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-white transition-colors duration-300 relative z-10">
                        {y.label}
                      </span>
                      {!configured && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full mt-1.5 relative z-10 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div
              key="form-step"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 400, damping: 25 }, opacity: { duration: 0.15 } }}
              className="py-2 relative"
            >
              <div className="flex items-center mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <button 
                  onClick={() => setStep('year')}
                  className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                  title="Change Year"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center pr-10">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Sign in to</p>
                  <h2 className="text-lg font-black text-indigo-700">{yearMode} Year Portal</h2>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded-r-lg" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Users className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
                  <Select
                    value={selectedRole}
                    onChange={(e: any) => setSelectedRole(e.target.value)}
                    className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl font-medium text-slate-700"
                    required
                  >
                    <option value="FACULTY">Faculty Account</option>
                    <option value="COORDINATOR">Class Coordinator</option>
                    {settings.studentLoginEnabled && <option value="STUDENT">Student Account</option>}
                  </Select>
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                  <Input
                    type="text"
                    placeholder={selectedRole === 'STUDENT' ? 'Enrollment Number' : 'Email Address'}
                    className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={selectedRole === 'STUDENT' ? 'Mobile No.' : 'Password'}
                    className={`pl-12 pr-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all ${loading ? 'opacity-50 skeleton-bg' : ''}`}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 focus:outline-none rounded-lg hover:bg-slate-100 transition-colors"
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <Button type="submit" className="w-full h-12 mt-6 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all text-base overflow-hidden relative" disabled={loading}>
                  {loading ? (
                    <div className="absolute inset-0 bg-indigo-500 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 w-[200%] translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                      <span className="relative z-10 text-indigo-100">Authenticating...</span>
                    </div>
                  ) : 'Sign In Securely'}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <button
            onClick={() => setIsDevModalOpen(true)}
            className="group flex items-center gap-2 px-5 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600">
              About the Developer
            </span>
          </button>
        </div>
      </Card>
      
      <footer className="fixed bottom-6 w-full text-center pointer-events-none">
        <p className="text-[10px] font-black text-slate-400/60 uppercase tracking-[0.2em] flex items-center justify-center gap-2 pointer-events-auto">
          <span>Developed by</span>
          <a
            href="https://www.linkedin.com/in/aayush-sharma-2013d"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600/80 hover:text-indigo-800 underline underline-offset-4 decoration-2 decoration-indigo-200/50 hover:decoration-indigo-600 transition-all font-black"
          >
            Aayush Sharma
          </a>
        </p>
      </footer>
      <AboutDeveloperModal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} />
    </div>
  );
};
