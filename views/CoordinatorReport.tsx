import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { db } from '../services/db';
import { User, AttendanceRecord, MidSemType } from '../types';
import { Input, Select, ExportProgressModal } from '../components/UI';
import { Layers, FileDown, Activity, Loader2, Trophy } from 'lucide-react';

interface CoordinatorReportProps {
   branchId: string;
   branchName: string;
   students: User[];
   metaData: any;
   user: User;
}

export const CoordinatorReport: React.FC<CoordinatorReportProps> = ({ branchId, branchName, students, metaData, user }) => {
   const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
   const [loading, setLoading] = useState(false);
   const [progress, setProgress] = useState(0);
   const [status, setStatus] = useState('');
   const [exportRange, setExportRange] = useState<'TILL_TODAY' | 'CUSTOM'>('TILL_TODAY');
   const [exportSubjectType, setExportSubjectType] = useState<'ALL' | 'THEORY' | 'LAB'>('ALL');
   const [exportStartDate, setExportStartDate] = useState('');
   const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);
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
            const data = await db.getBranchAttendance(branchId);
            setAttendance(data);
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

   const executeExport = async () => {
      setLoading(true);
      setProgress(0);
      setStatus('Initializing report engine...');

      try {
         await new Promise(r => setTimeout(r, 600));
         setProgress(10);
         setStatus('Filtering records...');
         await new Promise(r => setTimeout(r, 400));

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

         const subjectSessionCounts: Record<string, number> = {};
         uniqueSubjectIds.forEach(sid => {
            const subjectSessions = new Set(regularRecs.filter(r => r.subjectId === sid).map(r => `${r.date}_${r.lectureSlot}`)).size;
            subjectSessionCounts[sid] = subjectSessions;
         });

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
            []
         ];

         setProgress(50);
         setStatus('Generating batch-wise analytics...');
         await new Promise(r => setTimeout(r, 50));

         const totalStudents = filteredStudents.length;
         const studentStats = filteredStudents.map(s => {
            const studentRecs = previewRecords.filter(r => r.studentId === s.uid);
            const studentRegularRecs = studentRecs.filter(r => r.subjectId !== 'sub_extra');
            const sessionMap = new Map<string, typeof studentRegularRecs[0]>();
            studentRegularRecs.forEach(r => {
               const k = `${r.date}_${r.lectureSlot || 1}_${r.subjectId}`;
               const ex = sessionMap.get(k);
               if (!ex || (!ex.isPresent && r.isPresent)) sessionMap.set(k, r);
            });
            const uniqueRegular = Array.from(sessionMap.values());
            const presentCount = uniqueRegular.filter(r => r.isPresent).length;
            const totalSessions = uniqueRegular.length;
            const extraCount = studentRecs.filter(r => r.subjectId === 'sub_extra' && r.isPresent).length;
            const pct = totalSessions === 0 ? 0 : ((presentCount + extraCount) / totalSessions) * 100;
            return { name: s.displayName, pct };
         });

         const detentionCount = studentStats.filter(s => s.pct < 75).length;
         const classAvg = totalStudents === 0 ? 0 : Math.round(studentStats.reduce((acc, curr) => acc + curr.pct, 0) / totalStudents);

         const statsInfo = [
            ["EXECUTIVE SUMMARY", ""],
            ["Total Strength", totalStudents.toString()],
            ["Class Average", `${classAvg}%`],
            ["Detention Count (<75%)", detentionCount.toString()],
            ["", ""]
         ];

         const mainHeader = ["Serial No", "Name", "Enrollment ID", ...subjectHeaders, "Extra Lectures", "Total Lectures", "Present Count", "Attendance %"];
         let csvRows: any[][] = [...headerInfo, ...statsInfo];

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
            const batchRegularRecs = regularRecs.filter(r => r.batchId === batchId || r.batchId === 'ALL');
            const batchSubjectSessionCounts: Record<string, number> = {};
            uniqueSubjectIds.forEach(sid => {
               const batchSubjectSessions = new Set(batchRegularRecs.filter(r => r.subjectId === sid).map(r => `${r.date}_${r.lectureSlot}`)).size;
               batchSubjectSessionCounts[sid] = batchSubjectSessions;
            });

            csvRows.push([]);
            csvRows.push([`>>> BATCH: ${batchNameStr} <<<`]);
            csvRows.push(mainHeader);

            const batchTotalLectures = Object.values(batchSubjectSessionCounts).reduce((acc, curr) => acc + curr, 0);
            const batchTotalsLabelRow = ["", "Total Lectures Held", "", ...uniqueSubjectIds.map(sid => batchSubjectSessionCounts[sid].toString()), "", batchTotalLectures.toString(), "VARIES", ""];
            csvRows.push(batchTotalsLabelRow);

            const batchDataRows = batchStudents.map(s => {
               const studentRecs = previewRecords.filter(r => r.studentId === s.uid);
               const studentRegularRecs = regularRecs.filter(r => r.studentId === s.uid);
               const sessionMap = new Map<string, typeof studentRegularRecs[0]>();
               studentRegularRecs.forEach(r => {
                  const k = `${r.date}_${r.lectureSlot || 1}_${r.subjectId}`;
                  const ex = sessionMap.get(k);
                  if (!ex || (!ex.isPresent && r.isPresent)) sessionMap.set(k, r);
               });
               const uniqueRegular = Array.from(sessionMap.values());
               const studentTotalSessions = uniqueRegular.length;
               const presentCount = uniqueRegular.filter(r => r.isPresent).length;
               const extraCount = studentRecs.filter(r => r.subjectId === 'sub_extra' && r.isPresent).length;

               const subjectAttendance = uniqueSubjectIds.map(sid => {
                  return uniqueRegular.filter(r => r.subjectId === sid && r.isPresent).length.toString();
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
            csvRows.push([]);
            csvRows.push([]);
         });

         setProgress(85);
         setStatus('Applying institutional branding...');
         await new Promise(r => setTimeout(r, 50));

         const workbook = new ExcelJS.Workbook();
         const sheet = workbook.addWorksheet('Attendance Report');

         sheet.addRows(csvRows);

         sheet.columns.forEach((col, colIndex) => {
            let maxLen = 10;
            csvRows.forEach((row, rowIndex) => {
               if (rowIndex < 7) return;
               const val = row[colIndex];
               if (val) {
                  const len = val.toString().length;
                  if (len > maxLen) maxLen = len;
               }
            });
            col.width = maxLen + 4;
         });

         sheet.views = [{ state: 'frozen', xSplit: 4, ySplit: 14 }];

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

               if (R >= 0 && R <= 2) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
                  cell.alignment = { horizontal: "center" };
               }

               const rowVal0 = csvRows[R]?.[0]?.toString() || '';
               const rowVal1 = csvRows[R]?.[1]?.toString() || '';

               if (rowVal0.startsWith('>>> BATCH')) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
                  cell.alignment = { horizontal: "center" };
               }

               if (rowVal0 === 'Serial No') {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
                  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                  cell.alignment = { horizontal: "center" };
               }

               if (rowVal1 === 'Total Lectures Held') {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                  cell.font = { bold: true };
               }

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

         sheet.mergeCells(1, 1, 1, mainHeader.length);
         sheet.mergeCells(2, 1, 2, mainHeader.length);
         sheet.mergeCells(3, 1, 3, mainHeader.length);

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
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${branchName}_Summary_Report.xlsx`;
         a.click();
         window.URL.revokeObjectURL(url);

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
      <div className="w-full max-w-full space-y-6 pb-32 md:pb-20 overflow-x-hidden min-w-0 block">
         {/* 1. Header Section - Strict Block for vertical stacking */}
         <div className="w-full px-2 block">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full bg-white/40 p-6 rounded-[2rem] border border-slate-100/50">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2.5 bg-indigo-50 rounded-2xl flex-shrink-0"><Layers className="h-5 w-5 text-indigo-600" /></div>
                  <div className="min-w-0">
                     <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight leading-none truncate">Class Reports</h3>
                     <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Export branch analytics</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 sm:flex gap-4 w-full sm:w-auto bg-slate-50 p-3 rounded-2xl sm:bg-transparent sm:p-0">
                  <div className="text-left sm:text-right border-r border-slate-200 sm:border-none pr-4 sm:pr-0">
                     <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Classes</div>
                     <div className="text-lg md:text-xl font-black text-indigo-600 leading-none">{previewStats.sessions}</div>
                  </div>
                  <div className="text-right pl-4 sm:pl-0">
                     <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Students</div>
                     <div className="text-lg md:text-xl font-black text-indigo-600 leading-none">{filteredStudents.length}</div>
                  </div>
               </div>
            </div>
         </div>

         {/* 2. MST Marks Export Card - Mobile Optimized Stack */}
         <div className="w-full px-2 block">
            <div className="w-full bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
               {/* Decorative Background Icon */}
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Trophy className="h-20 w-20 text-indigo-600" />
               </div>
               
               <div className="relative z-10 w-full flex flex-col items-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full mb-5">
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Performance Center</span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight mb-3">MST Marks Summary</h3>
                  <p className="text-slate-500 text-xs md:text-base font-medium mb-8 max-w-2xl leading-relaxed">
                     Generate a comprehensive branch-wide report. This includes student-wise performance for all subjects in a side-by-side Excel format.
                  </p>

                  <div className="w-full flex flex-col gap-5">
                     <div className="w-full">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Select Exam Type</label>
                        <div className="relative w-full">
                           <Select
                              value={midSemType}
                              onChange={e => setMidSemType(e.target.value as MidSemType)}
                              className="w-full bg-slate-50 border-none font-bold text-sm h-14 rounded-2xl px-5 transition-all focus:bg-slate-100"
                           >
                              <option value="MID_SEM_1">Mid Semester Test 1 (MST-1)</option>
                              <option value="MID_SEM_2">Mid Semester Test 2 (MST-2)</option>
                              <option value="MID_SEM_REMEDIAL">Remedial / Makeup MST</option>
                           </Select>
                        </div>
                     </div>

                     <button
                         onClick={async () => {
                             setLoading(true);
                             setProgress(10);
                             setStatus('Initializing Web Worker...');

                             try {
                                const examName = midSemType === 'MID_SEM_1' ? 'MST 1' : midSemType === 'MID_SEM_2' ? 'MST 2' : 'Remedial MST';
                                setStatus('Fetching marks from database...');
                                const marks = await db.getMarksByStudents(students.map(s => s.uid), midSemType);
                                setProgress(40);
                                setStatus('Preparing data for worker...');

                                const usedSubjectIds = Array.from(new Set(marks.map(m => m.subjectId)));
                                const branchSubjects = (usedSubjectIds as string[]).map(sid => {
                                   const sub = metaData.subjects[sid];
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

                                const tableHeaders = Object.keys(data[0] || {});
                                const examTitle = midSemType === 'MID_SEM_1' ? 'MID SEMESTER TEST - I' : midSemType === 'MID_SEM_2' ? 'MID SEMESTER TEST - II' : 'REMEDIAL MST';
                                const now = new Date();
                                const currentYear = now.getFullYear();
                                const session = now.getMonth() >= 6 ? `${currentYear}-${(currentYear + 1) % 100}` : `${currentYear - 1}-${currentYear % 100}`;

                                setStatus('Worker is generating Excel workbook...');
                                setProgress(60);

                                // Instantiate worker
                                const worker = new Worker(new URL('../services/excel.worker.ts', import.meta.url), { type: 'module' });
                                
                                worker.postMessage({
                                   type: 'GENERATE_MST_EXCEL',
                                   payload: {
                                      data,
                                      branchName,
                                      examName,
                                      examTitle,
                                      session,
                                      coordinatorName: user.displayName,
                                      tableHeaders
                                   }
                                });

                                worker.onmessage = (e) => {
                                   const { type, payload } = e.data;
                                   if (type === 'SUCCESS') {
                                      setProgress(100);
                                      setStatus('Starting download...');
                                      const blob = new Blob([payload], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `${branchName}_${examName}_Summary.xlsx`;
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      setLoading(false);
                                      worker.terminate();
                                   } else if (type === 'ERROR') {
                                      alert("Worker error: " + payload);
                                      setLoading(false);
                                      worker.terminate();
                                   }
                                };
                             } catch (e: any) {
                                alert("Failed to export: " + e.message);
                                setLoading(false);
                             }
                         }}
                        disabled={loading || students.length === 0}
                        className="w-full h-12 md:h-14 px-6 md:px-10 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest md:tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 md:gap-3"
                     >
                        {loading ? (
                           <>
                              <Loader2 className="animate-spin h-4 w-4" />
                              <span>Processing...</span>
                           </>
                        ) : (
                           <>
                              <FileDown className="h-4 w-4" />
                              <span>Download MST Report</span>
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* 3. Detail Reports & Filters */}
         <div className="w-full px-1 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 block">
            <div className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
               <div className="space-y-3">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Time range</label>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                     <button onClick={() => setExportRange('TILL_TODAY')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${exportRange === 'TILL_TODAY' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Session</button>
                     <button onClick={() => setExportRange('CUSTOM')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${exportRange === 'CUSTOM' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Range</button>
                  </div>
                  {exportRange === 'CUSTOM' && (
                     <div className="grid grid-cols-2 gap-2 md:gap-3 animate-in fade-in zoom-in duration-300">
                        <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="mb-0 border-none bg-slate-50 font-black text-indigo-900 rounded-xl" />
                        <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="mb-0 border-none bg-slate-50 font-black text-indigo-900 rounded-xl" />
                     </div>
                  )}
               </div>

               <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="space-y-3">
                     <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Type</label>
                     <div className="grid grid-cols-3 gap-2 md:gap-3">
                        <button onClick={() => setExportSubjectType('ALL')} className={`p-4 rounded-2xl border transition-all text-[10px] md:text-xs font-black uppercase tracking-widest ${exportSubjectType === 'ALL' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>All</button>
                        <button onClick={() => setExportSubjectType('THEORY')} className={`p-4 rounded-2xl border transition-all text-[10px] md:text-xs font-black uppercase tracking-widest ${exportSubjectType === 'THEORY' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Theory</button>
                        <button onClick={() => setExportSubjectType('LAB')} className={`p-4 rounded-2xl border transition-all text-[10px] md:text-xs font-black uppercase tracking-widest ${exportSubjectType === 'LAB' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Lab</button>
                     </div>
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="space-y-3">
                     <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Scope</label>
                     <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <button onClick={() => setFilterMode('FULL')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${filterMode === 'FULL' ? 'bg-indigo-900 text-white border-indigo-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-50 hover:bg-slate-100'}`}>Full Class</button>
                        <button onClick={() => setFilterMode('FILTERED')} className={`p-4 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest ${filterMode === 'FILTERED' ? 'bg-indigo-900 text-white border-indigo-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-50 hover:bg-slate-100'}`}>Filtered</button>
                     </div>
                  </div>
                  {filterMode === 'FILTERED' && (
                     <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 md:gap-3 animate-in fade-in zoom-in duration-300">
                        <select value={filterCondition} onChange={e => setFilterCondition(e.target.value as any)} className="w-full p-3 bg-slate-50 border-none rounded-2xl text-[10px] md:text-xs font-black text-indigo-900 uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
                           <option value="GE">Above (&ge;)</option>
                           <option value="LE">Below (&le;)</option>
                           <option value="GT">Strictly Above (&gt;)</option>
                           <option value="LT">Strictly Below (&lt;)</option>
                        </select>
                        <div className="relative">
                           <input type="number" value={filterValue} onChange={e => setFilterValue(Number(e.target.value))} className="w-full p-3 bg-slate-50 border-none rounded-2xl text-[10px] md:text-xs font-black text-indigo-900 uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm" />
                           <span className="absolute right-4 top-3 text-[10px] text-slate-400 font-black">%</span>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="w-full flex flex-col justify-between gap-4 block">
               <div className="w-full bg-indigo-50/50 p-6 md:p-8 rounded-[2rem] border border-indigo-100/30 flex-1">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-indigo-100 rounded-xl flex-shrink-0"><Activity className="h-4 w-4 text-indigo-600" /></div>
                     <span className="text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest">Report Insights</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-sm md:text-base">
                        <span className="font-bold text-slate-500">Average Attendance</span>
                        <span className="font-black text-indigo-600 text-lg md:text-xl">{averageAttendance}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm md:text-base">
                        <span className="font-bold text-slate-500">Below 75% Criteria</span>
                        <span className="font-black text-rose-600 text-lg md:text-xl">{students.filter(s => {
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
                        }).length} <span className="text-[10px] uppercase">Students</span></span>
                     </div>
                  </div>
                  <button
                     onClick={executeExport}
                     disabled={loading || filteredStudents.length === 0}
                     className="mt-8 md:mt-12 w-full h-14 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     <FileDown className="h-4 w-4" />
                     Generate Detail Report
                  </button>
               </div>
            </div>
         </div>
         <ExportProgressModal isOpen={loading} progress={progress} status={status} />
      </div>
   );
};
