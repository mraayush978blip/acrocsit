// Coordinator View for managing and reporting branch attendance
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { User, FacultyAssignment, AttendanceRecord, Subject } from '../types';
import { Button, Modal, Input } from '../components/UI';
import {
   Save, History, Filter, CheckCircle2, ChevronDown, Check, X,
   CheckSquare, Square, AlertCircle, AlertTriangle, Trash, Loader2,
   Calendar, RefreshCw, Layers, Eye, BookOpen, User as UserIcon, Activity, Users, FileDown
} from 'lucide-react';
import { CoordinatorReport } from './CoordinatorReport';

// Modern Toggle Switch Component
export const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
   <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-14 h-7 rounded-full p-1 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative overflow-hidden ${checked ? 'bg-emerald-500' : 'bg-slate-200'
         } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md active:scale-95'}`}
   >
      <div
         className={`bg-white w-5 h-5 rounded-full shadow-lg transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ${checked ? 'translate-x-7 rotate-0' : 'translate-x-0 -rotate-180'
            }`}
      >
         {checked ? <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} /> : <X className="w-3 h-3 text-slate-400" strokeWidth={3} />}
      </div>
   </button>
);

const CoordinatorMarkingMonitor: React.FC<{ branchId: string; metaData: any }> = ({ branchId, metaData }) => {
   const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
   const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
   const [loading, setLoading] = useState(true);
   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

   useEffect(() => {
      const load = async () => {
         setLoading(true);
         try {
            const [allAssigns, allAtt] = await Promise.all([
               db.getAssignments(),
               db.getDateAttendance(date)
            ]);
            setAssignments(allAssigns.filter(a => a.branchId === branchId));
            setAttendance(allAtt.filter(a => a.branchId === branchId));
         } finally {
            setLoading(false);
         }
      };
      load();
   }, [branchId, date]);

   if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-indigo-500" /></div>;

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
            <div className="space-y-1">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Faculty Monitor</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time status for {date}</p>
            </div>
            <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
               <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="mb-0 border-none bg-slate-50 font-black text-indigo-900 rounded-xl"
               />
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.length > 0 ? assignments.map(a => {
               const marked = attendance.some(r => r.subjectId === a.subjectId && r.date === date);
               const sub = metaData.subjects[a.subjectId];
               return (
                  <div key={a.id} className={`group relative p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden ${marked
                     ? 'bg-white border-emerald-100 shadow-sm hover:shadow-md'
                     : 'bg-white border-rose-100 shadow-sm hover:shadow-md'
                     }`}>
                     <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-all duration-500 ${marked ? 'bg-emerald-100/50' : 'bg-rose-100/50'
                        }`} />
                     <div className="relative flex items-center justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                           <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              {sub?.code || 'N/A'}
                           </div>
                           <h4 className="font-black text-slate-800 uppercase tracking-tight truncate leading-tight">
                              {sub?.name || 'Unknown Subject'}
                           </h4>
                           <div className="flex items-center gap-2">
                              <UserIcon className="h-3 w-3 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500">{metaData.faculty[a.facultyId] || 'Unknown Faculty'}</span>
                           </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${marked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 rotate-0' : 'bg-rose-500 text-white shadow-lg shadow-rose-100 animate-pulse'
                              }`}>
                              {marked ? <CheckCircle2 className="h-7 w-7" strokeWidth={3} /> : <AlertCircle className="h-7 w-7" strokeWidth={3} />}
                           </div>
                           <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${marked ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {marked ? 'Complete' : 'Pending'}
                           </span>
                        </div>
                     </div>
                  </div>
               );
            }) : (
               <div className="col-span-2 flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <Eye className="h-10 w-10 text-slate-200 mb-4 animate-pulse" />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No assignments tracked for this branch</p>
               </div>
            )}
         </div>
      </div>
   );
};

