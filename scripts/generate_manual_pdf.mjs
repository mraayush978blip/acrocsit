import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
const margin = 18;
const contentWidth = pageWidth - (margin * 2);

let yPos = margin;
let currentPage = 1;

// Colors
const COLOR_PRIMARY = [30, 41, 59];       // Slate 800
const COLOR_ACCENT = [79, 70, 229];       // Indigo 600
const COLOR_SUCCESS = [16, 185, 129];     // Emerald 500
const COLOR_DANGER = [239, 68, 68];       // Rose 500
const COLOR_WARNING = [245, 158, 11];     // Amber 500
const COLOR_MUTED = [100, 116, 139];      // Slate 500
const COLOR_BG_BOX = [248, 250, 252];     // Slate 50
const COLOR_BORDER = [226, 232, 240];     // Slate 200

function checkPageBreak(requiredHeight) {
  if (yPos + requiredHeight > pageHeight - margin - 15) {
    drawFooter();
    doc.addPage();
    currentPage++;
    yPos = margin + 10;
    drawHeader();
  }
}

function drawHeader() {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('ACROPOLIS AMS  •  DESIGNED & DEVELOPED BY AAYUSH SHARMA', margin, margin);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
  yPos = margin + 8;
}

function drawFooter() {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - margin - 2, pageWidth - margin, pageHeight - margin - 2);
  doc.text(`Page ${currentPage}`, pageWidth - margin - 12, pageHeight - margin + 3);
  doc.text('Developed & Architected by Aayush Sharma  •  Confidential', margin, pageHeight - margin + 3);
}

function addTitle(text) {
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.text(text, margin, yPos);
  yPos += 8;
}

