const accounts = {
  student: {
    username: "student",
    password: "student123",
    role: "OJT Student",
    name: "Jamie Dela Cruz",
    initials: "JD",
  },
  adviser: {
    username: "adviser",
    password: "adviser123",
    role: "OJT Adviser",
    name: "Maria Santos",
    initials: "MS",
  },
  supervisor: {
    username: "supervisor",
    password: "supervisor123",
    role: "Department Supervisor",
    name: "Alex Ramirez",
    initials: "AR",
  },
  admin: {
    username: "admin",
    password: "admin123",
    role: "Administrator",
    name: "ISPSC Admin",
    initials: "IA",
  },
};

let currentUser = accounts.student;

const state = {
  attendance: 84,
  attendanceRecorded: false,
  activeModal: null,
  tasks: [
    {
      title: "Submit weekly OJT journal",
      meta: "Documentation",
      due: "Due today",
      done: false,
    },
    {
      title: "Upload accomplishment report",
      meta: "Required document",
      due: "Due Sep 05",
      done: false,
    },
    {
      title: "Complete supervisor feedback form",
      meta: "Evaluation",
      due: "Due Sep 08",
      done: true,
    },
  ],
  supervisorData: {
    students: [
      {
        name: "Jamie Dela Cruz",
        program: "BS Information Technology",
        department: "Product Engineering",
        company: "Northstar Digital Studio",
        hours: "348 / 480 hrs",
        progress: "72%",
        status: "Active",
        evalStatus: "Completed",
        evalRating: 92,
        evalComments:
          "Jamie has demonstrated exceptional growth in product engineering. Documentation and code structure have improved markedly.",
        feedbackStatus: "Feedback given",
        feedbackRating: 92,
        feedbackNotes:
          "Jamie has been consistent, curious, and dependable this month. The quality of documentation has improved significantly.",
        journalTask: "Building a reusable dashboard component",
        journalDate: "Aug 25, 2026 · 8h",
        journalStatus: "Awaiting review",
        attendanceDate: "Aug 26, 2026",
        attendanceTimes: "7:59 AM – 5:01 PM (8h 02m)",
        attendanceStatus: "Present",
        taskTitle: "API Integration & Testing",
        taskDue: "Due Sep 05, 2026",
        taskStatus: "In progress",
        reportTitle: "Accomplishment report · Week 14",
        reportPeriod: "Aug 24 – 28",
        reportStatus: "Awaiting review",
      },
      {
        name: "Nica Ramos",
        program: "BS Computer Science",
        department: "Quality Assurance",
        company: "Northstar Digital Studio",
        hours: "388 / 480 hrs",
        progress: "81%",
        status: "Active",
        evalStatus: "Due soon",
        evalRating: 88,
        evalComments:
          "Strong performance in automated test scripts and sprint regressions. Keep up the initiative.",
        feedbackStatus: "Pending",
        feedbackRating: 88,
        feedbackNotes:
          "Excellent bug reporting on the latest sprint. Work on optimizing regression runtimes.",
        journalTask: "Test automation scripts & sprint regression",
        journalDate: "Aug 25, 2026 · 8h",
        journalStatus: "Awaiting review",
        attendanceDate: "Aug 26, 2026",
        attendanceTimes: "8:00 AM – 5:00 PM (8h 00m)",
        attendanceStatus: "Present",
        taskTitle: "Documentation update & QA test suite",
        taskDue: "Due Sep 02, 2026",
        taskStatus: "Open",
        reportTitle: "Accomplishment report · Week 14",
        reportPeriod: "Aug 24 – 28",
        reportStatus: "Approved",
      },
      {
        name: "Carlo Reyes",
        program: "BS Information Technology",
        department: "IT Support",
        company: "Northstar Digital Studio",
        hours: "278 / 480 hrs",
        progress: "58%",
        status: "Needs attention",
        evalStatus: "Due soon",
        evalRating: 85,
        evalComments:
          "Active in ticket resolutions and hardware support. Needs consistent punctuality on morning shifts.",
        feedbackStatus: "Pending",
        feedbackRating: 85,
        feedbackNotes:
          "Ensure daily time-in is recorded promptly before 8:00 AM. Good initiative on ticket triage.",
        journalTask: "Network diagnostic walkthrough & workstation tickets",
        journalDate: "Aug 25, 2026 · 8h",
        journalStatus: "Awaiting review",
        attendanceDate: "Aug 26, 2026",
        attendanceTimes: "8:45 AM – 5:00 PM (7h 15m)",
        attendanceStatus: "Needs review (Late)",
        taskTitle: "Workstation setup & network configuration guide",
        taskDue: "Due Sep 08, 2026",
        taskStatus: "Open",
        reportTitle: "Accomplishment report · Week 13",
        reportPeriod: "Aug 17 – 21",
        reportStatus: "Approved",
      },
    ],
  },
};

const views = {
  overview: { label: "Overview", render: renderOverview },
  application: { label: "Application", render: renderApplication },
  requirements: { label: "Requirements", render: renderRequirements },
  attendance: { label: "Attendance", render: renderAttendance },
  tasks: { label: "Assigned tasks", render: renderTasks },
  journal: { label: "OJT journal", render: renderJournal },
  reports: { label: "Reports", render: renderReports },
  feedback: { label: "Feedback", render: renderFeedback },
  evaluation: { label: "Evaluation results", render: renderEvaluation },
};

const container = document.getElementById("viewContainer");
const breadcrumb = document.getElementById("breadcrumbCurrent");

function renderView(name = "overview") {
  const view = views[name] || views.overview;
  const activeItem = document.querySelector(`.nav-item[data-view="${name}"]`);
  breadcrumb.textContent = activeItem?.dataset.label || view.label;
  container.innerHTML =
    currentUser.username !== "student" && name !== "overview"
      ? renderStaffView(name)
      : view.render();
  document
    .querySelectorAll(".nav-item[data-view]")
    .forEach((item) =>
      item.classList.toggle("active", item.dataset.view === name),
    );
  bindViewActions();
  bindPassiveControls();
}

function pageIntro(eyebrow, title, copy, action = "") {
  return `<div class="page-intro"><div><p class="eyebrow">${eyebrow}</p><h1 class="page-title">${title}</h1><p>${copy}</p></div>${action}</div>`;
}

