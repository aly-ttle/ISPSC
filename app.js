const accounts = {};

let currentUser = null;

const state = {
  attendance: 0,
  attendanceRecorded: false,
  totalHours: 0,
  daysPresent: 0,
  daysAbsent: 0,
  activeModal: null,
  tasks: [],
  journals: [],
  reports: [],
  attendanceLogs: [],
  activities: [],
  requirements: [
    {
      name: "Memorandum of Agreement",
      meta: "Required document",
      status: "Not submitted",
    },
    {
      name: "Parent Consent Form",
      meta: "Required document",
      status: "Not submitted",
    },
    {
      name: "Weekly Accomplishment Report",
      meta: "PDF or DOCX",
      status: "Not submitted",
    },
    {
      name: "Medical Clearance Renewal",
      meta: "Upload current copy",
      status: "Not submitted",
    },
  ],
  application: null,
  supervisorData: {
    students: [],
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
  if (!currentUser) return;
  const view = views[name] || views.overview;
  const activeItem = document.querySelector(`.nav-item[data-view="${name}"]`);
  breadcrumb.textContent = activeItem?.dataset.label || view.label;
  container.innerHTML =
    currentUser.roleKey !== "student" && name !== "overview"
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
  if (!currentUser) return "";
  const role = currentUser.roleKey;
  const roleName = currentUser.role;

  if (role === "supervisor") {
    return renderSupervisorView(view);
  }

  const data = {
    adviser: {
      application: [
        "Manage OJT students",
        "Review student applications and placement details.",
        "0 applications need review",
        "Review application",
        "review",
      ],
      requirements: [
        "Review requirements",
        "Approve or return student document submissions.",
        "0 documents are awaiting review",
        "Review documents",
        "review",
      ],
      tasks: [
        "Assign OJT students",
        "Monitor active advisees and their assigned workload.",
        "0 students need task assignments",
        "Assign task",
        "assign",
      ],
      attendance: [
        "Monitor attendance",
        "Review attendance exceptions for your advisees.",
        "0 attendance records need review",
        "Review attendance",
        "review",
      ],
      reports: [
        "Generate reports",
        "Prepare adviser summaries for the practicum office.",
        "0 reports submitted this week",
        "Generate report",
        "report",
      ],
      evaluation: [
        "Evaluate students",
        "Record adviser evaluations for active placements.",
        "0 evaluations are due this month",
        "Record evaluation",
        "evaluation",
      ],
    },
    admin: {
      application: [
        "Manage user accounts",
        "Manage students, advisers, supervisors, and their access.",
        `${Object.keys(accounts).length} active accounts`,
        "Add user",
        "user",
      ],
      requirements: [
        "Manage requirements",
        "Maintain the documents required for the practicum program.",
        `${state.requirements.length} requirement types are active`,
        "Add requirement",
        "requirement",
      ],
      attendance: [
        "Manage practicum period",
        "Review campus-wide practicum attendance and periods.",
        "No active practicum period scheduled",
        "Manage period",
        "period",
      ],
      feedback: [
        "Manage announcements",
        "Publish program announcements for the Tagudin campus.",
        "0 announcements scheduled",
        "Create announcement",
        "announcement",
      ],
    },
  }[role]?.[view];

  if (!data)
    return `<div class="page">${pageIntro(roleName, "Page unavailable", "This area is not available for your current role.")}</div>`;

  const [title, copy, summary, action, modal] = data;
  return `<div class="page">${pageIntro(roleName, title, copy, `<button class="primary-button" data-modal="${modal}">${action} <span>→</span></button>`)}<section class="hero-strip"><div><h2>${summary}</h2><p>Use the action below to manage the practicum workflow.</p></div><div class="hero-stat"><strong>00</strong><span>items</span></div></section><section class="panel"><div class="panel-header"><div><h3>${title}</h3><p>Current records for ISPSC Tagudin Campus</p></div><button class="text-button" data-toast="List refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Details</th><th>Status</th><th>Action</th></tr></thead><tbody><tr><td colspan="4" style="text-align:center;padding:28px;color:var(--muted)">No records found. Click &quot;${action}&quot; above to create a new entry.</td></tr></tbody></table></div></section></div>`;
}

function renderSupervisorView(view) {
  const students = state.supervisorData.students;
  const count = students.length;

  switch (view) {
    case "application":
      return `<div class="page">${pageIntro("Department Trainees", "Assigned OJT students", "View placement agreements and company details for students in your department.", '<button class="primary-button" data-modal="placement">View placement <span>→</span></button>')}<section class="hero-strip"><div><h2>${count} student${count === 1 ? "" : "s"} assigned to your department</h2><p>Review placement details and mentor assignments.</p></div><div class="hero-stat"><strong>${count < 10 ? "0" + count : count}</strong><span>assigned</span></div></section><section class="panel"><div class="panel-header"><div><h3>Assigned students & placements</h3><p>Active trainees in your department</p></div><button class="text-button" data-toast="Placements list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Program & Department</th><th>Host Organization</th><th>Rendered Hours</th><th>Status</th><th>Action</th></tr></thead><tbody>${
        count === 0
          ? '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No assigned students found in your department roster.</td></tr>'
          : students
              .map(
                (s) =>
                  `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.program)} · ${escapeHtml(s.department)}</td><td>${escapeHtml(s.company)}</td><td>${escapeHtml(s.hours)}</td><td><span class="status ${s.status === "Active" ? "status-green" : "status-yellow"}">${escapeHtml(s.status)}</span></td><td><button class="text-button" data-modal="placement" data-student="${escapeHtml(s.name)}">View placement →</button></td></tr>`,
              )
              .join("")
      }</tbody></table></div></section></div>`;

    case "tasks":
      return `<div class="page">${pageIntro("Workload management", "Assign tasks", "Create, assign, and track work for your assigned OJT students.", '<button class="primary-button" data-modal="assign">Assign task <span>+</span></button>')}<section class="hero-strip"><div><h2>${count} active student assignment${count === 1 ? "" : "s"}</h2><p>Keep your department trainees aligned with deliverables and deadlines.</p></div><div class="hero-stat"><strong>${count < 10 ? "0" + count : count}</strong><span>open tasks</span></div></section><section class="panel"><div class="panel-header"><div><h3>Student task assignments</h3><p>Assigned work for OJT students</p></div><button class="text-button" data-toast="Tasks list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Assigned Task</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${
        count === 0
          ? '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">No tasks currently assigned to students.</td></tr>'
          : students
              .map(
                (s) =>
                  `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.department)}</small></td><td>${escapeHtml(s.taskTitle || "No task assigned")}</td><td>${escapeHtml(s.taskDue || "—")}</td><td><span class="status ${s.taskStatus === "In progress" ? "status-blue" : "status-yellow"}">${escapeHtml(s.taskStatus || "Open")}</span></td><td><button class="text-button" data-modal="assign" data-student="${escapeHtml(s.name)}">Assign task →</button></td></tr>`,
              )
              .join("")
      }</tbody></table></div></section></div>`;

    case "attendance":
      return `<div class="page">${pageIntro("Time & attendance", "Manage attendance", "Review and verify the daily attendance logs of your assigned students.", '<button class="primary-button" data-modal="attendance_review">Review attendance <span>→</span></button>')}<section class="hero-strip"><div><h2>${count} student log${count === 1 ? "" : "s"} tracked</h2><p>Verify time logs and approve daily check-ins for practicum credits.</p></div><div class="hero-stat"><strong>${count > 0 ? "100%" : "0%"}</strong><span>attendance</span></div></section><section class="panel"><div class="panel-header"><div><h3>Daily attendance records</h3><p>Recent attendance for ISPSC Tagudin students</p></div><button class="text-button" data-toast="Attendance list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Date</th><th>Schedule & Time</th><th>Status</th><th>Action</th></tr></thead><tbody>${
        count === 0
          ? '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">No student attendance records logged yet.</td></tr>'
          : students
              .map(
                (s) =>
                  `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.department)}</small></td><td>${escapeHtml(s.attendanceDate || "—")}</td><td>${escapeHtml(s.attendanceTimes || "—")}</td><td><span class="status ${s.attendanceStatus === "Present" ? "status-green" : "status-yellow"}">${escapeHtml(s.attendanceStatus || "Pending")}</span></td><td><button class="text-button" data-modal="attendance_review" data-student="${escapeHtml(s.name)}">Review attendance →</button></td></tr>`,
              )
              .join("")
      }</tbody></table></div></section></div>`;

    case "journal":
      return `<div class="page">${pageIntro("Practicum logs", "Review journals", "Review and approve recent student journal entries and reflections.", '<button class="primary-button" data-modal="journal_review">Review entries <span>→</span></button>')}<section class="hero-strip"><div><h2>${count} journal log${count === 1 ? "" : "s"} tracked</h2><p>Check student daily reflections, tasks accomplished, and lessons learned.</p></div><div class="hero-stat"><strong>${count < 10 ? "0" + count : count}</strong><span>entries</span></div></section><section class="panel"><div class="panel-header"><div><h3>Submitted journal reflections</h3><p>Recent learning logs awaiting supervisor sign-off</p></div><button class="text-button" data-toast="Journal list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Journal Entry</th><th>Submitted Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${
        count === 0
          ? '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">No student journal entries submitted yet.</td></tr>'
          : students
              .map(
                (s) =>
                  `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.department)}</small></td><td>${escapeHtml(s.journalTask || "Daily reflection")}</td><td>${escapeHtml(s.journalDate || "—")}</td><td><span class="status ${s.journalStatus === "Approved" ? "status-green" : "status-yellow"}">${escapeHtml(s.journalStatus || "Awaiting review")}</span></td><td><button class="text-button" data-modal="journal_review" data-student="${escapeHtml(s.name)}">Review entries →</button></td></tr>`,
              )
              .join("")
      }</tbody></table></div></section></div>`;

    case "feedback":
      return `<div class="page">${pageIntro("Mentorship & guidance", "Provide feedback", "Share numerical performance ratings (1–100) and supervisor comments with your students.", '<button class="primary-button" data-modal="feedback">Provide feedback <span>+</span></button>')}<section class="hero-strip"><div><h2>${count} assigned student${count === 1 ? "" : "s"}</h2><p>Help your trainees grow by giving actionable comments and performance scores.</p></div><div class="hero-stat"><strong>${count > 0 ? "—" : "0"}</strong><span>avg rating</span></div></section><section class="panel"><div class="panel-header"><div><h3>Student feedback & guidance</h3><p>Numerical ratings (1–100) and comments given to students</p></div><button class="text-button" data-toast="Feedback list refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Department</th><th>Latest Rating (1–100)</th><th>Supervisor Comments</th><th>Action</th></tr></thead><tbody>${
        count === 0
          ? '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">No student feedback recorded yet.</td></tr>'
          : students
              .map(
                (s) =>
                  `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.department)}</td><td><span class="score-badge">${escapeHtml(s.feedbackRating || "—")} / 100</span></td><td style="max-width:320px;line-height:1.5;color:#4f5e65">${s.feedbackNotes ? `“${escapeHtml(s.feedbackNotes)}”` : "No comments entered."}</td><td><button class="text-button" data-modal="feedback" data-student="${escapeHtml(s.name)}">Provide feedback →</button></td></tr>`,
              )
              .join("")
      }</tbody></table></div></section></div>`;

    case "evaluation":
      return `<div class="page">${pageIntro("Performance appraisal", "Evaluate OJT students", "Complete workplace evaluations with numerical ratings from 1–100 and detailed supervisor comments.", '<button class="primary-button" data-modal="evaluation">Evaluate OJT students <span>+</span></button>')}<section class="hero-strip"><div><h2>${count} student evaluation${count === 1 ? "" : "s"} tracked</h2><p>Assess skills, professionalism, and render ratings from 1 to 100 with comprehensive feedback.</p></div><div class="hero-stat"><strong>${count > 0 ? "—" : "0"}</strong><span>score</span></div></section><section class="panel"><div class="panel-header"><div><h3>OJT Student Workplace Evaluations</h3><p>Scored on a 1–100 numerical rating scale with supervisor comments</p></div><button class="text-button" data-toast="Evaluations refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Department</th><th>Evaluation Period</th><th>Rating (1–100)</th><th>Supervisor Evaluation Comments</th><th>Action</th></tr></thead><tbody>${
        count === 0
          ? '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No student evaluations recorded yet.</td></tr>'
          : students
              .map(
                (s) =>
                  `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.program)}</small></td><td>${escapeHtml(s.department)}</td><td>Midterm evaluation</td><td><span class="score-badge">${escapeHtml(s.evalRating || "—")} / 100</span></td><td style="max-width:300px;line-height:1.5;color:#4f5e65">${s.evalComments ? `“${escapeHtml(s.evalComments)}”` : "No evaluation comments entered."}</td><td><button class="text-button" data-modal="evaluation" data-student="${escapeHtml(s.name)}">Evaluate OJT students →</button></td></tr>`,
              )
              .join("")
      }</tbody></table></div></section></div>`;

    case "reports":
      return `<div class="page">${pageIntro("Documentation review", "Accomplishment reports", "Review and approve weekly accomplishment reports submitted by your trainees.", '<button class="primary-button" data-modal="review">Review reports <span>→</span></button>')}<section class="hero-strip"><div><h2>${count} student report${count === 1 ? "" : "s"} tracked</h2><p>Verify completed hours and sign off on weekly accomplishments.</p></div><div class="hero-stat"><strong>${count < 10 ? "0" + count : count}</strong><span>reports</span></div></section><section class="panel"><div class="panel-header"><div><h3>Submitted accomplishment reports</h3><p>Weekly documentation for ISPSC Tagudin Campus</p></div><button class="text-button" data-toast="Reports refreshed.">Refresh</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Report Title</th><th>Period</th><th>Status</th><th>Action</th></tr></thead><tbody>${
        count === 0
          ? '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">No accomplishment reports submitted yet.</td></tr>'
          : students
              .map(
                (s) =>
                  `<tr><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(s.reportTitle || "Accomplishment report")}</td><td>${escapeHtml(s.reportPeriod || "—")}</td><td><span class="status ${s.reportStatus === "Approved" ? "status-green" : "status-yellow"}">${escapeHtml(s.reportStatus || "Pending")}</span></td><td><button class="text-button" data-modal="review" data-student="${escapeHtml(s.name)}">Review report →</button></td></tr>`,
              )
              .join("")
      }</tbody></table></div></section></div>`;

    default:
      return `<div class="page">${pageIntro("Department Supervisor", "Overview", "Welcome to your supervisor dashboard.")}</div>`;
  }
}