function addSubtitle(text) {
  checkPageBreak(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(text.toUpperCase(), margin, yPos);
  yPos += 6;
}

function addSection(title) {
  checkPageBreak(20);
  yPos += 4;
  doc.setFillColor(COLOR_BG_BOX[0], COLOR_BG_BOX[1], COLOR_BG_BOX[2]);
  doc.roundedRect(margin, yPos - 5, contentWidth, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text(title, margin + 3, yPos + 1.5);
  yPos += 10;
}

function addSubSection(title) {
  checkPageBreak(14);
  yPos += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.text(title, margin, yPos);
  yPos += 6;
}

function addParagraph(text) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(text, contentWidth);
  checkPageBreak(lines.length * 4.5);
  doc.text(lines, margin, yPos);
  yPos += lines.length * 4.5 + 2;
}

function addBullet(bulletTitle, bulletDesc) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  const prefix = `•  ${bulletTitle}: `;
  const titleWidth = doc.getTextWidth(prefix);
  
  checkPageBreak(8);
  doc.text(prefix, margin + 2, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const descLines = doc.splitTextToSize(bulletDesc, contentWidth - titleWidth - 4);
  doc.text(descLines, margin + 2 + titleWidth, yPos);
  yPos += descLines.length * 4.5 + 2;
}

function addStep(stepNum, stepTitle, stepBody) {
  checkPageBreak(16);
  // Step badge
  doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.roundedRect(margin + 2, yPos - 3.5, 14, 5.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`STEP ${stepNum}`, margin + 3.2, yPos + 0.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text(stepTitle, margin + 19, yPos + 0.5);
  yPos += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const bodyLines = doc.splitTextToSize(stepBody, contentWidth - 8);
  checkPageBreak(bodyLines.length * 4.5);
  doc.text(bodyLines, margin + 6, yPos);
  yPos += bodyLines.length * 4.5 + 2.5;
}

function addCallout(type, title, text) {
  const lines = doc.splitTextToSize(text, contentWidth - 14);
  const boxHeight = lines.length * 4.2 + 10;
  checkPageBreak(boxHeight + 4);

  let bg = COLOR_BG_BOX;
  let stroke = COLOR_BORDER;
  let titleColor = COLOR_PRIMARY;

  if (type === 'IMPORTANT') {
    bg = [254, 242, 242];      // Rose 50
    stroke = [254, 202, 202];  // Rose 200
    titleColor = COLOR_DANGER;
  } else if (type === 'TIP') {
    bg = [240, 253, 244];      // Emerald 50
    stroke = [187, 247, 208];  // Emerald 200
    titleColor = COLOR_SUCCESS;
  } else if (type === 'NOTE') {
    bg = [238, 242, 255];      // Indigo 50
    stroke = [224, 231, 255];  // Indigo 200
    titleColor = COLOR_ACCENT;
  }

  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text(`[ ${title} ]`, margin + 4, yPos + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(lines, margin + 4, yPos + 10.5);

  yPos += boxHeight + 4;
}

// ==============================================================================
// COVER / HEADER
// ==============================================================================
// Decorative top band
doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
doc.rect(0, 0, pageWidth, 6, 'F');

yPos = 22;
addSubtitle('Acropolis Institute of Technology & Research');
addTitle('Attendance Management System (AMS)');
addSubtitle('Official User Manual: Teacher & Class Coordinator Guide');
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
doc.text('Designed, Engineered & Architected by Aayush Sharma', margin, yPos);
yPos += 6;

addCallout('TIP', 'LEAD ARCHITECT & DEVELOPER: AAYUSH SHARMA', 
  'Acro AMS platform architecture, database pipelines, and UI are engineered by Aayush Sharma. This official manual guides Faculty Members and Class Coordinators through daily attendance marking, past-date edits, deletions, shift lectures, and Excel reports.'
);

// ==============================================================================
// SECTION 1: LOGIN & GETTING STARTED
// ==============================================================================
addSection('1.0 Login & Getting Started');
addParagraph('The AMS web application is accessible via mobile browsers, tablets, and desktop computers with instant auto-save and offline sync.');

addBullet('Portal URL', 'Open your web browser and navigate to the portal link (e.g., https://acrocsit.vercel.app).');
addBullet('Credentials', 'Log in using your registered institute email (e.g., faculty@acropolis.in) and password.');
addBullet('Session Keep-Alive', 'The system automatically maintains active background authentication so your marking session never gets disconnected midway.');

// ==============================================================================
// SECTION 2: FACULTY (TEACHER) WORKFLOWS
// ==============================================================================
addSection('2.0 Faculty (Teacher) Daily Workflows');

addSubSection('2.1 Marking Daily Attendance (Theory & Lab)');
addParagraph('Once logged in, your assigned classes and subjects appear on the Faculty Dashboard.');

addStep(1, 'Select Class & Subject', 'Tap on the designated class card (e.g. CSIT-1) and then choose your subject (e.g. Computer Networks).');
addStep(2, 'Choose Date & Time Slot', 'Select the attendance date (defaults to today). Select the Lecture Slot number (Slot 1, Slot 2, Slot 3, etc.) corresponding to your timetable.');
addStep(3, 'Select Scope (Theory vs Lab Batch)', 'For Theory lectures, select "ALL". For Practical/Lab sessions, choose your specific batch (e.g. "B1" or "B2").');
addStep(4, 'Mark Attendance with Quick Toggles', 'Use the "Mark All Present" button (Green) or "Mark All Absent" button (Gray) to quickly set bulk status. Then tap individual student toggles to switch specific students between Present and Absent.');
addStep(5, 'Save & Cloud Sync', 'Click "Save Attendance". A verification modal shows the count of Present and Absent students. Click "Confirm & Save". The records are instantly synced to the cloud.');

addCallout('TIP', 'OFFLINE RESILIENCE', 
  'If campus WiFi fluctuates while taking attendance, the portal safely holds the marked state locally and auto-saves as soon as connection is re-established.'
);

// ==============================================================================
// SECTION 3: EDITING A PARTICULAR DAY ATTENDANCE
// ==============================================================================
addSection('3.0 How to Edit a Particular Day\'s Attendance');
addParagraph('Faculty members can edit or rectify attendance marked for any past date without duplicating entries.');

addStep(1, 'Navigate to your Subject Class View', 'Open the class and subject where attendance was previously marked.');
addStep(2, 'Change the Date Picker to the Target Date', 'In the "Mark Attendance" tab, click the Date input field and select the exact date you wish to edit.');
addStep(3, 'Select the Target Slot', 'Choose the slot number that was previously marked on that day (e.g., Slot 1).');
addStep(4, 'System Auto-Loads Existing Record', 'The portal will instantly detect that attendance already exists for this slot and load each student\'s saved Present/Absent state.');
addStep(5, 'Make Corrections', 'Toggle any student who was mistakenly marked Absent or Present.');
addStep(6, 'Click "Save Attendance"', 'The confirmation modal will clearly state that an existing record is being updated. Click "Confirm & Save". The database automatically updates the entries with zero duplicate records.');

// ==============================================================================
// SECTION 4: DELETING A PARTICULAR DAY ATTENDANCE
// ==============================================================================
addSection('4.0 How to Delete a Particular Day\'s Attendance');
addParagraph('If attendance was marked in error, for the wrong slot, or on a declared holiday, teachers can delete the specific lecture session.');

addStep(1, 'Switch to the "Preview Attendance" / "History" Tab', 'Inside your class dashboard, tap on the "Preview Attendance" tab.');
addStep(2, 'Select the Date to Delete', 'Use the date picker in the history toolbar to filter the specific date (or click "Today" / "Yesterday").');
addStep(3, 'Locate the Red Trash / Delete Button', 'When a single date is selected in History, a red Trash icon appears in the summary header.');
addStep(4, 'Select the Slot(s) to Delete in Modal', 'A modal will open showing all slots marked on that date (e.g. Slot 1, Slot 2). Check the slot(s) you want to remove.');
addStep(5, 'Confirm Deletion', 'Click "Delete Selected Slots". The attendance records for that slot are safely removed and the class percentage updates instantly.');

addCallout('IMPORTANT', '12-HOUR RECYCLE BIN SAFETY', 
  'Deleted attendance records are automatically preserved in the portal\'s "Recycle Bin" for 12 hours. If deleted accidentally, they can be restored from the Recycle Bin before permanent cleanup.'
);

// ==============================================================================
// SECTION 5: SHIFT LECTURES & PROXY
// ==============================================================================
addSection('5.0 Handling Shift / Proxy Lectures');
addParagraph('When an extra class is scheduled or you are covering a slot for another faculty member:');

addBullet('Shift Lecture Request', 'Select the "Shift Lecture" option in the class dashboard.');
addBullet('Specify Original Faculty & Slot', 'Select the target date, time slot, and reason for taking the lecture.');
addBullet('Conflict Prevention', 'The system verifies that no double-allocation occurs and marks the session with proper audit tags.');

// ==============================================================================
// SECTION 6: STUDENT TIMELINE & INDIVIDUAL TRACKING
// ==============================================================================
addSection('6.0 Student Attendance Timeline & History');
addParagraph('Teachers can inspect individual student consistency:');

addStep(1, 'Open "Preview Attendance" Tab', 'Shows the complete roster with total classes taken, classes attended, and current percentage.');
addStep(2, 'Tap on Any Student Name', 'Clicking on a student\'s name opens their dedicated "Student Timeline Card".');
addStep(3, 'View Day-by-Day Record', 'Inspect each date and slot the student was Present or Absent, with color-coded status badges.');

// ==============================================================================
// SECTION 7: CLASS COORDINATOR WORKFLOWS
// ==============================================================================
addSection('7.0 Class Coordinator Workflows');
addParagraph('Class Coordinators have privileged supervisory tools to monitor overall branch health and enforce timely attendance marking.');

addSubSection('7.1 Faculty Live Marking Monitor');
addParagraph('Coordinators can view real-time marking progress for their entire class in one glance:');
addStep(1, 'Open "Class Coordinator" Portal', 'Navigate to the Coordinator dashboard from the navigation bar.');
addStep(2, 'Open "Faculty Monitor" Tab', 'Displays all subject allocations for your class on the selected date.');
addStep(3, 'Inspect Status Badges', 'Subjects marked with a Green Checkmark "Complete" have been marked. Subjects with a Red Pulse "Pending" have not yet been marked by the assigned faculty.');

addSubSection('7.2 Branch Cumulative Reports & Defaulter List');
addParagraph('Generate official reports for academic reviews, parents, and notice boards:');
addStep(1, 'Open "Reports" Tab', 'Click on the "Reports & Analytics" tab under Coordinator view.');
addStep(2, 'Configure Filter Parameters', 'Choose Date Range ("Till Today" or "Custom Date Range"), Subject Type ("All", "Theory Only", or "Lab Only").');
addStep(3, 'Set Defaulter Criteria', 'Choose percentage threshold (e.g. Less Than or Equal to 75% or 60%) to instantly filter students at risk.');
addStep(4, 'Export Official Excel', 'Click "Download Excel Report". The system generates a formatted spreadsheet with Enrollment ID, Roll No, Student Name, subject-wise lecture counts, attended counts, and overall aggregate percentage.');

// ==============================================================================
// SECTION 8: FREQUENTLY ASKED QUESTIONS (FAQS)
// ==============================================================================
addSection('8.0 Frequently Asked Questions (FAQ)');

addBullet('What if I marked attendance on the wrong slot?', 'Go to "Preview Attendance", select that date, click the red Trash button, select that slot and delete it. Then go to "Mark Attendance" and re-save on the correct slot.');
addBullet('Can one teacher be assigned to both Lab B1 and B2?', 'Yes! The admin portal provides a 1-click "All Batches" button that assigns the teacher to all batches instantly. The teacher will see both batches on their portal.');
addBullet('What happens if my network drops during attendance?', 'The portal holds your marked entries locally. As soon as connectivity returns, click Save and it will sync seamlessly.');
addBullet('How are student percentages calculated?', 'Formula: (Total Lectures Attended / Total Lectures Conducted) * 100. Late-joined students are synchronized through branch re-indexing.');
addBullet('Platform Architect & Copyright', 'Acro AMS was designed and developed by Aayush Sharma (mraayush979@gmail.com). © 2026 Aayush Sharma. All rights reserved. Portfolio: https://itsaayushsharma.vercel.app');

// Finalize footer on last page
drawFooter();

// Write to files
const outPublic = path.join(process.cwd(), 'public', 'AcroAMS_Teacher_Coordinator_Manual.pdf');
const outRoot = path.join(process.cwd(), 'AcroAMS_Teacher_Coordinator_Manual.pdf');

const pdfBytes = doc.output('arraybuffer');
fs.writeFileSync(outPublic, Buffer.from(pdfBytes));
fs.writeFileSync(outRoot, Buffer.from(pdfBytes));

console.log('PDF Generated Successfully at:');
console.log('1.', outPublic);
console.log('2.', outRoot);
