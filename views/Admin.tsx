import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { db } from '../services/db';
import { supabase } from '../services/supabase';
import { Branch, Batch, User, Subject, FacultyAssignment, AttendanceRecord, CoordinatorAssignment, Mark, SystemSettings, MidSemType } from '../types';
import { Card, Button, Input, Select, Modal, FileUploader, ExportProgressModal } from '../components/UI';
import { Plus, Trash2, ChevronRight, Users, BookOpen, Database, Key, ArrowLeft, CheckCircle2, XCircle, Trash, Eye, EyeOff, Layers, Edit2, Calendar, Smartphone, Filter, AlertCircle, AlertTriangle, Trophy, Settings, GripVertical, FileDown, Loader2, Activity, RefreshCw, MoreVertical, Archive, Download } from 'lucide-react';
import { useNavigate, useLocation, Routes, Route, Navigate, useParams } from 'react-router-dom';

const SystemManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'audit'>('config');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({ studentLoginEnabled: true });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metaCache, setMetaCache] = useState<{
    branches: Record<string, string>;
    batches: Record<string, string>;
    subjects: Record<string, string>;
  }>({ branches: {}, batches: {}, subjects: {} });

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'config') {
        const s = await db.getSystemSettings();
        setSettings(s);
      } else {
        const [logs, branches, batches, subjects] = await Promise.all([
          db.getAuditLogs(50),
          db.getBranches(),
          db.getBatches(),
          db.getSubjects()
        ]);

        const bMap: Record<string, string> = {};
        branches.forEach(b => bMap[b.id] = b.name);
        
        const baMap: Record<string, string> = {};
        batches.forEach(b => baMap[b.id] = b.name);
        
        const sMap: Record<string, string> = {};
        subjects.forEach(s => sMap[s.id] = s.name);

        setMetaCache({ branches: bMap, batches: baMap, subjects: sMap });
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudentLogin = async () => {
    setSaving(true);
    try {
      const newSettings = { ...settings, studentLoginEnabled: !settings.studentLoginEnabled };
      await db.updateSystemSettings(newSettings);
      setSettings(newSettings);
    } catch (err: any) {
      alert("Failed to update settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatLogDetails = (log: any) => {
    const m = log.metadata;
    if (!m) return '-';
    
    const parts = [];
    if (m.branchId) parts.push(`Class: ${metaCache.branches[m.branchId] || m.branchId}`);
    if (m.batchId && m.batchId !== 'ALL') parts.push(`Batch: ${metaCache.batches[m.batchId] || m.batchId}`);
    if (m.subjectId) parts.push(`Sub: ${metaCache.subjects[m.subjectId] || m.subjectId}`);
    if (m.date) parts.push(`Date: ${m.date}`);
    if (m.slot) parts.push(`Slot: ${m.slot}`);
    if (m.count) parts.push(`Count: ${m.count}`);
    
    return parts.length > 0 ? parts.join(' • ') : JSON.stringify(m);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab('config')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'audit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Audit Trail
        </button>
      </div>

      {activeSubTab === 'config' ? (
        <Card className="max-w-2xl">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Settings className="h-6 w-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-900">System Configuration</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-900">Student Login Access</h4>
                <p className="text-sm text-slate-500">Control whether students can sign in to the application.</p>
              </div>
              <button
                onClick={handleToggleStudentLogin}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.studentLoginEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.studentLoginEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-bold">Important Note</p>
                  <p>Disabling student login will immediately hide the "Login as Student" option from the login screen and block any active student login attempts.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                System Audit Logs
             </h3>
             <Button variant="secondary" size="sm" onClick={loadData}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
             </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Fetching audit trail...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">No audit logs found.</div>
            ) : (
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Performed By</th>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          log.action.includes('DELETE') ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          log.action.includes('RESTORE') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                         {log.profiles?.display_name || log.performed_by || 'System'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                         {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-[10px] font-bold text-slate-500 leading-relaxed" title={JSON.stringify(log.metadata)}>
                            {formatLogDetails(log)}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};



export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [seeding, setSeeding] = useState(false);

  // Determine active tab from path (admin/students or admin/faculty or admin/monitor or admin/reports or admin/system)
  const activeTab = location.pathname.includes('/admin/faculty') ? 'faculty' :
    location.pathname.includes('/admin/archived') ? 'archived' :
    location.pathname.includes('/admin/monitor') ? 'monitor' :
      location.pathname.includes('/admin/reports') ? 'reports' :
        location.pathname.includes('/admin/system') ? 'system' : 'students';

  const handleSeed = async () => {
    if (!window.confirm("This will reset/overwrite initial data. Continue?")) return;
    setSeeding(true);
    try {
      await db.seedDatabase();
      alert("Database initialized successfully!");
    } catch (e: any) {
      alert("Seeding failed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const tabs = [
    { id: 'students', label: 'Students', icon: Users },
    { id: 'faculty',  label: 'Faculty',  icon: BookOpen },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'monitor',  label: 'Monitor',  icon: Calendar },
    { id: 'reports',  label: 'Reports',  icon: Layers },
    { id: 'system',   label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      {/* Desktop tab bar */}
      <div className="hidden md:flex justify-between items-end border-b border-slate-300 pb-1">
        <div className="flex space-x-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => activeTab !== t.id && navigate(`/admin/${t.id}`)}
              className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === t.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t.id === 'students' ? 'Manage Students' : t.id === 'faculty' ? 'Manage Faculty & Classes' : t.id === 'monitor' ? "Today's Attendance" : t.id === 'archived' ? 'Archived Classes' : t.label}
            </button>
          ))}
        </div>
        <button onClick={handleSeed} disabled={seeding} className="mb-2 text-xs flex items-center px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded transition-colors">
          <Database className="h-3 w-3 mr-1.5" />
          {seeding ? 'Seeding...' : 'Init DB'}
        </button>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-1 pt-1">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
          {tabs.find(t => t.id === activeTab)?.label}
        </h2>
        <button onClick={handleSeed} disabled={seeding} className="text-[10px] flex items-center px-2 py-1 bg-slate-200 text-slate-700 rounded-lg transition-colors">
          <Database className="h-3 w-3 mr-1" />
          {seeding ? '...' : 'Init'}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'students' ? <StudentManagement /> :
        activeTab === 'faculty' ? <FacultyManagement /> :
          activeTab === 'archived' ? <ArchivedClasses /> :
          activeTab === 'monitor' ? <AttendanceMonitor /> :
            activeTab === 'system' ? <SystemManagement /> : <ReportManagement />}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-40">
        <div className="grid grid-cols-6">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => navigate(`/admin/${t.id}`)}
                className={`flex flex-col items-center justify-center py-2.5 gap-1 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`text-[9px] font-black uppercase tracking-tight leading-none ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{t.label}</span>
                {isActive && <div className="absolute top-0 h-0.5 w-8 bg-indigo-600 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ... AdminStudentDetail component remains same ...
const AdminStudentDetail: React.FC<{ student: User; onBack: () => void }> = ({ student, onBack }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [historySubjectFilter, setHistorySubjectFilter] = useState('ALL');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [att, allSubs, marksData, fac, assignments] = await Promise.all([
          db.getStudentAttendance(student.uid),
          db.getSubjects(),
          db.getStudentMarks(student.uid),
          db.getFaculty(),
          db.getAssignments()
        ]);

        // Filter subjects to only show those allotted to this student's branch/batch
        const allottedSubjectIds = new Set(
          assignments
            .filter(a => a.branchId === student.studentData?.branchId && (a.batchId === 'ALL' || a.batchId === student.studentData?.batchId))
            .map(a => a.subjectId)
        );

        // Also include subjects that have attendance data (even if assignment was removed)
        const historySubjectIds = new Set(att.map(a => a.subjectId));

        const filteredSubs = allSubs.filter(s => allottedSubjectIds.has(s.id) || historySubjectIds.has(s.id));

        setAttendance(att);
        setSubjects(filteredSubs);
        setMarks(marksData);
        setFaculty(fac);
      } finally { setLoading(false); }
    };
    load();
  }, [student.uid, student.studentData?.branchId, student.studentData?.batchId]);

  const getSubjectStats = (subjectId: string) => {
    const relevant = attendance.filter(a => a.subjectId === subjectId);
    const total = relevant.length;
    const present = relevant.filter(a => a.isPresent).length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, percentage };
  };

  const subjectStats = subjects.map(s => {
    const stats = getSubjectStats(s.id);
    return { ...s, ...stats };
  }).filter(s => s.total > 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{student.displayName}</h3>
            <p className="text-sm text-slate-900 font-mono">{student.studentData?.enrollmentId} {student.studentData?.rollNo ? `| S.No: ${student.studentData.rollNo}` : ''}</p>
          </div>
        </div>
      </div>
      {loading ? <div className="p-12 text-center text-slate-500">Loading records...</div> : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map(stat => (
              <div key={stat.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2"><span className="font-semibold text-slate-800">{stat.name}</span><span className={`text-sm font-bold px-2 py-0.5 rounded ${stat.percentage < 75 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{stat.percentage}%</span></div>
                <div className="text-sm text-slate-500 flex justify-between"><span>Attended: {stat.present} / {stat.total}</span></div>
              </div>
            ))}
            {subjectStats.length === 0 && <div className="col-span-full p-4 text-center bg-slate-50 border border-dashed rounded text-slate-500">No attendance data.</div>}
          </div>

          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-indigo-600" />
              <h4 className="text-lg font-bold text-slate-900">MST Marks</h4>
            </div>
            {marks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['MID_SEM_1', 'MID_SEM_2', 'MID_SEM_REMEDIAL'].map(type => {
                  const typeMarks = marks.filter(m => m.midSemType === type);
                  if (typeMarks.length === 0) return null;
                  return (
                    <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">{type === 'MID_SEM_REMEDIAL' ? 'Remedial MST' : type.replace('MID_SEM_', 'MST ')}</div>
                      <div className="divide-y divide-slate-100">
                        {typeMarks.map(m => {
                          const sub = subjects.find(s => s.id === m.subjectId);
                          const prof = faculty.find(f => f.uid === m.facultyId);
                          return (
                            <div key={m.id} className="p-3 flex justify-between items-center text-sm">
                              <div className="flex flex-col min-w-0 mr-2">
                                <div className="font-semibold text-slate-700 uppercase text-[10px] truncate">{sub?.name || 'Subject'}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Prof. {prof?.displayName || 'Unknown'}</div>
                              </div>
                              <div className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded whitespace-nowrap">{m.marksObtained} / {m.maxMarks}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 border border-dashed rounded text-slate-500 text-sm italic">No marks recorded.</div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <h4 className="text-lg font-bold text-slate-900">Attendance History</h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
                <select
                  value={historySubjectFilter}
                  onChange={(e) => {
                    setHistorySubjectFilter(e.target.value);
                    setExpandedDate(null);
                  }}
                  className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="ALL">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Present Slots</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Absent Slots</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const filteredAtt = historySubjectFilter === 'ALL'
                      ? attendance
                      : attendance.filter(a => a.subjectId === historySubjectFilter);

                    const dailyGroups: Record<string, { date: string; present: number[]; absent: number[]; records: AttendanceRecord[] }> = {};

                    // Sort attendance by timestamp/slot to ensure order
                    [...filteredAtt].sort((a, b) => (a.lectureSlot || 0) - (b.lectureSlot || 0)).forEach(r => {
                      if (!dailyGroups[r.date]) dailyGroups[r.date] = { date: r.date, present: [], absent: [], records: [] };
                      dailyGroups[r.date].records.push(r);
                      if (r.isPresent) dailyGroups[r.date].present.push(r.lectureSlot || 1);
                      else dailyGroups[r.date].absent.push(r.lectureSlot || 1);
                    });

                    const sortedDates = Object.values(dailyGroups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    if (sortedDates.length === 0) {
                      return <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Records Found</td></tr>;
                    }

                    return sortedDates.map(day => {
                      const isExpanded = expandedDate === day.date;
                      return (
                        <React.Fragment key={day.date}>
                          <tr
                            onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase">{new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {day.present.length > 0 ? (
                                <div className="flex gap-1 justify-center flex-wrap">
                                  {day.present.sort((a, b) => a - b).map(s => (
                                    <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 font-black text-[10px] rounded-md border border-emerald-100">L{s}</span>
                                  ))}
                                </div>
                              ) : <span className="text-slate-200 font-black text-[10px] uppercase tracking-widest">-</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {day.absent.length > 0 ? (
                                <div className="flex gap-1 justify-center flex-wrap">
                                  {day.absent.sort((a, b) => a - b).map(s => (
                                    <span key={s} className="px-2 py-0.5 bg-rose-50 text-rose-600 font-black text-[10px] rounded-md border border-rose-100">L{s}</span>
                                  ))}
                                </div>
                              ) : <span className="text-slate-200 font-black text-[10px] uppercase tracking-widest">-</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'text-slate-400 hover:bg-slate-100'}`}>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={4} className="px-6 py-4">
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(() => {
                                      // Group by subject within the expanded day
                                      const subjectGroups: Record<string, { subjectId: string; markedBy: string; slots: number[]; isPresent: boolean[] }> = {};
                                      day.records.forEach(r => {
                                        const key = `${r.subjectId}_${r.markedBy}`;
                                        if (!subjectGroups[key]) subjectGroups[key] = { subjectId: r.subjectId, markedBy: r.markedBy, slots: [], isPresent: [] };
                                        subjectGroups[key].slots.push(r.lectureSlot || 1);
                                        subjectGroups[key].isPresent.push(r.isPresent);
                                      });

                                      return Object.values(subjectGroups).map((sg, idx) => {
                                        const sub = subjects.find(s => s.id === sg.subjectId);
                                        const prof = faculty.find(f => f.uid === sg.markedBy);
                                        return (
                                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group/item hover:border-indigo-200 transition-all">
                                            <div className="min-w-0 flex-1">
                                              <div className="font-bold text-slate-800 text-xs uppercase truncate">{sub?.name || 'Subject'}</div>
                                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Prof. {prof?.displayName || 'Unknown'}</div>
                                            </div>
                                            <div className="flex gap-1 ml-4 shrink-0">
                                              {sg.slots.map((slot, sidx) => (
                                                <span key={sidx} className={`px-2 py-0.5 rounded-lg font-black text-[9px] border ${sg.isPresent[sidx] ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                  L{slot}: {sg.isPresent[sidx] ? 'P' : 'A'}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

const ArchivedClasses: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batchCounts, setBatchCounts] = useState<Record<string, number>>({});
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  // Drill-down state
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // Edit student state
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState<{ uid: string; name: string; mobile: string; enroll: string; rollNo: string; originalEnroll: string; studentObj: any | null }>({ uid: '', name: '', mobile: '', enroll: '', rollNo: '', originalEnroll: '', studentObj: null });
  const [editLoading, setEditLoading] = useState(false);

  // Dropdown state for class cards
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allBranches = await db.getBranches();
      const archived = allBranches.filter(b => b.view_only);
      setBranches(archived);

      const [allBatches, allStudents] = await Promise.all([
        db.getBatches(),
        db.getAllStudents()
      ]);

      const bCounts: Record<string, number> = {};
      const sCounts: Record<string, number> = {};
      for (const br of archived) {
        bCounts[br.id] = allBatches.filter(b => b.branchId === br.id).length;
        sCounts[br.id] = allStudents.filter(s => s.studentData?.branchId === br.id).length;
      }
      setBatchCounts(bCounts);
      setStudentCounts(sCounts);
    } catch (err) {
      console.error('Failed to load archived classes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = async (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedBatch(null);
    setSubLoading(true);
    try {
      const bts = await db.getBatches(branch.id);
      setBatches(bts);
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  const handleSelectBatch = async (batch: Batch) => {
    if (!selectedBranch) return;
    setSelectedBatch(batch);
    setSubLoading(true);
    try {
      const stus = await db.getStudents(selectedBranch.id, batch.id);
      setStudents(stus);
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedBatch) {
      setSelectedBatch(null);
      setStudents([]);
    } else if (selectedBranch) {
      setSelectedBranch(null);
      setBatches([]);
    }
  };

  const handleRestore = async (branchId: string, branchName: string) => {
    if (!window.confirm(`Are you sure you want to restore "${branchName}" back to active classes?\n\nThis will disable view mode and the class will appear in Students, Faculty, Monitor, and Reports again.`)) return;
    setRestoring(branchId);
    try {
      await db.updateBranchViewOnly(branchId, false);
      setSelectedBranch(null);
      setSelectedBatch(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to restore: ' + err.message);
    } finally {
      setRestoring(null);
    }
  };

  const handleDeleteComplete = async (branchId: string, branchName: string) => {
    if (!window.confirm(`⚠️ DANGER: Are you absolutely sure you want to permanently delete "${branchName}"?\n\nThis will wipe all students, their login accounts, faculty allocations, and attendance. THIS CANNOT BE UNDONE.`)) return;
    if (window.prompt(`Type DELETE to confirm permanent deletion of "${branchName}":`) !== 'DELETE') return;
    
    setSubLoading(true);
    try {
      await db.deleteCompleteBranch(branchId);
      setSelectedBranch(null);
      setSelectedBatch(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setSubLoading(false);
    }
  };

  const handleExportStudents = () => {
    if (students.length === 0) { alert('No students to export.'); return; }
    const header = 'Enrollment,Sr No,Name,Mobile';
    const rows = [...students].sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })).map(s => {
      const enroll = s.studentData?.enrollmentId || '';
      const roll = s.studentData?.rollNo || '';
      const name = s.displayName || '';
      const mobile = s.studentData?.mobileNo || '';
      return `${enroll},${roll},${name},${mobile}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const branchName = selectedBranch?.name?.replace(/\s+/g, '_') || 'class';
    const batchName = selectedBatch?.name?.replace(/\s+/g, '_') || 'students';
    link.download = `${branchName}_${batchName}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const startEditStudent = (s: User) => {
    setEditStudentForm({
      uid: s.uid,
      name: s.displayName,
      mobile: s.studentData?.mobileNo || '',
      enroll: s.studentData?.enrollmentId || '',
      rollNo: s.studentData?.rollNo || '',
      originalEnroll: s.studentData?.enrollmentId || '',
      studentObj: s
    });
    setIsEditingStudent(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || !selectedBatch) return;
    const enrollmentChanged = editStudentForm.enroll.trim().toUpperCase() !== editStudentForm.originalEnroll.trim().toUpperCase();
    if (enrollmentChanged) {
      if (!window.confirm(
        `⚠️ ENROLLMENT CHANGE DETECTED\n\n` +
        `Old: ${editStudentForm.originalEnroll}\nNew: ${editStudentForm.enroll}\n\n` +
        `This will:\n• Create a new login account (${editStudentForm.enroll.toLowerCase()}@acropolis.in)\n` +
        `• Migrate ALL attendance, marks and data to the new account\n` +
        `• Permanently delete the old login account\n\n` +
        `This cannot be undone. Are you sure?`
      )) return;
    } else {
      if (!window.confirm('Are you sure you want to update this student?')) return;
    }
    setEditLoading(true);
    try {
      if (enrollmentChanged && editStudentForm.studentObj) {
        // Full migration: new auth user + data transfer + old user deletion
        await db.migrateStudentEnrollment(
          editStudentForm.uid,
          { ...editStudentForm.studentObj, displayName: editStudentForm.name, studentData: { ...editStudentForm.studentObj.studentData, mobileNo: editStudentForm.mobile, rollNo: editStudentForm.rollNo, branchId: selectedBranch.id, batchId: selectedBatch.id } },
          editStudentForm.enroll.trim().toUpperCase()
        );
        alert(`✅ Enrollment migrated successfully!\nNew login: ${editStudentForm.enroll.trim().toLowerCase()}@acropolis.in`);
      } else {
        await db.updateStudent(editStudentForm.uid, {
          displayName: editStudentForm.name,
          studentData: {
            branchId: selectedBranch.id,
            batchId: selectedBatch.id,
            enrollmentId: editStudentForm.enroll,
            rollNo: editStudentForm.rollNo,
            mobileNo: editStudentForm.mobile
          }
        });
        alert('Student updated successfully.');
      }
      setIsEditingStudent(false);
      const fresh = await db.getStudents(selectedBranch.id, selectedBatch.id);
      setStudents(fresh);
    } catch (err: any) { alert(`Error: ${err.message}`); } finally { setEditLoading(false); }
  };

  const handleDeleteStudent = async (uid: string) => {
    if (!selectedBranch || !selectedBatch) return;
    if (!window.confirm('Are you sure you want to delete this student? This cannot be undone.')) return;
    setSubLoading(true);
    try {
      await db.deleteUser(uid);
      const fresh = await db.getStudents(selectedBranch.id, selectedBatch.id);
      setStudents(fresh);
    } catch (err: any) { alert(err.message); } finally { setSubLoading(false); }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          <span className="text-sm font-bold text-slate-500">Loading archived classes...</span>
        </div>
      </Card>
    );
  }

  if (branches.length === 0) {
    return (
      <Card>
        <div className="text-center py-16 space-y-3">
          <Archive className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700">No Archived Classes</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Classes with View Mode enabled will appear here. They are hidden from Students, Faculty, Monitor, and Reports to avoid confusion with active classes.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Breadcrumb */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-amber-50 rounded-lg">
          <Archive className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center text-sm text-slate-500 gap-1 flex-wrap">
            <span className={`cursor-pointer hover:text-indigo-600 ${!selectedBranch ? 'font-bold text-indigo-600' : ''}`} onClick={() => { setSelectedBranch(null); setSelectedBatch(null); }}>
              Archived Classes
            </span>
            {selectedBranch && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className={`cursor-pointer hover:text-indigo-600 ${selectedBranch && !selectedBatch ? 'font-bold text-indigo-600' : ''}`} onClick={() => { setSelectedBatch(null); }}>
                  {selectedBranch.name}
                </span>
              </>
            )}
            {selectedBatch && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-bold text-indigo-600">{selectedBatch.name}</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {!selectedBranch ? 'Tap a class to view its batches and students.' : !selectedBatch ? 'Tap a batch to view students.' : `${students.length} students in this batch`}
          </p>
        </div>
        {(selectedBranch || selectedBatch) && (
          <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        )}
      </div>

      {subLoading ? (
        <Card>
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            <span className="text-sm font-bold text-slate-500">Loading...</span>
          </div>
        </Card>
      ) : !selectedBranch ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(br => (
            <div key={br.id} onClick={() => handleSelectBranch(br)} className="group border border-amber-200 bg-amber-50/30 p-4 rounded-xl cursor-pointer hover:shadow-lg hover:border-amber-400 flex justify-between items-center transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 mb-1">
                  <span className="font-bold text-amber-900">{br.name}</span>
                </div>
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">View Mode</span>
                  {br.hide_from_teacher_student && <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">Hidden T/S</span>}
                  {br.hide_from_coordinator && <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">Hidden Coord</span>}
                  <span className="text-[10px] text-slate-400 font-bold">{batchCounts[br.id] || 0}b · {studentCounts[br.id] || 0}s</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {/* Three-dot dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === br.id ? null : br.id); }}
                    className="p-2 text-slate-400 hover:text-amber-700 rounded-full hover:bg-amber-50 transition-colors focus:outline-none"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {openDropdownId === br.id && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden origin-top-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); if (confirm(`${br.hide_from_teacher_student ? 'Show' : 'Hide'} "${br.name}" from Teachers & Students?`)) { db.updateBranchHideTeacherStudent(br.id, !br.hide_from_teacher_student).then(loadData).catch(err => alert(err.message)); } }}
                        className="w-full text-left px-4 py-3.5 text-sm hover:bg-slate-50 flex items-center gap-3 font-medium text-slate-700"
                      >
                        {br.hide_from_teacher_student ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-rose-500" />}
                        {br.hide_from_teacher_student ? 'Show to Teachers/Students' : 'Hide from Teachers/Students'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); if (confirm(`${br.hide_from_coordinator ? 'Show' : 'Hide'} "${br.name}" from Coordinator?`)) { db.updateBranchHideCoordinator(br.id, !br.hide_from_coordinator).then(loadData).catch(err => alert(err.message)); } }}
                        className="w-full text-left px-4 py-3.5 text-sm hover:bg-slate-50 flex items-center gap-3 font-medium text-slate-700 border-t border-slate-100"
                      >
                        {br.hide_from_coordinator ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-purple-500" />}
                        {br.hide_from_coordinator ? 'Show to Coordinator' : 'Hide from Coordinator'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleRestore(br.id, br.name); }}
                        disabled={restoring === br.id}
                        className="w-full text-left px-4 py-3.5 text-sm hover:bg-emerald-50 flex items-center gap-3 font-medium text-emerald-700 border-t border-slate-100 disabled:opacity-50"
                      >
                        {restoring === br.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Restore to Active
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); handleDeleteComplete(br.id, br.name); }}
                        className="w-full text-left px-4 py-3.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 border-t border-slate-100 font-medium"
                      >
                        <Trash2 className="h-4 w-4" /> Permanently Delete
                      </button>
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-amber-400 group-hover:text-amber-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : !selectedBatch ? (
        /* ===== Level 2: Batches for Selected Class ===== */
        <Card>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h4 className="font-bold text-slate-800">Batches in {selectedBranch.name}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { if (confirm(`${selectedBranch.hide_from_teacher_student ? 'Show' : 'Hide'} "${selectedBranch.name}" from Teachers & Students?`)) { db.updateBranchHideTeacherStudent(selectedBranch.id, !selectedBranch.hide_from_teacher_student).then(async () => { const fresh = await db.getBranches(); const updated = fresh.find(b => b.id === selectedBranch.id); if (updated) setSelectedBranch(updated); await loadData(); }).catch(err => alert(err.message)); } }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${selectedBranch.hide_from_teacher_student ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
              >
                {selectedBranch.hide_from_teacher_student ? <><Eye className="h-3.5 w-3.5" /> Show T/S</> : <><EyeOff className="h-3.5 w-3.5" /> Hide T/S</>}
              </button>
              <button
                onClick={() => { if (confirm(`${selectedBranch.hide_from_coordinator ? 'Show' : 'Hide'} "${selectedBranch.name}" from Coordinator?`)) { db.updateBranchHideCoordinator(selectedBranch.id, !selectedBranch.hide_from_coordinator).then(async () => { const fresh = await db.getBranches(); const updated = fresh.find(b => b.id === selectedBranch.id); if (updated) setSelectedBranch(updated); await loadData(); }).catch(err => alert(err.message)); } }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${selectedBranch.hide_from_coordinator ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}
              >
                {selectedBranch.hide_from_coordinator ? <><Eye className="h-3.5 w-3.5" /> Show Coord</> : <><EyeOff className="h-3.5 w-3.5" /> Hide Coord</>}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRestore(selectedBranch.id, selectedBranch.name); }}
                disabled={restoring === selectedBranch.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-50"
              >
                {restoring === selectedBranch.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Restore to Active
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteComplete(selectedBranch.id, selectedBranch.name); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Class
              </button>
            </div>
          </div>
          {batches.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No batches found in this class.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {batches.map(bt => (
                <div key={bt.id} onClick={() => handleSelectBatch(bt)} className="group border border-slate-200 p-4 rounded-xl cursor-pointer hover:shadow-lg hover:border-indigo-400 flex justify-between items-center transition-all bg-white">
                  <span className="font-bold text-slate-800">{bt.name}</span>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      title="Rename Batch"
                      onClick={(e) => { e.stopPropagation(); const newName = prompt('Enter new batch name:', bt.name); if (newName && newName !== bt.name) { db.updateBatchName(bt.id, newName).then(async () => { const fresh = await db.getBatches(selectedBranch.id); setBatches(fresh); }).catch(err => alert(err.message)); } }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        /* ===== Level 3: Students in Selected Batch ===== */
        <Card>
          {isEditingStudent && (
            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <h5 className="font-bold text-indigo-800 mb-3 text-sm">Edit Student</h5>
              <form onSubmit={handleEditStudent} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input label="Name" required value={editStudentForm.name} onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })} className="mb-0 bg-white" />
                <Input label="Mobile No" required value={editStudentForm.mobile} onChange={e => setEditStudentForm({ ...editStudentForm, mobile: e.target.value })} className="mb-0 bg-white" />
                <Input label="Enrollment" required value={editStudentForm.enroll} onChange={e => setEditStudentForm({ ...editStudentForm, enroll: e.target.value })} className="mb-0 bg-white" />
                <Input label="Sr No" value={editStudentForm.rollNo} onChange={e => setEditStudentForm({ ...editStudentForm, rollNo: e.target.value })} className="mb-0 bg-white" />
                <div className="col-span-2 md:col-span-4 flex justify-end gap-2 mt-1">
                  <Button variant="secondary" type="button" onClick={() => setIsEditingStudent(false)} disabled={editLoading}>Cancel</Button>
                  <Button type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</Button>
                </div>
              </form>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-800">Students in {selectedBatch.name}</h4>
            <button
              onClick={handleExportStudents}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No students found in this batch.</div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100">
                {[...students].sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })).map(s => (
                  <div key={s.uid} className="flex items-center justify-between py-3 px-1 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm truncate">{s.displayName}</div>
                      <div className="text-[10px] font-mono text-slate-600 uppercase">{s.studentData?.enrollmentId} {s.studentData?.rollNo ? `· Sr No: ${s.studentData.rollNo}` : ''}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.studentData?.mobileNo}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => startEditStudent(s)} className="text-blue-500 p-1" title="Edit"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteStudent(s.uid)} className="text-red-500 p-1" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <table className="hidden md:table w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2 text-slate-900">Enrollment</th>
                    <th className="p-2 text-slate-900">Sr No</th>
                    <th className="p-2 text-slate-900">Name</th>
                    <th className="p-2 text-slate-900">Mobile No</th>
                    <th className="p-2 text-right text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...students].sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })).map(s => (
                    <tr key={s.uid} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-mono text-slate-900">{s.studentData?.enrollmentId}</td>
                      <td className="p-2 font-mono text-slate-900">{s.studentData?.rollNo}</td>
                      <td className="p-2 text-slate-900">{s.displayName}</td>
                      <td className="p-2 text-slate-900 font-mono">{s.studentData?.mobileNo}</td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEditStudent(s)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit Student"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteStudent(s.uid)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Delete Student"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {students.length} students total
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

const StudentManagement: React.FC = () => {
  const { branchId, batchId, studentId } = useParams();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  const [selBranch, setSelBranch] = useState<Branch | null>(null);
  const [selBatch, setSelBatch] = useState<Batch | null>(null);
  const [viewStudent, setViewStudent] = useState<User | null>(null);

  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);

  // Edit Student State
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState<{ uid: string; name: string; mobile: string; enroll: string; rollNo: string; originalEnroll: string; studentObj: any | null }>({ uid: '', name: '', mobile: '', enroll: '', rollNo: '', originalEnroll: '', studentObj: null });

  // Drag and Drop State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Dropdown state for classes
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Derived level
  const level = studentId ? 'detail' : batchId ? 'students' : branchId ? 'batches' : 'branches';

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

  useEffect(() => {
    loadInitialData();
  }, [branchId, batchId, studentId]);

  const loadInitialData = async () => {
    try {
      const allBranches = await db.getBranches();
      setBranches(allBranches);

      if (branchId) {
        const branch = allBranches.find(b => b.id === branchId);
        if (branch) {
          setSelBranch(branch);
          const bts = await db.getBatches(branchId);
          setBatches(bts);

          if (batchId) {
            const batch = bts.find(b => b.id === batchId);
            if (batch) {
              setSelBatch(batch);
              const stus = await db.getStudents(branchId, batchId);
              setStudents(stus);

              if (studentId) {
                const stu = stus.find(s => s.uid === studentId);
                if (stu) setViewStudent(stu);
              } else {
                setViewStudent(null);
              }
            }
          } else {
            setSelBatch(null);
            setStudents([]);
          }
        }
      } else {
        setSelBranch(null);
        setBatches([]);
      }
    } catch (err: any) {
      console.error("Failed to load student management data", err);
    }
  };

  const loadBranches = async () => {
    try {
      setBranches(await db.getBranches());
    } catch (err: any) {
      console.error("Load branches failed", err);
    }
  };

  const handleSelectBranch = (b: Branch) => { navigate(`/admin/students/${b.id}`); };
  const handleSelectBatch = (b: Batch) => { navigate(`/admin/students/${branchId}/${b.id}`); };
  const handleSelectStudent = (s: User) => { navigate(`/admin/students/${branchId}/${batchId}/${s.uid}`); };

  const handleAdd = async () => {
    if (!newItemName) return;
    try {
      if (level === 'branches') {
        await db.addBranch(newItemName);
        await loadBranches();
      } else if (level === 'batches' && branchId) {
        await db.addBatch(newItemName, branchId);
        const bts = await db.getBatches(branchId);
        setBatches(bts);
      }
      setNewItemName('');
    } catch (err: any) {
      alert("Error adding " + (level === 'branches' ? 'branch' : 'batch') + ": " + err.message);
    }
  };

  const handleCSVUpload = async (file: File) => {
    if (!branchId || !batchId) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      // Handle both \n and \r\n line endings
      const lines = text.split(/\r?\n/);
      const newStudents: Partial<User>[] = [];

      // Determine if header exists (first line contains 'enrollment' or 'name')
      const firstLineLower = lines[0].toLowerCase();
      const startIndex = (firstLineLower.includes('enrollment') || firstLineLower.includes('name')) ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma but handle potential trailing commas or simple quotes
        const parts = line.split(',').map(s => s.trim().replace(/^"(.*)"$/, '$1'));
        let enroll, roll, name, mobile;

        if (parts.length >= 4) {
          [enroll, roll, name, mobile] = parts;
        } else if (parts.length === 3) {
          [enroll, name, mobile] = parts; roll = '';
        } else {
          continue;
        }

        if (enroll && name) {
          newStudents.push({
            displayName: name,
            studentData: { branchId, batchId, enrollmentId: enroll, rollNo: roll || '', mobileNo: mobile || '' }
          });
        }
      }

      if (newStudents.length > 0) {
        try {
          setImportProgress({ current: 0, total: newStudents.length });
          const result = await db.importStudents(newStudents, (current, total) => {
            setImportProgress({ current, total });
          });
          let message = `Import Complete:\n- Success: ${result.success}\n- Failed: ${result.failed}`;
          if (result.errors.length > 0) {
            message += `\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}`;
            if (result.errors.length > 5) message += `\n...and ${result.errors.length - 5} more errors.`;
          }
          alert(message);
          setStudents(await db.getStudents(branchId, batchId));
        } catch (err: any) {
          alert("Import process failed: " + err.message);
        } finally {
          setImportProgress(null);
        }
      } else {
        alert("No valid student data found in CSV. Expected columns: Enrollment, Sr No, Name, Mobile");
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const [newStudent, setNewStudent] = useState({ name: '', mobile: '', enroll: '', rollNo: '' });
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !batchId) return;
    if (!window.confirm("Are you sure you want to add this student?")) return;
    setLoading(true);
    try {
      await db.createStudent({
        displayName: newStudent.name,
        studentData: { branchId, batchId, enrollmentId: newStudent.enroll, rollNo: newStudent.rollNo, mobileNo: newStudent.mobile }
      });
      setNewStudent({ name: '', mobile: '', enroll: '', rollNo: '' });
      setStudents(await db.getStudents(branchId, batchId));
      alert(`Student added.`);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const enrollmentChanged = editStudentForm.enroll.trim().toUpperCase() !== editStudentForm.originalEnroll.trim().toUpperCase();
    if (enrollmentChanged) {
      if (!window.confirm(
        `⚠️ ENROLLMENT CHANGE DETECTED\n\n` +
        `Old: ${editStudentForm.originalEnroll}\nNew: ${editStudentForm.enroll}\n\n` +
        `This will:\n• Create a new login account (${editStudentForm.enroll.toLowerCase()}@acropolis.in)\n` +
        `• Migrate ALL attendance, marks and data to the new account\n` +
        `• Permanently delete the old login account\n\n` +
        `This cannot be undone. Are you sure?`
      )) return;
    } else {
      if (!window.confirm("Are you sure you want to update this student?")) return;
    }
    setLoading(true);
    try {
      if (enrollmentChanged && editStudentForm.studentObj) {
        await db.migrateStudentEnrollment(
          editStudentForm.uid,
          { ...editStudentForm.studentObj, displayName: editStudentForm.name, studentData: { ...editStudentForm.studentObj.studentData, mobileNo: editStudentForm.mobile, rollNo: editStudentForm.rollNo, branchId: branchId!, batchId: batchId! } },
          editStudentForm.enroll.trim().toUpperCase()
        );
        alert(`✅ Enrollment migrated successfully!\nNew login: ${editStudentForm.enroll.trim().toLowerCase()}@acropolis.in`);
      } else {
        await db.updateStudent(editStudentForm.uid, {
          displayName: editStudentForm.name,
          studentData: {
            branchId: branchId!,
            batchId: batchId!,
            enrollmentId: editStudentForm.enroll,
            rollNo: editStudentForm.rollNo,
            mobileNo: editStudentForm.mobile
          }
        });
        alert("Student updated");
      }
      setIsEditingStudent(false);
      setStudents(await db.getStudents(branchId!, batchId!));
    } catch (err: any) { alert(`Error: ${err.message}`); } finally { setLoading(false); }
  };

  const startEditStudent = (s: User) => {
    setEditStudentForm({
      uid: s.uid,
      name: s.displayName,
      mobile: s.studentData?.mobileNo || '',
      enroll: s.studentData?.enrollmentId || '',
      rollNo: s.studentData?.rollNo || '',
      originalEnroll: s.studentData?.enrollmentId || '',
      studentObj: s
    });
    setIsEditingStudent(true);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost image if needed, or just set data
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDragEnd = async () => {
    if (draggedIdx === null || dragOverIdx === null || draggedIdx === dragOverIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    // Work on a copy of the current sorted state
    const currentSorted = [...students].sort((a, b) => 
      (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })
    );

    const reordered = [...currentSorted];
    const [movedItem] = reordered.splice(draggedIdx, 1);
    reordered.splice(dragOverIdx, 0, movedItem);

    setDraggedIdx(null);
    setDragOverIdx(null);
    setIsUpdatingOrder(true);

    try {
      const orderedIds = reordered.map(s => s.uid);
      // This now handles class-wide re-indexing automatically
      await db.updateRosterOrder(branchId!, orderedIds);
      
      // Refresh students for this batch
      const fresh = await db.getStudents(branchId!, batchId!);
      setStudents(fresh);
    } catch (err) {
      console.error("Order update failed:", err);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleDelete = async (id: string) => {
    const itemType = level === 'branches' ? 'class' : level === 'batches' ? 'batch' : 'student';
    if (!window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`)) return;
    try {
      if (level === 'branches') {
        await db.deleteBranch(id);
        await loadBranches();
      } else if (level === 'batches' && branchId) {
        await db.deleteBatch(id);
        const bts = await db.getBatches(branchId);
        setBatches(bts);
      } else if (level === 'students' && branchId && batchId) {
        await db.deleteUser(id);
        const stus = await db.getStudents(branchId, batchId);
        setStudents(stus);
      }
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  if (level === 'detail' && viewStudent) return (
    <AdminStudentDetail
      student={viewStudent}
      onBack={() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate(`/admin/students/${branchId}/${batchId}`);
        }
      }}
    />
  );

  let listItems: any[] = [];
  if (level === 'branches') listItems = branches.filter(b => !b.view_only);
  else if (level === 'batches') listItems = batches;

  return (
    <Card>
      <div className="mb-6 space-y-4">
        {/* Global Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-900"
            placeholder="Search student by Enrollment, Mobile No, or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>}
        </div>

        {/* Search Results Dropdown-like display */}
        {searchQuery.length >= 3 && (
          <div className="bg-slate-50 border rounded-lg overflow-hidden shadow-sm">
            <div className="px-3 py-2 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
              <span>Search Results</span>
              <span>{searchResults.length} found</span>
            </div>
            {searchResults.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map(s => (
                  <div
                    key={s.uid}
                    onClick={() => {
                      setSearchQuery('');
                      // Navigate to detail view
                      navigate(`/admin/students/${s.studentData?.branchId}/${s.studentData?.batchId}/${s.uid}`);
                    }}
                    className="flex justify-between items-center px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{s.displayName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {s.studentData?.enrollmentId} | {branches.find(b => b.id === s.studentData?.branchId)?.name || '...'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-600">{s.studentData?.mobileNo}</div>
                      <ChevronRight className="h-4 w-4 text-slate-400 inline ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">{isSearching ? 'Searching...' : 'No students found.'}</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center text-sm mb-6 text-slate-500 flex-wrap justify-between">
        <div className="flex items-center">
          <span className={`cursor-pointer hover:text-indigo-600 ${level === 'branches' ? 'font-bold text-indigo-600' : ''}`} onClick={() => level !== 'branches' && navigate('/admin/students')}>Classes</span>
          {selBranch && <><ChevronRight className="h-4 w-4 mx-2" /><span className={`cursor-pointer hover:text-indigo-600 ${level === 'batches' ? 'font-bold text-indigo-600' : ''}`} onClick={() => level !== 'batches' && navigate(`/admin/students/${branchId}`)}>{selBranch.name}</span></>}
          {selBatch && <><ChevronRight className="h-4 w-4 mx-2" /><span className="font-bold text-indigo-600">{selBatch.name}</span></>}
        </div>

        {level === 'branches' && (
          <button
            onClick={async () => {
              if (!confirm("This will scan all students and fix their Class/Branch associations based on their Batch. Use this if students seem 'missing'. Continue?")) return;
              setLoading(true);
              try {
                const students = await db.getAllStudents();
                const batches = await db.getBranches().then(async brs => {
                  const allBatches: Batch[] = [];
                  for (const br of brs) {
                    const bts = await db.getBatches(br.id);
                    allBatches.push(...bts);
                  }
                  return allBatches;
                });

                let fixed = 0;
                for (const s of students) {
                  if (!s.studentData?.batchId) continue;
                  const batch = batches.find(b => b.id === s.studentData?.batchId);
                  if (batch && s.studentData.branchId !== batch.branchId) {
                    await db.updateStudent(s.uid, {
                      displayName: s.displayName,
                      studentData: { ...s.studentData, branchId: batch.branchId }
                    });
                    fixed++;
                  }
                }
                alert(`Restoration complete! Fixed ${fixed} students.`);
                loadInitialData();
              } catch (err: any) {
                alert("Restoration failed: " + err.message);
              } finally {
                setLoading(false);
              }
            }}
            className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100 transition-colors flex items-center gap-1 font-bold"
          >
            <AlertTriangle className="h-3 w-3" /> Restore Missing Students
          </button>
        )}
      </div>

      {level !== 'students' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder={`New ${level === 'branches' ? 'Class' : 'Batch'} Name`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-grow text-slate-900 bg-white" />
            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1 inline" /> Add</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {listItems.map((item) => (
              <div key={item.id} onClick={() => { if (level === 'branches') handleSelectBranch(item); else handleSelectBatch(item); }} className={`group border p-4 rounded-xl cursor-pointer hover:shadow-lg flex justify-between items-center transition-all bg-white hover:border-indigo-400 ${level === 'branches' && item.view_only ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
                <div className="flex items-center flex-wrap gap-2">
                  <span className={`font-bold ${level === 'branches' && item.view_only ? 'text-amber-900' : 'text-slate-800'}`}>{item.name}</span>
                  {level === 'branches' && (
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        item.view_only ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        View Mode: {item.view_only ? 'Enabled' : 'Disabled'}
                      </span>
                      {item.hide_from_teacher_student && (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                          Hidden from Teachers/Students
                        </span>
                      )}
                      {item.hide_from_coordinator && (
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                          Hidden from Coordinator
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {level === 'branches' ? (
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenDropdownId(openDropdownId === item.id ? null : item.id); 
                        }} 
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors focus:outline-none"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      
                      {openDropdownId === item.id && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden transform origin-top-right transition-all">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenDropdownId(null); 
                              const newName = prompt('Enter new class name:', item.name); 
                              if (newName && newName !== item.name) {
                                db.updateBranchName(item.id, newName).then(loadInitialData).catch(err => alert(err.message));
                              }
                            }} 
                            className="w-full text-left px-4 py-3.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium"
                          >
                            <Edit2 className="h-4 w-4 text-indigo-500" /> Edit Class Name
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setOpenDropdownId(null);
                              if (confirm(`Are you sure you want to ${item.view_only ? 'disable' : 'enable'} view mode for ${item.name}?\n\nIf enabled, regular faculty will NOT be able to add attendance or marks for this class.`)) {
                                db.updateBranchViewOnly(item.id, !item.view_only).then(loadInitialData).catch(err => alert(err.message));
                              }
                            }} 
                            className="w-full text-left px-4 py-3.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium border-t border-slate-100"
                          >
                            {item.view_only ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-amber-500" />}
                            {item.view_only ? 'Disable View Mode' : 'Enable View Mode'}
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setOpenDropdownId(null);
                              if (confirm(`Are you sure you want to ${item.hide_from_teacher_student ? 'show' : 'hide'} ${item.name} for Teachers and Students?`)) {
                                db.updateBranchHideTeacherStudent(item.id, !item.hide_from_teacher_student).then(loadInitialData).catch(err => alert(err.message));
                              }
                            }} 
                            className="w-full text-left px-4 py-3.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium border-t border-slate-100"
                          >
                            {item.hide_from_teacher_student ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-rose-500" />}
                            {item.hide_from_teacher_student ? 'Show to Teachers/Students' : 'Hide from Teachers/Students'}
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setOpenDropdownId(null);
                              if (confirm(`Are you sure you want to ${item.hide_from_coordinator ? 'show' : 'hide'} ${item.name} for the Coordinator?`)) {
                                db.updateBranchHideCoordinator(item.id, !item.hide_from_coordinator).then(loadInitialData).catch(err => alert(err.message));
                              }
                            }} 
                            className="w-full text-left px-4 py-3.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium border-t border-slate-100"
                          >
                            {item.hide_from_coordinator ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-purple-500" />}
                            {item.hide_from_coordinator ? 'Show to Coordinator' : 'Hide from Coordinator'}
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setOpenDropdownId(null);
                              handleDelete(item.id);
                            }} 
                            className="w-full text-left px-4 py-3.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 border-t border-slate-100 font-medium"
                          >
                            <Trash2 className="h-4 w-4" /> Delete Class
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        title="Rename Batch"
                        onClick={(e) => { e.stopPropagation(); const newName = prompt('Enter new batch name:', item.name); if (newName && newName !== item.name) { db.updateBatchName(item.id, newName).then(async () => { if (branchId) { setBatches(await db.getBatches(branchId)); } }).catch(err => alert(err.message)); } }}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                      ><Edit2 className="h-4 w-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded border">
            <form onSubmit={handleAddStudent} className="grid grid-cols-4 gap-4 mb-2">
              <Input label="Name" required value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="mb-0 text-slate-900 bg-white" />
              <Input label="Mobile No" required value={newStudent.mobile} onChange={e => setNewStudent({ ...newStudent, mobile: e.target.value })} className="mb-0 text-slate-900 bg-white" placeholder="Used as password" />
              <Input label="Enrollment" required value={newStudent.enroll} onChange={e => setNewStudent({ ...newStudent, enroll: e.target.value })} className="mb-0 text-slate-900 bg-white" />
              <Input label="Sr No" value={newStudent.rollNo} onChange={e => setNewStudent({ ...newStudent, rollNo: e.target.value })} className="mb-0 text-slate-900 bg-white" />
            </form>
            <div className="flex justify-end gap-2">
              <a href="data:text/csv;charset=utf-8,Enrollment,Sr No,Name,Mobile%0A0827CS221234,1,John Doe,9876543210" download="students_template.csv" className="flex items-center gap-1 px-3 py-2 rounded border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-100 transition-all">📄 Template</a>
              <FileUploader onFileSelect={handleCSVUpload} label="Import CSV" />
              <button
                onClick={() => {
                  if (students.length === 0) { alert('No students to export.'); return; }
                  const header = 'Enrollment,Sr No,Name,Mobile';
                  const rows = [...students].sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })).map(s => {
                    const enroll = s.studentData?.enrollmentId || '';
                    const roll = s.studentData?.rollNo || '';
                    const name = s.displayName || '';
                    const mobile = s.studentData?.mobileNo || '';
                    return `${enroll},${roll},${name},${mobile}`;
                  });
                  const csv = [header, ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  const branchName = selBranch?.name?.replace(/\s+/g, '_') || 'class';
                  const batchName = selBatch?.name?.replace(/\s+/g, '_') || 'students';
                  link.download = `${branchName}_${batchName}_export.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded border border-dashed border-emerald-400 text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition-all"
              >
                <Download className="h-3 w-3" /> Export CSV
              </button>
              <Button onClick={handleAddStudent} disabled={loading}>{loading ? 'Adding...' : 'Add Student'}</Button>
            </div>
            {importProgress && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Importing Students...</span>
                  <span className="text-xs font-black text-indigo-700">{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}></div>
                </div>
                <div className="text-right mt-1 text-[10px] text-indigo-500 font-bold">
                  {importProgress.current} / {importProgress.total} Proceeded
                </div>
              </div>
            )}
          </div>
          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-slate-100">
            {students.sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })).map(s => (
              <div key={s.uid} className="flex items-center justify-between py-3 px-1 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-sm truncate">{s.displayName}</div>
                  <div className="text-[10px] font-mono text-slate-900 uppercase">{s.studentData?.enrollmentId} {s.studentData?.rollNo ? `· ${s.studentData.rollNo}` : ''}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{s.studentData?.mobileNo}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => handleSelectStudent(s)} className="text-indigo-500 p-1" title="View"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => startEditStudent(s)} className="text-blue-500 p-1" title="Edit"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s.uid)} className="text-red-500 p-1" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden md:table w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-2 text-slate-900">Enrollment</th>
                <th className="p-2 text-slate-900 group">
                   Sr No {isUpdatingOrder && <span className="ml-2 inline-block animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full align-middle"></span>}
                </th>
                <th className="p-2 text-slate-900">Name</th>
                <th className="p-2 text-slate-900">Mobile No</th>
                <th className="p-2 text-right text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>{[...students].sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true })).map((s, idx) => (
              <tr 
                key={s.uid} 
                draggable={!isUpdatingOrder}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`border-b group transition-all duration-200 ${dragOverIdx === idx ? 'bg-indigo-50 border-t-2 border-t-indigo-400' : 'bg-white'} ${draggedIdx === idx ? 'opacity-40 grayscale' : ''}`}
              >
                <td className="p-2 font-mono text-slate-900 selectable">{s.studentData?.enrollmentId}</td>
                <td className="p-2 font-mono text-slate-900 selectable">{s.studentData?.rollNo}</td>
                <td className="p-2 text-slate-900 selectable">{s.displayName}</td>
                <td className="p-2 text-slate-900 font-mono selectable">{s.studentData?.mobileNo}</td>
                <td className="p-2 text-right">
                  <div className="flex justify-end items-center gap-1">
                    <button 
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleSelectStudent(s)} className="text-indigo-500 p-1 opacity-0 group-hover:opacity-100" title="View Details"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => startEditStudent(s)} className="text-blue-500 p-1 opacity-0 group-hover:opacity-100" title="Edit Student"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(s.uid)} className="text-red-500 p-1 opacity-0 group-hover:opacity-100" title="Delete Student"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>

          {/* Edit Student Modal */}
          <Modal isOpen={isEditingStudent} onClose={() => setIsEditingStudent(false)} title="Edit Student">
            <form onSubmit={handleEditStudent} className="space-y-4">
              <Input label="Name" required value={editStudentForm.name} onChange={e => setEditStudentForm({ ...editStudentForm, name: e.target.value })} />
              <Input label="Mobile No" required value={editStudentForm.mobile} onChange={e => setEditStudentForm({ ...editStudentForm, mobile: e.target.value })} />
              <Input label="Enrollment" required value={editStudentForm.enroll} onChange={e => setEditStudentForm({ ...editStudentForm, enroll: e.target.value })} />
              <Input label="Sr No" value={editStudentForm.rollNo} onChange={e => setEditStudentForm({ ...editStudentForm, rollNo: e.target.value })} />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsEditingStudent(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </Card>
  );
};

const FacultyManagement: React.FC = () => {
  const { subtab } = useParams();
  const navigate = useNavigate();

  const activeSubTab = (subtab as 'subjects' | 'faculty_list' | 'allocations' | 'coordinators') || 'subjects';
  const setActiveSubTab = (tab: string) => activeSubTab !== tab && navigate(`/admin/faculty/${tab}`);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorAssignment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [newSub, setNewSub] = useState({ name: '', code: '', type: 'theory' as 'theory' | 'lab' });
  const [newFac, setNewFac] = useState({ name: '', email: '', password: '', serialNo: '' });
  const [isImportingSubjects, setIsImportingSubjects] = useState(false);
  const [isImportingFaculty, setIsImportingFaculty] = useState(false);

  const handleImportSubjectsCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsImportingSubjects(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() && !l.toLowerCase().startsWith('name'));
      const parsed = lines.map(line => {
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        const name = parts[0] || '';
        const code = parts[1] || '';
        const type = (parts[2]?.toLowerCase() === 'lab' ? 'lab' : 'theory') as 'theory' | 'lab';
        return { name, code, type };
      }).filter(s => s.name && s.code);
      if (parsed.length === 0) { alert('No valid subject rows found. CSV format: Name, Code, Type (theory/lab)'); setIsImportingSubjects(false); return; }
      const result = await db.importSubjects(parsed);
      alert(`Import Done:\n✅ Success: ${result.success}\n❌ Failed: ${result.failed}${result.errors.length > 0 ? '\n\nErrors:\n' + result.errors.slice(0, 5).join('\n') : ''}`);
      loadData();
      setIsImportingSubjects(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportFacultyCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsImportingFaculty(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() && !l.toLowerCase().startsWith('name') && !l.toLowerCase().startsWith('s.no'));
      const parsed = lines.map(line => {
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        const serialNo = parts[0] || '';
        const name = parts[1] || '';
        const email = parts[2] || '';
        const password = parts[3] || 'password123';
        return { data: { displayName: name, email, facultyData: { serialNo } }, password };
      }).filter(f => f.data.displayName && f.data.email);
      if (parsed.length === 0) { alert('No valid faculty rows found. CSV format: S.No, Name, Email, Password'); setIsImportingFaculty(false); return; }
      const result = await db.importFaculty(parsed);
      alert(`Import Done:\n✅ Success: ${result.success}\n❌ Failed: ${result.failed}${result.errors.length > 0 ? '\n\nErrors:\n' + result.errors.slice(0, 5).join('\n') : ''}`);
      loadData();
      setIsImportingFaculty(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Assignment Form State
  const [assignForm, setAssignForm] = useState({ facultyId: '', subjectId: '', branchId: '', batchId: '' });
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<any>(null);
  const [coordForm, setCoordForm] = useState({ facultyId: '', branchId: '' });
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedFacultyForReset, setSelectedFacultyForReset] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [allocFilterBranchId, setAllocFilterBranchId] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Edit Faculty/Subject State
  const [isEditingFaculty, setIsEditingFaculty] = useState(false);
  const [editFacForm, setEditFacForm] = useState({ uid: '', name: '', email: '', serialNo: '' });
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editSubForm, setEditSubForm] = useState({ id: '', name: '', code: '', type: 'theory' as 'theory' | 'lab' });


  // Maps for displaying names in table
  const [classMap, setClassMap] = useState<Record<string, string>>({}); // Actually class context names
  const [batchMap, setBatchMap] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, [activeSubTab]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [subs, facs, assigns, brs, coords] = await Promise.all([
        db.getSubjects(),
        db.getFaculty(),
        db.getAssignments(),
        db.getBranches(),
        db.getCoordinators()
      ]);
      setSubjects(subs);
      setFaculty(facs);
      setAssignments(assigns);
      setBranches(brs);
      setCoordinators(coords);

      // Pre-fetch all batches for context efficiently
      const involvedBranchIds = Array.from(new Set(assigns.map(a => a.branchId)));
      const bMap: Record<string, string> = {};

      const batchPromises = involvedBranchIds.map(bid => db.getBatches(bid));
      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(bts => {
        bts.forEach(b => bMap[b.id] = b.name);
      });

      setBatchMap(bMap);
    } catch (err: any) {
      console.error("Failed to load faculty data", err);
      // Don't show alert here to avoid spamming, but we ensure loading is false
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadBatches = async (branchId: string) => {
    if (!branchId) return;
    try {
      setBatches(await db.getBatches(branchId));
    } catch (err: any) {
      console.error("Load batches failed", err);
    }
  };

  const handleAddSubject = async () => {
    if (newSub.name) {
      if (!window.confirm("Are you sure you want to add this subject?")) return;
      try {
        await db.addSubject(newSub.name, newSub.code, newSub.type);
        setNewSub({ name: '', code: '', type: 'theory' });
        setSubjects(await db.getSubjects());
      } catch (err: any) {
        alert("Error adding subject: " + err.message);
      }
    }
  };
  const handleDeleteSubject = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await db.deleteSubject(id);
        setSubjects(await db.getSubjects());
      } catch (err: any) {
        alert("Error deleting subject: " + err.message);
      }
    }
  };
  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to add this faculty member?")) return;
    try {
      await db.createFaculty({
        displayName: newFac.name,
        email: newFac.email,
        facultyData: { serialNo: newFac.serialNo }
      }, newFac.password);
      setNewFac({ name: '', email: '', password: '', serialNo: '' });
      setFaculty(await db.getFaculty());
      alert("Faculty added.");
    } catch (e: any) {
      alert(e.message);
    }
  };
  const handleDeleteFaculty = async (uid: string) => {
    if (window.confirm("Are you sure you want to delete this faculty member?")) {
      try {
        await db.deleteUser(uid);
        setFaculty(await db.getFaculty());
      } catch (err: any) {
        alert("Error deleting faculty: " + err.message);
      }
    }
  };
  const initiateResetPassword = (f: User) => { setSelectedFacultyForReset(f); setResetModalOpen(true); };
  const handleResetPassword = async () => { if (selectedFacultyForReset) { if (!window.confirm("Are you sure you want to reset this password?")) return; try { await db.resetFacultyPassword(selectedFacultyForReset.uid, newPasswordInput); alert("Done"); setResetModalOpen(false); setFaculty(await db.getFaculty()); } catch (e: any) { alert(e.message); } } };

  const handleEditFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to update this faculty member?")) return;
    setIsLoadingData(true);
    try {
      await db.updateFaculty(editFacForm.uid, {
        displayName: editFacForm.name,
        email: editFacForm.email,
        facultyData: { serialNo: editFacForm.serialNo }
      });
      setIsEditingFaculty(false);
      await loadData();
      alert("Faculty updated");
    } catch (err: any) { alert(err.message); } finally { setIsLoadingData(false); }
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to update this subject?")) return;
    setIsLoadingData(true);
    try {
      await db.updateSubject(editSubForm.id, editSubForm.name, editSubForm.code, editSubForm.type);
      setIsEditingSubject(false);
      await loadData();
      alert("Subject updated");
    } catch (err: any) { alert(err.message); } finally { setIsLoadingData(false); }
  };

  const startEditFaculty = (f: User) => {
    setEditFacForm({ uid: f.uid, name: f.displayName, email: f.email, serialNo: f.facultyData?.serialNo || '' });
    setIsEditingFaculty(true);
  };

  const startEditSubject = (s: Subject) => {
    setEditSubForm({ id: s.id, name: s.name, code: s.code, type: s.type || 'theory' });
    setIsEditingSubject(true);
  };


  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignForm.facultyId && assignForm.branchId && assignForm.subjectId) {
      // Default batchId to 'ALL' if not selected
      const finalAssign = {
        ...assignForm,
        batchId: assignForm.batchId || 'ALL'
      };
      setPendingAssignment(finalAssign);
      setConfirmModalOpen(true);
    }
  };

  const confirmAssignment = async () => {
    if (pendingAssignment) {
      if (!window.confirm("Are you sure you want to finalize this allocation?")) return;
      try {
        setIsLoadingData(true);
        if (isEditingAssignment && editingAssignmentId) {
          await db.removeAssignment(editingAssignmentId);
        }
        await db.assignFaculty(pendingAssignment);
        await loadData();
        setConfirmModalOpen(false);
        resetAssignForm();
      } catch (e: any) {
        console.error(e);
        alert("Error saving allocation: " + e.message);
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  const resetAssignForm = () => {
    setAssignForm({ facultyId: '', subjectId: '', branchId: '', batchId: '' });
    setIsEditingAssignment(false);
    setEditingAssignmentId(null);
  }

  const handleDeleteAssignment = async (id: string) => { if (window.confirm("Are you sure you want to remove this faculty allocation?")) { await db.removeAssignment(id); loadData(); } };

  const handleEditAssignment = async (assignment: FacultyAssignment) => {
    setIsEditingAssignment(true);
    setEditingAssignmentId(assignment.id);
    await loadBatches(assignment.branchId);
    setAssignForm({
      facultyId: assignment.facultyId,
      branchId: assignment.branchId,
      batchId: assignment.batchId,
      subjectId: assignment.subjectId
    });
  };

  // Helper to format Context display
  const formatContext = (batchId: string) => {
    if (batchId === 'ALL') return 'All Batches';
    return batchMap[batchId] || batchId;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-200 p-1 rounded-lg inline-flex">
        <button onClick={() => setActiveSubTab('subjects')} className={`px-4 py-2 text-sm font-medium rounded ${activeSubTab === 'subjects' ? 'bg-white text-indigo-600' : 'text-slate-600'}`}>Subjects</button>
        <button onClick={() => setActiveSubTab('faculty_list')} className={`px-4 py-2 text-sm font-medium rounded ${activeSubTab === 'faculty_list' ? 'bg-white text-indigo-600' : 'text-slate-600'}`}>Faculty</button>
        <button onClick={() => setActiveSubTab('allocations')} className={`px-4 py-2 text-sm font-medium rounded ${activeSubTab === 'allocations' ? 'bg-white text-indigo-600' : 'text-slate-600'}`}>Allocations</button>
        <button onClick={() => setActiveSubTab('coordinators')} className={`px-4 py-2 text-sm font-medium rounded ${activeSubTab === 'coordinators' ? 'bg-white text-indigo-600' : 'text-slate-600'}`}>Class Coordintor</button>
      </div>
      {isLoadingData ? <div>Loading...</div> : (
        <>
          {activeSubTab === 'subjects' && (
            <Card>
              <div className="flex gap-2 mb-4 bg-slate-50 p-4 flex-wrap">
                <input placeholder="Name" className="border p-2 flex-1 min-w-0 text-slate-900 bg-white" value={newSub.name} onChange={e => setNewSub({ ...newSub, name: e.target.value })} />
                <input placeholder="Code" className="border p-2 w-32 text-slate-900 bg-white" value={newSub.code} onChange={e => setNewSub({ ...newSub, code: e.target.value })} />
                <select 
                  className="border p-2 w-32 text-slate-900 bg-white" 
                  value={newSub.type} 
                  onChange={e => setNewSub({ ...newSub, type: e.target.value as 'theory' | 'lab' })}
                >
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                </select>
                <Button onClick={handleAddSubject}>Add</Button>
                <label className={`cursor-pointer flex items-center gap-1 px-3 py-2 rounded border border-dashed border-indigo-400 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-all ${isImportingSubjects ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isImportingSubjects ? '⏳ Importing...' : '📥 Import CSV'}
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportSubjectsCSV} disabled={isImportingSubjects} />
                </label>
                <a href="data:text/csv;charset=utf-8,Name%2CCode%2CType%0AData%20Structures%2CCS301%2Ctheory%0AOS%20Lab%2CCS302%2Clab" download="subjects_template.csv" className="flex items-center gap-1 px-3 py-2 rounded border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-100 transition-all">📄 Template</a>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2 text-slate-900">Code</th>
                    <th className="p-2 text-slate-900">Name</th>
                    <th className="p-2 text-slate-900">Type</th>
                    <th className="p-2 text-right text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...subjects].sort((a, b) => {
                    const typeA = a.type === 'lab' ? 'lab' : 'theory';
                    const typeB = b.type === 'lab' ? 'lab' : 'theory';
                    if (typeA !== typeB) return typeA === 'theory' ? -1 : 1;
                    return (a.code || '').localeCompare(b.code || '');
                  }).map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="p-2 text-slate-900">{s.code}</td>
                      <td className="p-2 text-slate-900">{s.name}</td>
                      <td className="p-2 text-slate-900 uppercase text-[10px] font-bold">
                        <span className={`px-2 py-1 rounded ${s.type === 'lab' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {s.type || 'theory'}
                        </span>
                      </td>
                      <td className="p-2 text-right flex justify-end gap-2">
                        <button onClick={() => startEditSubject(s)} className="text-blue-500"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteSubject(s.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          {activeSubTab === 'faculty_list' && (
            <Card>
              <form onSubmit={handleAddFaculty} className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2 bg-slate-50 p-4">
                <Input label="S.No" value={newFac.serialNo} onChange={e => setNewFac({ ...newFac, serialNo: e.target.value })} className="mb-0 text-slate-900 bg-white" placeholder="Serial No" />
                <Input label="Name" required value={newFac.name} onChange={e => setNewFac({ ...newFac, name: e.target.value })} className="mb-0 text-slate-900 bg-white" />
                <Input label="Email" required value={newFac.email} onChange={e => setNewFac({ ...newFac, email: e.target.value })} className="mb-0 text-slate-900 bg-white" />
                <Input label="Password" required value={newFac.password} onChange={e => setNewFac({ ...newFac, password: e.target.value })} className="mb-0 text-slate-900 bg-white" />
                <div className="flex items-end gap-2">
                  <Button type="submit" className="flex-1">Add</Button>
                  <label className={`cursor-pointer flex items-center gap-1 px-3 py-2 rounded border border-dashed border-indigo-400 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-all whitespace-nowrap ${isImportingFaculty ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isImportingFaculty ? '⏳...' : '📥 CSV'}
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportFacultyCSV} disabled={isImportingFaculty} />
                  </label>
                  <a href="data:text/csv;charset=utf-8,S.No%2CName%2CEmail%2CPassword%0A1%2CDr.%20John%2Cjohn%40college.in%2Cpassword123" download="faculty_template.csv" className="flex items-center gap-1 px-3 py-2 rounded border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-100 transition-all">📄</a>
                </div>
              </form>
              {/* Mobile faculty cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {faculty.sort((a, b) => (a.facultyData?.serialNo || '').localeCompare(b.facultyData?.serialNo || '', undefined, { numeric: true })).map(f => (
                  <div key={f.uid} className="flex items-center justify-between py-3 px-1 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-sm">{f.displayName} <span className="font-mono text-[10px] text-slate-400">#{f.facultyData?.serialNo || '-'}</span></div>
                      <div className="text-[10px] text-slate-500 truncate">{f.email}</div>
                      <div className="text-[10px] text-slate-400">{f.lastLogin ? new Date(f.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never logged in'}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button onClick={() => startEditFaculty(f)} className="text-blue-500 p-1"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => initiateResetPassword(f)} className="text-slate-500 p-1"><Key className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteFaculty(f.uid)} className="text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop faculty table */}
              <table className="hidden md:table w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-2 text-slate-900 w-16">S.No</th><th className="p-2 text-slate-900">Name</th><th className="p-2 text-slate-900">Email</th><th className="p-2 text-slate-900">Last Login</th><th className="p-2 text-right text-slate-900">Actions</th></tr></thead><tbody>{faculty.sort((a, b) => (a.facultyData?.serialNo || '').localeCompare(b.facultyData?.serialNo || '', undefined, { numeric: true })).map(f => <tr key={f.uid} className="border-b"><td className="p-2 text-slate-600 font-mono text-xs">{f.facultyData?.serialNo || '-'}</td><td className="p-2 text-slate-900 font-semibold">{f.displayName}</td><td className="p-2 text-slate-900">{f.email}</td><td className="p-2 text-slate-500 text-[10px] uppercase font-bold">{f.lastLogin ? new Date(f.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}</td><td className="p-2 text-right flex justify-end gap-2"><button onClick={() => startEditFaculty(f)} className="text-blue-500" title="Edit Faculty"><Edit2 className="h-4 w-4" /></button><button onClick={() => initiateResetPassword(f)} title="Reset Password"><Key className="h-4 w-4" /></button><button onClick={() => handleDeleteFaculty(f.uid)} className="text-red-500"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table>
            </Card>
          )}
          {activeSubTab === 'allocations' && (
            <Card>
              <div className="bg-indigo-50 p-4 rounded mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-indigo-900">{isEditingAssignment ? 'Edit Assignment' : 'New Assignment'}</h4>
                  {isEditingAssignment && <button onClick={resetAssignForm} className="text-xs text-red-600 underline">Cancel Edit</button>}
                </div>
                <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                  <Select label="Faculty" value={assignForm.facultyId} onChange={e => setAssignForm({ ...assignForm, facultyId: e.target.value })} className="mb-0 bg-white">{[<option key="def" value="">Select</option>, ...faculty.map(f => <option key={f.uid} value={f.uid}>{f.displayName}</option>)]}</Select>
                  <Select label="Class" value={assignForm.branchId} onChange={e => { setAssignForm({ ...assignForm, branchId: e.target.value, batchId: '' }); loadBatches(e.target.value); }} className="mb-0 bg-white">{[<option key="def" value="">Select</option>, ...branches.filter(b => !b.view_only).map(b => <option key={b.id} value={b.id}>{b.name}</option>)]}</Select>
                  <Select label="Subject" value={assignForm.subjectId} onChange={e => {
                    const subj = subjects.find(s => s.id === e.target.value);
                    setAssignForm({ ...assignForm, subjectId: e.target.value, batchId: (subj?.type !== 'lab') ? 'ALL' : '' });
                  }} className="mb-0 bg-white">{[<option key="def" value="">Select</option>, ...subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.type || 'theory'}</option>)]}</Select>
                  {subjects.find(s => s.id === assignForm.subjectId)?.type === 'lab' && (
                    <Select label="Batch" value={assignForm.batchId} onChange={e => setAssignForm({ ...assignForm, batchId: e.target.value })} disabled={!assignForm.branchId} className="mb-0 bg-white">{[<option key="def" value="">Select Batch</option>, ...batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)]}</Select>
                  )}
                  <Button type="submit" className="">{isEditingAssignment ? 'Update' : 'Assign'}</Button>
                </form>
              </div>

              <div className="flex justify-between items-center mb-2 px-2">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Allocations</h5>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">Filter by Class:</span>
                  <select
                    value={allocFilterBranchId}
                    onChange={e => setAllocFilterBranchId(e.target.value)}
                    className="text-xs border rounded p-1 bg-white text-slate-700"
                  >
                    <option value="">All Classes</option>
                    {branches.filter(b => !b.view_only).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Mobile assignment cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {assignments.filter(a => { const br = branches.find(b => b.id === a.branchId); if (br?.view_only) return false; return !allocFilterBranchId || a.branchId === allocFilterBranchId; }).map(a => {
                  const fac = faculty.find(f => f.uid === a.facultyId);
                  const sub = subjects.find(s => s.id === a.subjectId);
                  const br = branches.find(b => b.id === a.branchId)?.name;
                  return (
                    <div key={a.id} className="flex items-center justify-between py-3 px-1 gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-sm truncate">{fac?.displayName}</div>
                        <div className="text-[10px] text-slate-600">{sub ? `${sub.name} (${sub.code})` : 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400">{br} · {formatContext(a.batchId)}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button onClick={() => handleEditAssignment(a)} className="text-blue-500 p-1"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteAssignment(a.id)} className="text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop assignment table */}
              <table className="hidden md:table w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-2 text-slate-900">Faculty</th><th className="p-2 text-slate-900">Subject</th><th className="p-2 text-slate-900">Context</th><th className="p-2 text-right text-slate-900">Action</th></tr></thead>
                <tbody>{assignments.filter(a => { const br = branches.find(b => b.id === a.branchId); if (br?.view_only) return false; return !allocFilterBranchId || a.branchId === allocFilterBranchId; }).map(a => {
                  const fac = faculty.find(f => f.uid === a.facultyId);
                  const sub = subjects.find(s => s.id === a.subjectId);
                  const subDisplayName = sub ? `${sub.name} (${sub.code})` : 'Unknown Subject';
                  const br = branches.find(b => b.id === a.branchId)?.name;
                  return (<tr key={a.id} className="border-b"><td className="p-2 text-slate-900">{fac?.displayName}</td><td className="p-2 text-slate-900">{subDisplayName}</td><td className="p-2 text-xs text-slate-600"><div className="font-bold">{br}</div><div>{formatContext(a.batchId)}</div></td><td className="p-2 text-right flex justify-end gap-2"><button onClick={() => handleEditAssignment(a)} className="text-blue-500 hover:text-blue-700"><Edit2 className="h-4 w-4" /></button><button onClick={() => handleDeleteAssignment(a.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></td></tr>)
                })}</tbody></table>
            </Card>
          )}
          {activeSubTab === 'coordinators' && (
            <Card>
              <div className="bg-indigo-50 p-4 rounded mb-4">
                <h4 className="font-semibold text-indigo-900 mb-2">Assign Class Coordintor</h4>
                <div className="flex gap-2 items-end">
                  <Select label="Faculty" value={coordForm.facultyId} onChange={e => setCoordForm({ ...coordForm, facultyId: e.target.value })} className="mb-0 bg-white">
                    <option value="">Select Faculty</option>
                    {faculty.map(f => <option key={f.uid} value={f.uid}>{f.displayName}</option>)}
                  </Select>
                  <Select label="Class" value={coordForm.branchId} onChange={e => setCoordForm({ ...coordForm, branchId: e.target.value })} className="mb-0 bg-white">
                    <option value="">Select Class</option>
                    {branches.filter(b => !b.view_only).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                  <Button onClick={async () => {
                    if (coordForm.facultyId && coordForm.branchId) {
                      await db.assignCoordinator(coordForm);
                      setCoordForm({ facultyId: '', branchId: '' });
                      await loadData();
                    }
                  }}>Assign</Button>
                </div>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-2 text-slate-900">Faculty</th>
                    <th className="p-2 text-slate-900">Class</th>
                    <th className="p-2 text-right text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coordinators.filter(c => { const br = branches.find(b => b.id === c.branchId); return !br?.view_only; }).map(c => (
                    <tr key={c.id} className="border-b">
                      <td className="p-2 text-slate-900">{faculty.find(f => f.uid === c.facultyId)?.displayName}</td>
                      <td className="p-2 text-slate-900">{branches.find(b => b.id === c.branchId)?.name}</td>
                      <td className="p-2 text-right">
                        <button onClick={async () => { if (window.confirm("Are you sure you want to remove this coordinator assignment?")) { await db.removeCoordinator(c.id); await loadData(); } }}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
      <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Assignment">
        <div className="p-4">
          <p className="text-slate-600 mb-4">{isEditingAssignment ? 'Please review the updated details:' : 'Please review the assignment details before confirming:'}</p>

          {pendingAssignment && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mb-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty</span>
                <span className="text-sm font-bold text-slate-900">{faculty.find(f => f.uid === pendingAssignment.facultyId)?.displayName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</span>
                <span className="text-sm font-bold text-slate-900">
                  {subjects.find(s => s.id === pendingAssignment.subjectId)
                    ? `${subjects.find(s => s.id === pendingAssignment.subjectId)?.name} (${subjects.find(s => s.id === pendingAssignment.subjectId)?.code})`
                    : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</span>
                <span className="text-sm font-bold text-slate-900">{branches.find(b => b.id === pendingAssignment.branchId)?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch</span>
                <span className="text-sm font-bold text-indigo-600">
                  {pendingAssignment.batchId === 'ALL' ? 'All Batches' : (batchMap[pendingAssignment.batchId] || pendingAssignment.batchId)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)} className="px-6">Cancel</Button>
            <Button onClick={confirmAssignment} className="px-8 bg-indigo-600 hover:bg-indigo-700">Confirm & Save</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset Password"><div className="p-4"><Input label="New Password" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} className="text-slate-900 bg-white" /><div className="flex justify-end gap-2 mt-4"><Button onClick={handleResetPassword}>Update</Button></div></div></Modal>

      {/* Edit Faculty Modal */}
      <Modal isOpen={isEditingFaculty} onClose={() => setIsEditingFaculty(false)} title="Edit Faculty">
        <form onSubmit={handleEditFaculty} className="space-y-4 p-4">
          <Input label="Sr No" value={editFacForm.serialNo} onChange={e => setEditFacForm({ ...editFacForm, serialNo: e.target.value })} className="text-slate-900 bg-white" placeholder="S.No" />
          <Input label="Name" required value={editFacForm.name} onChange={e => setEditFacForm({ ...editFacForm, name: e.target.value })} className="text-slate-900 bg-white" />
          <Input label="Email" required value={editFacForm.email} onChange={e => setEditFacForm({ ...editFacForm, email: e.target.value })} className="text-slate-900 bg-white" />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditingFaculty(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoadingData}>{isLoadingData ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal isOpen={isEditingSubject} onClose={() => setIsEditingSubject(false)} title="Edit Subject">
        <form onSubmit={handleEditSubject} className="space-y-4 p-4">
          <Input label="Subject Name" required value={editSubForm.name} onChange={e => setEditSubForm({ ...editSubForm, name: e.target.value })} className="text-slate-900 bg-white" />
          <Input label="Subject Code" required value={editSubForm.code} onChange={e => setEditSubForm({ ...editSubForm, code: e.target.value })} className="text-slate-900 bg-white" />
          <Select label="Subject Type" value={editSubForm.type} onChange={e => setEditSubForm({ ...editSubForm, type: e.target.value as 'theory' | 'lab' })} className="text-slate-900 bg-white">
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </Select>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsEditingSubject(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoadingData}>{isLoadingData ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Attendance Monitor View
function AttendanceMonitor() {
  const [students, setStudents] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectDate, setInspectDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [allStu, allBr, allAtt] = await Promise.all([
          db.getAllStudents(),
          db.getBranches(),
          db.getDateAttendance(inspectDate)
        ]);
        setStudents(allStu);
        setBranches(allBr);
        setAttendance(allAtt);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Live update for the selected date
    const channel = supabase
      .channel(`attendance_monitor_${inspectDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `date=eq.${inspectDate}`
        },
        async () => {
          // Re-fetch only the attendance for that date to keep stats fresh
          const freshAtt = await db.getDateAttendance(inspectDate);
          setAttendance(freshAtt);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inspectDate]);

  const stats = React.useMemo(() => {
    const sessionsMap = new Map<string, Set<string>>();
    const presentCounts = new Map<string, number>();

    attendance.forEach(a => {
      const key = `${a.branchId}_${a.batchId}`;
      if (!sessionsMap.has(key)) sessionsMap.set(key, new Set());
      sessionsMap.get(key)?.add(`${a.subjectId}_${a.lectureSlot}`);

      if (a.isPresent) {
        presentCounts.set(a.studentId, (presentCounts.get(a.studentId) || 0) + 1);
      }
    });

    return students.map(s => {
      const bId = s.studentData?.branchId || '';
      const batId = s.studentData?.batchId || '';
      const sessionsForBatch = sessionsMap.get(`${bId}_${batId}`) || new Set();
      const sessionsForAll = sessionsMap.get(`${bId}_ALL`) || new Set();
      
      // Use a temporary set to count unique sessions across Batch and ALL assignments
      const totalSessions = new Set([...Array.from(sessionsForBatch), ...Array.from(sessionsForAll)]).size;
      const presentCount = presentCounts.get(s.uid) || 0;

      return {
        ...s,
        totalLectures: totalSessions,
        attendedLectures: presentCount,
        isIncomplete: presentCount < totalSessions
      };
    });
  }, [students, attendance]);

  const filteredStats = stats.filter(s => {
    const studentBranch = branches.find(b => b.id === s.studentData?.branchId);
    if (studentBranch?.view_only) return false;
    const matchBranch = branchFilter === 'ALL' || s.studentData?.branchId === branchFilter;
    const matchStatus = !showIncompleteOnly || s.isIncomplete;
    return matchBranch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg"><Calendar className="h-5 w-5 text-indigo-600" /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Daily Attendance Monitor</h3>
            <p className="text-xs text-slate-500">Track student engagement for {inspectDate === new Date().toISOString().split('T')[0] ? 'today' : inspectDate}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Date:</span>
            <input type="date" value={inspectDate} onChange={e => setInspectDate(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-slate-900 focus:ring-0 appearance-none p-0 cursor-pointer" />
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-4 bg-indigo-50/50 px-4 py-2 rounded-lg border border-indigo-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Total Students</span>
              <span className="text-sm font-black text-indigo-700">{filteredStats.length}</span>
            </div>
            <div className="h-6 w-px bg-indigo-200/50"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest leading-none">Completed</span>
              <span className="text-sm font-black text-green-600">{filteredStats.filter(s => s.totalLectures > 0 && s.attendedLectures === s.totalLectures).length}</span>
            </div>
          </div>

          <Select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="mb-0 text-xs font-bold bg-white">
            <option value="ALL">All Classes</option>
            {branches.filter(b => !b.view_only).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <button onClick={() => setShowIncompleteOnly(!showIncompleteOnly)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${showIncompleteOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
            {showIncompleteOnly ? <AlertTriangle className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            {showIncompleteOnly ? 'Showing Incomplete' : 'Filter Incomplete'}
          </button>
        </div>
      </div>
      <Card className="p-0 overflow-hidden border-slate-200 shadow-xl shadow-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Class</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Mobile</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Engagement</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500">Fetching records...</td></tr>
              ) : filteredStats.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400">No students found for this filter.</td></tr>
              ) : (
                filteredStats.map(s => (
                  <tr key={s.uid} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{s.displayName}</div>
                      <div className="text-[10px] text-slate-900 font-mono tracking-tighter uppercase">{s.studentData?.enrollmentId} | S.No: {s.studentData?.rollNo}</div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded uppercase">
                        {branches.find(b => b.id === s.studentData?.branchId)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium"><Smartphone className="h-3 w-3 text-slate-400" />{s.studentData?.mobileNo || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <div className="text-sm font-black text-slate-900">
                          <span className={s.attendedLectures === s.totalLectures ? 'text-green-600' : 'text-indigo-600'}>{s.attendedLectures}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-slate-500">{s.totalLectures}</span>
                        </div>
                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full transition-all ${s.attendedLectures === s.totalLectures ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${s.totalLectures === 0 ? 0 : (s.attendedLectures / s.totalLectures) * 100}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {s.totalLectures === 0 ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">No Lectures</span>
                      ) : s.attendedLectures === s.totalLectures ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded"><CheckCircle2 className="h-3 w-3" /> COMPLETED</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded"><AlertCircle className="h-3 w-3" /> MISSING {s.totalLectures - s.attendedLectures}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const ReportManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [reportViewMode, setReportViewMode] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [exportRange, setExportRange] = useState<'TILL_TODAY' | 'CUSTOM'>('TILL_TODAY');
  const [exportSubjectType, setExportSubjectType] = useState<'ALL' | 'THEORY' | 'LAB'>('ALL');
  const [exportFormat, setExportFormat] = useState<'DETAILED' | 'COMPATIBLE'>('DETAILED');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [filterMode, setFilterMode] = useState<'FULL' | 'FILTERED'>('FULL');
  const [attendanceThreshold, setAttendanceThreshold] = useState(75);
  const [attendanceOperator, setAttendanceOperator] = useState<'GE' | 'LE' | 'GT' | 'LT'>('GE');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [metaBatches, setMetaBatches] = useState<Record<string, string>>({});
  const [midSemType, setMidSemType] = useState<MidSemType>('MID_SEM_1');

  useEffect(() => {
    db.getBranches().then(setBranches);
    db.getSubjects().then(setSubjects);
  }, []);

  const handleBranchSelect = async (branchId: string) => {
    setSelectedBranchId(branchId);
    if (!branchId) return;
    setLoading(true);
    setProgress(15);
    setStatus('Loading branch master data...');
    try {
      const [allStu, allAtt, fetchedBatches] = await Promise.all([
        db.getStudentsByBranch(branchId),
        db.getBranchAttendance(branchId),
        db.getBatches(branchId)
      ]);
      setProgress(80);
      setStatus('Indexing records...');
      setStudents(allStu);
      setAttendance(allAtt);
      
      const batchMap: Record<string, string> = {};
      fetchedBatches.forEach(b => { batchMap[b.id] = b.name; });
      setMetaBatches(batchMap);
      setProgress(100);
      setStatus('Ready');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  const executeExport = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setProgress(0);
    setStatus('Initializing admin report...');

    try {
      // Small delays just to let UI render the progress steps, vastly reduced for speed
      await new Promise(r => setTimeout(r, 10));
      setProgress(10);
      setStatus('Filtering database records...');
      await new Promise(r => setTimeout(r, 10));

      const exportStart = exportRange === 'CUSTOM' ? exportStartDate : '';
      const exportEnd = exportRange === 'CUSTOM' ? exportEndDate : '';
      const recordsToExport = attendance.filter(r => {
        const inStart = !exportStart || r.date >= exportStart;
        const inEnd = !exportEnd || r.date <= exportEnd;
        return inStart && inEnd;
      });

      if (recordsToExport.length === 0) {
        alert("No records found in the selected range.");
        setLoading(false);
        return;
      }

      setProgress(30);
      setStatus('Compiling subject headers...');
      await new Promise(r => setTimeout(r, 10));

      const branchName = branches.find(b => b.id === selectedBranchId)?.name || 'Branch';

      const regularRecs = recordsToExport.filter(r => {
        if (r.subjectId === 'sub_extra') return false;
        const subj = subjects.find(s => s.id === r.subjectId);
        if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
        if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
        return true;
      });
      const uniqueSubjectIds = Array.from(new Set(regularRecs.map(r => r.subjectId))).sort((a, b) => {
        const sA = subjects.find(s => s.id === a);
        const sB = subjects.find(s => s.id === b);
        const nameA = (sA?.code || '') + (sA?.type || 'theory');
        const nameB = (sB?.code || '') + (sB?.type || 'theory');
        return nameA.localeCompare(nameB);
      });

      const subjectSessionCounts: Record<string, number> = {};
      uniqueSubjectIds.forEach(sid => {
        const subjectSessions = new Set(regularRecs.filter(r => r.subjectId === sid).map(r => `${r.date}_${r.lectureSlot}`)).size;
        subjectSessionCounts[sid] = subjectSessions;
      });

      const totalRegularSessions = new Set(regularRecs.map(r => `${r.date}_${r.lectureSlot}_${r.subjectId}`)).size;
      const subjectHeaders = uniqueSubjectIds.map(sid => {
        const s = subjects.find(s => s.id === sid);
        return s ? `${s.code} (${s.type === 'lab' ? 'Lab' : 'Theory'})` : sid;
      });

      const now = new Date();
      const currentYear = now.getFullYear();
      const session = now.getMonth() >= 6 ? `${currentYear}-${(currentYear + 1) % 100}` : `${currentYear - 1}-${currentYear % 100}`;

      const headerRows = [
        ["ACROPOLIS INSTITUTE OF TECHNOLOGY AND RESEARCH"],
        ["DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING"],
        [`Attendance Summary Report: ${branchName} | SESSION: ${session}`],
        [`Period: ${exportRange === 'TILL_TODAY' ? 'Full Session' : `${exportStartDate} to ${exportEndDate}`}`],
        [`Generated: ${now.toLocaleString()} | ADMIN EXPORT`],
        []
      ];

      setProgress(50);
      setStatus('Calculating class statistics...');
      await new Promise(r => setTimeout(r, 10));

      const allBranchStudents = [...students].sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true }));

      // --- 2. Stats Calculation (Optimized O(N+M)) ---
      const studentStatsMap = new Map<string, { present: number, total: number }>();
      regularRecs.forEach(r => {
        const current = studentStatsMap.get(r.studentId) || { present: 0, total: 0 };
        studentStatsMap.set(r.studentId, {
          present: current.present + (r.isPresent ? 1 : 0),
          total: current.total + 1
        });
      });

      const filteredForExport = filterMode === 'FULL' ? allBranchStudents : allBranchStudents.filter(s => {
        const stats = studentStatsMap.get(s.uid) || { present: 0, total: 0 };
        const pct = stats.total === 0 ? 0 : (stats.present / stats.total) * 100;
        if (attendanceOperator === 'GE') return pct >= attendanceThreshold;
        if (attendanceOperator === 'LE') return pct <= attendanceThreshold;
        if (attendanceOperator === 'GT') return pct > attendanceThreshold;
        if (attendanceOperator === 'LT') return pct < attendanceThreshold;
        return true;
      });

      const studentStats = filteredForExport.map(s => {
        const studentRecs = recordsToExport.filter(r => r.studentId === s.uid);
        const studentRegularRecs = studentRecs.filter(r => r.subjectId !== 'sub_extra');
        const presentCount = studentRegularRecs.filter(r => r.isPresent).length;
        const totalSessions = studentRegularRecs.length;
        const extraCount = studentRecs.filter(r => r.subjectId === 'sub_extra' && r.isPresent).length;
        const pct = totalSessions === 0 ? 0 : ((presentCount + extraCount) / totalSessions) * 100;
        return { name: s.displayName, pct };
      });

      const classAvg = filteredForExport.length === 0 ? 0 : Math.round(studentStats.reduce((acc, curr) => acc + curr.pct, 0) / filteredForExport.length);
      const detentionCount = studentStats.filter(s => s.pct < 75).length;

      const statsInfo = [
        ["EXECUTIVE SUMMARY", ""],
        ["Total Strength", filteredForExport.length.toString()],
        ["Class Average", `${classAvg}%`],
        ["Detention Count (<75%)", detentionCount.toString()],
        ["", ""]
      ];

      const headerLabels = ["Sr No", "Name", "Enrollment", ...subjectHeaders, "Extra", "Total lectures", "Present Count", "Attendance %"];
      let excelRows: any[][] = [...headerRows, ...statsInfo];

      // Group students by Batch
      const batchesMap = new Map<string, User[]>();
      filteredForExport.forEach(s => {
        const bId = s.studentData?.batchId || 'UNASSIGNED';
        if (!batchesMap.has(bId)) batchesMap.set(bId, []);
        batchesMap.get(bId)!.push(s);
      });

      setProgress(70);
      setStatus('Generating batch data...');
      await new Promise(r => setTimeout(r, 10));

      Array.from(batchesMap.entries()).forEach(([batchId, batchStudents]) => {
        const batchNameStr = metaBatches[batchId] || batchId;

        // Find all records that apply to this batch specifically or to the whole class
        const batchRegularRecs = regularRecs.filter(r => r.batchId === batchId || r.batchId === 'ALL');
        
        const batchSubjectSessionCounts: Record<string, number> = {};
        uniqueSubjectIds.forEach(sid => {
          const batchSubjectSessions = new Set(batchRegularRecs.filter(r => r.subjectId === sid).map(r => `${r.date}_${r.lectureSlot}`)).size;
          batchSubjectSessionCounts[sid] = batchSubjectSessions;
        });

        // Add Batch Spacing and Headers
        excelRows.push([]); 
        excelRows.push([`>>> BATCH: ${batchNameStr} <<<`]);
        excelRows.push(headerLabels);

        const batchTotalLectures = Object.values(batchSubjectSessionCounts).reduce((acc, curr) => acc + curr, 0);
        const batchTotalsLabelRow = ["", "Total lectures held", "", ...uniqueSubjectIds.map(sid => batchSubjectSessionCounts[sid].toString()), "", batchTotalLectures.toString(), "VARIES", ""];
        excelRows.push(batchTotalsLabelRow);

        const batchDataRows = batchStudents.map(s => {
          const studentRecs = recordsToExport.filter(r => r.studentId === s.uid);
          const studentRegularRecs = regularRecs.filter(r => r.studentId === s.uid);
          const presentCount = studentRegularRecs.filter(r => r.isPresent).length;
          const totalSessions = studentRegularRecs.length;
          const extraCount = studentRecs.filter(r => r.subjectId === 'sub_extra' && r.isPresent).length;

          const subjectAttendance = uniqueSubjectIds.map(sid => {
            return studentRegularRecs.filter(r => r.subjectId === sid && r.isPresent).length.toString();
          });

          const pct = totalSessions === 0 ? 0 : Math.round(((presentCount + extraCount) / totalSessions) * 100);

          return [
            s.studentData?.rollNo || '',
            s.displayName,
            s.studentData?.enrollmentId || '',
            ...subjectAttendance,
            extraCount.toString(),
            totalSessions.toString(),
            (presentCount + extraCount).toString(),
            `${pct}%`
          ];
        });

        excelRows = excelRows.concat(batchDataRows);
        excelRows.push([]); // trailing spacer
        excelRows.push([]);
      });

      setProgress(85);
      setStatus('Applying Excel styling...');
      await new Promise(r => setTimeout(r, 10));

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Attendance Report');

      // Add data
      sheet.addRows(excelRows);

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

      // Frozen Panes
      sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 13 }];

      // Apply Colors & Styles
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

          const R = rowNumber - 1; // 0-indexed row for logic comparison
          const C = colNumber - 1;

          // Main Headers (Rows 0-2)
          if (R >= 0 && R <= 2) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
            cell.alignment = { horizontal: "center" };
          }

          const rowVal0 = excelRows[R]?.[0]?.toString() || '';
          const rowVal1 = excelRows[R]?.[1]?.toString() || '';

          // Batch Title Row
          if (rowVal0.startsWith('>>> BATCH')) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
            cell.alignment = { horizontal: "center" };
          }

          // Table Header
          if (rowVal0 === 'Sr No') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: "center" };
          }

          // Totals Row
          if (rowVal1 === 'Total lectures held') {
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

      // Merge batch title rows across the whole table and headers
      sheet.mergeCells(1, 1, 1, headerLabels.length);
      sheet.mergeCells(2, 1, 2, headerLabels.length);
      sheet.mergeCells(3, 1, 3, headerLabels.length);
      
      excelRows.forEach((row, R) => {
        if (row[0]?.toString().startsWith('>>> BATCH')) {
          sheet.mergeCells(R + 1, 1, R + 1, headerLabels.length);
        }
      });

      setProgress(95);
      setStatus('Finalizing file...');
      await new Promise(r => setTimeout(r, 10));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${branchName}_Admin_Summary.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      setProgress(100);
      setStatus('Complete!');
      setShowExportModal(false);
    } catch (e: any) {
      alert("Export failed: " + e.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 800);
    }
  };

  const downloadCSV = (rows: string[][], filename: string) => {
    const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewRecords = useMemo(() => {
    const start = exportRange === 'CUSTOM' ? exportStartDate : '';
    const end = exportRange === 'CUSTOM' ? exportEndDate : '';
    return attendance.filter(r => {
      const inStart = !start || r.date >= start;
      const inEnd = !end || r.date <= end;
      return inStart && inEnd;
    });
  }, [attendance, exportRange, exportStartDate, exportEndDate, exportSubjectType, subjects]);

  const previewStats = useMemo(() => {
    const regularRecs = previewRecords.filter(r => {
      if (r.subjectId === 'sub_extra') return false;
      const subj = subjects.find(s => s.id === r.subjectId);
      if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
      if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
      return true;
    });
    const sessions = new Set(regularRecs.map(r => `${r.date}_${r.lectureSlot}_${r.subjectId}`)).size;
    return { sessions, totalRecords: previewRecords.length };
  }, [previewRecords, exportSubjectType, subjects]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <Card>
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg"><Layers className="h-5 w-5 text-indigo-600" /></div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Attendance Reports</h3>
            </div>
            {selectedBranchId && (
              <div className="flex gap-6">
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions</div>
                  <div className="text-lg font-black text-indigo-600 leading-tight">{previewStats.sessions}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</div>
                  <div className="text-lg font-black text-indigo-600 leading-tight">{students.length}</div>
                </div>
              </div>
            )}
          </div>

          {!showFullPreview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Configuration Step 1: Branch */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">1. Select Class</label>
                  <select
                    value={reportViewMode}
                    onChange={(e) => {
                      setReportViewMode(e.target.value as any);
                      setSelectedBranchId('');
                    }}
                    className="text-xs font-bold text-slate-600 bg-slate-100 border-none rounded-lg px-2 py-1 outline-none"
                  >
                    <option value="ACTIVE">Active Classes</option>
                    <option value="ARCHIVED">Archived Classes</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {branches.filter(b => reportViewMode === 'ACTIVE' ? !b.view_only : b.view_only).map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleBranchSelect(b.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedBranchId === b.id ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                    >
                      <span className={`font-bold ${selectedBranchId === b.id ? 'text-indigo-900' : 'text-slate-700'}`}>{b.name}</span>
                      {selectedBranchId === b.id && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuration Step 2: Details */}
              {selectedBranchId ? (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">2. Configure Logic</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setExportRange('TILL_TODAY')} className={`p-4 rounded-xl border-2 text-center transition-all ${exportRange === 'TILL_TODAY' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-100 bg-white text-slate-500'}`}>Till Today</button>
                      <button onClick={() => setExportRange('CUSTOM')} className={`p-4 rounded-xl border-2 text-center transition-all ${exportRange === 'CUSTOM' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-100 bg-white text-slate-500'}`}>Custom Range</button>
                    </div>

                    {exportRange === 'CUSTOM' && (
                      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                        <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} label="Start Date" />
                        <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} label="End Date" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">3. Select Subject Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => setExportSubjectType('ALL')} className={`p-4 rounded-xl border-2 text-center transition-all ${exportSubjectType === 'ALL' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-100 bg-white text-slate-500'}`}>All</button>
                      <button onClick={() => setExportSubjectType('THEORY')} className={`p-4 rounded-xl border-2 text-center transition-all ${exportSubjectType === 'THEORY' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-100 bg-white text-slate-500'}`}>Theory</button>
                      <button onClick={() => setExportSubjectType('LAB')} className={`p-4 rounded-xl border-2 text-center transition-all ${exportSubjectType === 'LAB' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-100 bg-white text-slate-500'}`}>Lab</button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">4. Filter Scope</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setFilterMode('FULL')} className={`p-4 rounded-xl border-2 transition-all ${filterMode === 'FULL' ? 'bg-indigo-900 border-indigo-900 text-white font-bold shadow-lg' : 'bg-slate-50 border-slate-50 text-slate-500 hover:bg-slate-100'}`}>Full Class</button>
                      <button onClick={() => setFilterMode('FILTERED')} className={`p-4 rounded-xl border-2 transition-all ${filterMode === 'FILTERED' ? 'bg-indigo-900 border-indigo-900 text-white font-bold shadow-lg' : 'bg-slate-50 border-slate-50 text-slate-500 hover:bg-slate-100'}`}>Filtered</button>
                    </div>
                    {filterMode === 'FILTERED' && (
                      <div className="flex gap-3 animate-in fade-in zoom-in duration-300">
                        <select
                          value={attendanceOperator}
                          onChange={e => setAttendanceOperator(e.target.value as any)}
                          className="flex-1 p-4 bg-slate-50 border-none rounded-2xl text-xs font-black text-indigo-900 uppercase outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                        >
                          <option value="GE">Above or Equal (&ge;)</option>
                          <option value="LE">Below or Equal (&le;)</option>
                          <option value="GT">Strictly Above (&gt;)</option>
                          <option value="LT">Strictly Below (&lt;)</option>
                        </select>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            value={attendanceThreshold}
                            onChange={e => setAttendanceThreshold(Number(e.target.value))}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                            placeholder="Threshold %"
                          />
                          <span className="absolute right-4 top-4 text-[10px] text-slate-400 font-black">%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex gap-4">
                      <Button onClick={() => setShowFullPreview(true)} variant="secondary" className="flex-1 py-4 font-black uppercase tracking-widest h-auto bg-slate-100 text-slate-700 border-2 border-slate-200 hover:bg-slate-200">
                        <Eye className="h-5 w-5 mr-2" /> View Report
                      </Button>
                      <Button onClick={executeExport} className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-100 h-auto">
                        {loading ? 'Processing...' : 'Export CSV'}
                      </Button>
                    </div>
                  </div>

                  {/* MST Performance Export */}
                  <div className="pt-8 border-t border-slate-100">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block">Performance Analytics</label>
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-black text-indigo-900 text-sm uppercase">MST Marks Summary</h4>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest leading-none">Download all marks for this class</p>
                        <select
                           value={midSemType}
                           onChange={e => setMidSemType(e.target.value as MidSemType)}
                           className="w-full mt-3 p-3 bg-white border-none rounded-xl text-xs font-black text-indigo-900 uppercase shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                           <option value="MID_SEM_1">MST 1</option>
                           <option value="MID_SEM_2">MST 2</option>
                           <option value="MID_SEM_REMEDIAL">Remedial MST</option>
                        </select>
                      </div>
                      <Button 
                        onClick={async () => {
                           setLoading(true);
                           setProgress(0);
                           setStatus('Initializing data fetch...');
                           try {
                              const studentIds = students.map(s => s.uid);
                              setProgress(20);
                              setStatus('Fetching marks from database...');
                              const marks = await db.getMarksByStudents(studentIds, midSemType);
                              setProgress(50);
                              setStatus('Processing branch results...');
                              const branchName = branches.find(b => b.id === selectedBranchId)?.name || 'Branch';
                              const examName = midSemType === 'MID_SEM_1' ? 'MST 1' : midSemType === 'MID_SEM_2' ? 'MST 2' : 'Remedial MST';
                              
                              const usedSubjectIds = Array.from(new Set(marks.map(m => m.subjectId)));
                              const branchSubjects = subjects.filter(s => usedSubjectIds.includes(s.id));

                              const data = students.map(s => {
                                 const studentMarks = marks.filter(m => m.studentId === s.uid);
                                 const row: any = {
                                    'Student Name': s.displayName,
                                    'Enrollment Number': s.studentData?.enrollmentId || '',
                                    'Roll Number': s.studentData?.rollNo || '',
                                    'Class/Batch': metaBatches[s.studentData?.batchId || ''] || 'ALL',
                                 };
                                 branchSubjects.forEach(sub => {
                                    const m = studentMarks.find(m => m.subjectId === sub.id);
                                    row[`${sub.name} (${sub.code})`] = m ? (m.marksObtained === -1 ? 'A' : m.marksObtained) : '-';
                                 });
                                 return row;
                              });

                              setProgress(75);
                              setStatus('Applying institutional branding...');
                              await new Promise(r => setTimeout(r, 500));

                              const examTitle = midSemType === 'MID_SEM_1' ? 'MID SEMESTER TEST - I' : midSemType === 'MID_SEM_2' ? 'MID SEMESTER TEST - II' : 'REMEDIAL MST';
                              const now = new Date();
                              const currentYear = now.getFullYear();
                              const session = now.getMonth() >= 6 ? `${currentYear}-${(currentYear + 1) % 100}` : `${currentYear - 1}-${currentYear % 100}`;
                              
                              const headerAOA = [
                                 ['ACROPOLIS INSTITUTE OF TECHNOLOGY AND RESEARCH'],
                                 ['DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING'],
                                 [`ADMIN SUMMARY: ${examTitle} | SESSION: ${session}`],
                                 [`BRANCH: ${branchName.toUpperCase()} | GENERATED BY: ADMINISTRATOR`],
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
                              setStatus('Finalizing report structure...');
                              await new Promise(r => setTimeout(r, 600));

                              setProgress(100);
                              setStatus('Download starting...');
                              await new Promise(r => setTimeout(r, 300));

                              const buffer = await workbook.xlsx.writeBuffer();
                              const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${branchName}_${examName}_Summary.xlsx`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                           } catch (e: any) {
                              alert("Export failed: " + e.message);
                           } finally {
                              setTimeout(() => {
                                 setLoading(false);
                                 setProgress(0);
                              }, 800);
                           }
                        }}
                        disabled={loading || students.length === 0}
                        className="w-full md:w-auto px-10 bg-indigo-600 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                      >
                        {loading ? (
                           <>
                              <Loader2 className="animate-spin h-4 w-4 mr-2" />
                              Wait...
                           </>
                        ) : (
                           <>
                              <FileDown className="h-4 w-4 mr-2" />
                              Download Summary
                           </>
                        )}
                      </Button>
                    </div>
                    <ExportProgressModal isOpen={loading} progress={progress} status={status} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Layers className="h-12 w-12 opacity-20 mb-4" />
                  <p className="text-sm font-medium">Please select a class to continue</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <Button variant="secondary" onClick={() => setShowFullPreview(false)} className="px-3 py-1 bg-slate-100 text-slate-600 h-8 text-[10px] font-bold uppercase">
                  <ArrowLeft className="h-3 w-3 mr-1.5" /> Back to Config
                </Button>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Previewing {exportFormat} Report for {branches.find(b => b.id === selectedBranchId)?.name}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sr No</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Regular (P/T)</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Extra</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(() => {
                      // 1. Filter students by attendance threshold if needed
                      const filteredStudents = students
                        .filter(s => {
                          if (filterMode === 'FULL') return true;
                          const mine = previewRecords.filter(r => r.studentId === s.uid);
                          const regularMine = mine.filter(r => {
                            if (r.subjectId === 'sub_extra') return false;
                            const subj = subjects.find(sub => sub.id === r.subjectId);
                            if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
                            if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
                            return true;
                          });
                          const total = regularMine.length;
                          const present = regularMine.filter(r => r.isPresent).length;
                          const extraCount = mine.filter(r => r.subjectId === 'sub_extra' && r.isPresent).length;
                          const pct = total === 0 ? 0 : Math.round(((present + extraCount) / total) * 100);
                          if (attendanceOperator === 'GE') return pct >= attendanceThreshold;
                          if (attendanceOperator === 'LE') return pct <= attendanceThreshold;
                          if (attendanceOperator === 'GT') return pct > attendanceThreshold;
                          if (attendanceOperator === 'LT') return pct < attendanceThreshold;
                          return true;
                        })
                        .sort((a, b) => (a.studentData?.rollNo || '').localeCompare(b.studentData?.rollNo || '', undefined, { numeric: true }));

                      // 2. Group by batch (preserving insertion order)
                      const batchGroupMap = new Map<string, typeof filteredStudents>();
                      filteredStudents.forEach(s => {
                        const bId = s.studentData?.batchId || 'UNASSIGNED';
                        if (!batchGroupMap.has(bId)) batchGroupMap.set(bId, []);
                        batchGroupMap.get(bId)!.push(s);
                      });

                      // 3. Render batch banner + student rows
                      const rows: React.ReactNode[] = [];
                      batchGroupMap.forEach((batchStudents, batchId) => {
                        const batchName = metaBatches[batchId] || batchId;
                        // Banner row
                        rows.push(
                          <tr key={`banner_${batchId}`}>
                            <td colSpan={5} className="px-4 py-2.5 bg-indigo-600">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                  Batch: {batchName}
                                </span>
                                <div className="flex-1 h-px bg-indigo-400/40 ml-1" />
                                <span className="text-[10px] font-bold text-indigo-200">{batchStudents.length} students</span>
                              </div>
                            </td>
                          </tr>
                        );
                        // Student rows
                        batchStudents.forEach(s => {
                          const mine = previewRecords.filter(r => r.studentId === s.uid);
                          const regularMine = mine.filter(r => {
                            if (r.subjectId === 'sub_extra') return false;
                            const subj = subjects.find(sub => sub.id === r.subjectId);
                            if (exportSubjectType === 'THEORY' && subj?.type === 'lab') return false;
                            if (exportSubjectType === 'LAB' && subj?.type !== 'lab') return false;
                            return true;
                          });
                          const total = regularMine.length;
                          const present = regularMine.filter(r => r.isPresent).length;
                          const extraCount = mine.filter(r => r.subjectId === 'sub_extra' && r.isPresent).length;
                          const pct = total === 0 ? 0 : Math.round(((present + extraCount) / total) * 100);
                          rows.push(
                            <tr key={s.uid} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="p-4 font-mono text-[10px] text-slate-400">{s.studentData?.rollNo}</td>
                              <td className="p-4">
                                <div className="font-bold text-slate-900 uppercase text-xs">{s.displayName}</div>
                                <div className="text-[9px] font-mono text-slate-900 uppercase">{s.studentData?.enrollmentId}</div>
                              </td>
                              <td className="p-4 text-center text-sm font-bold text-slate-600">{present}/{total}</td>
                              <td className="p-4 text-center">
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black">+{extraCount}</span>
                              </td>
                              <td className="p-4 text-center text-sm font-bold text-slate-600">{present + extraCount}/{total}</td>
                              <td className="p-4 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${pct < 75 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                  {pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
              <Button onClick={executeExport} className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-100 h-auto">
                Download Full Report (CSV)
              </Button>
            </div>
          )}
        </div>
      </Card >
    </div >
  );
};