function renderStaffView(view) {
  const role = currentUser.username;
  const roleName = currentUser.role;

  if (role === "supervisor") {
    return renderSupervisorView(view);
  }

  const data = {
    adviser: {
      application: [
        "Manage OJT students",
        "Review student applications and placement details.",
        "4 applications need review",
        "Review application",
        "Jamie Dela Cruz",
        "BS Information Technology",
        "Pending review",
        "review",
      ],
      requirements: [
        "Review requirements",
        "Approve or return student document submissions.",
        "7 documents are awaiting review",
        "Review documents",
        "Weekly accomplishment report",
        "Jamie Dela Cruz",
        "Awaiting review",
        "review",
      ],
      tasks: [
        "Assign OJT students",
        "Monitor active advisees and their assigned workload.",
        "3 students need task assignments",
        "Assign task",
        "Paolo Mendoza",
        "BS Information Technology",
        "Needs assignment",
        "assign",
      ],
      attendance: [
        "Monitor attendance",
        "Review attendance exceptions for your advisees.",
        "2 attendance records need review",
        "Review attendance",
        "Paolo Mendoza",
        "Aug 26, 2026",
        "Needs review",
        "review",
      ],
      reports: [
        "Generate reports",
        "Prepare adviser summaries for the practicum office.",
        "7 reports submitted this week",
        "Generate report",
        "Week 14 adviser summary",
        "Aug 24 – 28",
        "Ready",
        "report",
      ],
      evaluation: [
        "Evaluate students",
        "Record adviser evaluations for active placements.",
        "5 evaluations are due this month",
        "Record evaluation",
        "Jamie Dela Cruz",
        "Midterm evaluation (92/100)",
        "Due soon",
        "evaluation",
      ],
    },
    admin: {
      application: [
        "Manage user accounts",
        "Manage students, advisers, supervisors, and their access.",
        "126 active accounts",
        "Add user",
        "OJT Students",
        "126 accounts",
        "Active",
        "user",
      ],
      requirements: [
        "Manage requirements",
        "Maintain the documents required for the practicum program.",
        "15 requirement types are active",
        "Add requirement",
        "Weekly accomplishment report",
        "All OJT students",
        "Required",
        "requirement",
      ],
      attendance: [
        "Manage practicum period",
        "Review campus-wide practicum attendance and periods.",
        "Current period ends October 04, 2026",
        "Manage period",
        "Practicum Period 2026",
        "Jun 01 – Oct 04",
        "Active",
        "period",
      ],
      feedback: [
        "Manage announcements",
        "Publish program announcements for the Tagudin campus.",
        "1 announcement is scheduled",
        "Create announcement",
        "OJT orientation reminder",
        "All active students",
        "Scheduled",
        "announcement",
      ],
    },
  }[role]?.[view];

  if (!data)
    return `<div class="page">${pageIntro(roleName, "Page unavailable", "This area is not available for your current role.")}</div>`;

  const [title, copy, summary, action, label, value, status, modal] = data;
  return `<div class="page">${pageIntro(roleName, title, copy, `<button class="primary-button" data-modal="${modal}">${action} <span>→</span></button>`)}<section class="hero-strip"><div><h2>${summary}</h2><p>Use the action below to keep the practicum workflow moving.</p></div><div class="hero-stat"><strong>${status === "Active" ? "✓" : "01"}</strong><span>${status.toLowerCase()}</span></div></section><section class="panel"><div class="panel-header"><div><h3>${title}</h3><p>Current items for ISPSC Tagudin Campus</p></div><button class="text-button" data-toast="List refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Details</th><th>Status</th><th>Action</th></tr></thead><tbody><tr><td>${label}</td><td>${value}</td><td><span class="status ${status === "Active" || status === "Ready" || status === "Required" ? "status-green" : "status-yellow"}">${status}</span></td><td><button class="text-button" data-modal="${modal}">${action} →</button></td></tr></tbody></table></div></section></div>`;
}

function renderSupervisorView(view) {
  const students = state.supervisorData.students;

  switch (view) {
    case "application":
      return `<div class="page">${pageIntro("Department Trainees", "Assigned OJT students", "View placement agreements and company details for students in your department.", '<button class="primary-button" data-modal="placement">View placement <span>→</span></button>')}<section class="hero-strip"><div><h2>08 students assigned to your department</h2><p>Review placement details and mentor assignments at Northstar Digital Studio.</p></div><div class="hero-stat"><strong>08</strong><span>assigned</span></div></section><section class="panel"><div class="panel-header"><div><h3>Assigned students & placements</h3><p>Active trainees in your department</p></div><button class="text-button" data-toast="Placements list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Program & Department</th><th>Host Organization</th><th>Rendered Hours</th><th>Status</th><th>Action</th></tr></thead><tbody>${students
        .map(
          (s) =>
            `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.program)} · ${escapeHtml(s.department)}</td><td>${escapeHtml(s.company)}</td><td>${escapeHtml(s.hours)}</td><td><span class="status ${s.status === "Active" ? "status-green" : "status-yellow"}">${escapeHtml(s.status)}</span></td><td><button class="text-button" data-modal="placement" data-student="${escapeHtml(s.name)}">View placement →</button></td></tr>`,
        )
        .join("")}</tbody></table></div></section></div>`;

    case "tasks":
      return `<div class="page">${pageIntro("Workload management", "Assign tasks", "Create, assign, and track work for your assigned OJT students.", '<button class="primary-button" data-modal="assign">Assign task <span>+</span></button>')}<section class="hero-strip"><div><h2>15 tasks are currently active</h2><p>Keep your department trainees aligned with clear deliverables and deadlines.</p></div><div class="hero-stat"><strong>15</strong><span>open tasks</span></div></section><section class="panel"><div class="panel-header"><div><h3>Student task assignments</h3><p>Assigned work for OJT students</p></div><button class="text-button" data-toast="Tasks list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Assigned Task</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${students
        .map(
          (s) =>
            `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.department)}</small></td><td>${escapeHtml(s.taskTitle)}</td><td>${escapeHtml(s.taskDue)}</td><td><span class="status ${s.taskStatus === "In progress" ? "status-blue" : "status-yellow"}">${escapeHtml(s.taskStatus)}</span></td><td><button class="text-button" data-modal="assign" data-student="${escapeHtml(s.name)}">Assign task →</button></td></tr>`,
        )
        .join("")}</tbody></table></div></section></div>`;

    case "attendance":
      return `<div class="page">${pageIntro("Time & attendance", "Manage attendance", "Review and verify the daily attendance logs of your assigned students.", '<button class="primary-button" data-modal="attendance_review">Review attendance <span>→</span></button>')}<section class="hero-strip"><div><h2>1 attendance record needs attention</h2><p>Verify time logs and approve daily check-ins for practicum credits.</p></div><div class="hero-stat"><strong>96%</strong><span>attendance</span></div></section><section class="panel"><div class="panel-header"><div><h3>Daily attendance records</h3><p>Recent attendance for ISPSC Tagudin students</p></div><button class="text-button" data-toast="Attendance list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Date</th><th>Schedule & Time</th><th>Status</th><th>Action</th></tr></thead><tbody>${students
        .map(
          (s) =>
            `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.department)}</small></td><td>${escapeHtml(s.attendanceDate)}</td><td>${escapeHtml(s.attendanceTimes)}</td><td><span class="status ${s.attendanceStatus === "Present" ? "status-green" : "status-yellow"}">${escapeHtml(s.attendanceStatus)}</span></td><td><button class="text-button" data-modal="attendance_review" data-student="${escapeHtml(s.name)}">Review attendance →</button></td></tr>`,
        )
        .join("")}</tbody></table></div></section></div>`;

    case "journal":
      return `<div class="page">${pageIntro("Practicum logs", "Review journals", "Review and approve recent student journal entries and reflections.", '<button class="primary-button" data-modal="journal_review">Review entries <span>→</span></button>')}<section class="hero-strip"><div><h2>3 entries are waiting for your review</h2><p>Check student daily reflections, tasks accomplished, and lessons learned.</p></div><div class="hero-stat"><strong>03</strong><span>pending</span></div></section><section class="panel"><div class="panel-header"><div><h3>Submitted journal reflections</h3><p>Recent learning logs awaiting supervisor sign-off</p></div><button class="text-button" data-toast="Journal list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Journal Entry</th><th>Submitted Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${students
        .map(
          (s) =>
            `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.department)}</small></td><td>${escapeHtml(s.journalTask)}</td><td>${escapeHtml(s.journalDate)}</td><td><span class="status ${s.journalStatus === "Approved" ? "status-green" : "status-yellow"}">${escapeHtml(s.journalStatus)}</span></td><td><button class="text-button" data-modal="journal_review" data-student="${escapeHtml(s.name)}">Review entries →</button></td></tr>`,
        )
        .join("")}</tbody></table></div></section></div>`;

    case "feedback":
      return `<div class="page">${pageIntro("Mentorship & guidance", "Provide feedback", "Share numerical performance ratings (1–100) and supervisor comments with your students.", '<button class="primary-button" data-modal="feedback">Provide feedback <span>+</span></button>')}<section class="hero-strip"><div><h2>2 students are waiting for feedback</h2><p>Help your trainees grow by giving actionable comments and performance scores.</p></div><div class="hero-stat"><strong>92 / 100</strong><span>avg rating</span></div></section><section class="panel"><div class="panel-header"><div><h3>Student feedback & guidance</h3><p>Numerical ratings (1–100) and comments given to students</p></div><button class="text-button" data-toast="Feedback list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Department</th><th>Latest Rating (1–100)</th><th>Supervisor Comments</th><th>Action</th></tr></thead><tbody>${students
        .map(
          (s) =>
            `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.department)}</td><td><span class="score-badge">${escapeHtml(s.feedbackRating)} / 100</span></td><td style="max-width:320px;line-height:1.5;color:#4f5e65">“${escapeHtml(s.feedbackNotes)}”</td><td><button class="text-button" data-modal="feedback" data-student="${escapeHtml(s.name)}">Provide feedback →</button></td></tr>`,
        )
        .join("")}</tbody></table></div></section></div>`;

    case "evaluation":
      return `<div class="page">${pageIntro("Performance appraisal", "Evaluate OJT students", "Complete workplace evaluations with numerical ratings from 1–100 and detailed supervisor comments.", '<button class="primary-button" data-modal="evaluation">Evaluate OJT students <span>+</span></button>')}<section class="hero-strip"><div><h2>3 midterm evaluations are being tracked</h2><p>Assess skills, professionalism, and render ratings from 1 to 100 with comprehensive feedback.</p></div><div class="hero-stat"><strong>92 / 100</strong><span>team score</span></div></section><section class="panel"><div class="panel-header"><div><h3>OJT Student Workplace Evaluations</h3><p>Scored on a 1–100 numerical rating scale with supervisor comments</p></div><button class="text-button" data-toast="Evaluations refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Department</th><th>Evaluation Period</th><th>Rating (1–100)</th><th>Supervisor Evaluation Comments</th><th>Action</th></tr></thead><tbody>${students
        .map(
          (s) =>
            `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.program)}</small></td><td>${escapeHtml(s.department)}</td><td>Midterm evaluation</td><td><span class="score-badge">${escapeHtml(s.evalRating)} / 100</span></td><td style="max-width:300px;line-height:1.5;color:#4f5e65">“${escapeHtml(s.evalComments)}”</td><td><button class="text-button" data-modal="evaluation" data-student="${escapeHtml(s.name)}">Evaluate OJT students →</button></td></tr>`,
        )
        .join("")}</tbody></table></div></section></div>`;

    case "reports":
      return `<div class="page">${pageIntro("Documentation review", "Accomplishment reports", "Review and approve weekly accomplishment reports submitted by your trainees.", '<button class="primary-button" data-modal="review">Review reports <span>→</span></button>')}<section class="hero-strip"><div><h2>5 reports need your approval</h2><p>Verify completed hours and sign off on weekly accomplishments.</p></div><div class="hero-stat"><strong>05</strong><span>reports</span></div></section><section class="panel"><div class="panel-header"><div><h3>Submitted accomplishment reports</h3><p>Weekly documentation for ISPSC Tagudin Campus</p></div><button class="text-button" data-toast="Reports refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Report Title</th><th>Period</th><th>Status</th><th>Action</th></tr></thead><tbody>${students
        .map(
          (s) =>
            `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.reportTitle)}</td><td>${escapeHtml(s.reportPeriod)}</td><td><span class="status ${s.reportStatus === "Approved" ? "status-green" : "status-yellow"}">${escapeHtml(s.reportStatus)}</span></td><td><button class="text-button" data-modal="review" data-student="${escapeHtml(s.name)}">Review report →</button></td></tr>`,
        )
        .join("")}</tbody></table></div></section></div>`;

    default:
      return `<div class="page">${pageIntro("Department Supervisor", "Overview", "Welcome to your supervisor dashboard.")}</div>`;
  }
}