function renderOverview() {
  if (!currentUser) return "";
  if (currentUser.roleKey !== "student")
    return renderRoleOverview(currentUser.roleKey);

  const approvedReqs = state.requirements.filter(
    (r) => r.status === "Approved",
  ).length;
  const totalReqs = state.requirements.length;
  const openTasks = state.tasks.filter((t) => !t.done).length;
  const progressPercent = Math.min(
    100,
    Math.round((state.totalHours / 480) * 100),
  );

  return `<div class="page">${pageIntro("Practicum Portal · ISPSC Tagudin Campus", `Good day, ${escapeHtml(currentUser.name)}.`, "Here is an overview of your practicum workspace.", '<span class="date-chip">AY 2025–2026</span>')}<section class="hero-strip"><div><h2>Welcome to your OJT dashboard.</h2><p>Track your requirements, attendance, assigned tasks, and journals in real-time.</p></div><div class="hero-stat"><strong>${progressPercent}%</strong><span>progress</span></div></section><div class="stats-grid"><div class="stat-card"><div class="stat-icon icon-green">◷</div><strong>${state.attendance}%</strong><span>Attendance rate</span></div><div class="stat-card"><div class="stat-icon icon-coral">✓</div><strong>${approvedReqs} / ${totalReqs}</strong><span>Requirements approved</span></div><div class="stat-card"><div class="stat-icon icon-blue">≡</div><strong>${openTasks < 10 ? "0" + openTasks : openTasks}</strong><span>Tasks in progress</span></div><div class="stat-card"><div class="stat-icon icon-gold">☆</div><strong>—</strong><span>Latest evaluation</span></div></div><div class="section-heading"><h2>Quick actions</h2><button class="text-button" data-view-link="application">View application →</button></div><div class="quick-actions"><button class="quick-action" data-view-link="attendance"><span class="action-icon">◷</span><b>Record attendance</b><span>Log today's time</span></button><button class="quick-action" data-view-link="journal"><span class="action-icon">✎</span><b>Write in journal</b><span>Capture reflections</span></button><button class="quick-action" data-view-link="requirements"><span class="action-icon">↑</span><b>Submit requirement</b><span>Upload documents</span></button></div><div class="dashboard-grid"><section class="panel"><div class="panel-header"><div><h3>Practicum progress</h3><p>${escapeHtml(currentUser.department || "Practicum Program")} · 480 total hours</p></div><button class="text-button" data-view-link="reports">View reports</button></div><div class="progress-wrap"><div class="progress-ring" style="background: conic-gradient(var(--lime-dark) 0 ${progressPercent}%, #edf1eb ${progressPercent}% 100%);"><strong>${progressPercent}%</strong></div><div class="progress-detail"><h4>${state.totalHours} hours completed</h4><p>You have ${Math.max(0, 480 - state.totalHours)} hours remaining to complete your 480-hour practicum requirement.</p><div class="progress-bar"><i style="width:${progressPercent}%"></i></div><small>Practicum Period: AY 2025–2026</small></div></div></section><section class="panel"><div class="panel-header"><div><h3>Recent activity</h3><p>Your latest updates</p></div></div><ul class="activity-list">${
    state.activities.length === 0
      ? '<li style="color:var(--muted);padding:14px 0">No recent activity recorded yet.</li>'
      : state.activities
          .map(
            (act) =>
              `<li><span class="activity-dot">${act.icon}</span><div><strong>${escapeHtml(act.title)}</strong><small>${escapeHtml(act.time)}</small></div></li>`,
          )
          .join("")
  }</ul></section></div></div>`;
}

