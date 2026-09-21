import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { User, Subject, AttendanceRecord, Mark } from '../types';
import { Card, Modal } from '../components/UI';
import { AlertCircle, CheckCircle2, Trophy, Calendar, Info, ChevronRight } from 'lucide-react';

interface StudentProps { user: User; }

export const StudentDashboard: React.FC<StudentProps> = ({ user }) => {
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
   const [marks, setMarks] = useState<Mark[]>([]);
   const [facultyMap, setFacultyMap] = useState<Record<string, string>>({});
   const [loading, setLoading] = useState(true);
   const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

   const selectedSubject = selectedSubjectId === 'overall' ? { id: 'overall', name: 'Overall Attendance Summary', code: 'ALL' } : 
                           selectedSubjectId === 'sub_extra' ? { id: 'sub_extra', name: 'Extra Lectures', code: 'EXTRA' } : 
                           subjects.find(s => s.id === selectedSubjectId);
   
   const selectedSubjectAttendance = selectedSubject && selectedSubjectId !== 'overall' ? attendance.filter(a => a.subjectId === selectedSubjectId) : [];

   useEffect(() => {
      const loadData = async () => {
         const { branchId, batchId } = user.studentData || {};
         if (!branchId || !batchId) { setLoading(false); return; }

         const [allAssignments, attData, marksData, facultyData, allSubs] = await Promise.all([
            db.getAssignments(),
            db.getStudentAttendance(user.uid),
            db.getStudentMarks(user.uid),
            db.getFaculty(),
            db.getSubjects()
         ]);

         // Primary: subjects from faculty assignments for this branch+batch
         const myClassAssignments = allAssignments.filter(a =>
            a.branchId === branchId &&
            (a.batchId === batchId || a.batchId === 'ALL')
         );
         const mySubjectIds = new Set(myClassAssignments.map(a => a.subjectId));

         // Fallback: if no assignments found (e.g. new academic year, faculty not yet assigned),
         // derive subjects from the student's own attendance history so the portal still works.
         if (mySubjectIds.size === 0) {
            attData
               .filter(r => r.subjectId !== 'sub_extra')
               .forEach(r => mySubjectIds.add(r.subjectId));
         }

         setSubjects(allSubs.filter(s => mySubjectIds.has(s.id)).sort((a, b) => a.name.localeCompare(b.name)));

         const facMap: Record<string, string> = {};
         facultyData.forEach(f => { facMap[f.uid] = f.displayName });
         setFacultyMap(facMap);

         setAttendance(attData);
         setMarks(marksData);
         setLoading(false);
      };
      loadData();
   }, [user.uid]);

   const extraLectures = attendance.filter(a => a.subjectId === 'sub_extra' && a.isPresent).length;

   const calc = (sid: string) => {
      const rel = attendance.filter(a => a.subjectId === sid);
      const tot = rel.length;
      const pres = rel.filter(a => a.isPresent).length;
      return { tot, pres, pct: tot === 0 ? 0 : Math.round((pres / tot) * 100) };
   };

   const getPrediction = (tot: number, pres: number, pct: number) => {
      if (tot === 0) return "No classes held yet.";
      if (pct >= 75) {
         let margin = 0;
         while (((pres) / (tot + margin + 1)) >= 0.75) margin++;
         return margin > 0 ? `Can miss ${margin} more class${margin === 1 ? '' : 'es'}` : `Exactly on track`;
      } else {
         let req = 0;
         while (((pres + req) / (tot + req)) < 0.75) req++;
         return `Need to attend ${req} more class${req === 1 ? '' : 'es'}`;
      }
   };

   let overallTot = 0;
   let overallPres = extraLectures;
   subjects.forEach(s => {
      const c = calc(s.id);
      overallTot += c.tot;
      overallPres += c.pres;
   });
   const overallPct = overallTot === 0 ? 100 : Math.min(100, Math.round((overallPres / overallTot) * 100));
   const overallIsLow = overallTot > 0 && overallPct < 75;

   if (loading) return <div>Loading...</div>;

   return (
      <div className="space-y-6 relative overflow-hidden p-1 -m-1">
         {/* Designer Grid Pattern Background */}
         <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6 }}></div>

         {/* Decorative Background Blobs for Glassmorphism */}
         <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-400 rounded-full filter blur-[80px] opacity-40 pointer-events-none animate-pulse duration-10000 z-0 transform-gpu"></div>
         <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full filter blur-[80px] opacity-40 pointer-events-none animate-pulse duration-10000 z-0 transform-gpu" style={{ animationDelay: '2s' }}></div>
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-400 rounded-full filter blur-[80px] opacity-30 pointer-events-none animate-pulse duration-10000 z-0 transform-gpu" style={{ animationDelay: '4s' }}></div>

         <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:justify-between md:items-center gap-4 relative z-10 overflow-hidden">
            {/* Glossy overlay for the header */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-indigo-900 opacity-80 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 z-0"></div>
            
            <div className="relative z-10">
               <h2 className="text-2xl font-bold tracking-tight">Hello, {user.displayName}</h2>
               <p className="mt-2 text-sm"><span className="bg-white/20 backdrop-blur-md text-white tracking-widest px-2 py-1 rounded font-mono font-bold shadow-inner border border-white/10">Enrollment: {user.studentData?.enrollmentId}</span></p>
            </div>
            {overallTot > 0 && (
               <div 
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-5 border border-white/20 shadow-xl cursor-pointer hover:bg-white/10 transition-all group relative z-10"
                  onClick={() => setSelectedSubjectId('overall')}
               >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronRight className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-center">
                     <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Overall</p>
                     <p className="text-sm font-bold text-white">{overallPres} / {overallTot} <span className="text-indigo-300 font-medium">classes</span></p>
                  </div>
                  <div className="h-10 w-px bg-indigo-700/50"></div>
                  <div className="text-center min-w-[60px]">
                     <span className={`text-3xl font-black tracking-tighter ${overallIsLow ? 'text-rose-400' : 'text-emerald-400'}`}>{overallPct}%</span>
                  </div>
               </div>
            )}
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {extraLectures > 0 && (
               <div 
                  className="bg-white/5 backdrop-blur-sm border border-white/60 shadow-[0_0_25px_rgba(0,0,0,0.25)] cursor-pointer hover:shadow-[0_0_35px_rgba(0,0,0,0.35)] hover:bg-white/10 transition-all hover:scale-[1.02] duration-300 ease-out group relative p-6 rounded-3xl transform-gpu will-change-transform" 
                  onClick={() => setSelectedSubjectId('sub_extra')}
               >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none"></div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronRight className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                     <div>
                        <h3 className="font-bold text-lg text-indigo-900 group-hover:text-indigo-600 transition-colors tracking-tight">Extra Lectures</h3>
                        <p className="text-[10px] text-indigo-500 font-medium uppercase tracking-widest mt-1">Co-ordinator marked</p>
                     </div>
                     <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <CheckCircle2 className="h-5 w-5" />
                     </div>
                  </div>
                  <div className="text-center border-t border-indigo-100/50 pt-3 relative z-10">
                     <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest">Total Present Count</p>
                     <p className="text-4xl font-black text-indigo-600 mt-1 tracking-tighter">{extraLectures}</p>
                  </div>
               </div>
            )}
            {subjects.length > 0 ? subjects.map(s => {
               const { tot, pres, pct } = calc(s.id);
               const isLow = pct < 75;
               const radius = 30;
               const circumference = 2 * Math.PI * radius;
               const strokeDashoffset = circumference - (pct / 100) * circumference;

               return (
                  <div 
                     key={s.id} 
                     className="bg-white/5 backdrop-blur-sm border border-white/60 shadow-[0_0_25px_rgba(0,0,0,0.25)] cursor-pointer hover:shadow-[0_0_35px_rgba(0,0,0,0.35)] hover:bg-white/10 transition-all hover:scale-[1.02] duration-300 ease-out group relative p-6 rounded-3xl overflow-hidden transform-gpu will-change-transform" 
                     onClick={() => setSelectedSubjectId(s.id)}
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                     <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                     </div>
                     <div className="flex justify-between items-start mb-4 pr-6 relative z-10">
                        <div>
                           <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-2 tracking-tight">{s.name}</h3>
                           <span className="text-[9px] bg-slate-900/5 px-2 py-1 rounded-md font-black tracking-widest text-slate-500 border border-slate-900/5">{s.code}</span>
                        </div>
                        <div className="relative flex items-center justify-center shrink-0 ml-2">
                           <div className="absolute inset-0 bg-white rounded-full shadow-inner blur-[2px] opacity-50"></div>
                           <svg className="transform -rotate-90 w-16 h-16 relative z-10 drop-shadow-sm">
                              <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200/50" />
                              <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={isLow ? "text-rose-500" : "text-emerald-500"} strokeLinecap="round" />
                           </svg>
                           <span className={`absolute text-xs font-black tracking-tighter z-10 ${isLow ? 'text-rose-600' : 'text-slate-700'}`}>{pct}%</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-200/50 pt-4 relative z-10">
                        <div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Classes</p>
                           <p className="font-bold text-slate-700 text-lg">{pres} <span className="text-slate-400 text-sm">/ {tot}</span></p>
                        </div>
                        <div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                           <div className="mt-1">
                              <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${isLow ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                 {isLow ? 'Low' : 'Good'}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="mt-4 pt-3 border-t border-slate-200/50 text-center relative z-10">
                        <p className={`text-[10px] uppercase tracking-widest font-black ${isLow ? 'text-rose-600' : 'text-indigo-600'}`}>{getPrediction(tot, pres, pct)}</p>
                     </div>
                  </div>
               )
            }) : <div className="col-span-3 text-center p-10 text-slate-500 border border-dashed rounded">No subjects assigned.</div>}
         </div>

         {/* Marks Section */}
         <div className="space-y-5 pt-8 relative z-10">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/60 shadow-xl shadow-indigo-900/5 inline-flex">
               <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200/50">
                  <Trophy className="h-5 w-5" />
               </div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight">MST Marks</h3>
            </div>

            {marks.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['MID_SEM_1', 'MID_SEM_2', 'MID_SEM_REMEDIAL'].map(type => {
                     const typeMarks = marks.filter(m => m.midSemType === type);
                     if (typeMarks.length === 0) return null;

                     return (
                        <div key={type} className="space-y-3">
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">{type === 'MID_SEM_REMEDIAL' ? 'Remedial MST' : type.replace('MID_SEM_', 'MST ')}</h4>
                           <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_0_25px_rgba(0,0,0,0.25)] overflow-hidden divide-y divide-slate-200/20 transform-gpu">
                              {typeMarks.map(m => {
                                 const sub = subjects.find(s => s.id === m.subjectId);
                                 const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
                                 return (
                                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                       <div className="min-w-0 mr-4">
                                          <div className="font-bold text-slate-800 text-sm truncate uppercase">{sub?.name || 'Subject'}</div>
                                          <div className="text-[10px] font-bold text-slate-400">{sub?.code || m.subjectId}</div>
                                       </div>
                                       <div className="text-right flex flex-col items-end">
                                          <div className="flex items-baseline gap-1">
                                             <span className={`text-lg font-black ${pct < 40 ? 'text-rose-500' : 'text-indigo-600'}`}>{m.marksObtained}</span>
                                             <span className="text-[10px] font-bold text-slate-300">/ {m.maxMarks}</span>
                                          </div>
                                          <div className={`text-[9px] font-black uppercase ${pct < 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                             {pct}%
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="font-bold uppercase tracking-widest text-xs">No marks uploaded yet.</p>
               </div>
            )}
         </div>

         <Modal
            isOpen={selectedSubjectId !== null}
            onClose={() => setSelectedSubjectId(null)}
            title={selectedSubject?.name || 'Details'}
         >
            {selectedSubject && (
               <div className="space-y-6">
                  {selectedSubject.id !== 'sub_extra' && (
                     <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                        <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                           <h4 className="text-sm font-bold text-indigo-900">Attendance Predictor</h4>
                           <p className="text-xs text-indigo-700 mt-1 font-medium">
                              {(() => {
                                 if (selectedSubject.id === 'overall') {
                                    return getPrediction(overallTot, overallPres, overallPct);
                                 }
                                 const { tot, pres, pct } = calc(selectedSubject.id);
                                 return getPrediction(tot, pres, pct);
                              })()}
                           </p>
                        </div>
                     </div>
                  )}

                  {selectedSubject.id !== 'overall' ? (
                     <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500" /> Attendance Log</h4>
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2.5">
                           {selectedSubjectAttendance.length === 0 ? (
                              <div className="text-center text-slate-500 text-sm py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl font-medium">No records found.</div>
                           ) : (
                              selectedSubjectAttendance.sort((a, b) => b.timestamp - a.timestamp).map((record, idx) => {
                                 const d = new Date(record.date);
                                 const isToday = record.date === new Date().toISOString().split('T')[0];
                                 return (
                                    <div key={record.id || idx} className={`p-3 rounded-xl border flex justify-between items-center transition-colors ${record.isPresent ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                                       <div>
                                          <div className="flex items-center gap-2">
                                             <div className={`text-sm font-bold ${record.isPresent ? 'text-emerald-900' : 'text-rose-900'}`}>{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                             {isToday && <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Today</span>}
                                          </div>
                                          <div className={`text-[10px] font-medium mt-0.5 ${record.isPresent ? 'text-emerald-700/70' : 'text-rose-700/70'}`}>
                                             Slot: {record.lectureSlot} • Marked by: {facultyMap[record.markedBy] || record.markedBy || 'Unknown'}
                                          </div>
                                       </div>
                                       <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${record.isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                          {record.isPresent ? 'Present' : 'Absent'}
                                       </div>
                                    </div>
                                 )
                              })
                           )}
                        </div>
                     </div>
                  ) : (
                     <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                        <p>This shows your overall consolidated attendance across all subjects, including extra lectures.</p>
                     </div>
                  )}
               </div>
            )}
         </Modal>
      </div>
   );
};