function renderOverview() {
  if (currentUser.username !== "student")
    return renderRoleOverview(currentUser.username);
  return `<div class="page">${pageIntro("Tuesday, August 26, 2026 · ISPSC Tagudin Campus", "Good morning, Jamie.", "Here is what is happening in your practicum today.", '<span class="date-chip">Week 14 of 20 &nbsp;·&nbsp; Aug 26</span>')}<section class="hero-strip"><div><h2>Your OJT journey is on track.</h2><p>Keep the momentum going. You are 72% through your practicum.</p></div><div class="hero-stat"><strong>72%</strong><span>overall progress</span></div></section><div class="stats-grid"><div class="stat-card"><div class="stat-icon icon-green">◷</div><strong>${state.attendance}%</strong><span>Attendance rate</span></div><div class="stat-card"><div class="stat-icon icon-coral">✓</div><strong>12 / 15</strong><span>Requirements submitted</span></div><div class="stat-card"><div class="stat-icon icon-blue">≡</div><strong>03</strong><span>Tasks in progress</span></div><div class="stat-card"><div class="stat-icon icon-gold">☆</div><strong>92 / 100</strong><span>Latest evaluation</span></div></div><div class="section-heading"><h2>Quick actions</h2><button class="text-button" data-view-link="application">View all activity →</button></div><div class="quick-actions"><button class="quick-action" data-view-link="attendance"><span class="action-icon">◷</span><b>Record attendance</b><span>Log today's time</span></button><button class="quick-action" data-view-link="journal"><span class="action-icon">✎</span><b>Write in journal</b><span>Capture your learnings</span></button><button class="quick-action" data-view-link="requirements"><span class="action-icon">↑</span><b>Submit requirement</b><span>2 items need attention</span></button></div><div class="dashboard-grid"><section class="panel"><div class="panel-header"><div><h3>Practicum progress</h3><p>BS Information Technology · ISPSC Tagudin Campus · 480 total hours</p></div><button class="text-button" data-view-link="reports">View report</button></div><div class="progress-wrap"><div class="progress-ring"><strong>72%</strong></div><div class="progress-detail"><h4>348 hours completed</h4><p>You have 132 hours left to complete your practicum placement.</p><div class="progress-bar"><i></i></div><small>Expected completion: October 04, 2026</small></div></div></section><section class="panel"><div class="panel-header"><div><h3>Recent activity</h3><p>Your latest updates</p></div><button class="text-button">•••</button></div><ul class="activity-list"><li><span class="activity-dot">✓</span><div><strong>Journal entry submitted</strong><small>Yesterday at 4:32 PM</small></div></li><li><span class="activity-dot">↑</span><div><strong>Weekly report approved</strong><small>August 22, 2026</small></div></li><li><span class="activity-dot">✦</span><div><strong>New task assigned by supervisor</strong><small>August 21, 2026</small></div></li></ul></section></div></div>`;
}