function renderRoleOverview(role) {
  if (!currentUser) return "";
  if (role === "supervisor") {
    const students = state.supervisorData.students;
    const count = students.length;
    return `<div class="page">${pageIntro("Supervisor workspace", `Good day, ${escapeHtml(currentUser.name)}.`, "Monitor assigned trainees, record numerical ratings (1–100), and review student submissions.", '<span class="date-chip">ISPSC Tagudin Campus</span>')}<section class="hero-strip"><div><h2>Supervisor Department Roster</h2><p>${count} assigned student${count === 1 ? "" : "s"} currently registered.</p></div><div class="hero-stat"><strong>${count < 10 ? "0" + count : count}</strong><span>assigned</span></div></section><div class="stats-grid"><div class="stat-card"><div class="stat-icon icon-green">◷</div><strong>${count > 0 ? "100%" : "0%"}</strong><span>Team attendance</span></div><div class="stat-card"><div class="stat-icon icon-blue">≡</div><strong>00</strong><span>Open tasks</span></div><div class="stat-card"><div class="stat-icon icon-coral">✓</div><strong>00</strong><span>Reports reviewed</span></div><div class="stat-card"><div class="stat-icon icon-gold">☆</div><strong>—</strong><span>Average rating</span></div></div><div class="section-heading"><h2>Quick actions</h2></div><div class="quick-actions"><button class="quick-action" data-view-link="tasks"><span class="action-icon">≡</span><b>Assign task</b><span>Assign work</span></button><button class="quick-action" data-view-link="attendance"><span class="action-icon">◷</span><b>Review attendance</b><span>Time logs</span></button><button class="quick-action" data-view-link="feedback"><span class="action-icon">♡</span><b>Provide feedback</b><span>Score & comments</span></button><button class="quick-action" data-view-link="evaluation"><span class="action-icon">☆</span><b>Evaluate OJT students</b><span>1–100 scale</span></button></div><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h3>Assigned OJT students</h3><p>Department placement overview & direct quick actions</p></div><button class="text-button" data-view-link="application">View all placements →</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Student name</th><th>Placement Department</th><th>Progress</th><th>Rating (1–100) & Status</th><th>Quick Actions</th></tr></thead><tbody>${
      count === 0
        ? '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">No students currently assigned. When trainees register, they will appear here.</td></tr>'
        : students
            .map(
              (s) =>
                `<tr><td><strong>${escapeHtml(s.name)}</strong><br><small style="color:var(--muted)">${escapeHtml(s.program)}</small></td><td>${escapeHtml(s.department)}</td><td>${escapeHtml(s.progress || "0%")}</td><td><span class="score-badge">${escapeHtml(s.evalRating || "—")} / 100</span> &nbsp;<span class="status ${s.status === "Active" ? "status-green" : "status-yellow"}">${escapeHtml(s.status || "Active")}</span></td><td><div class="table-action-group"><button class="text-button" data-modal="evaluation" data-student="${escapeHtml(s.name)}">Evaluate →</button><button class="text-button" data-modal="feedback" data-student="${escapeHtml(s.name)}">Feedback →</button><button class="text-button" data-modal="assign" data-student="${escapeHtml(s.name)}">Assign task →</button><button class="text-button" data-modal="placement" data-student="${escapeHtml(s.name)}">Placement →</button></div></td></tr>`,
            )
            .join("")
    }</tbody></table></div></section></div>`;
  }

  const roleData = {
    adviser: {
      eyebrow: "Adviser workspace",
      title: `Good day, ${currentUser.name}.`,
      copy: "Review student applications and help every trainee stay on track.",
      headline: "OJT Faculty Coordination",
      subhead: "Monitor student requirements, attendance, and evaluation status.",
      value: "00",
      valueLabel: "active students",
      stats: [
        ["◷", "0%", "Average attendance"],
        ["✓", "00", "Pending reviews"],
        ["≡", "00", "Reports this week"],
        ["☆", "—", "Average evaluation"],
      ],
      actions: [
        ["application", "♟", "Review applications", "0 waiting for review"],
        ["requirements", "✓", "Review requirements", "0 submissions pending"],
        ["reports", "▤", "Generate reports", "View adviser reports"],
      ],
      panelTitle: "Student progress",
      panelCopy: "Active trainees across your assigned departments",
    },
    admin: {
      eyebrow: "Administrator workspace",
      title: `Good day, ${currentUser.name}.`,
      copy: "Manage accounts, practicum requirements, and campus-wide records.",
      headline: "Centralized Practicum Administration",
      subhead: "Configure user permissions, periods, and official requirements.",
      value: `${Object.keys(accounts).length < 10 ? "0" + Object.keys(accounts).length : Object.keys(accounts).length}`,
      valueLabel: "registered accounts",
      stats: [
        ["♟", "04", "User roles"],
        ["▤", "05", "Departments"],
        ["◷", "100%", "System uptime"],
        ["▤", "00", "Reports generated"],
      ],
      actions: [
        ["application", "♟", "Manage user accounts", "Active portal users"],
        ["requirements", "✓", "Manage requirements", "Practicum documents"],
      ],
      panelTitle: "Registered User Roles",
      panelCopy: "ISPSC Tagudin Campus Portal Accounts",
    },
  }[role];

  return `<div class="page">${pageIntro(roleData.eyebrow, roleData.title, roleData.copy, '<span class="date-chip">ISPSC Tagudin Campus</span>')}<section class="hero-strip"><div><h2>${roleData.headline}</h2><p>${roleData.subhead}</p></div><div class="hero-stat"><strong>${roleData.value}</strong><span>${roleData.valueLabel}</span></div></section><div class="stats-grid">${roleData.stats.map((stat) => `<div class="stat-card"><div class="stat-icon icon-green">${stat[0]}</div><strong>${stat[1]}</strong><span>${stat[2]}</span></div>`).join("")}</div><div class="section-heading"><h2>Quick actions</h2></div><div class="quick-actions">${roleData.actions.map((action) => `<button class="quick-action" data-view-link="${action[0]}"><span class="action-icon">${action[1]}</span><b>${action[2]}</b><span>${action[3]}</span></button>`).join("")}</div><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h3>${roleData.panelTitle}</h3><p>${roleData.panelCopy}</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>User / Entity</th><th>Role / Placement</th><th>Status</th></tr></thead><tbody>${
    role === "admin"
      ? Object.values(accounts).length === 0
        ? '<tr><td colspan="3" style="text-align:center;padding:28px;color:var(--muted)">No registered user accounts found.</td></tr>'
        : Object.values(accounts)
            .map(
              (acc) =>
                `<tr><td><strong>${escapeHtml(acc.name)}</strong><br><small style="color:var(--muted)">@${escapeHtml(acc.username)}</small></td><td>${escapeHtml(acc.role)}</td><td><span class="status status-green">Active</span></td></tr>`,
            )
            .join("")
      : '<tr><td colspan="3" style="text-align:center;padding:28px;color:var(--muted)">No advisee records found.</td></tr>'
  }</tbody></table></div></section></div>`;
}

