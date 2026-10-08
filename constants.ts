
import { Branch, Batch, Subject, User, UserRole, FacultyAssignment } from './types';

export const SEED_BRANCHES: Branch[] = [
  { id: 'b_cse', name: 'Computer Science (CSE)' },
  { id: 'b_aiml', name: 'AI & ML (AIML)' },
  { id: 'b_ece', name: 'Electronics (ECE)' }
];

export const SEED_BATCHES: Batch[] = [
  { id: 'batch_cse_2_a', name: 'CSE Year 2 - Batch A', branchId: 'b_cse' },
  { id: 'batch_cse_2_b', name: 'CSE Year 2 - Batch B', branchId: 'b_cse' },
  { id: 'batch_aiml_2_a', name: 'AIML Year 2 - Batch A', branchId: 'b_aiml' }
];

export const SEED_SUBJECTS: Subject[] = [
  { id: 'sub_math', name: 'Engineering Mathematics', code: 'M101', type: 'theory' },
  { id: 'sub_ds', name: 'Data Structures', code: 'CS201', type: 'theory' },
  { id: 'sub_network', name: 'Computer Networks', code: 'CS304', type: 'theory' },
  { id: 'sub_extra', name: 'Extra Lectures', code: 'EXTRA', type: 'theory' }
];

export const SEED_USERS: User[] = [
  {
    uid: 'admin_1',
    email: 'hod@acropolis.in',
    displayName: 'Admin HOD',
    role: UserRole.ADMIN
  },
  {
    uid: 'admin_2',
    email: 'acro472007@acropolis.in',
    displayName: 'Acro Admin',
    role: UserRole.ADMIN
  },
  {
    uid: 'fac_1',
    email: 'faculty1@test.com',
    displayName: 'Faculty One',
    role: UserRole.FACULTY
  },
  {
    uid: 'fac_2',
    email: 'faculty2@test.com',
    displayName: 'Faculty Two',
    role: UserRole.FACULTY
  },
  {
    uid: 'stu_1',
    email: 'student@acropolis.in',
    displayName: 'Rahul Singh',
    role: UserRole.STUDENT,
    studentData: {
      branchId: 'b_cse',
      batchId: 'batch_cse_2_a',
      enrollmentId: '0827CS211001'
    }
  },
  {
    uid: 'stu_2',
    email: 'priya@acropolis.in',
    displayName: 'Priya Patel',
    role: UserRole.STUDENT,
    studentData: {
      branchId: 'b_cse',
      batchId: 'batch_cse_2_a',
      enrollmentId: '0827CS211002'
    }
  }
];

// Initial assignments
export const SEED_ASSIGNMENTS: FacultyAssignment[] = [
  {
    id: 'assign_1',
    facultyId: 'fac_1',
    branchId: 'b_cse',
    batchId: 'batch_cse_2_a',
    subjectId: 'sub_ds'
  },
  {
    id: 'assign_2',
    facultyId: 'fac_1',
    branchId: 'b_cse',
    batchId: 'ALL',
    subjectId: 'sub_network'
  },
  {
    id: 'assign_3',
    facultyId: 'fac_2',
    branchId: 'b_cse',
    batchId: 'batch_cse_2_a',
    subjectId: 'sub_network'
  }
];

export const DEFAULT_SLOT_TIMINGS: import('./types').SlotTiming[] = [
  { slot: 1, startTime: '10:30 AM', endTime: '11:20 AM', label: 'Lecture 1' },
  { slot: 2, startTime: '11:20 AM', endTime: '12:10 PM', label: 'Lecture 2' },
  { slot: 3, startTime: '12:10 PM', endTime: '01:00 PM', label: 'Lecture 3' },
  { slot: 4, startTime: '01:40 PM', endTime: '02:30 PM', label: 'Lecture 4' },
  { slot: 5, startTime: '02:30 PM', endTime: '03:20 PM', label: 'Lecture 5' },
  { slot: 6, startTime: '03:20 PM', endTime: '04:10 PM', label: 'Lecture 6' },
  { slot: 7, startTime: '04:10 PM', endTime: '05:00 PM', label: 'Lecture 7' },
];

export const DEFAULT_LUNCH_BREAK: import('./types').LunchBreakConfig = {
  startTime: '01:00 PM',
  endTime: '01:40 PM',
  afterSlot: 3,
  label: 'Lunch Break'
};