function renderRoleOverview(role) {
  if (role === "supervisor") {
    const students = state.supervisorData.students;
    return `<div class="page">${pageIntro("Supervisor workspace · August 26, 2026", "Good morning, Alex.", "Monitor your assigned students, render numerical ratings (1–100), and comment on performance.", '<span class="date-chip">ISPSC Tagudin Campus</span>')}<section class="hero-strip"><div><h2>Your team is making progress.</h2><p>3 assigned students have evaluations, tasks, or feedback ready for review.</p></div><div class="hero-stat"><strong>08</strong><span>assigned OJT students</span></div></section><div class="stats-grid"><div class="stat-card"><div class="stat-icon icon-green">◷</div><strong>96%</strong><span>Team attendance</span></div><div class="stat-card"><div class="stat-icon icon-blue">≡</div><strong>15</strong><span>Open tasks</span></div><div class="stat-card"><div class="stat-icon icon-coral">✓</div><strong>09</strong><span>Reports reviewed</span></div><div class="stat-card"><div class="stat-icon icon-gold">☆</div><strong>92 / 100</strong><span>Average rating (1–100)</span></div></div><div class="section-heading"><h2>Quick actions</h2><span class="date-chip">Today · Aug 26</span></div><div class="quick-actions"><button class="quick-action" data-view-link="tasks"><span class="action-icon">≡</span><b>Assign task</b><span>Keep students moving</span></button><button class="quick-action" data-view-link="attendance"><span class="action-icon">◷</span><b>Review attendance</b><span>Review this week</span></button><button class="quick-action" data-view-link="feedback"><span class="action-icon">♡</span><b>Provide feedback</b><span>Score & comments</span></button><button class="quick-action" data-view-link="evaluation"><span class="action-icon">☆</span><b>Evaluate OJT students</b><span>Score 1–100 scale</span></button></div><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h3>Assigned OJT students</h3><p>Current department placement overview & direct quick actions</p></div><button class="text-button" data-view-link="application">View all placements →</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Placement Department</th><th>Progress</th><th>Rating (1–100) & Status</th><th>Quick Actions</th></tr></thead><tbody>${students
      .map(
        (s) =>
          `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.program)}</small></td><td>${escapeHtml(s.department)}</td><td>${escapeHtml(s.progress)}</td><td><span class="score-badge">${escapeHtml(s.evalRating)} / 100</span> &nbsp;<span class="status ${s.status === "Active" ? "status-green" : "status-yellow"}">${escapeHtml(s.status)}</span></td><td><div class="table-action-group"><button class="text-button" data-modal="evaluation" data-student="${escapeHtml(s.name)}">Evaluate →</button><button class="text-button" data-modal="feedback" data-student="${escapeHtml(s.name)}">Feedback →</button><button class="text-button" data-modal="assign" data-student="${escapeHtml(s.name)}">Assign task →</button><button class="text-button" data-modal="placement" data-student="${escapeHtml(s.name)}">Placement →</button></div></td></tr>`,
      )
      .join("")}</tbody></table></div></section></div>`;
  }

  const roleData = {
    adviser: {
      eyebrow: "Adviser workspace · August 26, 2026",
      title: "Good morning, Maria.",
      copy: "Review placements and help every student stay on track.",
      headline: "Your advisees need your attention.",
      subhead: "4 applications and 7 requirements are waiting for review.",
      value: "24",
      valueLabel: "active OJT students",
      stats: [
        ["◷", "91%", "Average attendance"],
        ["✓", "18", "Pending reviews"],
        ["≡", "07", "Reports this week"],
        ["☆", "92 / 100", "Average evaluation"],
      ],
      actions: [
        ["application", "♟", "Review applications", "4 waiting for review"],
        ["requirements", "✓", "Review requirements", "7 submissions pending"],
        ["reports", "▤", "Generate reports", "View adviser reports"],
      ],
      panelTitle: "Student progress",
      panelCopy: "Active students across your assigned departments",
      rows: [
        ["Jamie Dela Cruz", "BS Information Technology", "72%", "On track"],
        ["Paolo Mendoza", "BS Information Technology", "64%", "Needs review"],
        ["Rina Flores", "BS Computer Science", "88%", "On track"],
      ],
    },
    admin: {
      eyebrow: "Administrator workspace · August 26, 2026",
      title: "Good morning, ISPSC Admin.",
      copy: "Keep the Tagudin practicum program organized and up to date.",
      headline: "The Tagudin program is running smoothly.",
      subhead:
        "All active placements are covered for the current practicum period.",
      value: "126",
      valueLabel: "active students",
      stats: [
        ["♟", "04", "User roles"],
        ["▤", "12", "Departments"],
        ["◷", "86%", "Completion rate"],
        ["▤", "32", "Reports generated"],
      ],
      actions: [
        ["application", "♟", "Manage user accounts", "126 active users"],
        ["requirements", "✓", "Manage requirements", "15 requirement types"],
      ],
      panelTitle: "Program overview",
      panelCopy: "ISPSC Tagudin Campus · Practicum Period 2026",
      rows: [
        ["OJT Students", "All departments", "126", "Active"],
        ["OJT Advisers", "Tagudin campus", "08", "Active"],
        ["Department Supervisors", "12 departments", "24", "Active"],
      ],
    },
  }[role];

  return `<div class="page">${pageIntro(roleData.eyebrow, roleData.title, roleData.copy, '<span class="date-chip">ISPSC Tagudin Campus</span>')}<section class="hero-strip"><div><h2>${roleData.headline}</h2><p>${roleData.subhead}</p></div><div class="hero-stat"><strong>${roleData.value}</strong><span>${roleData.valueLabel}</span></div></section><div class="stats-grid">${roleData.stats.map((stat) => `<div class="stat-card"><div class="stat-icon icon-green">${stat[0]}</div><strong>${stat[1]}</strong><span>${stat[2]}</span></div>`).join("")}</div><div class="section-heading"><h2>Quick actions</h2><span class="date-chip">Today · Aug 26</span></div><div class="quick-actions">${roleData.actions.map((action) => `<button class="quick-action" data-view-link="${action[0]}"><span class="action-icon">${action[1]}</span><b>${action[2]}</b><span>${action[3]}</span></button>`).join("")}</div><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h3>${roleData.panelTitle}</h3><p>${roleData.panelCopy}</p></div><button class="text-button" data-view-link="reports">View all →</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name / group</th><th>Placement</th><th>Progress</th><th>Status</th></tr></thead><tbody>${roleData.rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td><span class="status ${row[3] === "On track" || row[3] === "Active" ? "status-green" : "status-yellow"}">${row[3]}</span></td></tr>`).join("")}</tbody></table></div></section></div>`;
}

function renderApplication() {
  return `<div class="page">${pageIntro("Student workspace", "Practicum application", "Track your placement details and application status.", '<button class="primary-button" data-modal="application">Edit application <span>→</span></button>')}<div class="detail-grid"><section class="panel"><div class="panel-header"><div><h3>Application status</h3><p>Last updated August 12, 2026</p></div><span class="status status-green">Approved</span></div><div class="progress-bar"><i style="width:100%"></i></div><dl class="info-list"><div class="info-row"><dt>Application ID</dt><dd>OJT-2026-0148</dd></div><div class="info-row"><dt>Date submitted</dt><dd>July 18, 2026</dd></div><div class="info-row"><dt>Placement period</dt><dd>Jun 01 – Oct 04, 2026</dd></div></dl></section><section class="panel"><div class="panel-header"><div><h3>Host organization</h3><p>Your approved OJT placement</p></div><span class="status status-blue">Active</span></div><dl class="info-list"><div class="info-row"><dt>Company</dt><dd>Northstar Digital Studio</dd></div><div class="info-row"><dt>Department</dt><dd>Product Engineering</dd></div><div class="info-row"><dt>Supervisor</dt><dd>Alex Ramirez</dd></div><div class="info-row"><dt>Office hours</dt><dd>8:00 AM – 5:00 PM</dd></div></dl></section></div><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h3>Application timeline</h3><p>From submission to placement</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Milestone</th><th>Date</th><th>Status</th></tr></thead><tbody><tr><td>Application submitted</td><td>July 18, 2026</td><td><span class="status status-green">Completed</span></td></tr><tr><td>Adviser review</td><td>July 22, 2026</td><td><span class="status status-green">Completed</span></td></tr><tr><td>Company acceptance</td><td>July 30, 2026</td><td><span class="status status-green">Completed</span></td></tr><tr><td>Practicum started</td><td>June 01, 2026</td><td><span class="status status-blue">In progress</span></td></tr></tbody></table></div></section></div>`;
}

function renderRequirements() {
  return `<div class="page">${pageIntro("Document center", "Your requirements", "Submit and monitor the documents needed for completion.", '<button class="primary-button" data-modal="requirement">Upload document <span>↑</span></button>')}<section class="panel"><div class="panel-header"><div><h3>Submission checklist</h3><p>12 of 15 requirements completed</p></div><span class="status status-yellow">2 need attention</span></div><div class="task-list"><div class="task-row"><input class="task-check" type="checkbox" checked><div><strong>Memorandum of Agreement</strong><small>Approved August 02, 2026</small></div><span class="task-due status status-green">Approved</span></div><div class="task-row"><input class="task-check" type="checkbox" checked><div><strong>Parent consent form</strong><small>Approved August 02, 2026</small></div><span class="task-due status status-green">Approved</span></div><div class="task-row"><input class="task-check" type="checkbox"><div><strong>Weekly accomplishment report · Week 14</strong><small>PDF or DOCX · Max 10 MB</small></div><span class="task-due status status-yellow">Due today</span></div><div class="task-row"><input class="task-check" type="checkbox"><div><strong>Medical clearance renewal</strong><small>Upload a current copy</small></div><span class="task-due status status-yellow">Action needed</span></div></div></section></div>`;
}

function renderAttendance() {
  const attendanceAction = state.attendanceRecorded
    ? '<button class="secondary-button" disabled aria-disabled="true">Attendance recorded <span>✓</span></button>'
    : '<button class="primary-button" id="clockIn">Record today&apos;s attendance <span>◷</span></button>';
  return `<div class="page">${pageIntro("Time tracking", "Attendance", "A clear record of every hour that moves you forward.", attendanceAction)}<div class="stats-grid"><div class="stat-card"><div class="stat-icon icon-green">◷</div><strong>${state.attendanceRecorded ? "356" : "348"} hrs</strong><span>Total hours rendered</span></div><div class="stat-card"><div class="stat-icon icon-blue">▤</div><strong>${state.attendanceRecorded ? "53" : "52"} days</strong><span>Days present</span></div><div class="stat-card"><div class="stat-icon icon-coral">!</div><strong>03 days</strong><span>Days absent</span></div><div class="stat-card"><div class="stat-icon icon-gold">↗</div><strong>8.2 hrs</strong><span>Average per day</span></div></div><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h3>August attendance log</h3><p>Week 14 · Northstar Digital Studio</p></div><button class="secondary-button" id="exportAttendance">Export CSV ↓</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Schedule</th><th>Time in</th><th>Time out</th><th>Total</th><th>Status</th></tr></thead><tbody>${[
    "Aug 26, Wed",
    "Aug 25, Tue",
    "Aug 24, Mon",
    "Aug 21, Fri",
    "Aug 20, Thu",
  ]
    .map((d, i) => {
      const recorded = i === 0 && state.attendanceRecorded;
      return `<tr><td>${d}</td><td>Regular</td><td>${recorded ? "7:59 AM" : i === 0 ? "—" : "7:58 AM"}</td><td>${recorded ? "5:01 PM" : i === 0 ? "—" : "5:04 PM"}</td><td>${recorded ? "8h 02m" : i === 0 ? "—" : "8h 06m"}</td><td><span class="status ${recorded || i !== 0 ? "status-green" : "status-yellow"}">${recorded || i !== 0 ? "Present" : "Not recorded"}</span></td></tr>`;
    })
    .join("")}</tbody></table></div></section></div>`;
}

function renderTasks() {
  return `<div class="page">${pageIntro("Your workload", "Assigned tasks", "Stay on top of the work your supervisor has assigned.", '<button class="primary-button" data-modal="task">Add personal task <span>+</span></button>')}<section class="panel"><div class="panel-header"><div><h3>This week</h3><p>2 open tasks · 1 completed</p></div><span class="status status-blue">Week 14</span></div><div class="task-list">${state.tasks.map((task, i) => `<label class="task-row"><input class="task-check" data-task="${i}" type="checkbox" ${task.done ? "checked" : ""}><div><strong>${task.title}</strong><small>${task.meta}</small></div><span class="task-due">${task.due}</span></label>`).join("")}</div></section></div>`;
}

function renderJournal() {
  return `<div class="page">${pageIntro("Daily reflection", "OJT journal", "Document the work, lessons, and small wins from your placement.", '<button class="primary-button" data-modal="journal">New journal entry <span>+</span></button>')}<section class="panel"><div class="panel-header"><div><h3>Recent entries</h3><p>Keep a consistent record of your practicum experience.</p></div></div><div class="task-list"><div class="task-row"><span class="activity-dot">✎</span><div><strong>Building a reusable dashboard component</strong><small>August 25, 2026 · 8 hours · Approved by Alex Ramirez</small></div><span class="status status-green">Approved</span></div><div class="task-row"><span class="activity-dot">✎</span><div><strong>Learning the product release workflow</strong><small>August 22, 2026 · 8 hours · Approved by Alex Ramirez</small></div><span class="status status-green">Approved</span></div><div class="task-row"><span class="activity-dot">✎</span><div><strong>API testing and documentation</strong><small>August 20, 2026 · 8 hours · Submitted for review</small></div><span class="status status-yellow">In review</span></div></div></section></div>`;
}

function renderReports() {
  return `<div class="page">${pageIntro("Your records", "Reports & submissions", "Access your accomplishment reports and completion documents.", '<button class="primary-button" data-modal="report">Create report <span>+</span></button>')}<section class="panel"><div class="panel-header"><div><h3>Accomplishment reports</h3><p>Weekly documentation sent to your adviser</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Report</th><th>Period</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody><tr><td>Accomplishment report · Week 13</td><td>Aug 17 – 21</td><td>Aug 22, 2026</td><td><span class="status status-green">Approved</span></td><td><button class="text-button">View ↗</button></td></tr><tr><td>Accomplishment report · Week 12</td><td>Aug 10 – 14</td><td>Aug 15, 2026</td><td><span class="status status-green">Approved</span></td><td><button class="text-button">View ↗</button></td></tr><tr><td>Accomplishment report · Week 14</td><td>Aug 24 – 28</td><td>Not submitted</td><td><span class="status status-yellow">Draft</span></td><td><button class="text-button" data-modal="report">Continue →</button></td></tr></tbody></table></div></section></div>`;
}

function renderFeedback() {
  return `<div class="page">${pageIntro("Stay connected", "Feedback", "See notes and numerical performance ratings (1–100) from your supervisor and adviser.")}<section class="panel"><div class="panel-header"><div><h3>Supervisor feedback & guidance</h3><p>Most recent score and comments from Alex Ramirez</p></div><span class="score-badge">92 / 100</span></div><p style="font-size:14px;line-height:1.7;color:#4f5e65;margin:10px 0 18px">“Jamie has been consistent, curious, and dependable this month. The quality of documentation has improved significantly, and they are asking thoughtful questions during code reviews.”</p><small style="color:var(--muted)">August 21, 2026 · Northstar Digital Studio · Department of Product Engineering</small></section></div>`;
}

function renderEvaluation() {
  return `<div class="page">${pageIntro("Your growth", "Evaluation results", "Review workplace skill evaluations scored on a numerical 1–100 rating scale.")}<div class="detail-grid"><section class="panel"><div class="panel-header"><div><h3>Midterm evaluation</h3><p>Completed August 21, 2026 by Alex Ramirez</p></div><span class="score-badge">92 / 100</span></div><div class="progress-detail"><h4>Overall rating · 92 / 100</h4><div class="progress-bar"><i style="width:92%"></i></div></div><dl class="info-list"><div class="info-row"><dt>Technical skills</dt><dd>90 / 100</dd></div><div class="info-row"><dt>Communication & Teamwork</dt><dd>95 / 100</dd></div><div class="info-row"><dt>Professionalism & Punctuality</dt><dd>92 / 100</dd></div></dl></section><section class="panel"><div class="panel-header"><div><h3>Supervisor evaluation comments</h3><p>Alex Ramirez · Department Supervisor</p></div><span class="status status-green">Excellent</span></div><p style="font-size:13px;line-height:1.7;color:#4f5e65;margin:12px 0 16px">“Jamie has demonstrated exceptional growth in product engineering. Documentation and code structure have improved markedly, meeting workplace standards. Keep up the great engagement.”</p><small style="color:var(--muted)">Next evaluation: Final placement appraisal · October 01, 2026</small></section></div></div>`;
}

function bindViewActions() {
  document
    .querySelectorAll("[data-view-link]")
    .forEach((el) =>
      el.addEventListener("click", () => renderView(el.dataset.viewLink)),
    );

  document.querySelectorAll("[data-modal]").forEach((el) =>
    el.addEventListener("click", () =>
      openModal(el.dataset.modal, el.dataset.student || ""),
    ),
  );

  const clock = document.getElementById("clockIn");
  if (clock)
    clock.addEventListener("click", () => {
      state.attendanceRecorded = true;
      state.attendance = 85;
      showToast("Today's attendance has been recorded.");
      renderView("attendance");
    });

  const exportButton = document.getElementById("exportAttendance");
  if (exportButton) exportButton.addEventListener("click", exportAttendance);

  document.querySelectorAll("[data-task]").forEach((input) =>
    input.addEventListener("change", () => {
      state.tasks[input.dataset.task].done = input.checked;
      showToast(
        input.checked
          ? "Task marked complete."
          : "Task moved back to your list.",
      );
    }),
  );
}

function getStudentOptions() {
  return state.supervisorData.students
    .map(
      (s) =>
        `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.department)})</option>`,
    )
    .join("");
}

function openModal(type, studentName = "") {
  const configs = {
    application: [
      "Update application",
      "Save application",
      '<label>Host organization<input name="organization" placeholder="Organization name" required></label><label>Supervisor email<input name="email" type="email" placeholder="name@example.com" required></label>',
    ],
    placement: [
      studentName ? `Placement details: ${studentName}` : "View placement",
      "Update placement",
      `<label>Host organization<input name="organization" value="Northstar Digital Studio" required></label><label>Department<input name="department" value="Product Engineering" required></label><label>Supervisor notes<textarea name="notes" rows="3" placeholder="Enter placement and training notes..."></textarea></label>`,
    ],
    requirement: [
      "Upload requirement",
      "Upload document",
      '<label>Requirement<select name="requirement" required><option value="">Select a requirement</option><option>Weekly accomplishment report</option><option>Medical clearance renewal</option></select></label><label>Document<input name="document" type="file" accept=".pdf,.doc,.docx" required></label>',
    ],
    task: [
      "Add personal task",
      "Add task",
      '<label>Task title<input name="title" placeholder="What needs to be done?" required></label><label>Due date<input name="due" type="date" required></label>',
    ],
    journal: [
      "New journal entry",
      "Save journal entry",
      '<label>Entry title<input name="title" placeholder="What did you work on?" required></label><label>Reflection<textarea name="reflection" rows="4" required></textarea></label>',
    ],
    report: [
      "Create accomplishment report",
      "Create report",
      '<label>Report week<input name="week" placeholder="e.g., Week 14" required></label><label>Summary<textarea name="summary" rows="4" required></textarea></label>',
    ],
    review: [
      studentName ? `Review submission: ${studentName}` : "Review submission",
      "Save review",
      '<label>Decision<select name="decision" required><option value="Approved">Approve</option><option value="Revision">Return for revision</option></select></label><label>Comments<textarea name="comments" rows="3" placeholder="Enter review feedback and remarks..." required></textarea></label>',
    ],
    journal_review: [
      studentName ? `Review journal: ${studentName}` : "Review journal entry",
      "Save journal review",
      '<label>Review decision<select name="decision" required><option value="Approved">Approve entry</option><option value="Revision">Return for revision</option></select></label><label>Supervisor comments & feedback<textarea name="comments" rows="3" placeholder="Write comments or guidance for the student..." required></textarea></label>',
    ],
    attendance_review: [
      studentName ? `Review attendance: ${studentName}` : "Review attendance",
      "Save attendance review",
      '<label>Attendance decision<select name="decision" required><option value="Approved">Approve attendance (Present)</option><option value="Excused">Mark as Excused</option><option value="Revision">Return for correction</option></select></label><label>Supervisor remarks<textarea name="comments" rows="3" placeholder="Enter attendance notes or remarks..." required></textarea></label>',
    ],
    assign: [
      studentName ? `Assign task to ${studentName}` : "Assign task",
      "Assign task",
      '<label>Task title<input name="title" placeholder="e.g., Implement module test suite" required></label><label>Due date<input name="due" type="date" required></label><label>Task details & instructions<textarea name="details" rows="3" placeholder="Provide instructions for the student..." required></textarea></label>',
    ],
    feedback: [
      studentName ? `Provide feedback: ${studentName}` : "Provide feedback",
      "Send feedback",
      '<label>Performance rating (1–100)<input name="rating" type="number" min="1" max="100" step="1" placeholder="Enter numerical score from 1 to 100 (e.g., 92)" required></label><label>Supervisor feedback & comments<textarea name="feedback" rows="4" placeholder="Write feedback notes, commendations, and guidance..." required></textarea></label>',
    ],
    evaluation: [
      studentName ? `Evaluate: ${studentName}` : "Evaluate OJT student",
      "Save evaluation",
      '<label>Rating (1–100)<input name="rating" type="number" min="1" max="100" step="1" placeholder="Enter numerical score from 1 to 100 (e.g., 92)" required></label><label>Supervisor comments<textarea name="comment" rows="4" placeholder="Write comprehensive evaluation comments, strengths, and areas for improvement..." required></textarea></label>',
    ],
    user: [
      "Add user",
      "Create user",
      '<label>Full name<input name="name" required></label><label>Role<select name="role" required><option value="">Select a role</option><option>OJT Student</option><option>OJT Adviser</option><option>Department Supervisor</option></select></label>',
    ],
    period: [
      "Manage practicum period",
      "Save period",
      '<label>Period name<input name="period" required></label><label>End date<input name="endDate" type="date" required></label>',
    ],
    announcement: [
      "Create announcement",
      "Publish announcement",
      '<label>Title<input name="title" required></label><label>Message<textarea name="message" rows="4" required></textarea></label>',
    ],
  };

  const config = configs[type];
  if (!config) return;

  state.activeModal = type;
  document.getElementById("modalTitle").textContent = config[0];
  document.getElementById("modalDescription").textContent =
    studentName
      ? `Complete details for ${studentName}.`
      : `Complete the details to ${config[1].toLowerCase()}.`;

  let studentHTML = "";
  if (studentName) {
    studentHTML = `<div class="modal-student-banner"><span class="student-pill">OJT Student</span><strong>${escapeHtml(studentName)}</strong></div><input type="hidden" name="student" value="${escapeHtml(studentName)}">`;
  } else if (
    [
      "assign",
      "feedback",
      "evaluation",
      "placement",
      "attendance_review",
      "journal_review",
    ].includes(type)
  ) {
    studentHTML = `<label>Student<select name="student" required><option value="">Select an assigned student</option>${getStudentOptions()}</select></label>`;
  }

  document.getElementById("modalFields").innerHTML =
    studentHTML + config[2];
  document.getElementById("modalSubmitLabel").textContent = config[1];

  const backdrop = document.getElementById("modalBackdrop");
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document
    .querySelector(
      "#modalFields input:not([type=hidden]), #modalFields select, #modalFields textarea",
    )
    ?.focus();
}

function closeModal() {
  const backdrop = document.getElementById("modalBackdrop");
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  state.activeModal = null;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function exportAttendance() {
  const rows = [
    ["Date", "Schedule", "Time in", "Time out", "Total", "Status"],
    [
      "Aug 26, 2026",
      "Regular",
      state.attendanceRecorded ? "7:59 AM" : "",
      state.attendanceRecorded ? "5:01 PM" : "",
      state.attendanceRecorded ? "8h 02m" : "",
      state.attendanceRecorded ? "Present" : "Not recorded",
    ],
    ["Aug 25, 2026", "Regular", "7:58 AM", "5:04 PM", "8h 06m", "Present"],
  ];
  const blob = new Blob(
    [rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n")],
    { type: "text/csv" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "attendance-august-2026.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(
    () => toast.classList.remove("show"),
    2600,
  );
}

function bindPassiveControls() {
  document.querySelectorAll(".task-check:not([data-task])").forEach((input) => {
    input.disabled = true;
    input.setAttribute("aria-label", "Requirement status");
  });
  document
    .querySelectorAll("[data-toast]")
    .forEach((button) =>
      button.addEventListener("click", () => showToast(button.dataset.toast)),
    );
  document.querySelectorAll(".text-button").forEach((button) => {
    if (button.dataset.viewLink || button.dataset.modal || button.dataset.toast)
      return;
    if (button.textContent.includes("View"))
      button.addEventListener("click", () =>
        showToast("Report preview is not available in this demo."),
      );
  });
}

document.querySelectorAll(".nav-item[data-view]").forEach((item) =>
  item.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
    renderView(item.dataset.view);
    document.getElementById("sidebar").classList.remove("open");
  }),
);

document
  .getElementById("mobileMenu")
  .addEventListener("click", () =>
    document.getElementById("sidebar").classList.toggle("open"),
  );

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.activeModal) closeModal();
});

document.getElementById("modalForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const student = formData.get("student") || "";
  const rating = formData.get("rating");
  const comment = formData.get("comment") || formData.get("feedback") || "";
  const action = state.activeModal;

  if (student && rating) {
    const sObj = state.supervisorData.students.find((s) => s.name === student);
    if (sObj) {
      if (action === "evaluation") {
        sObj.evalRating = Number(rating);
        if (comment) sObj.evalComments = comment;
        sObj.evalStatus = "Completed";
      } else if (action === "feedback") {
        sObj.feedbackRating = Number(rating);
        if (comment) sObj.feedbackNotes = comment;
        sObj.feedbackStatus = "Feedback given";
      }
    }
  }

  closeModal();

  let toastMessage = "Changes saved successfully.";
  if (action === "evaluation") {
    toastMessage = rating
      ? `Evaluation with numerical score ${rating}/100 and comments saved${student ? ` for ${student}` : ""}.`
      : `Evaluation saved successfully${student ? ` for ${student}` : ""}.`;
  } else if (action === "feedback") {
    toastMessage = rating
      ? `Feedback with numerical rating ${rating}/100 submitted${student ? ` for ${student}` : ""}.`
      : `Feedback submitted${student ? ` for ${student}` : ""}.`;
  } else if (action === "assign" || action === "task") {
    toastMessage = student
      ? `Task assigned to ${student} successfully.`
      : "Task saved successfully.";
  } else if (action === "attendance_review") {
    toastMessage = student
      ? `Attendance review saved for ${student}.`
      : "Attendance review saved.";
  } else if (action === "journal_review") {
    toastMessage = student
      ? `Journal review approved for ${student}.`
      : "Journal review saved.";
  } else if (action === "placement") {
    toastMessage = student
      ? `Placement details updated for ${student}.`
      : "Placement details updated.";
  } else if (action === "requirement") {
    toastMessage = "Document uploaded successfully.";
  } else if (action === "journal") {
    toastMessage = "Journal entry saved successfully.";
  } else if (action === "report") {
    toastMessage = "Accomplishment report draft created.";
  } else if (action === "review") {
    toastMessage = student
      ? `Review saved for ${student}.`
      : "Review saved successfully.";
  } else if (action === "user") {
    toastMessage = "User created successfully.";
  } else if (action === "period") {
    toastMessage = "Practicum period saved successfully.";
  } else if (action === "announcement") {
    toastMessage = "Announcement published successfully.";
  }

  showToast(toastMessage);

  if (currentUser.username === "supervisor") {
    const activeNav = document.querySelector(".nav-item.active");
    if (activeNav) {
      renderView(activeNav.dataset.view);
    }
  }
});

document
  .getElementById("notificationButton")
  .addEventListener("click", () => showToast("You have 2 updates to review."));

document
  .getElementById("topProfileButton")
  .addEventListener("click", () =>
    showToast(`${currentUser.name} · ${currentUser.role}`),
  );

document
  .getElementById("sidebarProfileButton")
  .addEventListener("click", () =>
    showToast(`${currentUser.name} · ${currentUser.role}`),
  );

function setLoggedInUser(account) {
  document.getElementById("sidebarAvatar").textContent = account.initials;
  document.getElementById("topAvatar").textContent = account.initials;
  document.getElementById("sidebarName").textContent = account.name;
  document.getElementById("sidebarRole").textContent =
    `${account.role} · ISPSC Tagudin Campus`;
  document.getElementById("topProfileName").textContent = account.name;
}

function setRoleNavigation(role) {
  const navigation =
    {
      student: [
        ["overview", "⌂", "Overview"],
        ["application", "♟", "Application"],
        ["requirements", "✓", "Requirements"],
        ["attendance", "◷", "Attendance"],
        ["tasks", "≡", "Assigned tasks"],
        ["journal", "✎", "OJT journal"],
        ["reports", "▤", "Reports"],
        ["feedback", "♡", "Feedback"],
        ["evaluation", "☆", "Evaluation results"],
      ],
      adviser: [
        ["overview", "⌂", "Adviser overview"],
        ["application", "♟", "Manage OJT students"],
        ["requirements", "✓", "Review requirements"],
        ["tasks", "≡", "Assign OJT students"],
        ["attendance", "◷", "Monitor attendance"],
        ["reports", "▤", "Generate reports"],
        ["evaluation", "☆", "Evaluate students"],
      ],
      supervisor: [
        ["overview", "⌂", "Supervisor overview"],
        ["application", "♟", "Assigned OJT students"],
        ["tasks", "≡", "Assign tasks"],
        ["attendance", "◷", "Manage attendance"],
        ["journal", "✎", "Review journals"],
        ["feedback", "♡", "Provide feedback"],
        ["evaluation", "☆", "Evaluate OJT students"],
        ["reports", "▤", "Accomplishment reports"],
      ],
      admin: [
        ["overview", "⌂", "Admin overview"],
        ["application", "♟", "Manage user accounts"],
        ["requirements", "✓", "Manage requirements"],
        ["attendance", "◷", "Manage practicum period"],
        ["feedback", "✦", "Manage announcements"],
      ],
    }[role] || [];

  document.getElementById("mainNav").innerHTML =
    `<p class="nav-label">${role === "student" ? "Workspace" : currentUser.role}</p>${navigation
      .slice(0, role === "student" ? 7 : navigation.length)
      .map(
        (item, index) =>
          `<button class="nav-item ${index === 0 ? "active" : ""}" data-view="${item[0]}"><span class="nav-icon">${item[1]}</span>${item[2]}${item[2] === "Review requirements" ? "<em>7</em>" : ""}</button>`,
      )
      .join("")}${
      role === "student"
        ? '<p class="nav-label nav-label-spaced">Personal</p>' +
          navigation
            .slice(7)
            .map(
              (item) =>
                `<button class="nav-item" data-view="${item[0]}"><span class="nav-icon">${item[1]}</span>${item[2]}</button>`,
            )
            .join("")
        : ""
    }`;
  bindNavigation();
}

function bindNavigation() {
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    const copy = item.cloneNode(true);
    copy
      .querySelectorAll(".nav-icon, em")
      .forEach((element) => element.remove());
    item.dataset.label = copy.textContent.trim();
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-item[data-view]")
        .forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
      renderView(item.dataset.view);
      document.getElementById("sidebar").classList.remove("open");
    });
  });
}

function showApp(account) {
  currentUser = account;
  setLoggedInUser(account);
  setRoleNavigation(account.username);
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appShell").classList.remove("hidden");
  renderView();
}

function showLogin() {
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("loginScreen").style.display = "";
  document.getElementById("loginForm").reset();
  document.getElementById("signUpForm").reset();
  switchAuthTab("signIn");
  document.getElementById("loginError").textContent = "";
  document.getElementById("signUpError").textContent = "";
}

/* =========================================================
   PROFESSIONAL AUTHENTICATION (L/SU) CONTROLLER
   ========================================================= */

function switchAuthTab(tab) {
  const isSignIn = tab === "signIn";
  document.getElementById("tabSignIn").classList.toggle("active", isSignIn);
  document.getElementById("tabSignIn").setAttribute("aria-selected", isSignIn ? "true" : "false");
  document.getElementById("tabSignUp").classList.toggle("active", !isSignIn);
  document.getElementById("tabSignUp").setAttribute("aria-selected", !isSignIn ? "true" : "false");

  document.getElementById("signInContainer").classList.toggle("hidden", !isSignIn);
  document.getElementById("signUpContainer").classList.toggle("hidden", isSignIn);

  document.getElementById("loginError").textContent = "";
  document.getElementById("signUpError").textContent = "";

  if (isSignIn) {
    document.getElementById("loginUsername")?.focus();
  } else {
    document.getElementById("regName")?.focus();
  }
}

document.getElementById("tabSignIn").addEventListener("click", () => switchAuthTab("signIn"));
document.getElementById("tabSignUp").addEventListener("click", () => switchAuthTab("signUp"));
document.getElementById("switchToSignUp").addEventListener("click", () => switchAuthTab("signUp"));
document.getElementById("switchToSignIn").addEventListener("click", () => switchAuthTab("signIn"));

// Password Show/Hide Toggle Handlers
function togglePasswordVisibility(inputElem, toggleBtn) {
  if (!inputElem || !toggleBtn) return;
  const isPassword = inputElem.type === "password";
  inputElem.type = isPassword ? "text" : "password";
  toggleBtn.textContent = isPassword ? "🙈" : "👁";
  toggleBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
}

document.getElementById("toggleLoginPassword")?.addEventListener("click", () => {
  togglePasswordVisibility(
    document.getElementById("loginPassword"),
    document.getElementById("toggleLoginPassword"),
  );
});

document.getElementById("toggleRegPassword")?.addEventListener("click", () => {
  togglePasswordVisibility(
    document.getElementById("regPassword"),
    document.getElementById("toggleRegPassword"),
  );
});

// Forgot Password Prompt
document.getElementById("forgotPasswordBtn")?.addEventListener("click", () => {
  showToast("Password reset instructions sent. Please verify with the ICT / Practicum office.");
});

// Sign In Form Submission
document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document
    .getElementById("loginUsername")
    .value.trim()
    .toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const account = Object.values(accounts).find(
    (item) => item.username === username && item.password === password,
  );
  if (!account) {
    document.getElementById("loginError").textContent =
      "Incorrect username or password. Please check your credentials.";
    return;
  }
  showToast(`Welcome back, ${account.name}!`);
  showApp(account);
});

// Sign Up Form Submission
document.getElementById("signUpForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const idNumber = document.getElementById("regId").value.trim();
  const roleKey = document.getElementById("regRole").value;
  const dept = document.getElementById("regDept").value;
  const email = document.getElementById("regEmail").value.trim();
  const username = document.getElementById("regUsername").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const errorElem = document.getElementById("signUpError");

  if (password.length < 6) {
    errorElem.textContent = "Password must be at least 6 characters long.";
    return;
  }
  if (password !== confirmPassword) {
    errorElem.textContent = "Passwords do not match. Please re-enter.";
    return;
  }
  if (accounts[username]) {
    errorElem.textContent = "This username is already taken. Please choose another.";
    return;
  }

  // Derive initials
  const nameParts = name.split(" ");
  const initials = (nameParts[0]?.[0] || "U") + (nameParts[nameParts.length - 1]?.[0] || "");

  const roleTitle =
    roleKey === "supervisor"
      ? "Department Supervisor"
      : roleKey === "adviser"
        ? "OJT Adviser"
        : "OJT Student";

  const newAccount = {
    username,
    password,
    role: roleTitle,
    name,
    initials: initials.toUpperCase(),
    department: dept,
    idNumber,
    email,
  };

  accounts[username] = newAccount;

  // If new student created, add to supervisor's student list
  if (roleKey === "student") {
    state.supervisorData.students.push({
      name: newAccount.name,
      program: dept,
      department: "Product Engineering",
      company: "Northstar Digital Studio",
      hours: "0 / 480 hrs",
      progress: "0%",
      status: "Active",
      evalStatus: "Pending",
      evalRating: 90,
      evalComments: "New trainee registered. Ready for initial onboarding.",
      feedbackStatus: "Pending",
      feedbackRating: 90,
      feedbackNotes: "Welcome to the practicum program.",
      journalTask: "Orientation and environment setup",
      journalDate: "Aug 26, 2026 · 8h",
      journalStatus: "Awaiting review",
      attendanceDate: "Aug 26, 2026",
      attendanceTimes: "8:00 AM – 5:00 PM (8h 00m)",
      attendanceStatus: "Present",
      taskTitle: "Workspace setup & team introductions",
      taskDue: "Due Sep 01, 2026",
      taskStatus: "Open",
      reportTitle: "Accomplishment report · Week 1",
      reportPeriod: "Aug 26 – 30",
      reportStatus: "Draft",
    });
  }

  errorElem.textContent = "";
  showToast(`Account created successfully! Welcome, ${name}.`);
  showApp(newAccount);
});

document
  .querySelectorAll("#loginForm input, #signUpForm input")
  .forEach((input) =>
    input.addEventListener("input", () => {
      document.getElementById("loginError").textContent = "";
      document.getElementById("signUpError").textContent = "";
    }),
  );

document.getElementById("signOut").addEventListener("click", showLogin);

// Initial bootstrap
renderView();