function renderApplication() {
  const app = state.application;
  return `<div class="page">${pageIntro("Student workspace", "Practicum application", "Manage your host organization placement details and application status.", '<button class="primary-button" data-modal="application">Update application <span>→</span></button>')}<div class="detail-grid"><section class="panel"><div class="panel-header"><div><h3>Application status</h3><p>${app ? "Active placement application" : "Not yet submitted"}</p></div><span class="status ${app ? "status-green" : "status-yellow"}">${app ? "Approved" : "Pending Submission"}</span></div><dl class="info-list"><div class="info-row"><dt>Application ID</dt><dd>${app ? escapeHtml(app.id) : "—"}</dd></div><div class="info-row"><dt>Date submitted</dt><dd>${app ? escapeHtml(app.dateSubmitted) : "—"}</dd></div><div class="info-row"><dt>Placement period</dt><dd>${app ? escapeHtml(app.period) : "—"}</dd></div></dl></section><section class="panel"><div class="panel-header"><div><h3>Host organization</h3><p>Your OJT placement</p></div><span class="status ${app ? "status-blue" : "status-yellow"}">${app ? "Active" : "Unassigned"}</span></div><dl class="info-list"><div class="info-row"><dt>Company</dt><dd>${app ? escapeHtml(app.company) : "Unassigned"}</dd></div><div class="info-row"><dt>Department</dt><dd>${app ? escapeHtml(app.department) : "Unassigned"}</dd></div><div class="info-row"><dt>Supervisor</dt><dd>${app ? escapeHtml(app.supervisor) : "Unassigned"}</dd></div><div class="info-row"><dt>Office hours</dt><dd>${app ? escapeHtml(app.officeHours) : "—"}</dd></div></dl></section></div><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h3>Application timeline</h3><p>Milestones from submission to placement</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Milestone</th><th>Date</th><th>Status</th></tr></thead><tbody>${
    app
      ? '<tr><td>Application submitted</td><td>Today</td><td><span class="status status-green">Completed</span></td></tr>'
      : '<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--muted)">No application submitted yet. Click "Update application" above to submit placement details.</td></tr>'
  }</tbody></table></div></section></div>`;
}

