import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { User, Notification, AttendanceRecord } from '../types';
import { Button } from './UI';
import { 
  X, 
  ArrowRightLeft, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Loader2, 
  Info,
  Trash2,
  XCircle
} from 'lucide-react';

interface OverwriteShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
  currentUser: User;
  onSuccess: (message: string) => void;
  onDenySuccess?: () => void;
}

interface SlotDetail {
  slot: number;
  records: AttendanceRecord[];
  subjectName?: string;
  subjectCode?: string;
  markedByName?: string;
  isConflicting: boolean;
  isEmpty: boolean;
  isCurrentUser: boolean;
}

export const OverwriteShiftModal: React.FC<OverwriteShiftModalProps> = ({
  isOpen,
  onClose,
  notification,
  currentUser,
  onSuccess,
  onDenySuccess
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slotsData, setSlotsData] = useState<SlotDetail[]>([]);
  const [selectedTargetSlot, setSelectedTargetSlot] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState<'SHIFT' | 'DISCARD' | 'DENY' | null>(null);

  useEffect(() => {
    if (!isOpen || !notification) {
      setSlotsData([]);
      setSelectedTargetSlot(null);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadSlotDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dayRecords, subjects, facultyList] = await Promise.all([
          db.getBranchAttendance(notification.data.branchId, notification.data.date),
          db.getSubjects(),
          db.getFaculty()
        ]);

        if (!isMounted) return;

        const subMap: Record<string, { code: string; name: string }> = {};
        subjects.forEach(s => {
          subMap[s.id] = { code: s.code, name: s.name };
        });

        const facultyMap: Record<string, string> = {};
        facultyList.forEach(f => {
          facultyMap[f.uid] = f.displayName;
        });

        const computedSlots: SlotDetail[] = [1, 2, 3, 4, 5, 6, 7].map(slotNum => {
          const recs = dayRecords.filter(r => (r.lectureSlot || 1) === slotNum);
          const first = recs[0];
          const isConflicting = slotNum === notification.data.slot;
          const isEmpty = recs.length === 0;
          const isCurrentUser = first ? first.markedBy === currentUser.uid : false;

          return {
            slot: slotNum,
            records: recs,
            subjectCode: first && subMap[first.subjectId] ? subMap[first.subjectId].code : undefined,
            subjectName: first && subMap[first.subjectId] ? subMap[first.subjectId].name : undefined,
            markedByName: first ? (facultyMap[first.markedBy] || first.markedBy) : undefined,
            isConflicting,
            isEmpty,
            isCurrentUser
          };
        });

        setSlotsData(computedSlots);

        // Pre-select first blank slot that is not the conflicting slot
        const firstBlank = computedSlots.find(s => s.isEmpty && !s.isConflicting);
        if (firstBlank) {
          setSelectedTargetSlot(firstBlank.slot);
        } else {
          setSelectedTargetSlot(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Failed to load slot details:", err);
        setError(err?.message || "Failed to load schedule for this date.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSlotDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, notification, currentUser.uid]);

  if (!isOpen || !notification) return null;

  const conflictingSlotInfo = slotsData.find(s => s.isConflicting);
  const myExistingRecordCount = conflictingSlotInfo?.records?.length || 0;
  const blankSlots = slotsData.filter(s => s.isEmpty && !s.isConflicting);
  const hasBlankSlots = blankSlots.length > 0;

  // Format date display
  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // 1. Shift Attendance to Target Slot and Approve Overwrite
  const handleConfirmShift = async () => {
    if (!selectedTargetSlot) {
      alert("Please choose a blank slot to shift your attendance into.");
      return;
    }

    setIsProcessing(true);
    setActionType('SHIFT');

    try {
      // 1. Shift existing records from conflicting slot to selected blank slot
      await db.shiftAttendanceSlot(
        notification.data.date,
        notification.data.branchId,
        notification.data.slot,
        selectedTargetSlot
      );

      // 2. Save Faculty B's payload records in the vacated conflicting slot
      let savedMsg = "";
      if (notification.data.payload && notification.data.payload.length > 0) {
        const now = Date.now();
        const recordsToSave = notification.data.payload.map((r: any) => ({
          ...r,
          timestamp: now
        }));
        await db.saveAttendance(recordsToSave);
        savedMsg = " and your attendance was saved";
      }

      // 3. Notify Faculty B of approval and shift
      await db.createNotification({
        toUserId: notification.fromUserId,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName,
        type: 'REQUEST_APPROVED',
        status: 'PENDING',
        data: {
          ...notification.data,
          reason: `Request approved. Slot ${notification.data.slot} was handed over to you${savedMsg}. Previous attendance was shifted to Slot ${selectedTargetSlot}.`
        },
        timestamp: Date.now()
      });

      // 4. Mark notification as APPROVED
      await db.updateNotificationStatus(notification.id, 'APPROVED');

      onSuccess(`Attendance successfully shifted to Slot ${selectedTargetSlot}. Slot ${notification.data.slot} was granted to ${notification.fromUserName}.`);
      onClose();
    } catch (err: any) {
      console.error("Shift error:", err);
      alert(`Failed to shift attendance: ${err?.message || "Please retry."}`);
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // 2. Discard Attendance without shift & approve overwrite
  const handleDiscardAndApprove = async () => {
    const confirmMsg = `Are you sure you want to DISCARD your attendance in Slot ${notification.data.slot} on ${notification.data.date}? \n\nYour ${myExistingRecordCount} attendance records will be removed to Recycle Bin and Slot ${notification.data.slot} will be given to ${notification.fromUserName}.`;
    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    setActionType('DISCARD');

    try {
      await db.deleteAttendanceForOverwrite(
        notification.data.date,
        notification.data.branchId,
        notification.data.slot
      );

      let savedMsg = "";
      if (notification.data.payload && notification.data.payload.length > 0) {
        const now = Date.now();
        const recordsToSave = notification.data.payload.map((r: any) => ({
          ...r,
          timestamp: now
        }));
        await db.saveAttendance(recordsToSave);
        savedMsg = " and your attendance was saved";
      }

      await db.createNotification({
        toUserId: notification.fromUserId,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName,
        type: 'REQUEST_APPROVED',
        status: 'PENDING',
        data: {
          ...notification.data,
          reason: `Request approved. Slot ${notification.data.slot} granted to you${savedMsg}.`
        },
        timestamp: Date.now()
      });

      await db.updateNotificationStatus(notification.id, 'APPROVED');

      onSuccess(`Slot ${notification.data.slot} granted to ${notification.fromUserName}. Previous records moved to Recycle Bin.`);
      onClose();
    } catch (err: any) {
      console.error("Discard error:", err);
      alert(`Error approving overwrite: ${err?.message || "Please retry."}`);
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  // 3. Deny Request
  const handleDeny = async () => {
    if (!window.confirm(`Deny overwrite request from ${notification.fromUserName}?`)) return;

    setIsProcessing(true);
    setActionType('DENY');

    try {
      await db.createNotification({
        toUserId: notification.fromUserId,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName,
        type: 'REQUEST_DENIED',
        status: 'PENDING',
        data: notification.data,
        timestamp: Date.now()
      });

      await db.updateNotificationStatus(notification.id, 'DENIED');

      if (onDenySuccess) {
        onDenySuccess();
      } else {
        onSuccess(`Overwrite request from ${notification.fromUserName} was denied.`);
      }
      onClose();
    } catch (err: any) {
      console.error("Deny error:", err);
      alert(`Failed to deny request: ${err?.message || "Please retry."}`);
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">Resolve Overwrite & Shift Slot</h3>
              <p className="text-xs text-indigo-200/80">Manage slot conflict for {notification.data.branchId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Conflict Summary Box */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-900 text-sm">
                  {notification.fromUserName} requested <span className="underline decoration-amber-500 underline-offset-2">Slot {notification.data.slot}</span>
                </p>
                <p className="text-amber-800 leading-relaxed">
                  You mistakenly or previously marked attendance for <span className="font-semibold">Slot {notification.data.slot}</span> ({myExistingRecordCount} students).
                  You can now shift your session to an empty slot below so no student records are lost!
                </p>
              </div>
            </div>

            {/* Quick Context Pill Tag */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-amber-200 text-slate-700 font-semibold shadow-2xs">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                {formatDate(notification.data.date)}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-200 text-slate-700 font-semibold shadow-2xs">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Conflicting: Slot {notification.data.slot}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-200 text-indigo-700 font-bold shadow-2xs">
                Subject: {notification.data.subjectName}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Analyzing day's timetable & slot occupancy...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> Error loading schedule
              </p>
              <p>{error}</p>
            </div>
          )}

          {/* Day Slots Matrix */}
          {!loading && !error && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Day Slot Status ({formatDate(notification.data.date)})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Select any available blank slot to move your attendance records into
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Empty
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Occupied
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Conflict
                  </span>
                </div>
              </div>

              {/* 7 Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {slotsData.map(slotInfo => {
                  const isConflict = slotInfo.isConflicting;
                  const isEmpty = slotInfo.isEmpty;
                  const isSelected = selectedTargetSlot === slotInfo.slot;

                  if (isConflict) {
                    return (
                      <div
                        key={slotInfo.slot}
                        className="p-3 rounded-xl border-2 border-amber-400 bg-amber-50/60 flex flex-col justify-between min-h-[92px] shadow-2xs relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-black text-amber-900 tracking-tight">
                            Slot {slotInfo.slot}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                            Conflict
                          </span>
                        </div>
                        <div className="mt-2 text-[10px] space-y-0.5">
                          <p className="font-bold text-amber-800 truncate">
                            Your Session ({slotInfo.records.length} std)
                          </p>
                          <p className="text-amber-700/80 truncate">
                            Req by: {notification.fromUserName}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (!isEmpty) {
                    return (
                      <div
                        key={slotInfo.slot}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-400 flex flex-col justify-between min-h-[92px] cursor-not-allowed select-none"
                        title={`Slot ${slotInfo.slot} is already occupied by ${slotInfo.subjectCode || 'another session'}`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold text-slate-600">
                            Slot {slotInfo.slot}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> Occupied
                          </span>
                        </div>
                        <div className="mt-2 text-[10px] space-y-0.5">
                          <p className="font-bold text-slate-700 truncate">
                            {slotInfo.subjectCode || 'Marked Session'}
                          </p>
                          <p className="text-slate-500 truncate">
                            {slotInfo.markedByName || 'Faculty'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot (Selectable)
                  return (
                    <button
                      key={slotInfo.slot}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setSelectedTargetSlot(slotInfo.slot)}
                      className={`p-3 rounded-xl flex flex-col justify-between text-left min-h-[92px] transition-all cursor-pointer border-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-emerald-300/80 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className={`text-xs font-black ${isSelected ? 'text-indigo-950' : 'text-emerald-950'}`}>
                          Slot {slotInfo.slot}
                        </span>
                        {isSelected ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white flex items-center gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Selected
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> Blank
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-[10px]">
                        <p className={`font-bold ${isSelected ? 'text-indigo-700' : 'text-emerald-700'}`}>
                          Available to Shift
                        </p>
                        <p className="text-slate-500">
                          {isSelected ? 'Click to deselect' : 'Click to choose'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Shift Decision Preview */}
              {hasBlankSlots && selectedTargetSlot && (
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-3 mt-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 shrink-0 mt-0.5">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-black text-indigo-950">
                      Planned Shift: Slot {notification.data.slot} ➔ Slot {selectedTargetSlot}
                    </p>
                    <p className="text-indigo-800 leading-relaxed">
                      Your attendance ({myExistingRecordCount} students) will be safely moved to <span className="font-bold">Slot {selectedTargetSlot}</span>.
                      The conflicting <span className="font-bold">Slot {notification.data.slot}</span> will be handed over to <span className="font-bold">{notification.fromUserName}</span> ({notification.data.subjectName}).
                    </p>
                  </div>
                </div>
              )}

              {/* No Blank Slots Warning */}
              {!hasBlankSlots && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 mt-3">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-700 shrink-0 mt-0.5">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-rose-950">No Empty Slots Available on this Date</p>
                    <p className="text-rose-800 leading-relaxed">
                      All 7 slots are occupied for this date. You cannot shift your attendance. You can choose to overwrite and discard your current records, or deny the request.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isProcessing}
              onClick={handleDeny}
              className="text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center justify-center gap-1.5"
            >
              {isProcessing && actionType === 'DENY' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Deny Request
            </Button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDiscardAndApprove}
              className="text-xs font-bold text-slate-500 hover:text-rose-700 px-2 py-1.5 rounded transition-colors flex items-center gap-1 underline underline-offset-2 disabled:opacity-50"
              title="Delete current records and overwrite without shifting"
            >
              <Trash2 className="h-3 w-3" />
              Discard & Overwrite (No Shift)
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isProcessing}
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              disabled={isProcessing || !selectedTargetSlot || !hasBlankSlots}
              onClick={handleConfirmShift}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-sm px-4"
            >
              {isProcessing && actionType === 'SHIFT' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Shifting Slot...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Shift to Slot {selectedTargetSlot || '...'} & Approve
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
