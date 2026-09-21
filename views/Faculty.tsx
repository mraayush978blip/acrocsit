import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { db } from '../services/db';
import { User, FacultyAssignment, AttendanceRecord, Batch, Subject, Mark, MidSemType } from '../types';
import { Button, Card, Modal, Input, Select, ExportProgressModal } from '../components/UI';
import {
   Save, History, FileDown, Filter, ArrowLeft, CheckCircle2, ChevronDown, Check, X,
   CheckSquare, Square, XCircle, AlertCircle, AlertTriangle, Trash, Loader2,
   Calendar, RefreshCw, Layers, Eye, BookOpen, User as UserIcon, Activity, Users, Trophy, Upload, Share2
} from 'lucide-react';
import { useNavigate, useLocation, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Skeleton, SkeletonRow, SkeletonCard } from '../components/Skeleton';

interface FacultyProps { user: User; forceCoordinatorView?: boolean; }

// Modern Toggle Switch Component
const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
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

const CoordinatorMarkingMonitor: React.FC<{ branchId: string; metaData: { subjects: Record<string, any>, faculty: Record<string, any>, batches: Record<string, any> } }> = ({ branchId, metaData }) => {
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
                     {/* Decorative background for status */}
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


interface CoordinatorReportProps {
   branchId: string;
   branchName: string;
   students: User[];
   metaData: any;
   user: User;
}

const CoordinatorReport: React.FC<CoordinatorReportProps> = ({ branchId, branchName, students, metaData, user }) => {
   const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
   const [loading, setLoading] = useState(false);
   const [progress, setProgress] = useState(0);
   const [status, setStatus] = useState('');
   const [exportRange, setExportRange] = useState<'TILL_TODAY' | 'CUSTOM'>('TILL_TODAY');
   const [exportSubjectType, setExportSubjectType] = useState<'ALL' | 'THEORY' | 'LAB'>('ALL');
   const [exportStartDate, setExportStartDate] = useState('');
   const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);
   const [showFullPreview, setShowFullPreview] = useState(false);
   const [filterMode, setFilterMode] = useState<'FULL' | 'FILTERED'>('FULL');
   const [filterCondition, setFilterCondition] = useState<'LE' | 'GE' | 'LT' | 'GT'>('LE');
   const [filterValue, setFilterValue] = useState(75);
   const [midSemType, setMidSemType] = useState<MidSemType>('MID_SEM_1');

   useEffect(() => {
      const load = async () => {
         setLoading(true);
         setProgress(10);
         setStatus('Fetching attendance records...');
         try {
            setAttendance(await db.getBranchAttendance(branchId));
            setProgress(100);
            setStatus('Ready');
         } finally { 
            setTimeout(() => {
               setLoading(false);
               setProgress(0);
            }, 500);
         }
      };
      load();
   }, [branchId]);

   const previewRecords = useMemo(() => {
      const start = exportRange === 'CUSTOM' ? exportStartDate : '';
      const end = exportRange === 'CUSTOM' ? exportEndDate : '';
      return attendance.filter(r => {
         const inStart = !start || r.date >= start;
         const inEnd = !end || r.date <= end;
         return inStart && inEnd;
      });
   }, [attendance, exportRange, exportStartDate, exportEndDate]);

   const previewStats = useMemo(() => {
      const regularRecs = previewRecords.filter(r => {
         if (r.subjectId === 'sub_extra') return false;
         const subj = metaData.subjects[r.subjectId];
         if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
         if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
         return true;
      });
      const regularSessions = new Set(regularRecs.map(r => `${r.date}_${r.lectureSlot}_${r.subjectId}`)).size;
      const totalRecords = previewRecords.length;
      return { sessions: regularSessions, totalRecords };
   }, [previewRecords, exportSubjectType, metaData.subjects]);

   const filteredStudents = useMemo(() => {
      if (filterMode === 'FULL') return students;
      return students.filter(s => {
         const relevantRegular = previewRecords.filter(r => {
            if (r.studentId !== s.uid || r.subjectId === 'sub_extra') return false;
            const subj = metaData.subjects[r.subjectId];
            if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
            if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
            return true;
         });
         const present = relevantRegular.filter(r => r.isPresent).length;
         const pct = previewStats.sessions === 0 ? 0 : (present / previewStats.sessions) * 100;
         if (filterCondition === 'LT') return pct < filterValue;
         if (filterCondition === 'GT') return pct > filterValue;
         if (filterCondition === 'LE') return pct <= filterValue;
         if (filterCondition === 'GE') return pct >= filterValue;
         return true;
      });
   }, [students, previewRecords, previewStats.sessions, filterMode, filterCondition, filterValue, exportSubjectType, metaData.subjects]);

   const averageAttendance = useMemo(() => {
      if (filteredStudents.length === 0) return '0%';
      const totalPct = filteredStudents.reduce((acc, s) => {
         const relevantRegular = previewRecords.filter(r => {
            if (r.studentId !== s.uid || r.subjectId === 'sub_extra') return false;
            const subj = metaData.subjects[r.subjectId];
            if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
            if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
            return true;
         });
         const present = relevantRegular.filter(r => r.isPresent).length;
         return acc + (previewStats.sessions === 0 ? 0 : (present / previewStats.sessions) * 100);
      }, 0);
      return Math.round(totalPct / filteredStudents.length) + '%';
   }, [filteredStudents, previewRecords, previewStats.sessions, exportSubjectType, metaData.subjects]);

   const lowAttendanceCount = useMemo(() => {
      return filteredStudents.filter(s => {
         const relevantRegular = previewRecords.filter(r => {
            if (r.studentId !== s.uid || r.subjectId === 'sub_extra') return false;
            const subj = metaData.subjects[r.subjectId];
            if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
            if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
            return true;
         });
         const present = relevantRegular.filter(r => r.isPresent).length;
         const pct = previewStats.sessions === 0 ? 0 : (present / previewStats.sessions) * 100;
         return pct < 75;
      }).length;
   }, [filteredStudents, previewRecords, previewStats.sessions, exportSubjectType, metaData.subjects]);

   const executeExport = async () => {
      setLoading(true);
      setProgress(0);
      setStatus('Initializing report engine...');

      try {
         await new Promise(r => setTimeout(r, 600)); // Increased initial delay
         setProgress(10);
         setStatus('Filtering records...');
         await new Promise(r => setTimeout(r, 400));

         // 1. Identify relevant subjects (those with at least one record in this branch/period)
         const regularRecs = previewRecords.filter(r => {
            if (r.subjectId === 'sub_extra') return false;
            const subj = metaData.subjects[r.subjectId];
            if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
            if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
            return true;
         });

         setProgress(30);
         setStatus('Calculating subject metrics...');
         await new Promise(r => setTimeout(r, 50));

         const uniqueSubjectIds = Array.from(new Set(regularRecs.map(r => r.subjectId))).sort((a, b) => {
            const sA = metaData.subjects[a];
            const sB = metaData.subjects[b];
            const nameA = (sA?.code || sA?.name || '') + (sA?.type || 'theory');
            const nameB = (sB?.code || sB?.name || '') + (sB?.type || 'theory');
            return nameA.localeCompare(nameB);
         });

         const subjectHeaders = uniqueSubjectIds.map(sid => {
            const s = metaData.subjects[sid];
            return s ? `${s.code || s.name} (${s.type === 'lab' ? 'Lab' : 'Theory'})` : sid;
         });

         // Calculate total sessions per subject
         const subjectSessionCounts: Record<string, number> = {};
         uniqueSubjectIds.forEach(sid => {
            const subjectSessions = new Set(regularRecs.filter(r => r.subjectId === sid).map(r => `${r.date}_${r.lectureSlot}`)).size;
            subjectSessionCounts[sid] = subjectSessions;
         });

         const totalRegularSessions = previewStats.sessions;

         const now = new Date();
         const currentYear = now.getFullYear();
         const session = now.getMonth() >= 6 ? `${currentYear}-${(currentYear + 1) % 100}` : `${currentYear - 1}-${currentYear % 100}`;

         const headerInfo = [
            ["ACROPOLIS INSTITUTE OF TECHNOLOGY AND RESEARCH"],
            ["DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING"],
            [`Attendance Report: ${branchName} | SESSION: ${session}`],
            [`Type: ${exportRange === 'TILL_TODAY' ? 'Till Date' : 'Custom Range'}`],
            [`Period: ${exportRange === 'TILL_TODAY' ? 'Full Session' : `${exportStartDate} to ${exportEndDate}`}`],
            [`Generated: ${now.toLocaleString()}`],
            [] // Spacer
         ];

         setProgress(50);
         setStatus('Generating batch-wise analytics...');
         await new Promise(r => setTimeout(r, 50));

         // --- STATS CALCULATION ---
         const totalStudents = filteredStudents.length;
         const studentStats = filteredStudents.map(s => {
            const studentRecs = previewRecords.filter(r => r.studentId === s.uid);
            const studentRegularRecs = studentRecs.filter(r => r.subjectId !== 'sub_extra');
            const presentCount = studentRegularRecs.filter(r => r.isPresent).length;
            const totalSessions = studentRegularRecs.length;
            const extraCount = studentRecs.filter(r => r.subjectId === 'sub_extra' && r.isPresent).length;
            const pct = totalSessions === 0 ? 0 : ((presentCount + extraCount) / totalSessions) * 100;
            return { name: s.displayName, pct };
         });

         const detentionCount = studentStats.filter(s => s.pct < 75).length;
         const classAvg = totalStudents === 0 ? 0 : Math.round(studentStats.reduce((acc, curr) => acc + curr.pct, 0) / totalStudents);

         const statsInfo = [
            ["ATTENDANCE SUMMARY", ""],
            ["Total Strength", totalStudents.toString()],
            ["Class Average", `${classAvg}%`],
            ["Detention Count (<75%)", detentionCount.toString()],
            ["", ""]
         ];

         const mainHeader = ["Serial No", "Name", "Enrollment ID", ...subjectHeaders, "Extra Lectures", "Total Lectures", "Present Count", "Attendance %"];
         let csvRows: any[][] = [...headerInfo, ...statsInfo];

         // Group students by Batch
         const batchesMap = new Map<string, User[]>();
         filteredStudents.forEach(s => {
            const bId = s.studentData?.batchId || 'UNASSIGNED';
            if (!batchesMap.has(bId)) batchesMap.set(bId, []);
            batchesMap.get(bId)!.push(s);
         });

         setProgress(70);
         setStatus('Compiling student worksheets...');
         await new Promise(r => setTimeout(r, 50));

         Array.from(batchesMap.entries()).forEach(([batchId, batchStudents]) => {
            const batchNameStr = metaData.batches?.[batchId] || batchId;

            // Find all records that apply to this batch specifically or to the whole class
            const batchRegularRecs = regularRecs.filter(r => r.batchId === batchId || r.batchId === 'ALL');

            const batchSubjectSessionCounts: Record<string, number> = {};
            uniqueSubjectIds.forEach(sid => {
               const batchSubjectSessions = new Set(batchRegularRecs.filter(r => r.subjectId === sid).map(r => `${r.date}_${r.lectureSlot}`)).size;
               batchSubjectSessionCounts[sid] = batchSubjectSessions;
            });

            // Add Batch Spacing and Headers
            csvRows.push([]);
            csvRows.push([`>>> BATCH: ${batchNameStr} <<<`]);
            csvRows.push(mainHeader);

            const batchTotalLectures = Object.values(batchSubjectSessionCounts).reduce((acc, curr) => acc + curr, 0);
            const batchTotalsLabelRow = ["", "Total Lectures Held", "", ...uniqueSubjectIds.map(sid => batchSubjectSessionCounts[sid].toString()), "", batchTotalLectures.toString(), "VARIES", ""];
            csvRows.push(batchTotalsLabelRow);

            const batchDataRows = batchStudents.map(s => {
               const studentRecs = previewRecords.filter(r => r.studentId === s.uid);
               const studentRegularRecs = regularRecs.filter(r => r.studentId === s.uid);
               const studentTotalSessions = studentRegularRecs.length; // use accurate logic
               const presentCount = studentRegularRecs.filter(r => r.isPresent).length;
               const extraCount = studentRecs.filter(r => r.subjectId === 'sub_extra' && r.isPresent).length;

               const subjectAttendance = uniqueSubjectIds.map(sid => {
                  return studentRegularRecs.filter(r => r.subjectId === sid && r.isPresent).length.toString();
               });

               const pct = studentTotalSessions === 0 ? 0 : Math.round(((presentCount + extraCount) / studentTotalSessions) * 100);

               return [
                  s.studentData?.rollNo || '',
                  s.displayName,
                  s.studentData?.enrollmentId || '',
                  ...subjectAttendance,
                  extraCount.toString(),
                  studentTotalSessions.toString(),
                  (presentCount + extraCount).toString(),
                  `${pct}%`
               ];
            });

            csvRows = csvRows.concat(batchDataRows);
            csvRows.push([]); // trailing spacer
            csvRows.push([]);
         });

         setProgress(85);
         setStatus('Applying institutional branding...');
         await new Promise(r => setTimeout(r, 50));

         // Create Workbook
         const workbook = new ExcelJS.Workbook();
         const sheet = workbook.addWorksheet('Attendance Report');

         sheet.addRows(csvRows);

         // --- ADVANCED STYLING & FORMATTING ---
         // 1. Merge Main Headers
         sheet.mergeCells(1, 1, 1, mainHeader.length); // Main Title
         sheet.mergeCells(2, 1, 2, mainHeader.length); // Dept
         sheet.mergeCells(3, 1, 3, mainHeader.length); // Branch

         // 2. Auto-adjust column widths
         sheet.columns.forEach((col, colIndex) => {
            let maxLen = 10;
            csvRows.forEach((row, rowIndex) => {
               if (rowIndex < 7) return; // Skip big title merges for width calculation
               const val = row[colIndex];
               if (val) {
                  const len = val.toString().length;
                  if (len > maxLen) maxLen = len;
               }
            });
            col.width = maxLen + 4;
         });

         // 3. Frozen Panes
         sheet.views = [{ state: 'frozen', xSplit: 4, ySplit: 14 }];

         // --- 5. Apply Colors & Styles ---
         sheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
               cell.font = { name: "Calibri", size: 10 };
               cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
               cell.border = {
                  top: { style: "thin", color: { argb: "FFCBD5E1" } },
                  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
                  left: { style: "thin", color: { argb: "FFCBD5E1" } },
                  right: { style: "thin", color: { argb: "FFCBD5E1" } }
               };

               const R = rowNumber - 1;
               const C = colNumber - 1;

               // Main Headers
               if (R >= 0 && R <= 2) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
                  cell.alignment = { horizontal: "center" };
               }

               const rowVal0 = csvRows[R]?.[0]?.toString() || '';
               const rowVal1 = csvRows[R]?.[1]?.toString() || '';

               // Batch Title Row
               if (rowVal0.startsWith('>>> BATCH')) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
                  cell.alignment = { horizontal: "center" };
               }

               // Table Header
               if (rowVal0 === 'Serial No') {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                  cell.alignment = { horizontal: "center" };
               }

               // Totals Row
               if (rowVal1 === 'Total Lectures Held') {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                  cell.font = { bold: true };
               }

               // Numbers and Percentages
               if (C >= 3 && R > 7) {
                  cell.alignment = { horizontal: "right" };
                  const val = cell.value?.toString() || '';
                  if (val.includes('%')) {
                     const num = parseInt(val);
                     if (num < 75) {
                        cell.font = { color: { argb: 'FFFF0000' }, bold: true };
                     }
                  }
               }
            });
         });

         // Merge batch title rows across the whole table
         csvRows.forEach((row, R) => {
            if (row[0]?.toString().startsWith('>>> BATCH')) {
               sheet.mergeCells(R + 1, 1, R + 1, mainHeader.length);
            }
         });

         setProgress(95);
         setStatus('Finalizing file...');
         await new Promise(r => setTimeout(r, 400));

         const buffer = await workbook.xlsx.writeBuffer();
         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.href = url;
         link.download = `${branchName}_Summary_Report.xlsx`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         URL.revokeObjectURL(url);

         setProgress(100);
         setStatus('Complete!');
      } catch (e: any) {
         alert("Export failed: " + e.message);
      } finally {
         setTimeout(() => {
            setLoading(false);
            setProgress(0);
         }, 800);
      }
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
         <div className="flex items-center justify-between pb-4 px-2">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-indigo-50 rounded-[1.2rem]"><Layers className="h-5 w-5 text-indigo-600" /></div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Class Reports</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Export branch analytics</p>
               </div>
            </div>

            {/* MST Marks Export Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8">
                  <Trophy className="h-12 w-12 text-indigo-50 opacity-50 group-hover:scale-110 transition-transform duration-500" />
               </div>
               <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                     <span className="text-[10px] font-black uppercase tracking-widest">Performance Export</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">MST Marks Summary</h3>
                  <p className="text-slate-500 text-sm font-medium mb-8 max-w-md">Generate a branch-wide report for all subjects. This report includes a side-by-side comparison of marks for every student in your class.</p>

                  <div className="flex flex-col md:flex-row items-center gap-6">
                     <div className="w-full md:w-64">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Exam Type</label>
                        <Select
                           value={midSemType}
                           onChange={e => setMidSemType(e.target.value as MidSemType)}
                           className="w-full bg-slate-50 border-none font-bold text-sm h-12"
                        >
                           <option value="MID_SEM_1">MST 1</option>
                           <option value="MID_SEM_2">MST 2</option>
                           <option value="MID_SEM_REMEDIAL">Remedial MST</option>
                        </Select>
                     </div>
                     <div className="flex-1 w-full pt-6 md:pt-0">
                        <button
                           onClick={async () => {
                               setLoading(true);
                               setProgress(0);
                               setStatus('Initializing fetch...');
                               await new Promise(r => setTimeout(r, 600));
                              try {
                                 setProgress(20);
                                 setStatus('Fetching marks from database...');
                                 await new Promise(r => setTimeout(r, 100)); // Give time for modal to show
                                 const marks = await db.getMarksByStudents(students.map(s => s.uid), midSemType);
                                 setProgress(50);
                                 setStatus('Processing subjects and scores...');
                                 await new Promise(r => setTimeout(r, 50));
                                 const examName = midSemType === 'MID_SEM_1' ? 'MST 1' : midSemType === 'MID_SEM_2' ? 'MST 2' : 'Remedial MST';
                                 
                                 // Get all subjects that have marks or are assigned
                                 const usedSubjectIds = Array.from(new Set(marks.map(m => m.subjectId)));
                                 const branchSubjects = (usedSubjectIds as string[]).map(sid => {
                                    const sub = metaData.subjects[sid as string];
                                    return sub ? { ...sub, id: sid } : null;
                                 }).filter(Boolean) as any[];

                                 const data = students.map(s => {
                                    const studentMarks = marks.filter(m => m.studentId === s.uid);
                                    const row: any = {
                                       'Student Name': s.displayName,
                                       'Enrollment Number': s.studentData?.enrollmentId || '',
                                       'Roll Number': s.studentData?.rollNo || '',
                                       'Class/Batch': metaData.batches[s.studentData?.batchId || ''] || 'ALL',
                                    };
                                    
                                    branchSubjects.forEach(sub => {
                                       const m = studentMarks.find(m => m.subjectId === sub.id);
                                       row[`${sub.name} (${sub.code})`] = m ? (m.marksObtained === -1 ? 'A' : m.marksObtained) : '-';
                                    });
                                    
                                    return row;
                                 });

                                 setProgress(70);
                                 await new Promise(r => setTimeout(r, 50));
                                 setStatus('Generating Excel worksheets...');
                                 await new Promise(r => setTimeout(r, 500));

                                 const examTitle = midSemType === 'MID_SEM_1' ? 'MID SEMESTER TEST - I' : midSemType === 'MID_SEM_2' ? 'MID SEMESTER TEST - II' : 'REMEDIAL MST';
                                 const now = new Date();
                                 const currentYear = now.getFullYear();
                                 const session = now.getMonth() >= 6 ? `${currentYear}-${(currentYear + 1) % 100}` : `${currentYear - 1}-${currentYear % 100}`;
                                 
                                 const headerAOA = [
                                    ['ACROPOLIS INSTITUTE OF TECHNOLOGY AND RESEARCH'],
                                    ['DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING'],
                                    [`BRANCH SUMMARY: ${examTitle} | SESSION: ${session}`],
                                    [`BRANCH: ${branchName.toUpperCase()} | COORDINATOR: ${user.displayName.toUpperCase()}`],
                                    [`GENERATED ON: ${now.toLocaleDateString()}`],
                                    [] // Spacer
                                 ];

                                 const tableHeaders = Object.keys(data[0] || {});
                                 const tableData = data.map(row => Object.values(row));
                                 const finalAOA = [...headerAOA, tableHeaders, ...tableData];

                                 const workbook = new ExcelJS.Workbook();
                                 const sheet = workbook.addWorksheet('MST Marks Summary');

                                 sheet.addRows(finalAOA);

                                 // Merges for Header
                                 sheet.mergeCells(1, 1, 1, tableHeaders.length);
                                 sheet.mergeCells(2, 1, 2, tableHeaders.length);
                                 sheet.mergeCells(3, 1, 3, tableHeaders.length);
                                 sheet.mergeCells(4, 1, 4, tableHeaders.length);
                                 sheet.mergeCells(5, 1, 5, tableHeaders.length);

                                 // Auto-size columns
                                 sheet.columns.forEach((col, i) => {
                                    let maxLen = tableHeaders[i]?.length || 10;
                                    tableData.forEach(row => {
                                       const len = String(row[i] || '').length;
                                       if (len > maxLen) maxLen = len;
                                    });
                                    col.width = maxLen + 4;
                                 });

                                 // Apply Styling
                                 sheet.eachRow((row, rowNumber) => {
                                    row.eachCell((cell, colNumber) => {
                                       cell.font = { name: "Calibri", size: 11 };
                                       cell.alignment = { vertical: "middle", horizontal: "left" };

                                       const R = rowNumber - 1;
                                       const C = colNumber - 1;

                                       // Branding Header Styling
                                       if (R >= 0 && R <= 4) {
                                          cell.alignment = { horizontal: "center" };
                                          cell.font = { bold: true };
                                          if (R === 0) cell.font = { size: 16, bold: true };
                                          if (R === 1) cell.font = { size: 14, bold: true };
                                       }

                                       // Table Headers (Row 6)
                                       if (R === 6) {
                                          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                                          cell.font = { bold: true };
                                          cell.border = {
                                             bottom: { style: "thin", color: { argb: "FF000000" } },
                                             top: { style: "thin", color: { argb: "FF000000" } }
                                          };
                                       }

                                       // Marks Columns (Index 4 onwards)
                                       if (C >= 4 && R > 6) {
                                          cell.alignment = { horizontal: "right" };
                                          if (cell.value === 'A') {
                                             cell.font = { color: { argb: "FFFF0000" }, bold: true };
                                          }
                                       }
                                    });
                                 });

                                 setProgress(90);
                                 await new Promise(r => setTimeout(r, 50));
                                 setStatus('Applying institutional branding...');
                                 await new Promise(r => setTimeout(r, 600));

                                 setProgress(100);
                                 setStatus('Starting download...');
                                 await new Promise(r => setTimeout(r, 500));

                                 const buffer = await workbook.xlsx.writeBuffer();
                                 const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                 const url = URL.createObjectURL(blob);
                                 const link = document.createElement("a");
                                 link.href = url;
                                 link.download = `${branchName}_${examName}_Summary.xlsx`;
                                 document.body.appendChild(link);
                                 link.click();
                                 document.body.removeChild(link);
                                 URL.revokeObjectURL(url);
                              } catch (e: any) {
                                 alert("Failed to export: " + e.message);
                              } finally {
                                 setTimeout(() => {
                                    setLoading(false);
                                    setProgress(0);
                                 }, 800);
                              }
                           }}
                           disabled={loading || students.length === 0}
                           className="h-14 w-full md:w-auto px-10 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                           {loading ? (
                              <>
                                 <Loader2 className="animate-spin h-4 w-4" />
                                 <span>Wait...</span>
                              </>
                           ) : (
                              <>
                                 <FileDown className="h-4 w-4" />
                                 <span>Download Summary Report</span>
                              </>
                           )}
                        </button>
                     </div>
                  </div>
               </div>
               <ExportProgressModal isOpen={loading} progress={progress} status={status} />
            </div>
            <div className="flex gap-4">
               <div className="text-right">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Classes</div>
                  <div className="text-xl font-black text-indigo-600 leading-none">{previewStats.sessions}</div>
               </div>
               <div className="text-right">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Students</div>
                  <div className="text-xl font-black text-indigo-600 leading-none">{filteredStudents.length}</div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time range</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => setExportRange('TILL_TODAY')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${exportRange === 'TILL_TODAY' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md translate-y-[-2px]' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Session</button>
                     <button onClick={() => setExportRange('CUSTOM')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${exportRange === 'CUSTOM' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md translate-y-[-2px]' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Range</button>
                  </div>
                  {exportRange === 'CUSTOM' && (
                     <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in duration-300">
                        <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="mb-0 border-none bg-slate-50 font-black text-indigo-900 rounded-xl" />
                        <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="mb-0 border-none bg-slate-50 font-black text-indigo-900 rounded-xl" />
                     </div>
                  )}
               </div>

               <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Type</label>
                     <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => setExportSubjectType('ALL')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${exportSubjectType === 'ALL' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md translate-y-[-2px]' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>All</button>
                        <button onClick={() => setExportSubjectType('THEORY')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${exportSubjectType === 'THEORY' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md translate-y-[-2px]' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Theory</button>
                        <button onClick={() => setExportSubjectType('LAB')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${exportSubjectType === 'LAB' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md translate-y-[-2px]' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Lab</button>
                     </div>
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Scope</label>
                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setFilterMode('FULL')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${filterMode === 'FULL' ? 'bg-indigo-900 text-white border-indigo-900 shadow-lg translate-y-[-2px]' : 'bg-slate-50 text-slate-500 border-slate-50 hover:bg-slate-100'}`}>Full Class</button>
                        <button onClick={() => setFilterMode('FILTERED')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${filterMode === 'FILTERED' ? 'bg-indigo-900 text-white border-indigo-900 shadow-lg translate-y-[-2px]' : 'bg-slate-50 text-slate-500 border-slate-50 hover:bg-slate-100'}`}>Filtered</button>
                     </div>
                  </div>
                  {filterMode === 'FILTERED' && (
                     <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in duration-300">
                        <select value={filterCondition} onChange={e => setFilterCondition(e.target.value as any)} className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs font-black text-indigo-900 uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
                           <option value="GE">Above or Equal (&ge;)</option>
                           <option value="LE">Below or Equal (&le;)</option>
                           <option value="GT">Strictly Above (&gt;)</option>
                           <option value="LT">Strictly Below (&lt;)</option>
                        </select>
                        <div className="relative">
                           <input type="number" value={filterValue} onChange={e => setFilterValue(Number(e.target.value))} className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs font-black text-indigo-900 uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm" />
                           <span className="absolute right-4 top-3 text-[10px] text-slate-400 font-black">%</span>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="flex flex-col justify-between gap-4">
               <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/30 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-indigo-100 rounded-xl"><Activity className="h-4 w-4 text-indigo-600" /></div>
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Report Insights</span>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Average Attendance</span>
                        <span className="font-black text-indigo-600">{averageAttendance}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500 font-medium text-slate-500">Low Attendance {"(<75%)"}</span>
                        <span className="font-black text-rose-500">{lowAttendanceCount} Students</span>
                     </div>
                  </div>
               </div>

               <div className="flex gap-3">
                  <Button onClick={() => setShowFullPreview(!showFullPreview)} variant="secondary" className="flex-1 h-16 rounded-3xl font-black uppercase tracking-widest text-[10px]">
                     {showFullPreview ? <X className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                     {showFullPreview ? 'Close' : 'Preview'}
                  </Button>
                  <Button onClick={executeExport} className="flex-[2] h-16 bg-indigo-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
                     <FileDown className="h-4 w-4 mr-2" /> Download Report
                  </Button>
               </div>
            </div>
         </div>

         {showFullPreview && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                     <Layers className="h-4 w-4 text-indigo-500" />
                     Data Preview
                  </h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredStudents.length} Records Shown</span>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-slate-50">
                           <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sr No</th>
                           <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                           <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Regular (P/T)</th>
                           <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Extra</th>
                           <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                           <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Percentage</th>
                        </tr>
                     </thead>
                     {(() => {
                        const previewBatchesMap = new Map<string, User[]>();
                        filteredStudents.forEach(s => {
                           const bId = s.studentData?.batchId || 'UNASSIGNED';
                           if (!previewBatchesMap.has(bId)) previewBatchesMap.set(bId, []);
                           previewBatchesMap.get(bId)!.push(s);
                        });

                        return Array.from(previewBatchesMap.entries()).map(([batchId, batchStudents]) => {
                           const batchNameStr = metaData.batches?.[batchId] || batchId;
                           return (
                              <tbody key={batchId} className="divide-y divide-slate-50">
                                 <tr className="bg-indigo-50/50">
                                    <td colSpan={5} className="p-3 text-[10px] font-black tracking-widest text-indigo-800 uppercase text-center focus:bg-indigo-100 shadow-sm">
                                       {`>>> BATCH: ${batchNameStr} <<<`}
                                    </td>
                                 </tr>
                                 {batchStudents.map(s => {
                                    // Re-calculate the actual regular records for this specific student matching the export criteria
                                    const studentRegularRecs = previewRecords.filter(r => {
                                       if (r.studentId !== s.uid || r.subjectId === 'sub_extra') return false;
                                       const subj = metaData.subjects[r.subjectId];
                                       if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
                                       if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
                                       return true;
                                    });

                                    const studentTotalSessions = studentRegularRecs.length;
                                    const regularAtt = studentRegularRecs.filter(r => r.isPresent).length;
                                    const extraAtt = previewRecords.filter(r => r.studentId === s.uid && r.subjectId === 'sub_extra' && r.isPresent).length;
                                    const pct = studentTotalSessions === 0 ? 0 : Math.round(((regularAtt + extraAtt) / studentTotalSessions) * 100);

                                    return (
                                       <tr key={s.uid} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="p-4 font-mono text-[10px] text-slate-400">{s.studentData?.rollNo}</td>
                                          <td className="p-4">
                                             <div className="font-black text-slate-800 uppercase tracking-tight text-xs">{s.displayName}</div>
                                             <div className="text-[9px] font-mono text-slate-900">{s.studentData?.enrollmentId}</div>
                                          </td>
                                          <td className="p-4 text-center font-black text-indigo-600 text-xs">{regularAtt}/{studentTotalSessions}</td>
                                          <td className="p-4 text-center">
                                             <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black">+{extraAtt}</span>
                                          </td>
                                          <td className="p-4 text-center font-black text-indigo-600 text-xs">{regularAtt + extraAtt}/{studentTotalSessions}</td>
                                          <td className="p-4 text-right">
                                             <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${pct < 75 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {pct}%
                                              </div>
                                          </td>
                                       </tr>
                                    );
                                 })}
                              </tbody>
                           );
                        });
                     })()}
                  </table>
               </div>
            </div>
         )}
      </div>
   );
};


const CoordinatorView: React.FC<{ branchId: string; facultyUser: User; metaData: any }> = ({ branchId, facultyUser, metaData }) => {
   /*
    * Coordinator extra-lecture marking UX notes:
    * 1) At least one lecture slot must be selected before attendance can be saved.
    * 2) Save opens an explicit confirmation modal with date/slot context and retry-safe errors.
    * 3) Selected slot chips are visually emphasized and expose pressed state for accessibility.
    * 4) A helper banner appears when no slot is selected, guiding the user to pick one.
    */
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
   const [deletionModal, setDeletionModal] = useState<{ isOpen: boolean, date: string, slots: number[], records: AttendanceRecord[] } | null>(null);
   const [selectedSlotsToDelete, setSelectedSlotsToDelete] = useState<number[]>([]);
   const [isDeleting, setIsDeleting] = useState(false);
   const [networkError, setNetworkError] = useState('');

   // Search State
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState<User[]>([]);
   const [isSearching, setIsSearching] = useState(false);
   const [viewSearchStudent, setViewSearchStudent] = useState<User | null>(null);
   const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
   const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
   const [loadingStats, setLoadingStats] = useState(false);

   // Scroll state for smart navigation
   const [isNavVisible, setIsNavVisible] = useState(true);
   const [lastScrollY, setLastScrollY] = useState(0);

   useEffect(() => {
      const handleScroll = () => {
         const currentScrollY = window.scrollY;
         // Hide on scroll down, show on scroll up
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

   // Track previous state to avoid unnecessary resets
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
            // No existing data, only reset if it's a new date or branch (otherwise preserve manual marks)
            if (prevSelectionRef.current.date !== attendanceDate || prevSelectionRef.current.branchId !== branchId) {
               setStatus({});
            }
         }
      } else if (selectedSessions.length === 0) {
         // If clearing slots, and date/branch changed, we should reset
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

         // Identify existing records to delete for the selected date and sessions
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
         const message = e?.message ? `Failed to save attendance: ${e.message}` : 'Network/server error while saving attendance. Please retry.';
         setNetworkError(message);
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
         {/* Optimized Header Card */}
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

               {/* Navigation Tabs - Unified for all screens */}
               <div className={`hidden lg:flex bg-black/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-inner max-w-max self-end`}>
                  {[
                     { id: 'MARK', label: 'Mark Extra', icon: Save },
                     { id: 'SEARCH', label: 'Search', icon: Filter },
                     { id: 'MONITOR', label: 'Monitor', icon: Eye },
                     { id: 'REPORTS', label: 'Reports', icon: FileDown },
                     { id: 'HISTORY', label: 'Preview Attendance', icon: History }
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

         {/* Smart Mobile Navigation - Fixed Bottom with LinkedIn-style Hide-on-scroll logic */}
         <div className={`lg:hidden fixed bottom-8 left-0 right-0 z-[100] px-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'
            }`}>
            <div className="mx-auto max-w-sm bg-indigo-950/95 backdrop-blur-3xl px-2 py-2 rounded-[2.5rem] border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.4)] flex justify-between items-center">
               {[
                  { id: 'MARK', label: 'Mark', icon: Save },
                  { id: 'SEARCH', label: 'Search', icon: Filter },
                  { id: 'MONITOR', label: 'Monitor', icon: Eye },
                  { id: 'REPORTS', label: 'Reports', icon: FileDown },
                  { id: 'HISTORY', label: 'Preview Attendance', icon: History }
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
                     <div className="p-2 bg-indigo-50 rounded-xl">
                        <Filter className="h-4 w-4 text-indigo-600" />
                     </div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Student</label>
                  </div>
                  <div className="relative">
                     <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Enrollment, Mobile No, or Name..."
                        className="w-full pl-4 pr-12 py-4 border-none bg-slate-50 font-bold text-indigo-900 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                     />
                     {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                        </div>
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-3">
                     <div className="px-2 flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                           {searchQuery.trim() === '' ? 'Class Students' : 'Search Results'}
                        </h4>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                           {searchQuery.trim() === '' ? students.length : (searchResults.length > 0 ? searchResults.length : students.filter(s =>
                              s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              s.studentData?.enrollmentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              s.studentData?.mobileNo?.toLowerCase().includes(searchQuery.toLowerCase())
                           ).length)}
                        </span>
                     </div>
                     <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                        {(searchQuery.trim() === '' ? students : (
                           searchResults.length > 0 ? searchResults : students.filter(s =>
                              s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              s.studentData?.enrollmentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              s.studentData?.mobileNo?.toLowerCase().includes(searchQuery.toLowerCase())
                           )
                        )).map(s => (
                           <button
                              key={s.uid}
                              onClick={() => loadStudentStats(s)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all ${viewSearchStudent?.uid === s.uid
                                 ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                 : 'bg-white border-slate-100 hover:border-indigo-100 text-slate-700'
                                 }`}
                           >
                              <div className="font-black uppercase tracking-tight text-sm mb-0.5">{s.displayName}</div>
                              <div className={`text-[10px] font-mono opacity-60 ${viewSearchStudent?.uid === s.uid ? 'text-white' : 'text-slate-900'}`}>
                                 Sr No: {s.studentData?.enrollmentId}
                              </div>
                           </button>
                        ))}
                        {(searchQuery.trim() !== '' && searchResults.length === 0 && students.filter(s =>
                           s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.studentData?.enrollmentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           s.studentData?.mobileNo?.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 && !isSearching) && (
                              <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching students</p>
                              </div>
                           )}
                     </div>
                  </div>

                  <div className="lg:col-span-2">
                     {viewSearchStudent ? (
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                           <div className="flex justify-between items-start mb-8">
                              <div>
                                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-1">{viewSearchStudent.displayName}</h3>
                                 <div className="flex gap-3">
                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                       {viewSearchStudent.studentData?.enrollmentId}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                       {viewSearchStudent.studentData?.mobileNo}
                                    </span>
                                 </div>
                              </div>
                              <Activity className="h-8 w-8 text-indigo-100" strokeWidth={3} />
                           </div>

                           {loadingStats ? (
                              <div className="flex flex-col items-center justify-center py-20">
                                 <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing Data...</span>
                              </div>
                           ) : (
                              <div className="space-y-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allSubjects.map(sub => {
                                       const relevant = studentAttendance.filter(a => a.subjectId === sub.id);
                                       const total = relevant.length;
                                       const present = relevant.filter(a => a.isPresent).length;
                                       const perc = total === 0 ? 0 : Math.round((present / total) * 100);

                                       if (total === 0) return null;

                                       return (
                                          <div key={sub.id} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 transition-all">
                                             <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.code}</span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${perc < 75 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                   {perc}%
                                                </span>
                                             </div>
                                             <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-2">{sub.name}</h4>
                                             <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                   className={`h-full transition-all duration-1000 ${perc < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                   style={{ width: `${perc}%` }}
                                                />
                                             </div>
                                             <div className="flex justify-between mt-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attended</span>
                                                <span className="text-[9px] font-black text-slate-600">{present} / {total}</span>
                                             </div>
                                          </div>
                                       );
                                    }).filter(Boolean)}
                                 </div>

                                 {studentAttendance.length > 0 ? (
                                    <div className="mt-8">
                                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recent Activity</h4>
                                       <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                          <table className="w-full text-left text-xs">
                                             <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                   <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Date</th>
                                                   <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Subject</th>
                                                   <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                                                </tr>
                                             </thead>
                                             <tbody className="divide-y divide-slate-50">
                                                {studentAttendance.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(rec => {
                                                   const sub = allSubjects.find(s => s.id === rec.subjectId);
                                                   return (
                                                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                                                         <td className="px-4 py-3 font-mono text-slate-500">{rec.date}</td>
                                                         <td className="px-4 py-3 font-black text-slate-700 uppercase tracking-tight">{sub?.name || 'Extra'}</td>
                                                         <td className="px-4 py-3 text-right">
                                                            <span className={`font-black uppercase text-[9px] tracking-widest ${rec.isPresent ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                               {rec.isPresent ? 'Present' : 'Absent'}
                                                            </span>
                                                         </td>
                                                      </tr>
                                                   );
                                                })}
                                             </tbody>
                                          </table>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                       <Activity className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No attendance records found</p>
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                           <BookOpen className="h-10 w-10 text-slate-200 mb-4" />
                           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Select a student to view details</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'MARK' && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
               {/* Selection Controls */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                           <Calendar className="h-4 w-4 text-indigo-600" />
                        </div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Date</label>
                     </div>
                     <Input
                        type="date"
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        className="mb-0 border-none bg-slate-50 font-black text-indigo-900 rounded-2xl"
                     />
                  </div>

                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                           <RefreshCw className="h-4 w-4 text-indigo-600" />
                        </div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                           <span>Lecture Periods (Max 7)</span>
                           <span
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600 cursor-help"
                              title="Select one or more lecture slots before saving attendance."
                              aria-label="Slot selection help"
                           >
                              ℹ️
                           </span>
                        </label>
                     </div>
                     <div className="flex flex-wrap gap-2.5">
                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                           <button
                              key={num}
                              onClick={() => toggleSession(num)}
                              aria-pressed={selectedSessions.includes(num)}
                              className={`w-11 h-11 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center ${selectedSessions.includes(num)
                                 ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-300/70 scale-105 animate-pulse'
                                 : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                 }`}
                           >
                              {num}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Reason TextArea */}
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4">
                     <div className={`p-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight ${extraReason.trim().split(/\s+/).filter(Boolean).length > 40 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {extraReason.trim().split(/\s+/).filter(Boolean).length}/50 Words
                     </div>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-indigo-50 rounded-xl">
                        <Filter className="h-4 w-4 text-indigo-600" />
                     </div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for Extra Class</label>
                  </div>
                  <textarea
                     value={extraReason}
                     onChange={e => {
                        const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                        if (words.length <= 50) setExtraReason(e.target.value);
                     }}
                     placeholder="Example: Extra session for difficult topics or missed classes..."
                     className="w-full p-4 text-sm border-none bg-slate-50 text-slate-700 rounded-2xl min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-300"
                  />
               </div>

               {/* Student Selection Section */}
               <div className="space-y-4">
                  {selectedSessions.length === 0 && (
                     <div className="px-2 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-4 shadow-lg shadow-amber-100/50">
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-200">
                                 <AlertTriangle className="h-5 w-5" />
                              </div>
                              <div>
                                 <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">Register Locked</h4>
                                 <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Choose a lecture slot above to start marking the attendance.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
                  <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 transition-all duration-300 ${selectedSessions.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                     <div className="space-y-0.5">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                           Attendance Register
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Students: {students.length}</p>
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                        <button
                           onClick={() => {
                              const newStatus: Record<string, boolean> = {};
                              students.forEach(s => newStatus[s.uid] = true);
                              setStatus(newStatus);
                           }}
                           className="flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100 shadow-sm"
                        >
                           All Present
                        </button>
                        <button
                           onClick={() => {
                              const newStatus: Record<string, boolean> = {};
                              students.forEach(s => newStatus[s.uid] = false);
                              setStatus(newStatus);
                           }}
                           className="flex-1 md:flex-none text-[10px] font-black uppercase tracking-widest px-4 py-2.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 shadow-sm"
                        >
                           All Absent
                        </button>
                     </div>
                  </div>

                  {/* Optimized Student List */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 pb-32 transition-all duration-300 ${selectedSessions.length === 0 ? 'opacity-40 grayscale-[0.5] pointer-events-none cursor-not-allowed select-none' : ''}`}>
                     {selectedSessions.length === 0 && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-10 text-center pointer-events-none">
                           <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-4">
                              <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                                 <RefreshCw className="h-8 w-8 animate-spin-slow" />
                              </div>
                              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Marking Register Locked</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">Select at least one slot<br />above to unlock students</p>
                           </div>
                        </div>
                     )}
                     {students.map((s) => (
                        <div
                           key={s.uid}
                           onClick={() => toggleStudent(s.uid)}
                           className={`group relative p-4 rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer ${status[s.uid] === false
                              ? 'bg-rose-50/50 border-rose-100 shadow-sm'
                              : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md'
                              }`}
                        >
                           {/* Decorative background for status */}
                           <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-all duration-500 ${status[s.uid] === false ? 'bg-rose-200/50 opacity-100' : 'bg-indigo-100/50 opacity-0 group-hover:opacity-100'
                              }`} />

                           <div className="relative flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                 {/* Sr No badge */}
                                 <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-2xl font-black transition-all ${status[s.uid] === false
                                    ? 'bg-rose-100 text-rose-600 rotate-[-4deg]'
                                    : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                    }`}>
                                    <span className="text-[9px] uppercase leading-none opacity-60">Roll</span>
                                    <span className="text-sm leading-tight">{s.studentData?.rollNo || '#'}</span>
                                 </div>

                                 <div className="min-w-0">
                                    <h4 className={`font-black uppercase tracking-tight truncate transition-colors ${status[s.uid] === false ? 'text-rose-900' : 'text-slate-800'
                                       }`}>
                                       {s.displayName}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[10px] font-mono text-slate-900 tracking-tighter">{s.studentData?.enrollmentId}</span>
                                       <div className={`w-1.5 h-1.5 rounded-full ${status[s.uid] === false ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                                    </div>
                                 </div>
                              </div>

                              <div className="flex items-center gap-3">
                                 <div className={`hidden md:block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${status[s.uid] === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {status[s.uid] === false ? 'Absent' : 'Present'}
                                 </div>
                                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${status[s.uid] === false ? 'bg-slate-100 border-2 border-slate-200' : 'bg-emerald-500 border-2 border-emerald-500 shadow-lg shadow-emerald-100 rotate-0'}`}>
                                    {status[s.uid] !== false ? (
                                       <CheckSquare className="h-5 w-5 text-white" strokeWidth={3} />
                                    ) : (
                                       <Square className="h-5 w-5 text-slate-300" strokeWidth={2} />
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}

                     {students.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                           <Users className="h-10 w-10 text-slate-200 mb-4 animate-pulse" />
                           <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No Students Found in this Branch</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Premium Footer - Now scrolls with content on mobile to avoid overlapping */}
               <div className="mt-8 mb-24 md:mb-0 md:sticky md:bottom-6 z-40">
                  <div className="bg-white/80 backdrop-blur-2xl p-4 md:p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-100/20 md:shadow-none flex flex-col md:flex-row items-center justify-between gap-4 border-t transition-all hover:bg-white">
                     <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Summary</span>
                        <div className="text-sm font-black text-indigo-900 leading-none">
                           {Object.values(status).filter(v => v).length} Present / {students.length} Total
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        {saveMessage && (
                           <span className="text-xs font-black text-emerald-600 uppercase tracking-widest animate-in fade-in slide-in-from-right-2">
                              {saveMessage}
                           </span>
                        )}
                        <Button
                           onClick={() => {
                              if (selectedSessions.length === 0) return;
                              setConfirmOpen(true);
                           }}
                           disabled={isSaving || selectedSessions.length === 0}
                           className="w-full md:w-[280px] h-14 bg-indigo-600 text-white !rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:grayscale disabled:opacity-50"
                        >
                           {isSaving ? (
                              <div className="flex items-center gap-2 justify-center">
                                 <Loader2 className="h-4 w-4 animate-spin" />
                                 <span>Processing...</span>
                              </div>
                           ) : (
                              <div className="flex items-center justify-center gap-2">
                                 <Save className="h-4 w-4" />
                                 <span>Save Attendance</span>
                              </div>
                           )
                           }
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'HISTORY' && (
            // ... (History content remains same)
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                  <div className="space-y-0.5">
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Extra History</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Managing records for {metaData.branches[branchId] || branchId}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                     <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Total Records</span>
                        <span className="text-sm font-black text-indigo-600">{history.length}</span>
                     </div>
                     <History className="h-5 w-5 text-indigo-500" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                  {Array.from(new Set(history.map(r => r.date))).sort().reverse().map(date => {
                     const dayRecs = history.filter(r => r.date === date);
                     const slots = Array.from(new Set(dayRecs.map(r => r.lectureSlot))).sort();
                     const firstRec = dayRecs[0];

                     return (
                        <div key={date} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                           <div className="p-6">
                              <div className="flex flex-col md:flex-row justify-between gap-6">
                                 <div className="flex items-start gap-5">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center font-black group-hover:bg-indigo-50 transition-colors">
                                       <span className="text-[10px] text-slate-400 uppercase leading-none mb-1">Date</span>
                                       <span className="text-indigo-600 text-sm leading-tight text-center">
                                          {new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                       </span>
                                    </div>

                                    <div className="space-y-3">
                                       <div className="flex flex-wrap gap-2">
                                          {slots.map(s => (
                                             <div key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-indigo-100">
                                                <Layers className="h-3 w-3" />
                                                Slot {s}
                                             </div>
                                          ))}
                                       </div>
                                       <div className="flex items-center gap-4">
                                          <div className="flex flex-col">
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Attendance</span>
                                             <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-xs font-black text-slate-700">{dayRecs.length} Student Markings</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="flex-1 md:max-w-[40%] bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason provided</span>
                                    <p className="text-xs text-slate-600 font-medium italic leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                       "{firstRec?.reason || 'No specific reason provided for this session'}"
                                    </p>
                                 </div>

                                 <div className="flex md:flex-col justify-end gap-3 self-end md:self-stretch">
                                    <button
                                       onClick={() => {
                                          if (slots.length > 1) {
                                             setDeletionModal({ isOpen: true, date, slots, records: dayRecs });
                                             setSelectedSlotsToDelete(slots);
                                          } else {
                                             if (confirm(`CRITICAL: Delete ${dayRecs.length} entries for Slot ${slots[0]} on ${date}? \n\nNOTE: Records will be moved to the Recycle Bin and permanently deleted after 12 hours. You can restore them from the Recycle Bin until then.`)) {
                                                db.deleteAttendanceRecords(dayRecs.map(r => r.id)).then(async () => {
                                                   setHistory(await db.getAttendance(branchId, 'ALL', 'sub_extra'));
                                                });
                                             }
                                          }
                                       }}
                                       className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow-rose-200"
                                       title="Delete Record"
                                    >
                                       <Trash className="h-5 w-5" />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     );
                  })}

                  {history.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                        <History className="h-10 w-10 text-slate-200 mb-4 animate-pulse" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No extra attendance history found</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'MONITOR' && <CoordinatorMarkingMonitor branchId={branchId} metaData={metaData} />}
         {activeTab === 'REPORTS' && <CoordinatorReport branchId={branchId} branchName={metaData.branches[branchId] || branchId} students={students} metaData={metaData} user={facultyUser} />}
         <Modal
            isOpen={confirmOpen}
            onClose={() => { if (!isSaving) setConfirmOpen(false); }}
            title="Confirm Attendance Save"
         >
            <div className="space-y-4">
               <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between gap-4">
                     <span className="text-slate-500">Date</span>
                     <span className="font-semibold text-slate-900">{attendanceDate}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4">
                     <span className="text-slate-500">Selected Slots</span>
                     <span className="font-semibold text-slate-900">
                        {selectedSessions.length > 0 ? `L${selectedSessions.join(', L')}` : 'None'}
                     </span>
                  </div>
               </div>
               {networkError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                     {networkError}
                  </div>
               )}
               <div className="flex justify-end gap-3 pt-1">
                  <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={isSaving}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving || selectedSessions.length === 0}>
                     {isSaving ? 'Saving...' : 'Confirm'}
                  </Button>
               </div>
            </div>
         </Modal>

         <Modal
            isOpen={!!deletionModal?.isOpen}
            onClose={() => !isDeleting && setDeletionModal(null)}
            title="Select Slots to Delete"
         >
            <div className="space-y-6">
               <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                  <p className="text-xs font-black text-rose-700 uppercase tracking-wider mb-1">Date: {deletionModal?.date}</p>
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-tight">Multiple sessions detected. Select which ones to remove.</p>
                  <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                     <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest leading-tight">
                        Records stay in Recycle Bin for 12 hours before permanent deletion
                     </p>
                  </div>
               </div>

               <div className="space-y-2">
                  {deletionModal?.slots.map(slot => {
                     const isSelected = selectedSlotsToDelete.includes(slot);
                     const slotRecs = deletionModal.records.filter(r => r.lectureSlot === slot);
                     return (
                        <button
                           key={slot}
                           onClick={() => {
                              setSelectedSlotsToDelete(prev => 
                                 prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
                              );
                           }}
                           className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                              isSelected ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100 hover:border-slate-200'
                           }`}
                        >
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                 isSelected ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400'
                              }`}>
                                 <Layers size={18} />
                              </div>
                              <div className="text-left">
                                 <p className={`font-black uppercase text-xs tracking-tight ${isSelected ? 'text-rose-900' : 'text-slate-700'}`}>Slot {slot}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{slotRecs.length} Records</p>
                              </div>
                           </div>
                           <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-rose-500 border-rose-500' : 'border-slate-200 group-hover:border-slate-300'
                           }`}>
                              {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                           </div>
                        </button>
                     );
                  })}
               </div>

               <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setDeletionModal(null)} disabled={isDeleting}>Cancel</Button>
                  <Button 
                     onClick={async () => {
                        if (selectedSlotsToDelete.length === 0) return;
                        setIsDeleting(true);
                        try {
                           const idsToDelete = deletionModal!.records
                              .filter(r => selectedSlotsToDelete.includes(r.lectureSlot || 0))
                              .map(r => r.id);
                           
                           await db.deleteAttendanceRecords(idsToDelete);
                           setHistory(await db.getAttendance(branchId, 'ALL', 'sub_extra'));
                           setDeletionModal(null);
                        } catch (e) {
                           alert("Failed to delete selected slots");
                        } finally {
                           setIsDeleting(false);
                        }
                     }} 
                     disabled={isDeleting || selectedSlotsToDelete.length === 0}
                     className="!bg-rose-600 hover:!bg-rose-700"
                  >
                     {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash size={16} />}
                     <span className="ml-2">Delete {selectedSlotsToDelete.length} Slots</span>
                  </Button>
               </div>
            </div>
         </Modal>
      </div >
   );
};

export const FacultyDashboard: React.FC<FacultyProps> = ({ user, forceCoordinatorView = false }) => {
   /*
    * MARK tab UX behavior:
    * - Slot selection is mandatory before save is allowed.
    * - Save always routes through an explicit confirmation modal.
    * - Selected slot buttons are strongly highlighted and accessible (aria-pressed).
    * - Network/server failures are surfaced inside the confirmation modal for retry.
    */
   const navigate = useNavigate();
   const location = useLocation();
   const params = useParams();

   const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
   const [coordinatorBranchId, setCoordinatorBranchId] = useState<string | null>(null);
   const [coordinatorBranchIds, setCoordinatorBranchIds] = useState<string[]>([]);
   const [metaData, setMetaData] = useState<{
      branches: Record<string, string>;
      lockedBranches: Record<string, boolean>;
      batches: Record<string, string>;
      subjects: Record<string, { name: string, code: string, type?: 'theory' | 'lab' }>;
      faculty: Record<string, string>;
      rawBatches: Batch[];
   }>({ branches: {}, lockedBranches: {}, batches: {}, subjects: {}, faculty: {}, rawBatches: [] });
   const [loadingInit, setLoadingInit] = useState(true);
   const [loadingStudents, setLoadingStudents] = useState(false);

   // Derived state from URL
   const activeTab = forceCoordinatorView ? 'CO-ORDINATOR' :
      (location.pathname.includes('/history') ? 'HISTORY' :
         location.pathname.includes('/marks') ? 'MARKS' :
            location.pathname.includes('/coordinator') ? 'CO-ORDINATOR' : 'MARK');

   // URL Masking: We use indices to keep URLs short in the browser
   const { branchId: urlBranchId, subjectId: urlID2 } = params;

   // Assignments sorted by ID for stable indexing
   const sortedAssignments = useMemo(() => {
      return [...assignments].sort((a, b) => a.id.localeCompare(b.id));
   }, [assignments]);

   // Resolve Real IDs from URL (which might contain an index)
   const { selBranchId, selSubjectId } = useMemo(() => {
      if (!urlBranchId) return { selBranchId: '', selSubjectId: '' };

      const idx = parseInt(urlBranchId);
      if (!isNaN(idx) && idx >= 0 && idx < sortedAssignments.length) {
         return {
            selBranchId: sortedAssignments[idx].branchId,
            selSubjectId: sortedAssignments[idx].subjectId
         };
      }

      // Fallback: If it's not a valid index, assume it's a raw UID (backward compatibility)
      return { selBranchId: urlBranchId, selSubjectId: urlID2 || '' };
   }, [urlBranchId, urlID2, sortedAssignments]);

   const isCoordinatorForClass = useMemo(() => coordinatorBranchIds.includes(selBranchId), [coordinatorBranchIds, selBranchId]);
   const isViewOnlyLockActive = useMemo(() => {
      const isLocked = metaData.lockedBranches[selBranchId];
      return isLocked === true || String(isLocked) === "true";
   }, [metaData.lockedBranches, selBranchId]);

   const setSelection = (brid: string, sid: string) => {
      // Auto-populate batches when subject is selected to ensure student list appears
      if (brid && sid) {
         const rel = assignments.filter(a => a.branchId === brid && a.subjectId === sid);
         const batchesToSelect = rel.map(a => a.batchId);
         setSelectedMarkingBatches(batchesToSelect);
      } else {
         setSelectedMarkingBatches([]);
      }

      const currentPath = location.pathname;
      let targetPath = `/faculty/${activeTab.toLowerCase()}`;

      if (brid && sid) {
         const idx = sortedAssignments.findIndex(a => a.branchId === brid && a.subjectId === sid);
         targetPath += idx !== -1 ? `/${idx}` : `/${brid}/${sid}`;
      } else if (brid) {
         targetPath += `/${brid}`;
      }

      if (currentPath !== targetPath) {
         navigate(targetPath);
      }
   };

   const setActiveTab = (tab: 'MARK' | 'HISTORY' | 'CO-ORDINATOR' | 'MARKS') => {
      if (tab === activeTab) return;

      if (tab === 'CO-ORDINATOR') {
         navigate('/faculty/coordinator');
         return;
      }
      const idx = sortedAssignments.findIndex(a => a.branchId === selBranchId && a.subjectId === selSubjectId);
      const suffix = (idx !== -1) ? `/${idx}` : (selBranchId ? `/${selBranchId}` : '');
      navigate(`/faculty/${tab.toLowerCase()}${suffix}`);
   };

   // Marking State
   const [allBranchStudents, setAllBranchStudents] = useState<User[]>([]); // Cache all students in branch
   const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
   const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
   const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
   const [saveMessage, setSaveMessage] = useState('');
   const [allClassRecords, setAllClassRecords] = useState<AttendanceRecord[]>([]);
   const [isSaving, setIsSaving] = useState(false);
   const [isEditMode, setIsEditMode] = useState(false);
   const [showConfirmModal, setShowConfirmModal] = useState(false);
   const [networkError, setNetworkError] = useState('');

   // Marks State
   const [marksData, setMarksData] = useState<Record<string, number>>({});
   const [midSemType, setMidSemType] = useState<MidSemType>('MID_SEM_1');
   const [loadingMarks, setLoadingMarks] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [exportProgress, setExportProgress] = useState(0);
   const [exportStatus, setExportStatus] = useState('');
   const [maxMarks, setMaxMarks] = useState(20);

   // Conflict State
   const [conflictDetails, setConflictDetails] = useState<{
      markedBy: string;
      subjectName: string;
      slot: number;
      date: string;
      totalRecords: number;
      presentCount: number;
      timestamp: number;
   } | null>(null);
   const [idsToDelete, setIdsToDelete] = useState<string[]>([]);

   // Multi-Batch Selection State
   const [selectedMarkingBatches, setSelectedMarkingBatches] = useState<string[]>([]); // Selected Sections
   const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);

   // History State
   const [viewHistoryStudent, setViewHistoryStudent] = useState<User | null>(null);
   const [historyFilterDate, setHistoryFilterDate] = useState('');
   const [historyStartDate, setHistoryStartDate] = useState('');
   const [historyTillDate, setHistoryTillDate] = useState('');
   const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'CUSTOM'>('ALL');
   const [attendanceThreshold, setAttendanceThreshold] = useState(75);
   const [attendanceOperator, setAttendanceOperator] = useState<'GE' | 'LE' | 'GT' | 'LT'>('GE'); // GE: >=, LE: <=, GT: >, LT: <
   const [showFilters, setShowFilters] = useState(false);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [slotsToDeleteInModal, setSlotsToDeleteInModal] = useState<number[]>([]);
   const [isDeleting, setIsDeleting] = useState(false);

   // Export Flow State
   const [showExportModal, setShowExportModal] = useState(false);
   const [exportRange, setExportRange] = useState<'TILL_TODAY' | 'CUSTOM'>('TILL_TODAY');
   const [exportFormat, setExportFormat] = useState<'DETAILED' | 'COMPATIBLE'>('DETAILED');
   const [exportStartDate, setExportStartDate] = useState('');
   const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

   // 1. Initialize Data
   useEffect(() => {
      const init = async () => {
         const [myAssignments, coordinators] = await Promise.all([
            db.getAssignments(user.uid),
            db.getCoordinatorsByFaculty(user.uid)
         ]);
         const [allBranches, allSubjects, allFaculty] = await Promise.all([
            db.getBranches(),
            db.getSubjects(),
            db.getFaculty()
         ]);

         const branchMap: Record<string, string> = {};
         const lockedMap: Record<string, boolean> = {};
         allBranches.forEach(b => {
            branchMap[b.id] = b.name;
            lockedMap[b.id] = b.view_only || false;
         });
         
         // Apply new visibility filters
         const filteredAssignments = myAssignments.filter(a => {
            const b = allBranches.find(br => br.id === a.branchId);
            return !(b?.hide_from_teacher_student);
         });
         
         const filteredCoordinators = coordinators.filter(c => {
            const b = allBranches.find(br => br.id === c.branchId);
            return !(b?.hide_from_coordinator);
         });

         const subjectMap: Record<string, { name: string, code: string, type?: 'theory' | 'lab' }> = {};
         allSubjects.forEach(s => subjectMap[s.id] = { name: s.name, code: s.code, type: s.type });
         const facultyMap: Record<string, string> = {};
         allFaculty.forEach(f => facultyMap[f.uid] = f.displayName);

         // Fetch Batches for involved branches
         const branchIds = Array.from(new Set([
            ...filteredAssignments.map(a => a.branchId),
            ...filteredCoordinators.map(c => c.branchId)
         ]));
         const batchMap: Record<string, string> = {};
         const allBatches: Batch[] = [];

         for (const bid of branchIds) {
            const bts = await db.getBatches(bid);
            bts.forEach(b => { batchMap[b.id] = b.name; allBatches.push(b); });
         }

         setMetaData({ branches: branchMap, lockedBranches: lockedMap, batches: batchMap, subjects: subjectMap, faculty: facultyMap, rawBatches: allBatches });
         setAssignments(filteredAssignments);
         const coordIds = filteredCoordinators.map(c => c.branchId);
         setCoordinatorBranchIds(coordIds);
         if (coordIds.length > 0) setCoordinatorBranchId(coordIds[0]); // Default to first coordinator branch
         setLoadingInit(false);
      };
      init();
   }, [user.uid]);

   // 2. Load Branch Students & Attendance Data
   useEffect(() => {
      if (selBranchId && selSubjectId) {
         const load = async () => {
            setLoadingStudents(true);
            try {
               // Auto-heal / sync missing attendance records for late added students in background
               db.syncMissingAttendanceForBranch(selBranchId).then(async () => {
                  const fresh = await db.getAttendance(selBranchId, 'ALL', selSubjectId);
                  setAllClassRecords(fresh);
               }).catch(e => console.warn("Sync missing attendance warning:", e));

               // Fetch ALL students for the branch, we filter in UI based on selectedMarkingBatches
               const data: User[] = await db.getStudents(selBranchId);

               // Deduplicate
               const unique: User[] = Array.from(new Map(data.map(s => [s.uid, s])).values());
               // Sort numerically by Sr No
               setAllBranchStudents(unique.sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })));

               // Load Attendance
               // For 'ALL' batches context, we fetch everything for this subject/branch
               setAllClassRecords(await db.getAttendance(selBranchId, 'ALL', selSubjectId));
            } finally {
               setLoadingStudents(false);
            }
         };
         load();
      }
   }, [selBranchId, selSubjectId]);

   // 2.1 Load Marks Data
   useEffect(() => {
      if (selBranchId && selSubjectId && activeTab === 'MARKS') {
         const load = async () => {
            setLoadingMarks(true);
            try {
               // Use 'ALL' for batch as we filter visible students in UI
               const existingMarks = await db.getMarks(selBranchId, 'ALL', selSubjectId, midSemType);
               const marksMap: Record<string, number> = {};
               existingMarks.forEach(m => marksMap[m.studentId] = m.marksObtained);
               setMarksData(marksMap);
               if (existingMarks.length > 0) {
                  setMaxMarks(existingMarks[0].maxMarks);
               }
            } catch (e) {
               console.error("Failed to load marks", e);
            } finally {
               setLoadingMarks(false);
            }
         };
         load();
      }
   }, [selBranchId, selSubjectId, midSemType, activeTab]);

   // 3. Initialize Batch Selection when Subject/Branch changes
   useEffect(() => {
      if (selBranchId && selSubjectId) {
         // Find all relevant batches for this subject assignment
         // Logic: If assigned 'ALL' -> Select all batches in branch.
         // If assigned specific -> Select specific.
         const rel = assignments.filter(a => a.branchId === selBranchId && a.subjectId === selSubjectId);
         let batchesToSelect: string[] = [];

         if (rel.some(a => a.batchId === 'ALL')) {
            batchesToSelect = metaData.rawBatches.filter(b => b.branchId === selBranchId).map(b => b.id);
         } else {
            batchesToSelect = Array.from(new Set(rel.map(a => a.batchId)));
         }
         setSelectedMarkingBatches(batchesToSelect);
      }
   }, [selBranchId, selSubjectId, assignments, metaData.rawBatches]);

   // 3. Reset marking selection when Branch or Subject changes to prevent cross-class mistakes
   useEffect(() => {
      setSelectedSlots([]);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setAttendanceStatus({});
      setIsEditMode(false);
      setSaveMessage('');
   }, [selBranchId, selSubjectId]);

   // 4. Initialize Status / Detect Edit Mode
   // Track previous state to avoid unnecessary resets
   const prevContextRef = React.useRef<{ date: string, branchId: string, subjectId: string, batchIds: string }>({
      date: '', branchId: '', subjectId: '', batchIds: ''
   });

   useEffect(() => {
      // Identify students currently visible
      const visible = allBranchStudents.filter(s => s.studentData?.batchId && selectedMarkingBatches.includes(s.studentData.batchId));

      const existingRecords = allClassRecords.filter(r =>
         r.date === attendanceDate &&
         r.branchId === selBranchId &&
         r.subjectId === selSubjectId &&
         selectedSlots.includes(r.lectureSlot || 1)
      );

      const currentContext = {
         date: attendanceDate,
         branchId: selBranchId,
         subjectId: selSubjectId,
         batchIds: selectedMarkingBatches.sort().join(',')
      };

      const contextChanged = currentContext.date !== prevContextRef.current.date ||
         currentContext.branchId !== prevContextRef.current.branchId ||
         currentContext.subjectId !== prevContextRef.current.subjectId ||
         currentContext.batchIds !== prevContextRef.current.batchIds;

      const newStatus: Record<string, boolean> = {};

      if (existingRecords.length > 0) {
         // Found existing records in DB - Sync UI with DB (Edit Mode)
         visible.forEach(s => {
            const rec = existingRecords.find(r => r.studentId === s.uid);
            newStatus[s.uid] = rec ? rec.isPresent : true;
         });
         setIsEditMode(true);
         setAttendanceStatus(newStatus);
      } else {
         // No existing records found for this combination
         const wasEditMode = isEditMode;
         setIsEditMode(false);

         // Only reset status to "All Present" if:
         // 1. We were switching from a saved record to a blank one (wasEditMode)
         // 2. The whole context (Date/Subject/Batches) has changed
         // 3. Status is currently empty
         if (wasEditMode || contextChanged || Object.keys(attendanceStatus).length === 0) {
            visible.forEach(s => newStatus[s.uid] = true);
            setAttendanceStatus(newStatus);
         }
         // Otherwise, if we were just marking a new session and added a slot, keep the current marks!
      }

      prevContextRef.current = currentContext;
   }, [selectedMarkingBatches, attendanceDate, selectedSlots, allClassRecords, selBranchId, selSubjectId, allBranchStudents]);


   // --- Selection Logic ---
   const availableBranches = useMemo(() => {
      const ids = Array.from(new Set(assignments.map(a => a.branchId))).filter(id => typeof id === 'string' && id.trim() !== '');
      return ids
         .map(id => ({ id, name: metaData.branches[id] || id }))
         .filter(b => typeof b.name === 'string' && b.name.toLowerCase() !== 'select branch');
   }, [assignments, metaData.branches]);

   const availableSubjects = useMemo(() => {
      if (!selBranchId) return [];
      // Show all subjects assigned to this faculty in this branch
      const rel = assignments.filter(a => a.branchId === selBranchId);
      const uniqueIds = Array.from(new Set(rel.map(a => a.subjectId)));
      return uniqueIds.map(sid => ({ id: sid, ...metaData.subjects[sid] }));
   }, [selBranchId, assignments, metaData.subjects]);

   // "Batches" Options for Multi-Select in Toolbar
   const sameSubjectBatches = useMemo(() => {
      if (!selBranchId || !selSubjectId) return [];

      const rel = assignments.filter(a => a.branchId === selBranchId && a.subjectId === selSubjectId);
      // If we have an 'ALL' assignment, allow selecting from ALL batches in branch
      if (rel.some(a => a.batchId === 'ALL')) return metaData.rawBatches.filter(b => b.branchId === selBranchId);

      const bids = Array.from(new Set(rel.map(a => a.batchId)));
      return bids.map(bid => ({ id: bid, name: metaData.batches[bid] || bid }));
   }, [assignments, selBranchId, selSubjectId, metaData.batches, metaData.rawBatches]);

   // Derived Students List (Visual)
   const visibleStudents = useMemo(() => {
      return allBranchStudents.filter(s => s.studentData?.batchId && selectedMarkingBatches.includes(s.studentData.batchId));
   }, [allBranchStudents, selectedMarkingBatches]);

   // Memoized History Data Processing for high performance
   const historyProcessedData = useMemo(() => {
      if (activeTab !== 'HISTORY') return { filteredStudents: [], batchGroupMap: new Map(), studentStats: new Map() };

      // 1. Statistics Calculation (Pre-compute per-student stats for the selected period)
      const statsMap = new Map<string, { total: number, present: number, pct: number, filteredRecs: AttendanceRecord[], dateRecs: AttendanceRecord[] }>();

      // Determine subject type for correct session counting
      const currentSubject = metaData.subjects[selSubjectId];
      const isLabSubject = currentSubject?.type === 'lab';

      // For THEORY: sessions are branch-wide (same for all batches — one class for everyone)
      // Pre-compute theory sessions once (unique date_slot across all records of this subject in date range)
      const theorySessionsInRange = new Set(
         allClassRecords
            .filter(r => {
               const inStart = !historyStartDate || r.date >= historyStartDate;
               const inEnd = !historyTillDate || r.date <= historyTillDate;
               return inStart && inEnd;
            })
            .map(r => `${r.date}_${r.lectureSlot}`)
      );

      // For LAB: sessions are per-batch (different batches have different lab sessions)
      // Pre-compute lab sessions per batchId
      const labSessionsPerBatch = new Map<string, Set<string>>();
      allClassRecords
         .filter(r => {
            const inStart = !historyStartDate || r.date >= historyStartDate;
            const inEnd = !historyTillDate || r.date <= historyTillDate;
            return inStart && inEnd;
         })
         .forEach(r => {
            const bId = r.batchId;
            if (!labSessionsPerBatch.has(bId)) labSessionsPerBatch.set(bId, new Set());
            labSessionsPerBatch.get(bId)!.add(`${r.date}_${r.lectureSlot}`);
         });

      visibleStudents.forEach(s => {
         const myRecs = allClassRecords.filter(r => r.studentId === s.uid);
         const filteredRecs = myRecs.filter(r => {
            const inStart = !historyStartDate || r.date >= historyStartDate;
            const inEnd = !historyTillDate || r.date <= historyTillDate;
            return inStart && inEnd;
         });

         // Sessions held = NOT student's own records, but the actual sessions conducted
         // Theory: all batches share the same session count (one class)
         // Lab: each batch has its own independent session count
         let baseTotal: number;
         if (isLabSubject) {
            const studentBatchId = s.studentData?.batchId || '';
            baseTotal = (labSessionsPerBatch.get(studentBatchId) || new Set()).size;
         } else {
            baseTotal = theorySessionsInRange.size;
         }
         const total = Math.max(baseTotal, filteredRecs.length);

         const present = filteredRecs.filter(r => r.isPresent).length;
         const pct = total === 0 ? 0 : Math.round((present / total) * 100);
         const dateRecs = myRecs.filter(r => r.date === historyFilterDate);

         statsMap.set(s.uid, { total, present, pct, filteredRecs, dateRecs });
      });

      // 2. Filtration Logic (Apply UI filters on score threshold)
      const filtered = visibleStudents.filter(s => {
         if (historyFilterDate) return true;
         if (attendanceFilter === 'CUSTOM') {
            const stats = statsMap.get(s.uid)!;
            const pct = stats.pct;
            if (attendanceOperator === 'GE') return pct >= attendanceThreshold;
            if (attendanceOperator === 'LE') return pct <= attendanceThreshold;
            if (attendanceOperator === 'GT') return pct > attendanceThreshold;
            if (attendanceOperator === 'LT') return pct < attendanceThreshold;
         }
         return true;
      });

      // 3. Batch Grouping
      const batchGroupMap = new Map<string, User[]>();
      filtered.forEach(s => {
         const bId = s.studentData?.batchId || 'UNASSIGNED';
         if (!batchGroupMap.has(bId)) batchGroupMap.set(bId, []);
         batchGroupMap.get(bId)!.push(s);
      });

      return { filteredStudents: filtered, batchGroupMap, studentStats: statsMap };
   }, [
      activeTab,
      visibleStudents,
      allClassRecords,
      historyFilterDate,
      historyStartDate,
      historyTillDate,
      attendanceFilter,
      attendanceThreshold,
      attendanceOperator,
      selSubjectId,
      metaData.subjects
   ]);


   // --- Handlers ---
   const handleMark = (uid: string) => {
      if (selectedSlots.length === 0) return;
      setAttendanceStatus(prev => ({ ...prev, [uid]: !prev[uid] }));
   };

   const handleMarkAll = (status: boolean) => {
      if (selectedSlots.length === 0) return;
      const newStatus: Record<string, boolean> = {};
      visibleStudents.forEach(s => newStatus[s.uid] = status);
      setAttendanceStatus(prev => ({ ...prev, ...newStatus }));
   };

   const toggleSlot = (slot: number) => {
      setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort());
   };

   const toggleBatchSelection = (batchId: string) => {
      setSelectedMarkingBatches(prev => {
         if (prev.includes(batchId)) return prev.filter(id => id !== batchId);
         return [...prev, batchId];
      });
   };

   const handleSaveMarks = async () => {
      if (!selBranchId || !selSubjectId) return;
      if (!window.confirm("Are you sure you want to save these marks?")) return;

      const latestBranches = await db.getBranches();
      const currentBranch = latestBranches.find(b => b.id === selBranchId);
      if (currentBranch?.view_only && !isCoordinatorForClass) {
         alert("Error: This class is locked by the Admin. Please refresh your page.");
         return;
      }

      setIsSaving(true);
      try {
         const updates = visibleStudents.map(s => ({
            studentId: s.uid,
            subjectId: selSubjectId,
            facultyId: user.uid,
            midSemType: midSemType,
            marksObtained: marksData[s.uid] || 0,
            maxMarks: maxMarks
         }));
         await db.saveMarks(updates);
         setSaveMessage('Marks Saved Successfully!');
         setTimeout(() => setSaveMessage(''), 3000);
      } catch (e: any) {
         alert("Error saving marks: " + e.message);
      } finally {
         setIsSaving(false);
      }
   };

   const handleExportMarks = async () => {
      if (!selBranchId || !selSubjectId || visibleStudents.length === 0) return;
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus('Analyzing student records...');
      try {
         // Simulate progress for local processing
         setExportProgress(15);
         setExportStatus('Formatting data...');
         await new Promise(r => setTimeout(r, 400));
         const branchName = metaData.branches[selBranchId] || selBranchId;
      const subject = metaData.subjects[selSubjectId];
      const examName = midSemType === 'MID_SEM_1' ? 'MST 1' : midSemType === 'MID_SEM_2' ? 'MST 2' : 'Remedial MST';

      const data = visibleStudents.map(s => {
         const marksValue = marksData[s.uid] ?? 0;
         const isAbsent = marksValue === -1;
         const pctValue = maxMarks > 0 ? (isAbsent ? '0.00' : ((marksValue / maxMarks) * 100).toFixed(2)) : '0.00';
         
         return {
            'Student Name': s.displayName,
            'Enrollment Number': s.studentData?.enrollmentId || '',
            'Roll Number': s.studentData?.rollNo || '',
            'Class/Batch': metaData.batches[s.studentData?.batchId || ''] || 'ALL',
            'Subject Name': subject?.name || '',
            'Subject Code': subject?.code || '',
            'Exam': examName,
            'Marks Obtained': isAbsent ? 'A' : marksValue,
            'Max Marks': maxMarks,
            'Result (%)': pctValue + '%',
            'Faculty Name': user.displayName
         };
      });

      setExportProgress(45);
      setExportStatus('Generating Excel worksheets...');
      await new Promise(r => setTimeout(r, 500));

      const examTitle = midSemType === 'MID_SEM_1' ? 'MID SEMESTER TEST - I' : midSemType === 'MID_SEM_2' ? 'MID SEMESTER TEST - II' : 'REMEDIAL MST';
      const now = new Date();
      const currentYear = now.getFullYear();
      const session = now.getMonth() >= 6 ? `${currentYear}-${(currentYear + 1) % 100}` : `${currentYear - 1}-${currentYear % 100}`;
      
      const headerAOA = [
         ['ACROPOLIS INSTITUTE OF TECHNOLOGY AND RESEARCH'],
         ['DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING'],
         [`${examTitle} | SESSION: ${session}`],
         [`SUBJECT: ${subject?.name.toUpperCase()} (${subject?.code}) | FACULTY: ${user.displayName.toUpperCase()}`],
         [`BRANCH: ${branchName.toUpperCase()} | DATE: ${now.toLocaleDateString()}`],
         [] // Spacer
      ];

      const tableHeaders = Object.keys(data[0] || {});
      const tableData = data.map(row => Object.values(row));
      const finalAOA = [...headerAOA, tableHeaders, ...tableData];

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('MST Marks');

      sheet.addRows(finalAOA);

      // Merges for Header
      sheet.mergeCells(1, 1, 1, tableHeaders.length);
      sheet.mergeCells(2, 1, 2, tableHeaders.length);
      sheet.mergeCells(3, 1, 3, tableHeaders.length);
      sheet.mergeCells(4, 1, 4, tableHeaders.length);
      sheet.mergeCells(5, 1, 5, tableHeaders.length);

      // Auto-size columns
      sheet.columns.forEach((col, i) => {
         let maxLen = tableHeaders[i]?.length || 10;
         tableData.forEach(row => {
            const len = String(row[i] || '').length;
            if (len > maxLen) maxLen = len;
         });
         col.width = maxLen + 4;
      });

      // Apply Styling
      sheet.eachRow((row, rowNumber) => {
         row.eachCell((cell, colNumber) => {
            cell.font = { name: "Calibri", size: 11 };
            cell.alignment = { vertical: "middle", horizontal: "left" };

            const R = rowNumber - 1;
            const C = colNumber - 1;

            // Branding Header Styling
            if (R >= 0 && R <= 4) {
               cell.alignment = { horizontal: "center" };
               cell.font = { bold: true };
               if (R === 0) cell.font = { size: 16, bold: true };
               if (R === 1) cell.font = { size: 14, bold: true };
            }

            // Table Headers (Row 6)
            if (R === 6) {
               cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
               cell.font = { bold: true };
               cell.border = {
                  bottom: { style: "thin", color: { argb: "FF000000" } },
                  top: { style: "thin", color: { argb: "FF000000" } }
               };
            }

            // Marks Column (Index 7: Marks Obtained)
            if (C === 7 && R > 6) {
               cell.alignment = { horizontal: "right" };
               if (cell.value === 'A') {
                  cell.font = { color: { argb: "FFFF0000" }, bold: true };
               }
            }
         });
      });

      setExportProgress(80);
      setExportStatus('Finalizing branding...');
      await new Promise(r => setTimeout(r, 600));

      setExportProgress(100);
      setExportStatus('Download starting...');
      await new Promise(r => setTimeout(r, 300));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${branchName}_${subject?.code}_${examName}_Marks.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      } catch (e: any) {
         alert("Export failed: " + e.message);
      } finally {
         setTimeout(() => {
            setIsExporting(false);
            setExportProgress(0);
         }, 800);
      }
   };

   const handleSaveClick = async () => {
      if (selectedSlots.length === 0) return;
      if (visibleStudents.length === 0) { alert("No students selected."); return; }

      const latestBranches = await db.getBranches();
      const currentBranch = latestBranches.find(b => b.id === selBranchId);
      if (currentBranch?.view_only && !isCoordinatorForClass) {
         alert("Error: This class is locked by the Admin. Please refresh your page.");
         return;
      }

      setIsSaving(true);
      setNetworkError('');
      setConflictDetails(null);
      setIdsToDelete([]);

      try {
         // Fetch ALL attendance records for this branch/date to detect cross-subject conflicts
         const branchRecords = await db.getBranchAttendance(selBranchId, attendanceDate);

         let detectedConflict = null;
         let conflictIds: string[] = [];
         const visibleIds = new Set(visibleStudents.map(s => s.uid));

         // Iterate through selected slots and visible students
         for (const slot of selectedSlots) {
            const overlappingRecords = branchRecords.filter(r =>
               r.lectureSlot === slot && visibleIds.has(r.studentId)
            );

            if (overlappingRecords.length > 0) {
               conflictIds = [...conflictIds, ...overlappingRecords.map(r => r.id)];

               // Look for a record that is NOT from the current session context (Conflict)
               // A conflict is when someone else marked it, OR when I marked it for a DIFFERENT subject
               const conflictRec = overlappingRecords.find(r =>
                  r.subjectId !== selSubjectId || r.markedBy !== user.uid
               );

               if (conflictRec) {
                  // We found a meaningful conflict!
                  const conflictStats = {
                     present: overlappingRecords.filter(r => r.isPresent).length,
                     total: overlappingRecords.length
                  };

                  detectedConflict = {
                     markedBy: metaData.faculty[conflictRec.markedBy] || conflictRec.markedBy,
                     subjectName: metaData.subjects[conflictRec.subjectId]?.name || 'Unknown Subject',
                     slot: slot,
                     date: attendanceDate,
                     totalRecords: conflictStats.total,
                     presentCount: conflictStats.present,
                     timestamp: conflictRec.timestamp
                  };
                  break; // Show the first significant conflict found
               }
            }
         }

         setIdsToDelete(conflictIds);
         setConflictDetails(detectedConflict);
         setShowConfirmModal(true);
      } catch (e: any) {
         console.error(e);
         setNetworkError(`Error verifying records: ${e.message || 'Please retry.'}`);
         setShowConfirmModal(true);
      } finally {
         setIsSaving(false);
      }
   };

   const generateRecords = (): AttendanceRecord[] => {
      const records: AttendanceRecord[] = [];
      const timestamp = Date.now();

      selectedSlots.forEach(slot => {
         visibleStudents.forEach(s => {
            records.push({
               id: `${attendanceDate}_${s.uid}_L${slot}`,
               date: attendanceDate,
               studentId: s.uid,
               subjectId: selSubjectId,
               branchId: selBranchId,
               batchId: s.studentData!.batchId!,
               isPresent: attendanceStatus[s.uid] ?? true,
               markedBy: user.uid,
               timestamp: timestamp,
               lectureSlot: slot
            });
         });
      });
      return records;
   };

   const handleRequestOverwrite = async () => {
      if (!conflictDetails) return;
      setIsSaving(true);
      try {
         const allFaculty = await db.getFaculty();
         const targetUser = allFaculty.find(u => u.displayName === conflictDetails.markedBy || u.uid === conflictDetails.markedBy);

         if (!targetUser) {
            alert(`Could not find faculty user '${conflictDetails.markedBy}' to send request.`);
            return;
         }

         const pendingRecords = generateRecords();
         // Filter records only for the conflicting slot to stay precise? 
         // Or just send all selected slots? 
         // The conflict is likely one slot, but user might have selected multiple.
         // Let's send all generated records for the current selection.

         await db.createNotification({
            toUserId: targetUser.uid,
            fromUserId: user.uid,
            fromUserName: user.displayName,
            type: 'OVERWRITE_REQUEST',
            status: 'PENDING',
            data: {
               date: conflictDetails.date,
               slot: conflictDetails.slot,
               subjectName: metaData.subjects[selSubjectId]?.name || 'Unknown',
               branchId: selBranchId,
               reason: `Conflict in ${metaData.subjects[selSubjectId]?.code}`,
               payload: pendingRecords
            },
            timestamp: Date.now()
         });

         setSaveMessage(`Request sent to ${targetUser.displayName}`);
         setTimeout(() => setSaveMessage(''), 4000);
         setShowConfirmModal(false);
      } catch (e: any) {
         alert("Error sending request: " + e.message);
      } finally {
         setIsSaving(false);
      }
   };

   const executeSave = async () => {
      setIsSaving(true);
      setSaveMessage('');
      setNetworkError('');

      const records = generateRecords();

      try {
         // 1. Try to delete old records (Cleanup duplicates if any)
         // This is crucial for migrating from old non-canonical IDs.
         if (idsToDelete.length > 0) {
            try {
               await db.deleteAttendanceRecords(idsToDelete);
            } catch (delError: any) {
               if (delError.code === 'permission-denied') {
                  // IMPORTANT: If delete fails, we proceed. 
                  // The new record will be saved. The old duplicate will remain (Ghost Record).
                  // This is why users must update DB rules for full cleanup.
                  console.warn("Permission denied while cleaning up old records. Please update Firestore Rules.");
               } else {
                  console.warn("Could not delete old records", delError);
               }
            }
         }
         // 2. Direct Overwrite (Upsert)
         await db.saveAttendance(records);

         setSaveMessage('Attendance Saved & Synced!');

         // Refresh History
         setAllClassRecords(await db.getAttendance(selBranchId, 'ALL', selSubjectId));
         setTimeout(() => setSaveMessage(''), 3000);
         setShowConfirmModal(false);
      } catch (e: any) {
         if (e.code === 'permission-denied') {
            setNetworkError("PERMISSION DENIED: You cannot overwrite existing attendance. Please update Firestore Rules to allow write for the attendance collection.");
         } else {
            setNetworkError(`Error saving: ${e.message || 'Please retry.'}`);
         }
      } finally {
         setIsSaving(false);
         setConflictDetails(null);
         setIdsToDelete([]);
      }
   };

   const handleExportCSV = () => {
      if (allClassRecords.length === 0) {
         alert("No attendance records to export.");
         return;
      }
      setShowExportModal(true);
   };

   const executeExport = async () => {
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus('Initializing export...');

      try {
         await new Promise(r => setTimeout(r, 400));
         let recordsToExport = allClassRecords;
         const start = exportRange === 'CUSTOM' ? exportStartDate : '';
         const end = exportRange === 'CUSTOM' ? exportEndDate : '';

         recordsToExport = allClassRecords.filter(r => {
            const inStart = !start || r.date >= start;
            const inEnd = !end || r.date <= end;
            return r.subjectId === selSubjectId && inStart && inEnd;
         });

         if (recordsToExport.length === 0) {
            alert("No records found in the selected range.");
            setIsExporting(false);
            setShowExportModal(false);
            return;
         }

         const branchName = metaData.branches[selBranchId] || 'Branch';
         const subjectDetail = metaData.subjects[selSubjectId];
         const subjectName = subjectDetail?.name || 'Subject';
         const subjectCode = subjectDetail?.code || '';
         const facultyName = user.displayName;

         setExportProgress(20);
         setExportStatus('Processing attendance records...');
         await new Promise(r => setTimeout(r, 50));
         const lookupMap = new Map<string, AttendanceRecord>();
         recordsToExport.forEach(r => {
            const key = `${r.studentId}_${r.date}_${r.lectureSlot || 1}`;
            lookupMap.set(key, r);
         });

         const slotsMap = new Map<string, { date: string, slot: number }>();
         recordsToExport.forEach(r => {
            const slot = r.lectureSlot || 1;
            const key = `${r.date}_L${slot}`;
            if (!slotsMap.has(key)) slotsMap.set(key, { date: r.date, slot });
         });

         const sortedSlots = Array.from(slotsMap.values()).sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.slot - b.slot;
         });

         // Export ALL students in the branch, not just the ones visible/filtered in the UI
         const sortedStudents = [...allBranchStudents].sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true }));

         // --- 1. Headers ---
         const headerRows = [
            ["ACROPOLIS INSTITUTE OF RESEARCH AND TECHNOLOGY"],
            ["DEPT OF COMPUTER SCIENCE AND ENGINEERING"],
            [`Attendance Report: ${subjectName} (${subjectCode})`],
            [`Faculty: ${facultyName} | Class: ${branchName}`],
            [`Period: ${exportRange === 'TILL_TODAY' ? 'Full Session' : `${exportStartDate} to ${exportEndDate}`}`],
            [`Generated: ${new Date().toLocaleString()}`],
            []
         ];

         const isDetailed = exportFormat === 'DETAILED';

         // --- 2. Stats Calculation ---
         const studentStatsMap = new Map<string, { present: number, total: number }>();
         recordsToExport.forEach(r => {
            const current = studentStatsMap.get(r.studentId) || { present: 0, total: 0 };
            studentStatsMap.set(r.studentId, {
               present: current.present + (r.isPresent ? 1 : 0),
               total: current.total + 1
            });
         });

         setExportProgress(50);
         setExportStatus('Generating analytics...');
         await new Promise(r => setTimeout(r, 50));
         const stats = sortedStudents.map(s => {
            const aggregated = studentStatsMap.get(s.uid) || { present: 0, total: 0 };
            return { name: s.displayName, pct: aggregated.total === 0 ? 0 : (aggregated.present / aggregated.total) * 100 };
         });
         const classAvg = stats.length === 0 ? 0 : Math.round(stats.reduce((acc, curr) => acc + curr.pct, 0) / stats.length);
         const detentionCount = stats.filter(s => s.pct < 75).length;

         const statsInfo = [
            ["ATTENDANCE SUMMARY", ""],
            ["Total Students", sortedStudents.length.toString()],
            ["Class Average", `${classAvg}%`],
            ["Detention Count (<75%)", detentionCount.toString()],
            ["", ""]
         ];

         // --- 3. Data Assembly ---
         const dataHeaders = ['Roll No', 'Student Name', 'Enrollment No', 'Classes Held', 'Classes Attended', 'Attendance %'];
         if (isDetailed) {
            dataHeaders.push(...sortedSlots.map(s => `${s.date} (L${s.slot})`));
         }

         let excelRows: any[][] = [...headerRows, ...statsInfo];

         const batchesMap = new Map<string, User[]>();
         sortedStudents.forEach(s => {
            const bId = s.studentData?.batchId || 'UNASSIGNED';
            if (!batchesMap.has(bId)) batchesMap.set(bId, []);
            batchesMap.get(bId)!.push(s);
         });

         Array.from(batchesMap.entries()).forEach(([batchId, batchStudents]) => {
            const batchNameStr = metaData.batches[batchId] || batchId;

            excelRows.push([]);
            excelRows.push([`>>> BATCH: ${batchNameStr} <<<`]);
            excelRows.push(dataHeaders);

            const batchDataRows = batchStudents.map(s => {
               const stats = studentStatsMap.get(s.uid) || { present: 0, total: 0 };
               const presentCount = stats.present;
               const totalSessions = stats.total;
               const pct = totalSessions === 0 ? 0 : Math.round((presentCount / totalSessions) * 100);

               const row = [s.studentData?.rollNo || '', s.displayName, s.studentData?.enrollmentId || '', totalSessions.toString(), presentCount.toString(), `${pct}%`];
               if (isDetailed) {
                  sortedSlots.forEach(slotInfo => {
                     const rec = lookupMap.get(`${s.uid}_${slotInfo.date}_${slotInfo.slot}`);
                     row.push(rec ? (rec.isPresent ? 'P' : 'A') : '-');
                  });
               }
               return row;
            });

            excelRows = excelRows.concat(batchDataRows);
            excelRows.push([]);
         });

         setExportProgress(85);
         setExportStatus('Applying institutional branding...');
         await new Promise(r => setTimeout(r, 500));
         const workbook = new ExcelJS.Workbook();
         const sheet = workbook.addWorksheet('Attendance Report');

         sheet.addRows(excelRows);

         // Merges
         const mergeEndCol = dataHeaders.length - 1;
         sheet.mergeCells(1, 1, 1, mergeEndCol + 1);
         sheet.mergeCells(2, 1, 2, mergeEndCol + 1);
         sheet.mergeCells(3, 1, 3, mergeEndCol + 1);
         sheet.mergeCells(4, 1, 4, mergeEndCol + 1);

         // Auto Width
         sheet.columns.forEach((col, i) => {
            let maxLen = 10;
            excelRows.forEach((row, ri) => {
               if (ri < 10) return;
               if (row[i]) {
                  const len = row[i].toString().length;
                  if (len > maxLen) maxLen = len;
               }
            });
            col.width = maxLen + 4;
         });

         // --- 4. Apply Colors & Styles ---
         sheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
               cell.font = { name: "Calibri", size: 11 };
               cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
               cell.border = {
                  top: { style: "thin", color: { argb: "FFE2E8F0" } },
                  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                  left: { style: "thin", color: { argb: "FFE2E8F0" } },
                  right: { style: "thin", color: { argb: "FFE2E8F0" } }
               };

               const R = rowNumber - 1;
               const C = colNumber - 1;
               const rowVal0 = excelRows[R]?.[0]?.toString() || '';

               if (R >= 0 && R <= 3) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002D62' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
                  cell.alignment = { horizontal: "center" };
               }
               if (R >= 8 && R <= 11 && C === 0) {
                  cell.font = { bold: true };
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
               }
               if (rowVal0.startsWith('>>> BATCH')) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
                  cell.alignment = { horizontal: "center" };
               }
               if (rowVal0 === 'Sr No') {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                  cell.alignment = { horizontal: "center" };
               }
               if (rowVal0 && rowVal0 !== 'Sr No' && !rowVal0.startsWith('>>> BATCH') && R > 10 && C === 5) {
                  const valText = cell.value?.toString() || '';
                  const val = parseInt(valText);
                  if (!isNaN(val)) {
                     if (val >= 90) cell.font = { color: { argb: 'FF059669' }, bold: true };
                     else if (val < 75) cell.font = { color: { argb: 'FFDC2626' }, bold: true };
                     else cell.font = { bold: true };
                  }
               }
            });
         });

         excelRows.forEach((row, R) => {
            if (row[0]?.toString().startsWith('>>> BATCH')) {
               sheet.mergeCells(R + 1, 1, R + 1, mergeEndCol + 1);
            }
         });

         setExportProgress(100);
         setExportStatus('Starting download...');
         await new Promise(r => setTimeout(r, 500));
         
         const buffer = await workbook.xlsx.writeBuffer();
         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
         const url = URL.createObjectURL(blob);
         const link = document.createElement("a");
         link.href = url;
         link.download = `${subjectCode}_${branchName}_Report.xlsx`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         URL.revokeObjectURL(url);

      } catch (error) {
         console.error("Export Error:", error);
         alert("Export failed. Please check your connection and try again.");
      } finally {
         setTimeout(() => {
            setIsExporting(false);
            setExportProgress(0);
            setShowExportModal(false);
         }, 800);
      }
   };

   const handleShareAttendance = async () => {
      const targetDate = historyFilterDate || new Date().toISOString().split('T')[0];
      const targetRecords = allClassRecords.filter(r => r.date === targetDate && r.subjectId === selSubjectId);

      if (targetRecords.length === 0) {
         alert(`No attendance records found for ${targetDate} to share.`);
         return;
      }

      const subjectDetail = metaData.subjects[selSubjectId];
      const subjectName = subjectDetail?.name || 'Subject';
      const subjectCode = subjectDetail?.code || '';
      const branchName = metaData.branches[selBranchId] || 'Class';
      
      const slots = Array.from(new Set(targetRecords.map(r => r.lectureSlot))).filter(Boolean).sort((a,b) => (a as number) - (b as number));

      let message = `*DAILY ATTENDANCE SUMMARY*\n`;
      message += `*Date:* ${new Date(targetDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      message += `*Subject:* ${subjectName.toUpperCase()} (${subjectCode})\n`;
      message += `*Faculty:* ${user.displayName}\n`;
      message += `*Class:* ${branchName}\n`;
      message += `-------------------\n`;

      // Create a mapping of [studentId][slot] -> isPresent
      const attendanceMap: Record<string, Record<number, boolean>> = {};
      targetRecords.forEach(r => {
         if (!attendanceMap[r.studentId]) attendanceMap[r.studentId] = {};
         if (r.lectureSlot) attendanceMap[r.studentId][r.lectureSlot] = r.isPresent;
      });

      // Generate Reliable ASCII Table (Mobile Friendly)
      let table = "```\n";
      
      // Header
      let headerTop = "+----+--------------+";
      let headerMid = "| RN | NAME         |";
      slots.forEach(s => {
         headerTop += "---+";
         headerMid += ` L${s}|`;
      });
      table += headerTop + "\n" + headerMid + "\n" + headerTop + "\n";
      
      const sortedAll = [...allBranchStudents].sort((a,b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, {numeric: true}));
      
      sortedAll.forEach(s => {
         const roll = (s.studentData?.rollNo || '00').slice(-2).padStart(2, '0');
         const name = (s.displayName || 'Unknown').split(' ')[0].slice(0, 12).toUpperCase().padEnd(12, ' ');
         
         let row = `| ${roll} | ${name} |`;
         slots.forEach(slot => {
            const status = attendanceMap[s.uid]?.[slot as number];
            const char = status === undefined ? '-' : (status ? 'P' : 'A');
            row += ` ${char} |`;
         });
         table += row + "\n";
      });
      table += headerTop + "\n```";

      message += `\n${table}`;
      message += `\n_Generated via Acro Attendance App_`;
      message += `\n\n_Developed by:_ *Aayush Sharma*\nhttps://itsaayushsharma.vercel.app/`;

      if (navigator.share) {
         try {
            await navigator.share({ title: 'Attendance Report', text: message });
         } catch (err) {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
         }
      } else {
         window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      }
   };

   const downloadCSV = (rows: string[][], filename: string) => {
      const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   // --- Delete Handler ---
    const confirmDelete = async () => {
       if (!historyFilterDate || slotsToDeleteInModal.length === 0) return;
       setIsDeleting(true);
       try {
          // Identify records to delete
          const recordsToDelete = allClassRecords.filter(r => 
             r.date === historyFilterDate && 
             slotsToDeleteInModal.includes(r.lectureSlot || 0)
          );
          const ids = recordsToDelete.map(r => r.id);
 
          if (ids.length > 0) {
             await db.deleteAttendanceRecords(ids);
 
             // Local Update
             setAllClassRecords(prev => prev.filter(r => !ids.includes(r.id)));
             setSaveMessage('Records Deleted Successfully');
             setTimeout(() => setSaveMessage(''), 3000);
          }
          setShowDeleteModal(false);
          if (allClassRecords.filter(r => r.date === historyFilterDate && !ids.includes(r.id)).length === 0) {
             setHistoryFilterDate(''); // Only reset if no slots left for this day
          }
       } catch (e: any) {
          alert("Error deleting records: " + e.message);
       } finally {
          setIsDeleting(false);
       }
    };

   // --- Render Helpers ---
   const SelectionPrompt = () => {
      if (availableBranches.length === 0) {
         return (
            <div className="flex flex-col items-center justify-center py-10 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
               <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">No Classes Allotted</h3>
               <p className="text-sm text-slate-400 font-medium text-center max-w-[250px]">You have not been assigned to any classes by the admin yet.</p>
            </div>
         );
      }

      if (!selBranchId) {
         const uniqueBranches: string[] = [];
         const seen = new Set<string>();
         sortedAssignments.forEach(a => {
            if (!seen.has(a.branchId)) {
               seen.add(a.branchId);
               uniqueBranches.push(a.branchId);
            }
         });

         return (
            <div className="flex flex-col py-10 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
               <div className="text-center mb-8">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Ready to Start?</h3>
                  <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">Select a class from the drop down above, or choose from your allotted classes below.</p>
               </div>
               
               <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl mx-auto">
                  {uniqueBranches.map((branchId, idx) => {
                     const branchName = metaData.branches[branchId] || branchId;
                     return (
                        <button
                           key={idx}
                           onClick={() => setSelection(branchId, '')}
                           className="w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)] max-w-xs flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100 transition-all text-center group"
                        >
                           <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Users className="w-6 h-6" />
                           </div>
                           <h4 className="font-black text-slate-800 leading-tight mb-1 group-hover:text-indigo-900">
                              {branchName}
                           </h4>
                        </button>
                     );
                  })}
               </div>
            </div>
         );
      }

      const uniqueSubjectsForBranch: string[] = [];
      const seenSubj = new Set<string>();
      sortedAssignments.forEach(a => {
         if (a.branchId === selBranchId && !seenSubj.has(a.subjectId)) {
            seenSubj.add(a.subjectId);
            uniqueSubjectsForBranch.push(a.subjectId);
         }
      });

      return (
         <div className="flex flex-col py-10 px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-8">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Select Subject</h3>
               <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">Select a subject from the drop down above, or choose from your allotted subjects below.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl mx-auto">
               {uniqueSubjectsForBranch.map((subjId, idx) => {
                  const subject = metaData.subjects[subjId];
                  return (
                     <button
                        key={idx}
                        onClick={() => setSelection(selBranchId, subjId)}
                        className="w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)] max-w-xs flex flex-col items-start p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100 transition-all text-left group"
                     >
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                           {subject?.code || 'SUB'} • {subject?.type === 'lab' ? 'LAB' : 'THEORY'}
                        </div>
                        <h4 className="font-black text-slate-800 leading-tight mb-1 group-hover:text-indigo-900 line-clamp-2">
                           {subject?.name || 'Unknown Subject'}
                        </h4>
                     </button>
                  );
               })}
            </div>
         </div>
      );
   };

   // Drill Down View
   if (viewHistoryStudent) {
      const currentSubject = metaData.subjects[selSubjectId];
      const isLabSubject = currentSubject?.type === 'lab';
      const studentBatchId = viewHistoryStudent.studentData?.batchId || '';

      // Collect all sessions conducted for this subject relevant to this student
      const sessionMap = new Map<string, { date: string; lectureSlot: number; batchId: string }>();
      allClassRecords.forEach(r => {
         if (isLabSubject && r.batchId !== studentBatchId && r.batchId !== 'ALL') return;
         const slot = r.lectureSlot || 1;
         const key = `${r.date}_${slot}`;
         if (!sessionMap.has(key)) {
            sessionMap.set(key, { date: r.date, lectureSlot: slot, batchId: r.batchId });
         }
      });

      const myRecords = allClassRecords.filter(r => r.studentId === viewHistoryStudent.uid);
      const myRecordsByKey = new Map<string, AttendanceRecord>();
      myRecords.forEach(r => {
         const slot = r.lectureSlot || 1;
         myRecordsByKey.set(`${r.date}_${slot}`, r);
      });

      // Construct timeline: every conducted session is accounted for
      // If student was marked, show actual record; if added late, synthesize ABSENT
      const studentRecords: AttendanceRecord[] = Array.from(sessionMap.values()).map(sess => {
         const key = `${sess.date}_${sess.lectureSlot}`;
         if (myRecordsByKey.has(key)) {
            return myRecordsByKey.get(key)!;
         }
         return {
            id: `late_abs_${viewHistoryStudent.uid}_${sess.date}_${sess.lectureSlot}`,
            studentId: viewHistoryStudent.uid,
            date: sess.date,
            lectureSlot: sess.lectureSlot,
            subjectId: selSubjectId,
            branchId: selBranchId,
            batchId: studentBatchId,
            isPresent: false,
            timestamp: new Date(sess.date).getTime(),
            markedBy: '',
            reason: 'Added late to class'
         } as AttendanceRecord;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.lectureSlot || 0) - (a.lectureSlot || 0));

      const total = studentRecords.length;
      const present = studentRecords.filter(r => r.isPresent).length;
      const pct = total === 0 ? 0 : Math.round((present / total) * 100);

      return (
         <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100">
               <div className="flex items-center justify-between mb-8">
                  <button onClick={() => setViewHistoryStudent(null)} className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
                     <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="text-right">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">Attendance Score</div>
                     <div className={`text-2xl font-black ${pct < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>{pct}%</div>
                  </div>
               </div>

               <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border-2 border-indigo-100 font-black text-2xl uppercase">
                     {viewHistoryStudent.displayName?.charAt(0)}
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1.5">{viewHistoryStudent.displayName}</h3>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold py-0.5 px-2 bg-slate-100 text-slate-900 rounded-lg">{viewHistoryStudent.studentData?.enrollmentId}</span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 italic">Sr No: {viewHistoryStudent.studentData?.rollNo || '-'}</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                     <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-black">P</div>
                     <div>
                        <div className="text-[10px] font-black text-emerald-600/60 uppercase leading-none mb-1">Present</div>
                        <div className="text-sm font-black text-emerald-700 leading-none">{present}</div>
                     </div>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 flex items-center gap-3">
                     <div className="h-8 w-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-600 font-black">A</div>
                     <div>
                        <div className="text-[10px] font-black text-rose-600/60 uppercase leading-none mb-1">Absent</div>
                        <div className="text-sm font-black text-rose-700 leading-none">{total - present}</div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Timeline</h4>
                  <div className="h-[1px] flex-1 bg-slate-100 mx-4"></div>
               </div>

               <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 pb-10">
                  {studentRecords.map(r => (
                     <div key={r.id} className={`group relative p-4 rounded-2xl border transition-all hover:shadow-lg ${r.isPresent ? 'bg-white border-emerald-100/50' : 'bg-rose-50/30 border-rose-100'}`}>
                        <div className={`absolute top-0 right-0 h-10 w-10 rounded-bl-full opacity-10 ${r.isPresent ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <div className="text-[10px] font-bold text-slate-400 mb-1 group-hover:text-slate-600 transition-colors">{r.date.split('-').reverse().slice(0, 2).join('/')}</div>
                        <div className={`text-sm font-black leading-none mb-2 ${r.isPresent ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {r.isPresent ? 'PRESENT' : 'ABSENT'}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                           <div className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100/50 text-[9px] font-black text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              SLOT {r.lectureSlot || 1}
                           </div>
                           {r.reason && (
                              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                                 {r.reason}
                              </span>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      );
   }

   if (loadingInit) {
      return (
         <div className="space-y-6 pb-20 p-4">
            {/* Skeleton Command Center */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <Skeleton width="20%" height={16} />
                     <Skeleton width="100%" height={40} />
                  </div>
                  <div className="space-y-2">
                     <Skeleton width="20%" height={16} />
                     <Skeleton width="100%" height={40} />
                  </div>
               </div>
            </div>

            {/* Skeleton Tabs */}
            <div className="flex gap-4 border-b border-slate-200 py-2">
               <Skeleton width={120} height={40} />
               <Skeleton width={120} height={40} />
            </div>

            {/* Skeleton Content */}
            <div className="space-y-4">
               <Skeleton width="100%" height={60} />
               <Skeleton width="100%" height={200} />
            </div>
         </div>
      );
   }

   const showDashboard = selBranchId && selSubjectId;

   return (
      <div className={`w-full overflow-x-hidden space-y-6 ${showDashboard || forceCoordinatorView ? 'pb-32' : 'pb-6'}`}>
         {/* 1. Command Center / Top Bar */}
         {!forceCoordinatorView && (
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-5 rounded-3xl mb-2 shadow-xl shadow-indigo-200/50 border border-indigo-700/30">
               <div className="flex items-center gap-3 mb-5">
                  <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                     <Layers className="h-7 w-7 text-indigo-100" />
                  </div>
                  <div>
                     <h1 className="text-xl font-black text-white leading-tight">Welcome Back, {user.displayName}!</h1>
                     <p className="text-indigo-200 text-[10px] font-black tracking-[0.2em] uppercase opacity-80">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="relative group">
                     <label className="absolute left-3 top-2 text-[10px] font-black text-indigo-300 uppercase tracking-widest z-10 transition-all group-focus-within:text-white">Class</label>
                     <select
                        value={selBranchId}
                        onChange={e => { setSelection(e.target.value, ''); }}
                        className="w-full bg-indigo-950 border border-white/20 text-white rounded-xl pt-6 pb-2 px-3 text-sm font-bold focus:ring-2 focus:ring-white/20 focus:outline-none transition-all appearance-none"
                     >
                        <option value="" className="text-slate-900 bg-white">Select Class</option>
                        {availableBranches.map(b => <option key={b.id} value={b.id} className="text-slate-900 bg-white">{b.name}</option>)}
                     </select>
                     <ChevronDown className="absolute right-3 bottom-3 h-4 w-4 text-indigo-300 pointer-events-none" />
                  </div>
                  <div className="relative group">
                     <label className="absolute left-3 top-2 text-[10px] font-black text-indigo-300 uppercase tracking-widest z-10 transition-all group-focus-within:text-white">Subject</label>
                     <select
                        value={selSubjectId}
                        onChange={e => setSelection(selBranchId, e.target.value)}
                        disabled={!selBranchId}
                        className="w-full bg-indigo-950 border border-white/20 text-white rounded-xl pt-6 pb-2 px-3 text-sm font-bold focus:ring-2 focus:ring-white/20 focus:outline-none transition-all appearance-none disabled:opacity-30"
                     >
                        <option value="" className="text-slate-900 bg-white">Select Subject</option>
                        {availableSubjects.map(s => <option key={s.id} value={s.id} className="text-slate-900 bg-white">{s.name} ({s.code})</option>)}
                     </select>
                     <ChevronDown className="absolute right-3 bottom-3 h-4 w-4 text-indigo-300 pointer-events-none" />
                  </div>
               </div>
            </div>
         )}

         {/* 2. Tabs */}
         {!forceCoordinatorView && showDashboard && (
            <div className="flex bg-slate-100/50 p-1 rounded-xl mb-4">
               <button
                  onClick={() => setActiveTab('MARK')}
                  className={`flex-1 py-2.5 font-bold text-xs transition-all flex items-center justify-center rounded-lg ${activeTab === 'MARK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark
               </button>
               <button
                  onClick={() => setActiveTab('HISTORY')}
                  className={`flex-1 py-2.5 font-bold text-xs transition-all flex items-center justify-center rounded-lg ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  <History className="w-3.5 h-3.5 mr-2" /> Preview Attendance
               </button>
               <button
                  onClick={() => setActiveTab('MARKS')}
                  className={`flex-1 py-2.5 font-bold text-xs transition-all flex items-center justify-center rounded-lg ${activeTab === 'MARKS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  <Trophy className="w-3.5 h-3.5 mr-2" /> MST Marks
               </button>
            </div>
         )}

         {activeTab === 'MARK' && (
            !showDashboard ? <SelectionPrompt /> : (
               isViewOnlyLockActive ? (
                  <div className="flex flex-col items-center justify-center p-12 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4">
                     <AlertCircle className="w-16 h-16 text-rose-500 mb-2" />
                     <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight">View Only Mode is Enabled</h3>
                     <p className="text-sm font-bold text-rose-700 max-w-md mx-auto">
                        Admin has set this class to View-Only mode. You cannot add or edit attendance.
                     </p>
                  </div>
               ) : (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={`space-y-4 mb-6`}>
                     <div className={`p-4 rounded-2xl border transition-all ${isEditMode ? 'bg-orange-50/50 border-orange-200' : 'bg-slate-50/50 border-slate-200'}`}>
                        {isEditMode && (
                           <div className="flex items-center text-orange-700 font-bold text-[10px] uppercase tracking-widest mb-3">
                              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                              Editing Existing Record
                           </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mb-4">
                           <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                              <div className="relative">
                                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                 <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={e => setAttendanceDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                 />
                              </div>
                           </div>

                           {metaData.subjects[selSubjectId]?.type === 'lab' && (
                              <div className="space-y-1 relative">
                                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Groups</label>
                                 <button
                                    onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 flex justify-between items-center transition-all active:scale-[0.98]"
                                 >
                                    <span className="truncate">{selectedMarkingBatches.length > 0 ? `${selectedMarkingBatches.length} Sel` : 'Select'}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                 </button>

                                 {isBatchDropdownOpen && (
                                    <div className="fixed inset-x-4 top-[35%] bg-white border border-slate-200 shadow-2xl rounded-2xl z-[60] p-4 animate-in zoom-in-95 duration-200 max-h-[50vh] overflow-y-auto">
                                       <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Select Student Groups</h3>
                                          <button onClick={() => setIsBatchDropdownOpen(false)} className="p-1 hover:bg-slate-100 rounded-full"><X className="h-4 w-4" /></button>
                                       </div>
                                       <div className="grid grid-cols-1 gap-2">
                                          {sameSubjectBatches.map(b => {
                                             const isSelected = selectedMarkingBatches.includes(b.id);
                                             return (
                                                <div
                                                   key={b.id}
                                                   onClick={() => toggleBatchSelection(b.id)}
                                                   className={`px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${isSelected ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-transparent text-slate-600'}`}
                                                >
                                                   <span className="text-xs font-bold">{b.name}</span>
                                                   {isSelected && <Check className="h-4 w-4" />}
                                                </div>
                                             );
                                          })}
                                       </div>
                                    </div>
                                 )}
                                 {isBatchDropdownOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" onClick={() => setIsBatchDropdownOpen(false)}></div>}
                              </div>
                           )}
                        </div>

                        <div className="space-y-2">
                           <div className="space-y-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <span className="inline-flex items-center gap-1.5">
                                    <span>Lecture Periods</span>
                                    <span
                                       className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600 cursor-help"
                                       title="Select at least one slot before saving attendance."
                                       aria-label="Slot selection info"
                                    >
                                       ℹ️
                                    </span>
                                 </span>
                              </label>
                              <div className="flex gap-2 scrollbar-none overflow-x-auto pb-1">
                                 {[1, 2, 3, 4, 5, 6, 7].map(slot => (
                                    <button
                                       key={slot}
                                       onClick={() => toggleSlot(slot)}
                                       aria-pressed={selectedSlots.includes(slot)}
                                       className={`flex-shrink-0 w-10 h-10 rounded-xl text-xs font-black transition-all border-2 ${selectedSlots.includes(slot) ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-300/70 animate-pulse' : 'bg-white border-slate-100 text-slate-400'}`}
                                    >
                                       {slot}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     {selectedSlots.length === 0 && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                           <div className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-4 shadow-lg shadow-amber-100/50">
                              <div className="flex items-center gap-3">
                                 <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-200">
                                    <AlertTriangle className="h-5 w-5" />
                                 </div>
                                 <div>
                                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">Register Locked</h4>
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Choose a lecture slot above to start marking the attendance.</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     <div className={`flex gap-2 transition-all duration-300 ${selectedSlots.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                        <button onClick={() => handleMarkAll(true)} className="flex-1 py-2 bg-emerald-50 text-emerald-700 active:bg-emerald-100 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest transition-all">Mark All Present</button>
                        <button onClick={() => handleMarkAll(false)} className="flex-1 py-2 bg-rose-50 text-rose-700 active:bg-rose-100 rounded-xl border border-rose-100 text-[10px] font-black uppercase tracking-widest transition-all">Mark All Absent</button>
                     </div>

                     {/* Mobile Student List (Cards) */}
                     <div className={`md:hidden space-y-3 pb-20 relative transition-all duration-300 ${selectedSlots.length === 0 ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
                        {loadingStudents ? (
                           Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 w-full">
                                       <Skeleton variant="circular" width={32} height={32} />
                                       <div className="space-y-1 w-full max-w-[150px]">
                                          <Skeleton width="80%" height={16} />
                                          <Skeleton width="40%" height={12} />
                                       </div>
                                    </div>
                                    <Skeleton width={48} height={24} className="rounded-full" />
                                 </div>
                              </div>
                           ))
                        ) : (
                           <>
                              {visibleStudents.map((s, index) => {
                                 const rowStyles = [
                                   { grad: 'from-indigo-500/25 to-transparent', border: 'border-l-indigo-500', bg: 'bg-indigo-500' },
                                   { grad: 'from-emerald-500/25 to-transparent', border: 'border-l-emerald-500', bg: 'bg-emerald-500' },
                                   { grad: 'from-amber-500/25 to-transparent', border: 'border-l-amber-500', bg: 'bg-amber-500' },
                                   { grad: 'from-sky-500/25 to-transparent', border: 'border-l-sky-500', bg: 'bg-sky-500' },
                                   { grad: 'from-fuchsia-500/25 to-transparent', border: 'border-l-fuchsia-500', bg: 'bg-fuchsia-500' },
                                 ];
                                 const style = rowStyles[index % rowStyles.length];
                                 const isPresent = attendanceStatus[s.uid] ?? true;
                                 return (
                                    <div
                                       key={s.uid}
                                       onClick={() => handleMark(s.uid)}
                                       className={`relative pt-5 pb-4 px-4 rounded-3xl border transition-transform duration-200 ease-out active:scale-[0.98] flex items-center justify-between group overflow-hidden bg-white hover:shadow-md ${!isPresent ? 'border-rose-200 shadow-[0_2px_10px_rgb(225,29,72,0.1)]' : `border-slate-100 shadow-sm`}`}
                                    >
                                       <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-200 ${!isPresent ? 'bg-rose-500' : style.bg}`}></div>

                                       <div className="flex-1 min-w-0 mr-4">
                                          <div className="flex items-center gap-2 mb-1.5">
                                             <span className={`inline-flex items-center justify-center text-[10px] font-black px-2 py-0.5 rounded-lg tracking-tight ${isPresent ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                ROLL NO: {s.studentData?.rollNo || '#'}
                                             </span>
                                             <span className="text-[10px] font-bold text-slate-900 font-mono tracking-tighter opacity-100 truncate">{s.studentData?.enrollmentId}</span>
                                          </div>
                                          <h4 className="font-bold text-slate-800 text-sm tracking-tight leading-none mb-1 selectable">{s.displayName}</h4>
                                          <div className="flex items-center gap-1.5">
                                             <div className={`h-1.5 w-1.5 rounded-full ${isPresent ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                             <span className={`text-[10px] font-black uppercase tracking-widest ${isPresent ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isPresent ? 'Present' : 'Absent'}
                                             </span>
                                          </div>
                                       </div>

                                       <div onClick={e => e.stopPropagation()}>
                                          <ToggleSwitch
                                             checked={isPresent}
                                             onChange={() => handleMark(s.uid)}
                                          />
                                       </div>
                                    </div>
                                 );
                              })}
                              {visibleStudents.length === 0 && (
                                 <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    No students found.
                                 </div>
                              )}
                           </>
                        )}
                     </div>

                     {/* Desktop Student List (Table) */}
                     <div className={`hidden md:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative transition-all duration-300 ${selectedSlots.length === 0 ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
                        <table className="w-full text-left border-collapse">
                           <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                 <th className="py-3 px-4 text-xs font-bold text-slate-900 uppercase tracking-wider w-20">S.No</th>
                                 <th className="py-3 px-4 text-xs font-bold text-slate-900 uppercase tracking-wider">Student Details</th>
                                 <th className="py-3 px-4 text-xs font-bold text-slate-900 uppercase tracking-wider text-center w-32">Status</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {loadingStudents ? (
                                 Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                       <td className="py-3 px-4"><Skeleton width={30} height={16} /></td>
                                       <td className="py-3 px-4">
                                          <div className="space-y-1">
                                             <Skeleton width={120} height={16} />
                                             <Skeleton width={80} height={12} />
                                          </div>
                                       </td>
                                       <td className="py-3 px-4 flex justify-center"><Skeleton width={48} height={24} className="rounded-full" /></td>
                                    </tr>
                                 ))
                              ) : (
                                 <>
                                    {visibleStudents.map((s, index) => {
                                       const rowStyles = [
                                         { grad: 'from-indigo-500/25 to-transparent', border: 'border-l-indigo-500' },
                                         { grad: 'from-emerald-500/25 to-transparent', border: 'border-l-emerald-500' },
                                         { grad: 'from-amber-500/25 to-transparent', border: 'border-l-amber-500' },
                                         { grad: 'from-sky-500/25 to-transparent', border: 'border-l-sky-500' },
                                         { grad: 'from-fuchsia-500/25 to-transparent', border: 'border-l-fuchsia-500' },
                                       ];
                                       const style = rowStyles[index % rowStyles.length];
                                       const isPresent = attendanceStatus[s.uid] ?? true;
                                       return (
                                          <tr key={s.uid} onClick={() => handleMark(s.uid)} className={`cursor-pointer transition-all duration-500 ease-out bg-gradient-to-r border-b border-slate-50/50 hover:bg-white/40 relative z-10 hover:z-30 hover:scale-[1.015] hover:shadow-[0_0_0_1.5px_#000,0_10px_40px_-10px_rgba(0,0,0,0.3)] ${!isPresent ? 'from-rose-500/25 to-transparent' : `${style.grad}`}`}>
                                             <td className={`py-3 px-4 text-slate-900 font-mono text-sm border-l-[3px] transition-colors duration-500 ${!isPresent ? 'border-l-rose-500' : style.border}`}>{s.studentData?.rollNo || '-'}</td>
                                             <td className="py-3 px-4">
                                                <div className="font-semibold text-slate-900 text-sm">{s.displayName}</div>
                                                <div className="text-xs text-slate-900 font-mono">{s.studentData?.enrollmentId}</div>
                                             </td>
                                             <td className="py-3 px-4 text-center">
                                                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                                   <ToggleSwitch
                                                      checked={isPresent}
                                                      onChange={() => handleMark(s.uid)}
                                                   />
                                                </div>
                                             </td>
                                          </tr>
                                       );
                                    })}
                                    {visibleStudents.length === 0 && (
                                       <tr><td colSpan={3} className="p-8 text-center text-slate-400">No students found in selected batches.</td></tr>
                                    )}
                                 </>
                              )}
                           </tbody>
                        </table>
                     </div>

                     {/* Premium Footer */}
                     <div className="mt-8 mb-20 bg-white/80 backdrop-blur-xl border border-slate-100 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col items-center md:items-start">
                           <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-indigo-600 leading-none">{visibleStudents.filter(s => attendanceStatus[s.uid]).length}</span>
                              <span className="text-[12px] font-black text-slate-400 uppercase tracking-tighter">/ {visibleStudents.length} Students</span>
                           </div>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Marked Present</span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                           {saveMessage && (
                              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-right-2">
                                 <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                 <span className="text-[10px] font-black uppercase tracking-tight">{saveMessage.includes('Sync') ? 'Synced' : 'Saved'}</span>
                              </div>
                           )}
                           <button
                              onClick={handleSaveClick}
                              disabled={isSaving || selectedSlots.length === 0}
                              className={`h-14 px-10 w-full md:w-auto rounded-3xl font-black text-xs uppercase tracking-[0.1em] shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${isEditMode ? 'bg-orange-600 text-white shadow-orange-200' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
                           >
                              {isSaving ? (
                                 <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Processing...</span>
                                 </div>
                              ) : (
                                 <>
                                    <Save className="h-5 w-5" />
                                    <span>{isEditMode ? 'Edit Attendance' : 'Save Attendance'}</span>
                                 </>
                              )}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )
            )
         )}

         {activeTab === 'HISTORY' && (
            !showDashboard ? <SelectionPrompt /> : (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 mb-6">
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                           <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight truncate mr-2">Attendance History</h3>
                           <div className="flex items-center gap-1.5">
                              {historyFilterDate && (
                                 <button
                                    onClick={() => {
                                       const dayRecs = allClassRecords.filter(r => r.date === historyFilterDate);
                                       const daySlots = Array.from(new Set(dayRecs.map(r => r.lectureSlot))).filter(Boolean).sort() as number[];
                                       setSlotsToDeleteInModal(daySlots);
                                       setShowDeleteModal(true);
                                    }}
                                    className="h-8 px-2.5 bg-rose-50 text-rose-600 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all"
                                 >
                                    <Trash className="h-3.5 w-3.5" />
                                    <span className="text-[9px] font-black tracking-widest uppercase hidden xs:inline">Delete</span>
                                 </button>
                              )}
                              <button
                                 onClick={() => setShowFilters(!showFilters)}
                                 className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg transition-all ${showFilters ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}
                              >
                                 <Filter className="h-3.5 w-3.5" />
                                 <span className="text-[9px] font-black tracking-widest uppercase hidden xs:inline">Filters</span>
                              </button>
                           </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                           <div className="flex-1 min-w-[120px] relative">
                              <label className="absolute left-3 top-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">View Date</label>
                              <input
                                 type="date"
                                 value={historyFilterDate}
                                 onChange={e => { setHistoryFilterDate(e.target.value); setHistoryTillDate(''); }}
                                 className="w-full pl-3 pr-3 pt-5 pb-1.5 bg-slate-50 border border-transparent rounded-2xl text-[11px] font-bold text-slate-900 focus:bg-white focus:border-indigo-100 focus:outline-none transition-all appearance-none"
                              />
                              {historyFilterDate && <button onClick={() => setHistoryFilterDate('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><XCircle className="h-3.5 w-3.5" /></button>}
                           </div>
                           <button
                              onClick={handleExportCSV}
                              className="h-12 px-5 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center gap-2 active:scale-95 transition-all"
                              disabled={allClassRecords.length === 0}
                              title="Export Detailed Report"
                           >
                              <FileDown className="h-5 w-5" />
                              <span className="text-[10px] font-black tracking-widest uppercase">Download Reports</span>
                           </button>
                        </div>

                        <button
                           onClick={handleShareAttendance}
                           className="w-full h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-emerald-100"
                           disabled={allClassRecords.length === 0}
                        >
                           <Share2 className="h-5 w-5" />
                           <span className="text-[10px] font-black tracking-widest uppercase">
                              {historyFilterDate 
                                 ? `Share ${new Date(historyFilterDate).toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit', year: '2-digit'})} Attendance` 
                                 : "Share Today's Attendance"}
                           </span>
                        </button>

                        {showFilters && (
                           <div className="bg-slate-50 p-4 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                              <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">From</label>
                                    <input type="date" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">To</label>
                                    <input type="date" value={historyTillDate} onChange={e => setHistoryTillDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                 </div>
                              </div>

                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Score Range</label>
                                 <div className="flex gap-2">
                                    <select
                                       value={attendanceOperator}
                                       onChange={e => setAttendanceOperator(e.target.value as any)}
                                       className="w-16 p-2.5 bg-white border border-slate-100 rounded-xl text-xs font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                       <option value="GE">≥</option>
                                       <option value="LE">≤</option>
                                       <option value="GT">&gt;</option>
                                       <option value="LT">&lt;</option>
                                    </select>
                                    <input
                                       type="number"
                                       value={attendanceThreshold}
                                       onChange={e => setAttendanceThreshold(Number(e.target.value))}
                                       className="flex-1 p-2.5 bg-white border border-slate-100 rounded-xl text-xs font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                                       placeholder="Threshold %"
                                    />
                                 </div>
                              </div>

                              <div className="pt-2 flex gap-2">
                                 <button
                                    onClick={() => { setHistoryStartDate(''); setHistoryTillDate(''); setAttendanceFilter('ALL'); setAttendanceThreshold(75); setShowFilters(false); }}
                                    className="flex-1 py-2 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
                                 >
                                    Reset All
                                 </button>
                                 <button
                                    onClick={() => { setAttendanceFilter('CUSTOM'); setShowFilters(false); }}
                                    className="flex-[2] py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 transition-all"
                                 >
                                    Apply Filter
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="md:hidden space-y-3 pb-20">
                     {(() => {
                        const { batchGroupMap, studentStats } = historyProcessedData;
                        const nodes: React.ReactNode[] = [];

                        batchGroupMap.forEach((batchStudents, batchId) => {
                           const batchName = metaData.batches[batchId] || batchId;
                           nodes.push(
                              <div key={`mb_banner_${batchId}`} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 rounded-2xl">
                                 <div className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
                                 <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex-1">{batchName}</span>
                                 <span className="text-[10px] font-bold text-indigo-200">{batchStudents.length} students</span>
                              </div>
                           );
                           batchStudents.forEach(s => {
                              const stats = studentStats.get(s.uid)!;
                              if (historyFilterDate) {
                                 const dateRecs = stats.dateRecs;
                                 nodes.push(
                                    <div key={s.uid} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                       <div className="flex-1 min-w-0 mr-4">
                                          <div className="flex items-center gap-2 mb-1">
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter opacity-70">#{s.studentData?.rollNo}</span>
                                             <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                                             <span className="text-[10px] font-bold text-slate-900 font-mono tracking-tighter opacity-100 truncate">{s.studentData?.enrollmentId}</span>
                                          </div>
                                          <h4 className="font-bold text-slate-800 text-sm tracking-tight leading-none">{s.displayName}</h4>
                                       </div>
                                       <div className="flex gap-1.5 flex-wrap justify-end max-w-[120px]">
                                          {dateRecs.length > 0 ? dateRecs.map(r => (
                                             <div key={r.id} className={`px-2 py-1 rounded-lg text-[9px] font-black border ${r.isPresent ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                L{r.lectureSlot || 1}: {r.isPresent ? 'P' : 'A'}
                                             </div>
                                          )) : <span className="text-[10px] text-slate-300 italic font-bold">No Data</span>}
                                       </div>
                                    </div>
                                 );
                              } else {
                                 const pct = stats.pct;
                                 nodes.push(
                                    <div key={s.uid} onClick={() => setViewHistoryStudent(s)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all group">
                                       <div className="flex-1 min-w-0 mr-4">
                                          <div className="flex items-center gap-2 mb-1">
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter opacity-70">#{s.studentData?.rollNo}</span>
                                             <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                                             <span className="text-[10px] font-bold text-slate-900 font-mono tracking-tighter opacity-100 truncate">{s.studentData?.enrollmentId}</span>
                                          </div>
                                          <h4 className="font-bold text-slate-800 text-sm tracking-tight leading-none mb-1.5 group-hover:text-indigo-600 transition-colors uppercase selectable">{s.displayName}</h4>
                                          <div className="flex items-center gap-4">
                                             <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${pct < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }}></div>
                                             </div>
                                             <span className={`text-[10px] font-black leading-none ${pct < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>{pct}%</span>
                                          </div>
                                       </div>
                                       <div className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-300 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-all">
                                          <ChevronDown className="h-4 w-4 transform -rotate-90" />
                                       </div>
                                    </div>
                                 );
                              }
                           });
                        });
                        return nodes;
                     })()}
                     {historyProcessedData.filteredStudents.length === 0 && <div className="py-20 text-center font-black text-slate-300 uppercase tracking-widest text-[10px]">No Records Found</div>}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                     <table className="w-full text-sm text-left text-slate-900">
                        <thead className="bg-slate-50 border-b">
                           <tr>
                              <th className="p-3 text-slate-900 font-bold uppercase text-[10px] tracking-widest leading-none">S.No</th>
                              <th className="p-3 text-slate-900 font-bold uppercase text-[10px] tracking-widest leading-none">Name</th>
                              <th className="p-3 text-slate-900 font-bold uppercase text-[10px] tracking-widest leading-none">Enrollment</th>
                              {historyFilterDate ? (
                                 <>
                                    <th className="p-3 text-slate-900 font-bold text-center uppercase text-[10px] tracking-widest leading-none">Batch</th>
                                    <th className="p-3 text-slate-900 font-bold text-center uppercase text-[10px] tracking-widest leading-none">Date Status ({historyFilterDate})</th>
                                 </>
                              ) : (
                                 <>
                                    <th className="p-3 text-slate-900 font-bold text-center uppercase text-[10px] tracking-widest leading-none">Sessions</th>
                                    <th className="p-3 text-slate-900 font-bold text-center uppercase text-[10px] tracking-widest leading-none">Present</th>
                                    <th className="p-3 text-slate-900 font-bold text-center uppercase text-[10px] tracking-widest leading-none">% Score</th>
                                    <th className="p-3 text-slate-900 font-bold text-right uppercase text-[10px] tracking-widest leading-none">Action</th>
                                 </>
                              )}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {(() => {
                              const { batchGroupMap, studentStats } = historyProcessedData;
                              const rows: React.ReactNode[] = [];
                              const colSpan = historyFilterDate ? 5 : 7;
                              batchGroupMap.forEach((batchStudents, batchId) => {
                                 const batchName = metaData.batches[batchId] || batchId;
                                 rows.push(
                                    <tr key={`dt_banner_${batchId}`}>
                                       <td colSpan={colSpan} className="px-3 py-2 bg-indigo-600">
                                          <div className="flex items-center gap-2">
                                             <div className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
                                             <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex-1">Batch: {batchName}</span>
                                             <span className="text-[10px] font-bold text-indigo-200">{batchStudents.length} students</span>
                                          </div>
                                       </td>
                                    </tr>
                                 );
                                 batchStudents.forEach(s => {
                                    const stats = studentStats.get(s.uid)!;
                                    if (historyFilterDate) {
                                       const dateRecs = stats.dateRecs;
                                       rows.push(
                                          <tr key={s.uid} className="hover:bg-indigo-50/30 transition-colors">
                                             <td className="p-3 font-mono text-slate-400 text-xs tracking-tighter">{s.studentData?.rollNo}</td>
                                             <td className="p-3 font-bold text-slate-700 text-sm tracking-tight uppercase selectable">{s.displayName}</td>
                                             <td className="p-3 font-mono text-slate-500 text-xs tracking-tighter">{s.studentData?.enrollmentId || '-'}</td>
                                             <td className="p-3 text-center text-slate-400 font-black text-[10px]">{batchName}</td>
                                             <td className="p-3">
                                                {dateRecs.length > 0 ? (
                                                   <div className="flex gap-2 justify-center flex-wrap">
                                                      {dateRecs.map(r => (
                                                         <span key={r.id} className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black border tracking-wider ${r.isPresent ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                            L{r.lectureSlot || 1}: {r.isPresent ? 'P' : 'A'}
                                                         </span>
                                                      ))}
                                                   </div>
                                                ) : <span className="text-slate-200 italic font-black text-[10px] tracking-widest uppercase">No Data</span>}
                                             </td>
                                          </tr>
                                       );
                                    } else {
                                       const { total, present, pct } = stats;
                                       rows.push(
                                          <tr key={s.uid} onClick={() => setViewHistoryStudent(s)} className="hover:bg-indigo-50/50 cursor-pointer transition-colors group">
                                             <td className="p-3 font-mono text-slate-400 text-xs tracking-tighter">{s.studentData?.rollNo}</td>
                                             <td className="p-3 font-bold text-slate-700 text-sm tracking-tight uppercase group-hover:text-indigo-600 transition-colors selectable">{s.displayName}</td>
                                             <td className="p-3 font-mono text-slate-500 text-xs tracking-tighter">{s.studentData?.enrollmentId || '-'}</td>
                                             <td className="p-3 text-center text-slate-400 font-bold text-xs">{total}</td>
                                             <td className="p-3 text-center text-emerald-600 font-bold text-xs">{present}</td>
                                             <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider ${pct < 75 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{pct}%</span>
                                             </td>
                                             <td className="p-3 text-right text-slate-300 group-hover:text-indigo-400 transition-colors">
                                                <ChevronDown className="h-4 w-4 inline transform -rotate-90" />
                                             </td>
                                          </tr>
                                       );
                                    }
                                 });
                              });
                              return rows;
                           })()}
                        </tbody>
                     </table>
                  </div>
               </div>
            )
         )}

         {activeTab === 'MARKS' && (
            !showDashboard ? <SelectionPrompt /> : (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {isViewOnlyLockActive && (
                     <div className="mb-6 flex items-center justify-center p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-rose-500" />
                        <div className="text-left">
                           <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight leading-none">View Only Mode is Enabled</h4>
                           <p className="text-[10px] font-bold text-rose-700">You can view MST marks but cannot edit or save them.</p>
                        </div>
                     </div>
                  )}
                  <div className="space-y-4 mb-6">
                     <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Exam Type</label>
                              <Select
                                 value={midSemType}
                                 onChange={e => setMidSemType(e.target.value as MidSemType)}
                                 className="w-full bg-white border-indigo-100 text-xs font-bold"
                              >
                                 <option value="MID_SEM_1">MST 1</option>
                                 <option value="MID_SEM_2">MST 2</option>
                                 <option value="MID_SEM_REMEDIAL">Remedial MST</option>
                              </Select>
                           </div>
                           <div className="space-y-1">
                              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Max Marks</label>
                              <Input
                                 type="number"
                                 value={maxMarks}
                                 onChange={e => setMaxMarks(Number(e.target.value))}
                                 placeholder="Max Marks"
                                 className="w-full bg-white border-indigo-100 text-xs font-bold"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-indigo-100/20 overflow-hidden">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                 <tr>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Marks Obtained</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {visibleStudents.map(s => (
                                    <tr key={s.uid} className="hover:bg-slate-50/50 transition-colors">
                                       <td className="py-4 px-6">
                                          <div className="font-bold text-slate-800 text-sm uppercase tracking-tight selectable">{s.displayName}</div>
                                          <div className="text-[10px] font-bold text-slate-900 font-mono">{s.studentData?.enrollmentId} | Sr No: {s.studentData?.rollNo || '#'}</div>
                                       </td>
                                       <td className="py-4 px-6 text-right">
                                          <div className="flex items-center justify-end gap-3">
                                             <button
                                                onClick={() => {
                                                   if (isViewOnlyLockActive) return;
                                                   const isCurrentlyAbsent = marksData[s.uid] === -1;
                                                   setMarksData(prev => ({ ...prev, [s.uid]: isCurrentlyAbsent ? 0 : -1 }));
                                                }}
                                                disabled={isViewOnlyLockActive}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${marksData[s.uid] === -1 
                                                   ? 'bg-rose-600 text-white shadow-rose-100' 
                                                   : 'bg-white border border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-600'} ${isViewOnlyLockActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                             >
                                                {marksData[s.uid] === -1 ? 'Absent' : 'Mark Absent'}
                                             </button>
                                             <div className="flex items-center gap-2">
                                                <input
                                                   type="number"
                                                   disabled={marksData[s.uid] === -1 || isViewOnlyLockActive}
                                                   value={marksData[s.uid] === -1 ? '' : (marksData[s.uid] ?? '')}
                                                   min="0"
                                                   max={maxMarks}
                                                   onChange={e => {
                                                      if (isViewOnlyLockActive) return;
                                                      const val = Math.min(maxMarks, Math.max(0, Number(e.target.value)));
                                                      setMarksData(prev => ({ ...prev, [s.uid]: val }));
                                                   }}
                                                   placeholder={marksData[s.uid] === -1 ? 'ABS' : '0'}
                                                   className={`w-20 text-right px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl font-black focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${marksData[s.uid] === -1 ? 'opacity-30' : 'text-indigo-600'} ${isViewOnlyLockActive ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                                />
                                                <span className="text-[10px] font-black text-slate-300 uppercase">/ {maxMarks}</span>
                                             </div>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                                 {visibleStudents.length === 0 && (
                                    <tr>
                                       <td colSpan={2} className="py-20 text-center">
                                          <div className="flex flex-col items-center">
                                             <Trophy className="h-10 w-10 text-slate-100 mb-4" />
                                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Students Found</p>
                                          </div>
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>

                     <div className="mt-8 mb-20 bg-white/80 backdrop-blur-xl border border-slate-100 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entry Summary</div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-black text-indigo-600 leading-none">{Object.keys(marksData).length}</span>
                              <span className="text-[12px] font-black text-slate-400 uppercase tracking-tighter">Graded / {visibleStudents.length} Students</span>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                           {saveMessage && (
                              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-right-2">
                                 <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                 <span className="text-[10px] font-black uppercase tracking-tight">Saved</span>
                              </div>
                           )}
                           <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                              <button
                                 onClick={handleExportMarks}
                                 disabled={visibleStudents.length === 0}
                                 className="h-14 px-8 bg-white text-indigo-600 border-2 border-indigo-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                 {isExporting ? (
                                    <>
                                       <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                       <span>Wait...</span>
                                    </>
                                 ) : (
                                    <>
                                       <FileDown className="h-4 w-4" />
                                       <span>Export Marks</span>
                                    </>
                                 )}
                              </button>
                              <button
                                 onClick={handleSaveMarks}
                                 disabled={isSaving || visibleStudents.length === 0 || isViewOnlyLockActive}
                                 className={`h-14 px-10 text-white rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl ${
                                    isViewOnlyLockActive ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-400 hover:to-indigo-500'
                                 }`}
                              >
                                 {isSaving ? 'Processing...' : 'Save MST Marks'}
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )
         )}

         {activeTab === 'CO-ORDINATOR' && (
            coordinatorBranchIds.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-slate-400 mb-2" />
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Classes Assigned</h3>
                  <p className="text-sm font-bold text-slate-500 max-w-md mx-auto">
                     You have not been assigned as a coordinator for any classes by the administrator.
                  </p>
               </div>
            ) : (
               <div className="space-y-6">
                  {coordinatorBranchIds.length > 1 && (
                     <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-500 flex flex-col sm:flex-row items-center gap-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Select Coordinator Class:</span>
                        <div className="flex flex-wrap gap-2">
                           {coordinatorBranchIds.map(bid => (
                              <button
                                 key={bid}
                                 onClick={() => setCoordinatorBranchId(bid)}
                                 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    coordinatorBranchId === bid 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                 }`}
                              >
                                 {metaData.branches[bid] || bid}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}
                  {coordinatorBranchId && (
                     <CoordinatorView
                        branchId={coordinatorBranchId}
                        facultyUser={user}
                        metaData={metaData}
                     />
                  )}
               </div>
            )
         )}

         <ExportProgressModal isOpen={isExporting} progress={exportProgress} status={exportStatus} />


         {/* Confirmation / Conflict Modal */}
         <Modal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title={conflictDetails ? "⚠️ ATTENTION: CONFLICT" : (isEditMode ? "Confirm Edit" : "Confirm Submission")}
         >
            {conflictDetails ? (
               <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded-r-md">
                     <div className="flex items-start gap-4">
                        <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
                        <div>
                           <h4 className="font-extrabold text-red-900 text-base uppercase tracking-wide">Record Already Exists</h4>
                           <p className="text-red-900 text-sm mt-1">
                              Attendance for <span className="font-bold underline">Slot {conflictDetails.slot}</span> on <span className="font-bold">{conflictDetails.date}</span> was previously marked.
                           </p>

                           <div className="mt-4 bg-white p-4 rounded border border-red-200 shadow-sm">
                              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Previous Entry By</div>
                              <div className="font-bold text-lg text-slate-800">{conflictDetails.markedBy}</div>
                              <div className="text-sm font-medium text-indigo-700 mb-1">{conflictDetails.subjectName}</div>
                              <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">
                                 Last Updated: {new Date(conflictDetails.timestamp).toLocaleString()}
                              </div>
                              <div className="flex gap-4 mt-3 text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded">
                                 <span className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> {conflictDetails.presentCount} Present</span>
                                 <span className="flex items-center"><XCircle className="h-4 w-4 mr-1 text-red-600" /> {conflictDetails.totalRecords - conflictDetails.presentCount} Absent</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="px-2">
                     <p className="font-semibold text-slate-800 text-sm">Action Required:</p>
                     <p className="text-sm text-slate-600 mt-1">
                        {conflictDetails.markedBy === user.displayName
                           ? <>You are about to <span className="font-bold text-red-600">OVERWRITE</span> the existing attendance record with your current selection.</>
                           : <>This record belongs to another faculty member ({conflictDetails.markedBy}). You cannot overwrite it directly.</>
                        }
                     </p>
                  </div >

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                     <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                     {conflictDetails.markedBy === user.displayName ? (
                        <Button variant="danger" onClick={executeSave} disabled={isSaving}>YES, OVERWRITE</Button>
                     ) : (
                        <Button onClick={handleRequestOverwrite} disabled={isSaving} className="bg-indigo-600 text-white hover:bg-indigo-700">
                           Request Permission
                        </Button>
                     )}
                  </div >
               </div >
            ) : (
               <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
                     <div className="flex justify-between"><span className="text-slate-500">Subject:</span> <span className="font-semibold text-slate-900">{metaData.subjects[selSubjectId]?.name}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-900">{attendanceDate}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Slots:</span> <span className="font-semibold text-slate-900">L{selectedSlots.join(', L')}</span></div>
                     <div className="flex justify-between items-start"><span className="text-slate-500">Batches:</span> <div className="text-right font-semibold text-slate-900">{selectedMarkingBatches.map(b => metaData.batches[b]).join(', ')}</div></div>
                  </div>
                  {networkError && (
                     <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                        {networkError}
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-center">
                     <div className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-100">
                        <div className="text-2xl font-bold">{visibleStudents.filter(s => attendanceStatus[s.uid]).length}</div>
                        <div className="text-xs uppercase font-semibold opacity-70">Present</div>

                     </div>
                     <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-100">
                        <div className="text-2xl font-bold">{visibleStudents.filter(s => !attendanceStatus[s.uid]).length}</div>
                        <div className="text-xs uppercase font-semibold opacity-70">Absent</div>
                     </div>
                  </div >

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                     <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                     <Button onClick={executeSave} disabled={isSaving}>
                        {isSaving ? 'Processing...' : 'Confirm & Save'}
                     </Button>
                  </div>


               </div >
            )}
         </Modal >
         {/* Delete Confirmation Modal */}
         <Modal
            isOpen={showDeleteModal}
            onClose={() => !isDeleting && setShowDeleteModal(false)}
            title="🗑️ Delete Attendance Records"
         >
            <div className="space-y-6">
               <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center">
                        <Calendar size={18} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Date Selected</p>
                        <p className="text-sm font-black text-rose-900">{historyFilterDate}</p>
                     </div>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                     <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest leading-tight">
                        Records stay in Recycle Bin for 12 hours before permanent deletion
                     </p>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Slots to Remove</label>
                  <div className="grid grid-cols-1 gap-2">
                     {Array.from(new Set(allClassRecords.filter(r => r.date === historyFilterDate).map(r => r.lectureSlot))).filter(Boolean).sort().map(slot => {
                        const isSelected = slotsToDeleteInModal.includes(slot as number);
                        const count = allClassRecords.filter(r => r.date === historyFilterDate && r.lectureSlot === slot).length;
                        return (
                           <button
                              key={slot}
                              onClick={() => {
                                 setSlotsToDeleteInModal(prev => 
                                    prev.includes(slot as number) ? prev.filter(s => s !== slot) : [...prev, slot as number]
                                 );
                              }}
                              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                 isSelected ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-100 bg-white text-slate-600'
                              }`}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Layers size={14} />
                                 </div>
                                 <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-tight">Slot {slot}</p>
                                    <p className="text-[9px] font-bold opacity-60 uppercase">{count} Students</p>
                                 </div>
                              </div>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-rose-500 border-rose-500' : 'border-slate-200'}`}>
                                 {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                              </div>
                           </button>
                        );
                     })}
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</Button>
                  <Button 
                     variant="danger" 
                     onClick={confirmDelete} 
                     disabled={isDeleting || slotsToDeleteInModal.length === 0} 
                     className="!bg-rose-600 hover:!bg-rose-700 min-w-[140px]"
                  >
                     {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash size={16} className="mr-2" />}
                     <span>Delete {slotsToDeleteInModal.length} Slots</span>
                  </Button>
               </div>
            </div>
         </Modal>

         {/* Export Modal */}
         <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Export Attendance">
            <div className="space-y-6">
               {/* Date Range Selection */}
               <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Date Range</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button
                        onClick={() => setExportRange('TILL_TODAY')}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${exportRange === 'TILL_TODAY' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                     >
                        <div className="text-sm">Till Today</div>
                        <div className="text-[10px] opacity-70 font-normal">All records up to now</div>
                     </button>
                     <button
                        onClick={() => setExportRange('CUSTOM')}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${exportRange === 'CUSTOM' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                     >
                        <div className="text-sm">Custom Range</div>
                        <div className="text-[10px] opacity-70 font-normal">Specific date range</div>
                     </button>
                  </div>

                  {exportRange === 'CUSTOM' && (
                     <div className="grid grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1">
                           <label className="block text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                           <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                           <label className="block text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                           <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                     </div>
                  )}
               </div>

               {/* Format Selection */}
               <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Export Format</label>
                  <div className="space-y-3">
                     <button
                        onClick={() => setExportFormat('DETAILED')}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all group ${exportFormat === 'DETAILED' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                     >
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-xl ${exportFormat === 'DETAILED' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                              <Calendar className="h-5 w-5" />
                           </div>
                           <div>
                              <div className={`font-black text-sm uppercase tracking-tight ${exportFormat === 'DETAILED' ? 'text-indigo-900' : 'text-slate-700'}`}>Detailed Attendance</div>
                              <p className="text-xs text-slate-500 mt-0.5">Physical Register style (Date columns, P/A markings)</p>
                           </div>
                        </div>
                     </button>

                     <button
                        onClick={() => setExportFormat('COMPATIBLE')}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all group ${exportFormat === 'COMPATIBLE' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                     >
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-xl ${exportFormat === 'COMPATIBLE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                              <FileDown className="h-5 w-5" />
                           </div>
                           <div>
                              <div className={`font-black text-sm uppercase tracking-tight ${exportFormat === 'COMPATIBLE' ? 'text-indigo-900' : 'text-slate-700'}`}>Compatible Attendance</div>
                              <p className="text-xs text-slate-500 mt-0.5">Summary view (Name, Enrollment, Total, %, etc.)</p>
                           </div>
                        </div>
                     </button>
                  </div>
               </div>

               <div className="pt-6 flex gap-3 border-t border-slate-100">
                  <Button variant="secondary" onClick={() => setShowExportModal(false)} className="flex-1 px-6">Cancel</Button>
                  <Button onClick={executeExport} className="flex-[2] bg-indigo-600 text-white px-8 h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                     <FileDown className="h-4 w-4 mr-2" /> Download Report
                  </Button>
               </div>
            </div>
         </Modal>
        </div>
   );
};