function renderRequirements() {
  const reqs = state.requirements;
  const approvedCount = reqs.filter((r) => r.status === "Approved").length;

  return `<div class="page">${pageIntro("Document center", "Your requirements", "Submit and monitor the documents needed for practicum completion.", '<button class="primary-button" data-modal="requirement">Upload document <span>↑</span></button>')}<section class="panel"><div class="panel-header"><div><h3>Submission checklist</h3><p>${approvedCount} of ${reqs.length} requirements completed</p></div><span class="status ${approvedCount === reqs.length ? "status-green" : "status-yellow"}">${reqs.length - approvedCount} pending</span></div><div class="task-list">${reqs
    .map(
      (r) =>
        `<div class="task-row"><input class="task-check" type="checkbox" ${r.status === "Approved" ? "checked" : ""}><div><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml(r.meta)}</small></div><span class="task-due status ${r.status === "Approved" ? "status-green" : "status-yellow"}">${escapeHtml(r.status)}</span></div>`,
    )
    .join("")}</div></section></div>`;
}

function renderAttendance() {
  const attendanceAction = state.attendanceRecorded
    ? '<button class="secondary-button" disabled aria-disabled="true">Today&apos;s attendance recorded <span>✓</span></button>'
    : '<button class="primary-button" id="clockIn">Record today&apos;s attendance <span>◷</span></button>';

  return `<div class="page">${pageIntro("Time tracking", "Attendance", "A clear record of every hour rendered for your practicum.", attendanceAction)}<div class="stats-grid"><div class="stat-card"><div class="stat-icon icon-green">◷</div><strong>${state.totalHours} hrs</strong><span>Total hours rendered</span></div><div class="stat-card"><div class="stat-icon icon-blue">▤</div><strong>${state.daysPresent} days</strong><span>Days present</span></div><div class="stat-card"><div class="stat-icon icon-coral">!</div><strong>${state.daysAbsent} days</strong><span>Days absent</span></div><div class="stat-card"><div class="stat-icon icon-gold">↗</div><strong>${state.daysPresent > 0 ? (state.totalHours / state.daysPresent).toFixed(1) : "0"} hrs</strong><span>Average per day</span></div></div><section class="panel" style="margin-top:16px"><div class="panel-header"><div><h3>Attendance log</h3><p>Daily time records for ISPSC Tagudin Campus</p></div><button class="secondary-button" id="exportAttendance">Export CSV ↓</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Schedule</th><th>Time in</th><th>Time out</th><th>Total</th><th>Status</th></tr></thead><tbody>${
    state.attendanceLogs.length === 0
      ? '<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted)">No attendance records logged yet. Click "Record today\'s attendance" above to log time.</td></tr>'
      : state.attendanceLogs
          .map(
            (log) =>
              `<tr><td>${escapeHtml(log.date)}</td><td>${escapeHtml(log.schedule)}</td><td>${escapeHtml(log.timeIn)}</td><td>${escapeHtml(log.timeOut)}</td><td>${escapeHtml(log.total)}</td><td><span class="status status-green">${escapeHtml(log.status)}</span></td></tr>`,
          )
          .join("")
  }</tbody></table></div></section></div>`;
}