export const CoordinatorView: React.FC<{ branchId: string; facultyUser: User; metaData: any }> = ({ branchId, facultyUser, metaData }) => {
   const [students, setStudents] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
   const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
   const [status, setStatus] = useState<Record<string, boolean>>({});
   const [isSaving, setIsSaving] = useState(false);
   const [saveMessage, setSaveMessage] = useState('');
   const [history, setHistory] = useState<AttendanceRecord[]>([]);
   const [activeTab, setActiveTab] = useState<'MARK' | 'HISTORY' | 'MONITOR' | 'REPORTS' | 'SEARCH'>('MARK');
   const [extraReason, setExtraReason] = useState('');
   const [confirmOpen, setConfirmOpen] = useState(false);
   const [networkError, setNetworkError] = useState('');
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState<User[]>([]);
   const [isSearching, setIsSearching] = useState(false);
   const [viewSearchStudent, setViewSearchStudent] = useState<User | null>(null);
   const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
   const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
   const [loadingStats, setLoadingStats] = useState(false);
   const [isNavVisible, setIsNavVisible] = useState(true);
   const [lastScrollY, setLastScrollY] = useState(0);

   useEffect(() => {
      const handleScroll = () => {
         const currentScrollY = window.scrollY;
         if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsNavVisible(false);
         } else {
            setIsNavVisible(true);
         }
         setLastScrollY(currentScrollY);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
   }, [lastScrollY]);

   useEffect(() => {
      const load = async () => {
         setLoading(true);
         try {
            const [stu, att] = await Promise.all([
               db.getStudents(branchId),
               db.getAttendance(branchId, 'ALL', 'sub_extra')
            ]);
            setStudents(stu.sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })));
            setHistory(att);
         } finally {
            setLoading(false);
         }
      };
      load();
   }, [branchId]);

   const toggleSession = (idx: number) => {
      setSelectedSessions(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
   };

   useEffect(() => {
      setSelectedSessions([]);
      setStatus({});
      setAttendanceDate(new Date().toISOString().split('T')[0]);
   }, [branchId]);

   const prevSelectionRef = React.useRef<{ date: string, branchId: string }>({ date: '', branchId: '' });

   useEffect(() => {
      if (selectedSessions.length === 1) {
         const slot = selectedSessions[0];
         const existing = history.filter(r => r.date === attendanceDate && r.lectureSlot === slot);
         if (existing.length > 0) {
            const newStatus: Record<string, boolean> = {};
            existing.forEach(r => { if (r.isPresent) newStatus[r.studentId] = true; });
            setStatus(newStatus);
         } else {
            if (prevSelectionRef.current.date !== attendanceDate || prevSelectionRef.current.branchId !== branchId) {
               setStatus({});
            }
         }
      } else if (selectedSessions.length === 0) {
         if (prevSelectionRef.current.date !== attendanceDate || prevSelectionRef.current.branchId !== branchId) {
            setStatus({});
         }
      }
      prevSelectionRef.current = { date: attendanceDate, branchId };
   }, [attendanceDate, selectedSessions, history, branchId]);

   const toggleStudent = (uid: string) => {
      setStatus(prev => ({ ...prev, [uid]: !prev[uid] }));
   };

   const handleSave = async () => {
      if (selectedSessions.length === 0) return;
      setNetworkError('');
      setIsSaving(true);
      try {
         const records: AttendanceRecord[] = [];
         const ts = Date.now();
         const toDelete = history
            .filter(r => r.date === attendanceDate && selectedSessions.includes(r.lectureSlot || 0))
            .map(r => r.id);

         if (toDelete.length > 0) {
            await db.deleteAttendanceRecords(toDelete);
         }

         selectedSessions.forEach(slot => {
            students.forEach(s => {
               if (status[s.uid] !== false) {
                  records.push({
                     id: `extra_${branchId}_${attendanceDate}_S${slot}_${s.uid}`,
                     date: attendanceDate, studentId: s.uid, subjectId: 'sub_extra',
                     branchId, batchId: s.studentData?.batchId || 'ALL',
                     isPresent: true, markedBy: facultyUser.uid, timestamp: ts, lectureSlot: slot,
                     reason: extraReason
                  });
               }
            });
         });

         if (records.length > 0) {
            await db.saveAttendance(records);
         }

         setSaveMessage("Saved!");
         setHistory(await db.getAttendance(branchId, 'ALL', 'sub_extra'));
         setTimeout(() => setSaveMessage(''), 3000);
         setConfirmOpen(false);
      } catch (e: any) {
         setNetworkError(e?.message || 'Network error while saving attendance.');
      } finally { setIsSaving(false); }
   };

   useEffect(() => {
      const timer = setTimeout(async () => {
         if (searchQuery.trim().length >= 3) {
            setIsSearching(true);
            try {
               const res = await db.searchStudents(searchQuery.trim());
               setSearchResults(res);
            } catch (err) {
               console.error(err);
            } finally {
               setIsSearching(false);
            }
         } else {
            setSearchResults([]);
         }
      }, 500);
      return () => clearTimeout(timer);
   }, [searchQuery]);

   const loadStudentStats = async (student: User) => {
      setViewSearchStudent(student);
      setLoadingStats(true);
      try {
         const [att, subs] = await Promise.all([
            db.getStudentAttendance(student.uid),
            db.getSubjects()
         ]);
         setStudentAttendance(att);
         setAllSubjects(subs);
      } catch (e) {
         console.error(e);
      } finally {
         setLoadingStats(false);
      }
   };

   if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-indigo-500" /></div>;

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
         <div className="relative overflow-hidden bg-indigo-900 rounded-[2rem] shadow-2xl shadow-indigo-200 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:bg-indigo-700/50 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />
            <div className="relative p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
               <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-2">
                     <Layers className="h-3 w-3 text-indigo-300" />
                     <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Coordinator Mode</span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Class Control</h2>
                  <p className="text-indigo-200 text-sm font-medium flex items-center gap-1.5 pt-1">
                     <BookOpen className="h-4 w-4 opacity-70" />
                     {metaData.branches[branchId] || branchId}
                  </p>
               </div>
               <div className="hidden lg:flex bg-black/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-inner max-w-max self-end">
                  {[
                     { id: 'MARK', label: 'Mark Extra', icon: Save },
                     { id: 'SEARCH', label: 'Search', icon: Filter },
                     { id: 'MONITOR', label: 'Monitor', icon: Eye },
                     { id: 'REPORTS', label: 'Reports', icon: FileDown },
                     { id: 'HISTORY', label: 'History', icon: History }
                  ].map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ease-out whitespace-nowrap ${activeTab === tab.id
                           ? 'bg-white text-indigo-900 shadow-[0_4px_20px_rgba(255,255,255,0.2)] scale-[1.02] -translate-y-[1px]'
                           : 'text-indigo-100 hover:text-white hover:bg-white/10'
                           }`}
                     >
                        <tab.icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.id ? 'text-indigo-600' : 'opacity-70 group-hover:opacity-100'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                     </button>
                  ))}
               </div>
            </div>
         </div>

         <div className={`lg:hidden fixed bottom-8 left-0 right-0 z-[100] px-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
            <div className="mx-auto max-w-sm bg-indigo-950/95 backdrop-blur-3xl px-2 py-2 rounded-[2.5rem] border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.4)] flex justify-between items-center">
               {[
                  { id: 'MARK', label: 'Mark', icon: Save },
                  { id: 'SEARCH', label: 'Search', icon: Filter },
                  { id: 'MONITOR', label: 'Monitor', icon: Eye },
                  { id: 'REPORTS', label: 'Reports', icon: FileDown },
                  { id: 'HISTORY', label: 'History', icon: History }
               ].map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => {
                        setActiveTab(tab.id as any);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                     }}
                     className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-[1.8rem] transition-all duration-500 ${activeTab === tab.id
                        ? 'bg-white text-indigo-900 shadow-lg scale-90'
                        : 'text-indigo-200 hover:text-white'
                        }`}
                  >
                     <tab.icon className={`h-4.5 w-4.5 transition-transform duration-500 ${activeTab === tab.id ? 'text-indigo-600' : 'opacity-60'}`} />
                     <span className={`text-[7px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'block' : 'hidden'}`}>{tab.label}</span>
                  </button>
               ))}
            </div>
         </div>

         {activeTab === 'SEARCH' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-indigo-50 rounded-xl"><Filter className="h-4 w-4 text-indigo-600" /></div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Student</label>
                  </div>
                  <div className="relative">
                     <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Enrollment, Mobile No, or Name..." className="w-full pl-4 pr-12 py-4 border-none bg-slate-50 font-bold text-indigo-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                     {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div>}
                  </div>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-3">
                     <div className="px-2 flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{searchQuery.trim() === '' ? 'Class Students' : 'Search Results'}</h4>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{searchQuery.trim() === '' ? students.length : searchResults.length}</span>
                     </div>
                     <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                        {(searchQuery.trim() === '' ? students : searchResults).map(s => (
                           <button key={s.uid} onClick={() => loadStudentStats(s)} className={`w-full text-left p-4 rounded-2xl border transition-all ${viewSearchStudent?.uid === s.uid ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-100 text-slate-700'}`}>
                              <div className="font-black uppercase tracking-tight text-sm mb-0.5">{s.displayName}</div>
                              <div className={`text-[10px] font-mono opacity-60 ${viewSearchStudent?.uid === s.uid ? 'text-white' : 'text-slate-900'}`}>Sr No: {s.studentData?.enrollmentId}</div>
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="lg:col-span-2">
                     {viewSearchStudent ? (
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                           <div className="flex justify-between items-start mb-8">
                              <div>
                                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-1">{viewSearchStudent.displayName}</h3>
                                 <div className="flex gap-3">
                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{viewSearchStudent.studentData?.enrollmentId}</span>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{viewSearchStudent.studentData?.mobileNo}</span>
                                 </div>
                              </div>
                              <Activity className="h-8 w-8 text-indigo-100" strokeWidth={3} />
                           </div>
                           {loadingStats ? (
                              <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing Data...</span></div>
                           ) : (
                              <div className="space-y-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allSubjects.filter(sub => sub.id !== 'sub_extra' && sub.code !== 'EXTRA').map(sub => {
                                       const relevant = studentAttendance.filter(a => a.subjectId === sub.id);
                                       const total = relevant.length;
                                       const present = relevant.filter(a => a.isPresent).length;
                                       const perc = total === 0 ? 0 : Math.round((present / total) * 100);
                                       if (total === 0) return null;
                                       return (
                                          <div key={sub.id} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 transition-all">
                                             <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.code}</span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${perc < 75 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{perc}%</span>
                                             </div>
                                             <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-2">{sub.name}</h4>
                                             <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-1000 ${perc < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${perc}%` }} />
                                             </div>
                                          </div>
                                       );
                                    }).filter(Boolean)}
                                 </div>
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100"><BookOpen className="h-10 w-10 text-slate-200 mb-4" /><p className="font-black text-slate-400 uppercase tracking-widest text-xs">Select a student to view details</p></div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'MARK' && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                     <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-indigo-50 rounded-xl"><Calendar className="h-4 w-4 text-indigo-600" /></div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Date</label></div>
                     <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="mb-0 border-none bg-slate-50 font-black text-indigo-900 rounded-2xl" />
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                     <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-indigo-50 rounded-xl"><RefreshCw className="h-4 w-4 text-indigo-600" /></div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Slots (Max 7)</label></div>
                     <div className="flex flex-wrap gap-2.5">{[1, 2, 3, 4, 5, 6, 7].map(num => (<button key={num} onClick={() => toggleSession(num)} className={`w-11 h-11 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center ${selectedSessions.includes(num) ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-300/70 scale-105 animate-pulse' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{num}</button>))}</div>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md overflow-hidden relative">
                  <div className="flex items-center gap-3 mb-4"><div className="p-2 bg-indigo-50 rounded-xl"><Filter className="h-4 w-4 text-indigo-600" /></div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for Extra Lecture</label></div>
                  <textarea value={extraReason} onChange={e => { const words = e.target.value.trim().split(/\s+/).filter(Boolean); if (words.length <= 50) setExtraReason(e.target.value); }} placeholder="Example: Extra session for difficult topics or missed classes..." className="w-full p-4 text-sm border-none bg-slate-50 text-slate-700 rounded-2xl min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-300" />
               </div>
               <div className="space-y-4">
                  {selectedSessions.length === 0 && (<div className="px-2 animate-in fade-in slide-in-from-top-2 duration-500"><div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-4 shadow-lg shadow-amber-100/50"><div className="flex items-center gap-3"><div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-200"><AlertTriangle className="h-5 w-5" /></div><div><h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">Register Locked</h4><p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Choose a lecture slot above to start marking the attendance.</p></div></div></div></div>)}
                  <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 transition-all duration-300 ${selectedSessions.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                     <div className="space-y-0.5"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">Attendance Register</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Students: {students.length}</p></div>
                     <div className="flex gap-2 w-full md:w-auto"><button onClick={() => { const newStatus: Record<string, boolean> = {}; students.forEach(s => newStatus[s.uid] = true); setStatus(newStatus); }} className="flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100 shadow-sm">All Present</button><button onClick={() => { const newStatus: Record<string, boolean> = {}; students.forEach(s => newStatus[s.uid] = false); setStatus(newStatus); }} className="flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 shadow-sm">All Absent</button></div>
                  </div>
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 pb-32 transition-all duration-300 ${selectedSessions.length === 0 ? 'opacity-40 grayscale-[0.5] pointer-events-none cursor-not-allowed select-none' : ''}`}>
                     {students.map((s) => (
                        <div key={s.uid} onClick={() => toggleStudent(s.uid)} className={`group relative p-4 rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer ${status[s.uid] === false ? 'bg-rose-50/50 border-rose-100 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md'}`}>
                           <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-all duration-500 ${status[s.uid] === false ? 'bg-rose-200/50 opacity-100' : 'bg-indigo-100/50 opacity-0 group-hover:opacity-100'}`} />
                           <div className="relative flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                 <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-2xl font-black transition-all ${status[s.uid] === false ? 'bg-rose-100 text-rose-600 rotate-[-4deg]' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}><span className="text-[9px] uppercase leading-none opacity-60">S.No</span><span className="text-sm leading-tight">{s.studentData?.rollNo || '#'}</span></div>
                                 <div className="min-w-0"><h4 className={`font-black uppercase tracking-tight truncate transition-colors ${status[s.uid] === false ? 'text-rose-900' : 'text-slate-800'}`}>{s.displayName}</h4><div className="flex items-center gap-2"><span className="text-[10px] font-mono text-slate-900 tracking-tighter">{s.studentData?.enrollmentId}</span><div className={`w-1.5 h-1.5 rounded-full ${status[s.uid] === false ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} /></div></div>
                              </div>
                              <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${status[s.uid] === false ? 'bg-slate-100 border-2 border-slate-200' : 'bg-emerald-500 border-2 border-emerald-500 shadow-lg shadow-emerald-100 rotate-0'}`}>{status[s.uid] !== false ? <CheckSquare className="h-5 w-5 text-white" strokeWidth={3} /> : <Square className="h-5 w-5 text-slate-300" strokeWidth={2} />}</div></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="mt-8 mb-24 md:mb-0 md:sticky md:bottom-6 z-40"><div className="bg-white/80 backdrop-blur-2xl p-4 md:p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-100/20 md:shadow-none flex flex-col md:flex-row items-center justify-between gap-4 border-t transition-all hover:bg-white"><div className="flex flex-col items-center md:items-start text-center md:text-left"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Summary</span><div className="text-sm font-black text-indigo-900 leading-none">{Object.values(status).filter(v => v).length} Present / {students.length} Total</div></div><div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">{saveMessage && <span className="text-xs font-black text-emerald-600 uppercase tracking-widest animate-in fade-in slide-in-from-right-2">{saveMessage}</span>}<Button onClick={() => { if (selectedSessions.length === 0) return; setConfirmOpen(true); }} disabled={isSaving || selectedSessions.length === 0} className="w-full md:w-[280px] h-14 bg-indigo-600 text-white !rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:grayscale disabled:opacity-50">{isSaving ? <div className="flex items-center gap-2 justify-center"><Loader2 className="h-4 w-4 animate-spin" /><span>Processing...</span></div> : <div className="flex items-center justify-center gap-2"><Save className="h-4 w-4" /><span>Save Attendance</span></div>}</Button></div></div></div>
            </div>
         )}

         {activeTab === 'HISTORY' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                  <div className="space-y-0.5"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Extra History</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Managing records</p></div>
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm"><div className="flex flex-col items-end"><span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Total Records</span><span className="text-sm font-black text-indigo-600">{history.length}</span></div><History className="h-5 w-5 text-indigo-500" /></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                  {Array.from(new Set(history.map(r => r.date))).sort().reverse().map(date => {
                     const dayRecs = history.filter(r => r.date === date);
                     const slots = Array.from(new Set(dayRecs.map(r => r.lectureSlot))).sort();
                     const firstRec = dayRecs[0];
                     return (
                         <div key={date} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                            <div className="p-4 md:p-6">
                               <div className="flex flex-col gap-4">
                                  <div className="flex items-start justify-between">
                                     <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center font-black group-hover:bg-indigo-50 transition-colors">
                                           <span className="text-[9px] text-slate-400 uppercase leading-none mb-1">Date</span>
                                           <span className="text-indigo-600 text-xs leading-tight text-center">{new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</span>
                                        </div>
                                        <div className="space-y-2">
                                           <div className="flex flex-wrap gap-1.5">
                                              {slots.map(s => (
                                                 <div key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-indigo-100">
                                                    <Layers className="h-2.5 w-2.5" />Slot {s}
                                                 </div>
                                              ))}
                                           </div>
                                           <div className="flex items-center gap-1.5">
                                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{dayRecs.length} Students</span>
                                           </div>
                                        </div>
                                     </div>
                                     <button 
                                        onClick={async () => { if (confirm(`Delete ALL ${dayRecs.length} entries for ${date}?`)) { await db.deleteAttendanceRecords(dayRecs.map(r => r.id)); setHistory(await db.getAttendance(branchId, 'ALL', 'sub_extra')); } }}
                                        className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all flex-shrink-0"
                                     >
                                        <Trash className="h-4 w-4" />
                                     </button>
                                  </div>
                                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                     <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason</span>
                                     <p className="text-[11px] text-slate-600 font-medium italic leading-relaxed line-clamp-2">"{firstRec?.reason || 'No specific reason'}"</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                     );
                  })}
               </div>
            </div>
         )}

         {activeTab === 'MONITOR' && <CoordinatorMarkingMonitor branchId={branchId} metaData={metaData} />}
         {activeTab === 'REPORTS' && <CoordinatorReport branchId={branchId} branchName={metaData.branches[branchId] || branchId} students={students} metaData={metaData} user={facultyUser} />}
         
         <Modal isOpen={confirmOpen} onClose={() => { if (!isSaving) setConfirmOpen(false); }} title="Confirm Save"><div className="space-y-4"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Date</span><span className="font-semibold text-slate-900">{attendanceDate}</span></div><div className="mt-2 flex justify-between gap-4"><span className="text-slate-500">Slots</span><span className="font-semibold text-slate-900">L{selectedSessions.join(', L')}</span></div></div>{networkError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{networkError}</div>}<div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Processing...' : 'Confirm & Save'}</Button></div></div></Modal>
      </div>
   );
};