function renderTasks() {
  return `<div class="page">${pageIntro("Your workload", "Assigned tasks", "Stay on top of deliverables and tasks assigned by your supervisor.", '<button class="primary-button" data-modal="task">Add personal task <span>+</span></button>')}<section class="panel"><div class="panel-header"><div><h3>Active task list</h3><p>${state.tasks.length} task${state.tasks.length === 1 ? "" : "s"} tracked</p></div></div><div class="task-list">${
    state.tasks.length === 0
      ? '<div style="text-align:center;padding:32px 20px;color:var(--muted)">No tasks assigned yet. Click "Add personal task" to create one.</div>'
      : state.tasks
          .map(
            (task, i) =>
              `<label class="task-row"><input class="task-check" data-task="${i}" type="checkbox" ${task.done ? "checked" : ""}><div><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.meta || "Task")}</small></div><span class="task-due">${escapeHtml(task.due || "—")}</span></label>`,
          )
          .join("")
  }</div></section></div>`;
}

function renderJournal() {
  return `<div class="page">${pageIntro("Daily reflection", "OJT journal", "Document the tasks, lessons, and skills learned during your placement.", '<button class="primary-button" data-modal="journal">New journal entry <span>+</span></button>')}<section class="panel"><div class="panel-header"><div><h3>Journal entries</h3><p>Keep a consistent record of your practicum experience.</p></div></div><div class="task-list">${
    state.journals.length === 0
      ? '<div style="text-align:center;padding:32px 20px;color:var(--muted)">No journal entries logged yet. Click "+ New journal entry" to add your first reflection.</div>'
      : state.journals
          .map(
            (j) =>
              `<div class="task-row"><span class="activity-dot">✎</span><div><strong>${escapeHtml(j.title)}</strong><small>${escapeHtml(j.date)} · ${escapeHtml(j.hours || "8h")}</small><p style="margin:6px 0 0;font-size:12px;color:var(--muted)">${escapeHtml(j.reflection)}</p></div><span class="status ${j.status === "Approved" ? "status-green" : "status-yellow"}">${escapeHtml(j.status)}</span></div>`,
          )
          .join("")
  }</div></section></div>`;
}

function renderReports() {
  return `<div class="page">${pageIntro("Your records", "Reports & submissions", "Access your accomplishment reports and completion documents.", '<button class="primary-button" data-modal="report">Create report <span>+</span></button>')}<section class="panel"><div class="panel-header"><div><h3>Accomplishment reports</h3><p>Weekly documentation sent to your adviser</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Report</th><th>Period</th><th>Submitted</th><th>Status</th></tr></thead><tbody>${
    state.reports.length === 0
      ? '<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--muted)">No accomplishment reports submitted yet. Click "Create report" to add a draft.</td></tr>'
      : state.reports
          .map(
            (rep) =>
              `<tr><td><strong>${escapeHtml(rep.title)}</strong></td><td>${escapeHtml(rep.period || "—")}</td><td>${escapeHtml(rep.submitted)}</td><td><span class="status ${rep.status === "Approved" ? "status-green" : "status-yellow"}">${escapeHtml(rep.status)}</span></td></tr>`,
          )
          .join("")
  }</tbody></table></div></section></div>`;
}

function renderFeedback() {
  return `<div class="page">${pageIntro("Mentorship", "Feedback & guidance", "See numerical performance ratings (1–100) and comments from your supervisor.")}<section class="panel"><div class="panel-header"><div><h3>Supervisor feedback & guidance</h3><p>Official remarks from your host organization supervisor</p></div></div><div style="text-align:center;padding:36px 20px;color:var(--muted)">No feedback notes or performance ratings received yet.</div></section></div>`;
}

function renderEvaluation() {
  return `<div class="page">${pageIntro("Performance appraisal", "Evaluation results", "Review workplace skill evaluations scored on a numerical 1–100 rating scale.")}<section class="panel"><div class="panel-header"><div><h3>Workplace evaluation appraisal</h3><p>Completed by host training supervisor</p></div></div><div style="text-align:center;padding:36px 20px;color:var(--muted)">No workplace evaluation results have been recorded yet.</div></section></div>`;
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
      const todayStr = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
      state.attendanceRecorded = true;
      state.totalHours += 8;
      state.daysPresent += 1;
      state.attendance = 100;
      state.attendanceLogs.unshift({
        date: todayStr,
        schedule: "Regular",
        timeIn: "8:00 AM",
        timeOut: "5:00 PM",
        total: "8h 00m",
        status: "Present",
      });
      state.activities.unshift({
        icon: "◷",
        title: "Recorded daily attendance",
        time: "Just now",
      });
      showToast("Today's attendance has been recorded.");
      renderView("attendance");
    });

  const exportButton = document.getElementById("exportAttendance");
  if (exportButton) exportButton.addEventListener("click", exportAttendance);

  document.querySelectorAll("[data-task]").forEach((input) =>
    input.addEventListener("change", () => {
      if (state.tasks[input.dataset.task]) {
        state.tasks[input.dataset.task].done = input.checked;
        showToast(
          input.checked
            ? "Task marked complete."
            : "Task moved back to your list.",
        );
      }
    }),
  );
}

function getStudentOptions() {
  if (state.supervisorData.students.length === 0) {
    return '<option value="" disabled>No students registered yet</option>';
  }
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
      '<label>Host organization<input name="organization" required></label><label>Placement department<input name="department" required></label><label>Supervisor name<input name="supervisor" required></label><label>Supervisor email<input name="email" type="email" required></label>',
    ],
    placement: [
      studentName ? `Placement details: ${studentName}` : "View placement",
      "Update placement",
      '<label>Host organization<input name="organization" required></label><label>Department<input name="department" required></label><label>Supervisor notes<textarea name="notes" rows="3"></textarea></label>',
    ],
    requirement: [
      "Upload requirement",
      "Upload document",
      '<label>Requirement<select name="requirement" required><option value="">Select a requirement</option><option>Memorandum of Agreement</option><option>Parent Consent Form</option><option>Weekly Accomplishment Report</option><option>Medical Clearance Renewal</option></select></label><label>Document<input name="document" type="file" accept=".pdf,.doc,.docx" required></label>',
    ],
    task: [
      "Add personal task",
      "Add task",
      '<label>Task title<input name="title" required></label><label>Due date<input name="due" type="date" required></label>',
    ],
    journal: [
      "New journal entry",
      "Save journal entry",
      '<label>Entry title<input name="title" required></label><label>Reflection<textarea name="reflection" rows="4" required></textarea></label>',
    ],
    report: [
      "Create accomplishment report",
      "Create report",
      '<label>Report title (e.g. Week 1)<input name="week" required></label><label>Summary of accomplishments<textarea name="summary" rows="4" required></textarea></label>',
    ],
    review: [
      studentName ? `Review submission: ${studentName}` : "Review submission",
      "Save review",
      '<label>Decision<select name="decision" required><option value="Approved">Approve</option><option value="Revision">Return for revision</option></select></label><label>Comments<textarea name="comments" rows="3" required></textarea></label>',
    ],
    journal_review: [
      studentName ? `Review journal: ${studentName}` : "Review journal entry",
      "Save journal review",
      '<label>Review decision<select name="decision" required><option value="Approved">Approve entry</option><option value="Revision">Return for revision</option></select></label><label>Supervisor comments & feedback<textarea name="comments" rows="3" required></textarea></label>',
    ],
    attendance_review: [
      studentName ? `Review attendance: ${studentName}` : "Review attendance",
      "Save attendance review",
      '<label>Attendance decision<select name="decision" required><option value="Approved">Approve attendance (Present)</option><option value="Excused">Mark as Excused</option><option value="Revision">Return for correction</option></select></label><label>Supervisor remarks<textarea name="comments" rows="3"></textarea></label>',
    ],
    assign: [
      studentName ? `Assign task to ${studentName}` : "Assign task",
      "Assign task",
      '<label>Task title<input name="title" required></label><label>Due date<input name="due" type="date" required></label><label>Task details & instructions<textarea name="details" rows="3"></textarea></label>',
    ],
    feedback: [
      studentName ? `Provide feedback: ${studentName}` : "Provide feedback",
      "Send feedback",
      '<label>Performance rating (1–100)<input name="rating" type="number" min="1" max="100" step="1" required></label><label>Supervisor feedback & comments<textarea name="feedback" rows="4" required></textarea></label>',
    ],
    evaluation: [
      studentName ? `Evaluate: ${studentName}` : "Evaluate OJT student",
      "Save evaluation",
      '<label>Rating (1–100)<input name="rating" type="number" min="1" max="100" step="1" required></label><label>Supervisor comments<textarea name="comment" rows="4" required></textarea></label>',
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
  if (state.attendanceLogs.length === 0) {
    showToast("No attendance logs to export.");
    return;
  }
  const rows = [
    ["Date", "Schedule", "Time in", "Time out", "Total", "Status"],
    ...state.attendanceLogs.map((log) => [
      log.date,
      log.schedule,
      log.timeIn,
      log.timeOut,
      log.total,
      log.status,
    ]),
  ];
  const blob = new Blob(
    [rows.map((row) => row.map((value) => `"${value}"`).join(",")).join("\n")],
    { type: "text/csv" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "attendance-records.csv";
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

  if (action === "application") {
    state.application = {
      id: `OJT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      dateSubmitted: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      period: "AY 2025–2026",
      company: formData.get("organization") || "Unassigned",
      department: formData.get("department") || "Unassigned",
      supervisor: formData.get("supervisor") || "Unassigned",
      officeHours: "8:00 AM – 5:00 PM",
    };
    state.activities.unshift({
      icon: "♟",
      title: "Submitted placement application",
      time: "Just now",
    });
  } else if (action === "task") {
    state.tasks.unshift({
      title: formData.get("title"),
      meta: "Personal task",
      due: formData.get("due"),
      done: false,
    });
    state.activities.unshift({
      icon: "≡",
      title: `Added task: ${formData.get("title")}`,
      time: "Just now",
    });
  } else if (action === "journal") {
    state.journals.unshift({
      title: formData.get("title"),
      reflection: formData.get("reflection"),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      hours: "8 hours",
      status: "Submitted",
    });
    state.activities.unshift({
      icon: "✎",
      title: "Submitted journal entry",
      time: "Just now",
    });
  } else if (action === "report") {
    state.reports.unshift({
      title: formData.get("week"),
      period: "Current period",
      submitted: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: "Draft",
    });
    state.activities.unshift({
      icon: "▤",
      title: `Created report: ${formData.get("week")}`,
      time: "Just now",
    });
  } else if (action === "requirement") {
    const reqName = formData.get("requirement");
    const foundReq = state.requirements.find((r) => r.name === reqName);
    if (foundReq) {
      foundReq.status = "Approved";
    }
    state.activities.unshift({
      icon: "✓",
      title: `Uploaded document: ${reqName}`,
      time: "Just now",
    });
  }

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
      ? `Evaluation score ${rating}/100 and comments saved${student ? ` for ${student}` : ""}.`
      : `Evaluation saved successfully${student ? ` for ${student}` : ""}.`;
  } else if (action === "feedback") {
    toastMessage = rating
      ? `Feedback with rating ${rating}/100 submitted${student ? ` for ${student}` : ""}.`
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
  } else if (action === "application") {
    toastMessage = "Application details submitted successfully.";
  }

  showToast(toastMessage);

  const activeNav = document.querySelector(".nav-item.active");
  if (activeNav) {
    renderView(activeNav.dataset.view);
  } else {
    renderView();
  }
});

document
  .getElementById("notificationButton")
  .addEventListener("click", () => showToast("No unread notifications."));

document
  .getElementById("topProfileButton")
  .addEventListener("click", () => {
    if (currentUser) {
      showToast(`${currentUser.name} · ${currentUser.role}`);
    }
  });

document
  .getElementById("sidebarProfileButton")
  .addEventListener("click", () => {
    if (currentUser) {
      showToast(`${currentUser.name} · ${currentUser.role}`);
    }
  });

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
          `<button class="nav-item ${index === 0 ? "active" : ""}" data-view="${item[0]}"><span class="nav-icon">${item[1]}</span>${item[2]}</button>`,
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
  setRoleNavigation(account.roleKey);
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appShell").classList.remove("hidden");
  renderView();
}

function showLogin() {
  currentUser = null;
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
    roleKey,
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
      company: "Host Training Establishment",
      hours: "0 / 480 hrs",
      progress: "0%",
      status: "Active",
      evalStatus: "Pending",
      evalRating: 0,
      evalComments: "",
      feedbackStatus: "Pending",
      feedbackRating: 0,
      feedbackNotes: "",
      journalTask: "",
      journalDate: "—",
      journalStatus: "Pending",
      attendanceDate: "—",
      attendanceTimes: "—",
      attendanceStatus: "Pending",
      taskTitle: "",
      taskDue: "—",
      taskStatus: "Open",
      reportTitle: "",
      reportPeriod: "—",
      reportStatus: "Pending",
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

// Initial state: Start on the clean authentication screen
showLogin();
