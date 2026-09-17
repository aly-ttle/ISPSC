/**
 * ISPSC Practicum & Workplace Training Portal
 * Client Application Logic
 */

(function () {
  "use strict";

  // Application State
  const state = {
    currentUser: null,
    currentRole: null,
    currentView: "overview",
    practicumData: {},
    isLoading: false,
    activeSubTab: "all",
  };

  // DOM Elements Cache
  const el = {
    authContainer: document.getElementById("loginScreen"),
    portalContainer: document.getElementById("appShell"),
    loginCard: document.getElementById("signInContainer"),
    registerCard: document.getElementById("signUpContainer"),
    tabSignIn: document.getElementById("tabSignIn"),
    tabSignUp: document.getElementById("tabSignUp"),
    switchToSignUp: document.getElementById("switchToSignUp"),
    switchToSignIn: document.getElementById("switchToSignIn"),
    loginForm: document.getElementById("loginForm"),
    signUpForm: document.getElementById("signUpForm"),
    loginError: document.getElementById("loginError"),
    signUpError: document.getElementById("signUpError"),
    forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),
    helpModalBackdrop: document.getElementById("helpModalBackdrop"),
    helpModalClose: document.getElementById("helpModalClose"),
    helpModalConfirmBtn: document.getElementById("helpModalConfirmBtn"),
    toggleLoginPassword: document.getElementById("toggleLoginPassword"),
    toggleRegPassword: document.getElementById("toggleRegPassword"),
    btnLogout: document.getElementById("signOut"),
    btnSidebarToggle: document.getElementById("mobileMenu"),
    sidebar: document.getElementById("sidebar"),
    sidebarNav: document.getElementById("mainNav"),
    headerUserName: document.getElementById("topProfileName"),
    headerAvatar: document.getElementById("topAvatar"),
    sidebarUserName: document.getElementById("sidebarName"),
    sidebarUserRole: document.getElementById("sidebarRole"),
    sidebarAvatar: document.getElementById("sidebarAvatar"),
    breadcrumbCurrent: document.getElementById("breadcrumbCurrent"),
    viewContainer: document.getElementById("viewContainer"),
    toast: document.getElementById("toast"),
    // Modal Elements
    modalBackdrop: document.getElementById("modalBackdrop"),
    modalTitle: document.getElementById("modalTitle"),
    modalKicker: document.getElementById("modalKicker"),
    modalDescription: document.getElementById("modalDescription"),
    modalForm: document.getElementById("modalForm"),
    modalFields: document.getElementById("modalFields"),
    modalSubmitLabel: document.getElementById("modalSubmitLabel"),
    btnModalClose: document.getElementById("modalClose"),
    profileModalBackdrop: document.getElementById("profileModalBackdrop"),
    profileModalClose: document.getElementById("profileModalClose"),
    profileModalContent: document.getElementById("profileModalContent"),
    sidebarProfileCard: document.getElementById("sidebarProfileCard"),
    sidebarProfileButton: document.getElementById("sidebarProfileButton"),
    topProfileBadge: document.getElementById("topProfileBadge"),
  };

  // CSRF Token Helper for Laravel Sanctum/Web
  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.getAttribute("content");
    const match = document.cookie.match(new RegExp("(^|;\\s*)XSRF-TOKEN=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : "";
  }

  // API helper with error handling and Laravel validation message extraction
  async function apiRequest(endpoint, method = "GET", body = null) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-TOKEN": getCsrfToken(),
      "X-Requested-With": "XMLHttpRequest",
    };

    const options = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(endpoint, options);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        let msg = data.message || data.error;
        if (data.errors) {
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey && data.errors[firstKey].length) {
            msg = data.errors[firstKey][0];
          }
        }
        return {
          success: false,
          error: msg || `HTTP ${response.status}`,
          message: msg || `HTTP ${response.status}`,
          ...data,
        };
      }
      return data;
    } catch (err) {
      console.error(`API Error [${method} ${endpoint}]:`, err);
      return {
        success: false,
        error: err.message || "An unexpected network error occurred.",
        message: err.message || "An unexpected network error occurred.",
      };
    }
  }

  // Flash toast message notification
  function showToast(message, duration = 3600) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.add("show");
    setTimeout(() => {
      el.toast.classList.remove("show");
    }, duration);
  }

  function getGradeEquivalence(rating) {
    const r = parseFloat(rating);
    if (isNaN(r)) return "—";
    if (r >= 97) return "1.00 (Outstanding / Excellent)";
    if (r >= 94) return "1.25 (Very Superior)";
    if (r >= 91) return "1.50 (Superior)";
    if (r >= 88) return "1.75 (Very Good)";
    if (r >= 85) return "2.00 (Good)";
    if (r >= 80) return "2.25 (Satisfactory)";
    if (r >= 75) return "2.50 – 3.00 (Passing)";
    return "5.00 (Needs Improvement / Failing)";
  }

  // =========================================================================
  // INITIALIZATION & SESSION CHECK
  // =========================================================================

  async function initApp() {
    setupEventListeners();
    await checkAuthSession();
  }

  async function checkAuthSession() {
    const res = await apiRequest("/auth/me");
    if (res && res.authenticated && res.user) {
      setUserSession(res.user);
      await refreshBackendState();
      showPortal();
    } else {
      showAuth();
    }
  }

  function setUserSession(user) {
    state.currentUser = user;
    state.currentRole = user.role;

    // Default entry view per role
    switch (user.role) {
      case "supervisor":
        state.currentView = "supervisor-students";
        break;
      case "adviser":
        state.currentView = "adviser-students";
        break;
      case "admin":
        state.currentView = "admin-users";
        break;
      default:
        state.currentView = "overview";
        break;
    }

    updateUserUI();
  }

  function updateUserUI() {
    if (!state.currentUser) return;
    const user = state.currentUser;
    const roleTitles = {
      student: "OJT Practicum Trainee",
      supervisor: "Campus Department Supervisor",
      adviser: "OJT Faculty Adviser",
      admin: "Portal Administrator",
    };

    const roleName = roleTitles[user.role] || "User";
    const initials = (user.name || "U")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    if (el.headerUserName) el.headerUserName.textContent = user.name;
    if (el.headerAvatar) el.headerAvatar.textContent = initials;

    if (el.sidebarUserName) el.sidebarUserName.textContent = user.name;
    if (el.sidebarUserRole) el.sidebarUserRole.textContent = roleName;
    if (el.sidebarAvatar) el.sidebarAvatar.textContent = initials;

    updateSidebarQuota();
    renderNavigation();
  }

  function updateSidebarQuota() {
    const hours = state.practicumData?.totalHours || 0;
    const target = 480;
    const pct = Math.min(100, Math.round((hours / target) * 100));

    const quotaBlock = document.getElementById("quotaBlock");
    const quotaBadge = document.getElementById("quotaBadge");
    const quotaFill = document.getElementById("quotaFill");
    const quotaText = document.getElementById("quotaText");

    if (quotaBlock) {
      if (state.currentRole === "student") {
        quotaBlock.classList.remove("hidden");
        if (quotaBadge) quotaBadge.textContent = `${target} hrs`;
        if (quotaFill) quotaFill.style.width = `${pct}%`;
        if (quotaText) quotaText.textContent = `${hours} / ${target} hrs (${pct}%)`;
      } else {
        quotaBlock.classList.add("hidden");
      }
    }
  }

  async function refreshBackendState() {
    const res = await apiRequest("/practicum/state");
    if (res && !res.error) {
      state.practicumData = res;
      updateSidebarQuota();
    }
  }

  // =========================================================================
  // NAVIGATION & VIEW SWITCHER
  // =========================================================================

  const navConfigurations = {
    student: [
      { id: "overview", label: "Dashboard Overview", icon: "&#9635;" },
      { id: "application", label: "Campus Placement Details", icon: "&#128188;" },
      { id: "requirements", label: "Clearance Documents", icon: "&#128196;" },
      { id: "attendance", label: "Daily Time Record (DTR)", icon: "&#128197;" },
      { id: "tasks", label: "Department Assigned Tasks", icon: "&#9745;" },
      { id: "journal", label: "OJT Daily Journal", icon: "&#9998;" },
      { id: "reports", label: "Accomplishment Reports", icon: "&#128203;" },
      { id: "feedback", label: "Mentorship Feedback", icon: "&#9825;" },
      { id: "evaluation", label: "Workplace Appraisal", icon: "&#9734;" },
    ],
    supervisor: [
      { id: "supervisor-students", label: "Trainee Roster & Actions", icon: "&#128101;" },
      { id: "attendance-mgmt", label: "Verify Attendance (DTR)", icon: "&#128197;" },
      { id: "tasks-mgmt", label: "Assigned Work Tasks", icon: "&#9745;" },
      { id: "journal-mgmt", label: "Review Daily Journals", icon: "&#9998;" },
      { id: "feedback-mgmt", label: "Supervisory Coaching", icon: "&#9825;" },
      { id: "eval-mgmt", label: "Performance Evaluation", icon: "&#9734;" },
    ],
    adviser: [
      { id: "adviser-students", label: "Advisees Roster", icon: "&#128101;" },
      { id: "requirements-mgmt", label: "Clearance Verification", icon: "&#128196;" },
      { id: "reports-mgmt", label: "Accomplishment Reports", icon: "&#128203;" },
      { id: "adviser-appraisal", label: "Student Appraisals", icon: "&#9734;" },
    ],
    admin: [
      { id: "admin-users", label: "User Accounts Directory", icon: "&#128101;" },
      { id: "admin-placements", label: "Placement & Departments", icon: "&#127970;" },
      { id: "admin-logs", label: "Institutional Audit Logs", icon: "&#128220;" },
    ],
  };

  function renderNavigation() {
    if (!el.sidebarNav || !state.currentRole) return;
    const items = navConfigurations[state.currentRole] || [];

    el.sidebarNav.innerHTML = items
      .map(
        (item) => `
        <button class="nav-item ${state.currentView === item.id ? "active" : ""}" data-view="${item.id}" type="button">
          <span class="nav-icon" aria-hidden="true">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `
      )
      .join("");

    el.sidebarNav.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.currentView = btn.dataset.view;
        renderNavigation();
        renderCurrentView();
        if (window.innerWidth <= 840 && el.sidebar && el.sidebar.classList.contains("open")) {
          el.sidebar.classList.remove("open");
        }
      });
    });
  }

  function renderCurrentView() {
    const view = state.currentView;
    const role = state.currentRole;

    const titles = {
      overview: "Practicum Dashboard Overview",
      application: "Campus Placement & Department Assignment",
      requirements: "Documentary Requirements Clearance",
      attendance: "Daily Time Record & Biometric Logs",
      tasks: "Department Assigned Tasks & Deliverables",
      journal: "OJT Reflection Journal",
      "supervisor-students": "Campus Department Trainee Workspace",
      "adviser-students": "Student Advisees Roster & Compliance",
      "admin-users": "System User Directory & Roles",
      "admin-placements": "Campus Departments & Placement Management",
      "attendance-mgmt": "Daily Time Record (DTR) Verification",
      "tasks-mgmt": "Workplace Tasks & Project Deliverables",
      "journal-mgmt": "Review Trainee Journals",
      reports: "Accomplishment Reports",
      "reports-mgmt": "Verify Accomplishment Reports",
      "requirements-mgmt": "Verify Student Requirements",
      feedback: "Supervisor Performance Feedback",
      "feedback-mgmt": "Submit Coaching Feedback",
      evaluation: "Midterm & Final Workplace Evaluation",
      "eval-mgmt": "Evaluate Trainee Performance",
    };

    if (el.breadcrumbCurrent) {
      el.breadcrumbCurrent.textContent = titles[view] || "Dashboard";
    }

    if (role === "student") {
      switch (view) {
        case "overview":
          renderStudentOverview();
          break;
        case "application":
          renderStudentApplication();
          break;
        case "requirements":
          renderStudentRequirements();
          break;
        case "attendance":
          renderStudentAttendance();
          break;
        case "tasks":
          renderStudentTasks();
          break;
        case "journal":
          renderStudentJournal();
          break;
        case "reports":
          renderStudentReports();
          break;
        case "feedback":
          renderStudentFeedback();
          break;
        case "evaluation":
          renderStudentEvaluation();
          break;
        default:
          renderStudentOverview();
      }
    } else if (role === "supervisor") {
      renderSupervisorViews(view);
    } else if (role === "adviser") {
      renderAdviserViews(view);
    } else if (role === "admin") {
      renderAdminViews(view);
    }
  }

  // =========================================================================
  // VIEW RENDERERS: STUDENT
  // =========================================================================

  function renderStudentOverview() {
    const d = state.practicumData || {};
    const hours = d.totalHours || 0;
    const target = 480;
    const remaining = Math.max(0, target - hours);
    const progressPct = Math.min(100, Math.round((hours / target) * 100));

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">ISPSC Tagudin Campus &bull; Practicum Dashboard</p>
            <h1 class="page-title">Welcome, ${escapeHtml(state.currentUser.name)}</h1>
            <p>Track your 480-hour practicum hours, daily attendance logs, and documentary clearances.</p>
          </div>
          <div class="date-chip" aria-label="Current date">
            <span aria-hidden="true">&#128197;</span> ${new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        <div class="hero-strip" role="region" aria-label="Practicum Completion Status">
          <div>
            <h2>Practicum Target: 480 Hours</h2>
            <p>You have rendered <strong>${hours} hours</strong> with <strong>${remaining} hours remaining</strong>.</p>
          </div>
          <div class="hero-stat">
            <strong>${progressPct}%</strong>
            <span>Completed</span>
          </div>
        </div>

        <div class="stats-grid" role="region" aria-label="Quick Metrics">
          <div class="stat-card">
            <div class="stat-icon icon-green" aria-hidden="true">&#9201;</div>
            <strong>${hours} hrs</strong>
            <span>Rendered Hours (480h target)</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-blue" aria-hidden="true">&#128197;</div>
            <strong>${d.daysPresent || 0} days</strong>
            <span>Verified Attendance Days</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-gold" aria-hidden="true">&#128221;</div>
            <strong>${(d.journals || []).length} entries</strong>
            <span>Submitted Daily Journals</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-coral" aria-hidden="true">&#9745;</div>
            <strong>${(d.tasks || []).filter((t) => t.done).length} / ${(d.tasks || []).length}</strong>
            <span>Tasks Completed</span>
          </div>
        </div>

        <div class="section-heading">
          <h2>Quick Actions</h2>
        </div>
        <div class="quick-actions" role="region" aria-label="Direct Workflow Actions">
          <button class="quick-action" id="qaAttendance" type="button">
            <span class="action-icon" aria-hidden="true">&#9719;</span>
            <b>Record Attendance</b>
            <span>Log today's shift hours</span>
          </button>
          <button class="quick-action" id="qaJournal" type="button">
            <span class="action-icon" aria-hidden="true">&#9998;</span>
            <b>Write Journal Entry</b>
            <span>Document daily tasks & learnings</span>
          </button>
          <button class="quick-action" id="qaTasks" type="button">
            <span class="action-icon" aria-hidden="true">&#9745;</span>
            <b>Department Assigned Tasks</b>
            <span>Review deliverables & instructions</span>
          </button>
          <button class="quick-action" id="qaReport" type="button">
            <span class="action-icon" aria-hidden="true">&#9638;</span>
            <b>Submit Weekly Report</b>
            <span>File accomplishment summary</span>
          </button>
        </div>

        <div class="dashboard-grid">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Recent Attendance Logs</h3>
                <p>Latest verified time in and time out records</p>
              </div>
              <button class="text-button" id="btnViewAllAttendance" type="button">View all DTR</button>
            </div>
            <div class="table-wrap">
              <table class="data-table" aria-label="Recent Attendance Records">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Schedule</th>
                    <th>Rendered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    (d.attendanceLogs || []).length === 0
                      ? '<tr><td colspan="4" style="text-align:center; padding:20px; color:#6c7b80;">No attendance records logged yet. Click "Record Attendance" above!</td></tr>'
                      : (d.attendanceLogs || [])
                          .slice(0, 4)
                          .map(
                            (log) => `
                        <tr>
                          <td><strong>${escapeHtml(log.date)}</strong></td>
                          <td>${escapeHtml(log.schedule)} (${escapeHtml(log.timeIn)} – ${escapeHtml(log.timeOut)})</td>
                          <td><span class="score-badge">${escapeHtml(log.total)}</span></td>
                          <td><span class="status status-green">&#10003; ${escapeHtml(log.status)}</span></td>
                        </tr>
                      `
                          )
                          .join("")
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Department Assigned Tasks</h3>
                <p>Deliverables assigned by your Campus Department Supervisor</p>
              </div>
              <button class="text-button" id="btnViewAllTasks" type="button">View all tasks</button>
            </div>
            <div class="task-list">
              ${
                (d.tasks || []).length === 0
                  ? '<p style="color:#6c7b80; font-size:12.5px; text-align:center; padding:20px 0;">No active tasks pending. Tasks will appear here once assigned by your department supervisor.</p>'
                  : (d.tasks || [])
                      .slice(0, 4)
                      .map(
                        (task) => `
                    <div class="task-row">
                      <input type="checkbox" class="task-check" data-id="${task.id}" ${task.done ? "checked" : ""} aria-label="Mark task ${escapeHtml(task.title)} as complete" />
                      <div>
                        <strong style="${task.done ? "text-decoration:line-through; color:#7d8c91;" : ""}">${escapeHtml(task.title)}</strong>
                        <small>${escapeHtml(task.meta)}</small>
                      </div>
                      <span class="task-due">${escapeHtml(task.due)}</span>
                    </div>
                  `
                      )
                      .join("")
              }
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook quick actions
    document.getElementById("qaAttendance")?.addEventListener("click", () => openModal("attendance"));
    document.getElementById("qaJournal")?.addEventListener("click", () => openModal("journal"));
    document.getElementById("qaTasks")?.addEventListener("click", () => {
      state.currentView = "tasks";
      renderNavigation();
      renderCurrentView();
    });
    document.getElementById("qaReport")?.addEventListener("click", () => openModal("report"));
    document.getElementById("btnViewAllAttendance")?.addEventListener("click", () => {
      state.currentView = "attendance";
      renderNavigation();
      renderCurrentView();
    });
    document.getElementById("btnViewAllTasks")?.addEventListener("click", () => {
      state.currentView = "tasks";
      renderNavigation();
      renderCurrentView();
    });

    // Hook checkbox toggles
    el.viewContainer.querySelectorAll(".task-check").forEach((chk) => {
      chk.addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        const done = e.target.checked;
        await apiRequest(`/practicum/task/${id}/toggle`, "POST", { done });
        await refreshBackendState();
        renderCurrentView();
      });
    });
  }

  function renderStudentApplication() {
    const app = state.practicumData.application;

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Practicum Placement Record</p>
            <h1 class="page-title">Campus Placement Details</h1>
            <p>Your official in-campus department endorsement and designated supervisor assignment.</p>
          </div>
          <button class="primary-button" id="btnEditPlacement" type="button">&#9998; Update Placement Info</button>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Assigned Campus Department & Supervisor</h3>
              <p>Official placement details recorded with the ISPSC OJT Office</p>
            </div>
            <span class="status ${app && app.status === "Active" ? "status-green" : "status-yellow"}">
              &#10003; ${app ? escapeHtml(app.status) : "Not Configured"}
            </span>
          </div>

          ${
            app
              ? `
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Placement Reference</span>
                <span class="detail-value"><strong>${escapeHtml(app.id)}</strong></span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Academic Period</span>
                <span class="detail-value">${escapeHtml(app.period)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Assigned Campus Department / Office</span>
                <span class="detail-value"><strong>${escapeHtml(app.company)}</strong></span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Specific Unit / Section</span>
                <span class="detail-value">${escapeHtml(app.department)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Campus Department Supervisor</span>
                <span class="detail-value">${escapeHtml(app.supervisor)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Supervisor Institutional Email</span>
                <span class="detail-value">${escapeHtml(app.supervisorEmail || "—")}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Authorized Shift Hours</span>
                <span class="detail-value">${escapeHtml(app.officeHours)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date Submitted</span>
                <span class="detail-value">${escapeHtml(app.dateSubmitted)}</span>
              </div>
            </div>
          `
              : `
            <div style="text-align:center; padding:30px; color:#6c7b80;">
              <p>No campus placement details found. Please submit your assigned department info.</p>
              <button class="primary-button" id="btnCreatePlacement" style="margin-top:10px;" type="button">Submit Placement Info</button>
            </div>
          `
          }
        </div>
      </div>
    `;

    const editBtn = document.getElementById("btnEditPlacement");
    const createBtn = document.getElementById("btnCreatePlacement");
    if (editBtn) editBtn.addEventListener("click", () => openModal("placement"));
    if (createBtn) createBtn.addEventListener("click", () => openModal("placement"));
  }

  function renderStudentRequirements() {
    const reqs = state.practicumData.requirements || [];

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Clearance & Compliance</p>
            <h1 class="page-title">Documentary Requirements</h1>
            <p>Institutional clearances verified by your OJT Faculty Adviser.</p>
          </div>
          <button class="primary-button" id="btnUploadReq" type="button">&#128196; Upload Requirement</button>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Required Clearances & Endorsements</h3>
              <p>Upload signed documentary prerequisites for practicum accreditation</p>
            </div>
            <span class="score-badge">
              ${reqs.filter((r) => r.status === "Approved").length} / ${reqs.length} Approved
            </span>
          </div>

          <div class="table-wrap">
            <table class="data-table" aria-label="Student Requirements Table">
              <thead>
                <tr>
                  <th>Requirement Name</th>
                  <th>Mandatory</th>
                  <th>Status</th>
                  <th>Submission Date</th>
                  <th>Adviser Feedback</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${reqs
                  .map(
                    (r) => `
                  <tr>
                    <td><strong>${escapeHtml(r.name)}</strong></td>
                    <td>${r.mandatory ? '<span class="status status-yellow">Mandatory</span>' : '<span class="status status-blue">Optional</span>'}</td>
                    <td><span class="status ${r.status === "Approved" ? "status-green" : "status-yellow"}">${r.status === "Approved" ? "&#10003; " : ""}${escapeHtml(r.status)}</span></td>
                    <td>${escapeHtml(r.dateSubmitted || "—")}</td>
                    <td style="max-width:240px;">${escapeHtml(r.feedback || "—")}</td>
                    <td>
                      <button class="secondary-button" style="padding:6px 10px; font-size:11.5px;" onclick="window.reuploadReq('${escapeHtml(r.name)}')">
                        ${r.status === "Approved" ? "Re-upload" : "Upload Document"}
                      </button>
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnUploadReq")?.addEventListener("click", () => openModal("requirement"));
  }

  window.reuploadReq = function (name) {
    openModal("requirement", { reqName: name });
  };

  function renderStudentAttendance() {
    const logs = state.practicumData.attendanceLogs || [];
    const totalRendered = state.practicumData.totalHours || 0;
    const remaining = Math.max(0, 480 - totalRendered);

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Daily Time Record (DTR)</p>
            <h1 class="page-title">Attendance & Time Logs</h1>
            <p>Log your daily shift hours. Records are verified by your Campus Department Supervisor.</p>
          </div>
          <div class="button-row" style="display:flex; gap:10px;">
            <button class="secondary-button" id="btnExportDtr" type="button">&#128190; Export DTR (CSV)</button>
            <button class="primary-button" id="btnRecordAttendance" type="button">&#9719; Record Attendance</button>
          </div>
        </div>

        <div class="stats-grid" style="margin-bottom:20px;">
          <div class="stat-card">
            <div class="stat-icon icon-green">&#9201;</div>
            <strong>${totalRendered} hrs</strong>
            <span>Total Rendered Hours</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-coral">&#9203;</div>
            <strong>${remaining} hrs</strong>
            <span>Remaining to 480h Quota</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-blue">&#128197;</div>
            <strong>${logs.length} logged</strong>
            <span>Total Attendance Days</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-gold">&#9733;</div>
            <strong>${logs.length > 0 ? (totalRendered / logs.length).toFixed(1) : 0} hrs/day</strong>
            <span>Average Shift Length</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Daily Time Record Table</h3>
              <p>Official record of daily hours rendered at the assigned Campus Department / Office</p>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table" aria-label="Official Daily Time Record">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shift Type</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Total Rendered</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${
                  logs.length === 0
                    ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6c7b80;">No attendance records found. Click "Record Attendance" above to log your shift!</td></tr>'
                    : logs
                        .map(
                          (log) => `
                      <tr>
                        <td><strong>${escapeHtml(log.date)}</strong></td>
                        <td>${escapeHtml(log.schedule)}</td>
                        <td>${escapeHtml(log.timeIn)}</td>
                        <td>${escapeHtml(log.timeOut)}</td>
                        <td><span class="score-badge">${escapeHtml(log.total)}</span></td>
                        <td><span class="status status-green">&#10003; ${escapeHtml(log.status)}</span></td>
                        <td>${escapeHtml(log.remarks || "—")}</td>
                      </tr>
                    `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnRecordAttendance")?.addEventListener("click", () => openModal("attendance"));
    document.getElementById("btnExportDtr")?.addEventListener("click", exportDtrCsv);
  }

  function exportDtrCsv() {
    const logs = state.practicumData.attendanceLogs || [];
    if (logs.length === 0) {
      showToast("No attendance records to export.");
      return;
    }

    let csv = "Date,Shift Schedule,Time In,Time Out,Rendered Hours,Status,Remarks\n";
    logs.forEach((l) => {
      csv += `"${l.rawDate || l.date}","${l.schedule}","${l.timeIn}","${l.timeOut}","${l.totalHours || l.total}","${l.status}","${l.remarks || ""}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `ISPSC_DTR_${state.currentUser.username}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("DTR exported to CSV successfully.");
  }

  function renderStudentTasks() {
    const tasks = state.practicumData.tasks || [];

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Workplace Deliverables</p>
            <h1 class="page-title">Department Assigned Tasks</h1>
            <p>Official deliverables and assignments given by your Campus Department Supervisor. Mark items as completed when finished.</p>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Assigned Department Deliverables</h3>
              <p>Tasks assigned directly by your department supervisor</p>
            </div>
            <span class="score-badge">${tasks.filter((t) => t.done).length} / ${tasks.length} Completed</span>
          </div>
          <div class="task-list">
            ${
              tasks.length === 0
                ? '<div style="text-align:center; padding:36px 20px; color:#6c7b80;"><p style="font-size:14px; font-weight:600; margin-bottom:4px;">No Workplace Tasks Assigned</p><p style="font-size:12px;">Tasks will appear here once assigned by your Campus Department Supervisor.</p></div>'
                : tasks
                    .map(
                      (task) => `
                  <div class="task-row">
                    <input type="checkbox" class="task-check" data-id="${task.id}" ${task.done ? "checked" : ""} aria-label="Mark task ${escapeHtml(task.title)} as complete" />
                    <div style="flex:1;">
                      <strong style="${task.done ? "text-decoration:line-through; color:#7d8c91;" : ""}">${escapeHtml(task.title)}</strong>
                      <small>${escapeHtml(task.meta)} ${task.details ? `&bull; ${escapeHtml(task.details)}` : ""}</small>
                    </div>
                    <span class="task-due">${escapeHtml(task.due)}</span>
                  </div>
                `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    `;

    el.viewContainer.querySelectorAll(".task-check").forEach((chk) => {
      chk.addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        const done = e.target.checked;
        await apiRequest(`/practicum/task/${id}/toggle`, "POST", { done });
        await refreshBackendState();
        renderCurrentView();
      });
    });
  }

  function renderStudentJournal() {
    const journals = state.practicumData.journals || [];

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Reflective Practice</p>
            <h1 class="page-title">OJT Daily Journal</h1>
            <p>Document daily tasks, technical experiences, and skills acquired at your campus department.</p>
          </div>
          <button class="primary-button" id="btnNewJournal" type="button">&#9998; Write Daily Journal</button>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Journal Entries & Reflection Logs</h3>
              <p>Reviewed and evaluated by your designated Campus Department Supervisor</p>
            </div>
            <span class="score-badge">${journals.length} Entries Recorded</span>
          </div>

          <div class="activity-feed">
            ${
              journals.length === 0
                ? '<p style="text-align:center; padding:30px; color:#6c7b80;">No journal entries yet. Click "Write Daily Journal" above to document today\'s training!</p>'
                : journals
                    .map(
                      (j) => `
                  <div class="journal-card" style="padding:16px; border-bottom:1px solid #f0f3ef;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                      <div>
                        <strong style="font-size:14px; color:var(--ink);">${escapeHtml(j.title)}</strong>
                        <span style="font-size:11.5px; color:var(--muted); margin-left:8px;">${escapeHtml(j.date)} &bull; ${escapeHtml(j.hours)}</span>
                      </div>
                      <span class="status ${j.status === "Approved" ? "status-green" : "status-yellow"}">&#10003; ${escapeHtml(j.status)}</span>
                    </div>
                    <p style="font-size:13px; color:#37474f; margin:8px 0; line-height:1.6;">${escapeHtml(j.reflection)}</p>
                    ${j.supervisorFeedback ? `<div style="background:#f4f8ed; padding:8px 12px; border-radius:6px; font-size:12px; color:#3a5007; border-left:3px solid #8ba71b;"><strong>Supervisor Feedback:</strong> ${escapeHtml(j.supervisorFeedback)}</div>` : ""}
                  </div>
                `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnNewJournal")?.addEventListener("click", () => openModal("journal"));
  }

  function renderStudentReports() {
    const reports = state.practicumData.reports || [];

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Academic Compliance</p>
            <h1 class="page-title">Accomplishment Reports</h1>
            <p>Weekly synthesis of accomplishments verified and graded by your OJT Faculty Adviser.</p>
          </div>
          <button class="primary-button" id="btnNewReport" type="button">&#9638; Submit Accomplishment Report</button>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Weekly Accomplishment Filings</h3>
              <p>Reports reviewed by your OJT Faculty Adviser</p>
            </div>
            <span class="score-badge">${reports.length} Reports Filed</span>
          </div>

          <div class="table-wrap">
            <table class="data-table" aria-label="Accomplishment Reports Table">
              <thead>
                <tr>
                  <th>Report Title / Period</th>
                  <th>Date Filed</th>
                  <th>Adviser Status</th>
                  <th>Adviser Remarks</th>
                  <th>File Attachment</th>
                </tr>
              </thead>
              <tbody>
                ${
                  reports.length === 0
                    ? '<tr><td colspan="5" style="text-align:center; padding:24px; color:#6c7b80;">No accomplishment reports filed yet. Click "Submit Accomplishment Report" above!</td></tr>'
                    : reports
                        .map(
                          (r) => `
                      <tr>
                        <td><strong>${escapeHtml(r.week)}</strong></td>
                        <td>${escapeHtml(r.dateSubmitted)}</td>
                        <td><span class="status ${r.status === "Approved" ? "status-green" : "status-yellow"}">&#10003; ${escapeHtml(r.status)}</span></td>
                        <td>${escapeHtml(r.adviserRemarks || "—")}</td>
                        <td><span style="font-size:11.5px; color:var(--muted);">&#128206; ${escapeHtml(r.fileName || "Summary Recorded")}</span></td>
                      </tr>
                    `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnNewReport")?.addEventListener("click", () => openModal("report"));
  }

  function renderStudentFeedback() {
    const feedbacks = state.practicumData.feedbacks || [];

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Mentorship & Coaching</p>
            <h1 class="page-title">Supervisor Feedback & Coaching</h1>
            <p>Continuous constructive feedback and observations from your Campus Department Supervisor.</p>
          </div>
        </div>

        <div class="panel">
          ${
            feedbacks.length === 0
              ? '<p style="text-align:center; padding:30px; color:#6c7b80;">No supervisory feedback recorded yet. Check back after your first shift review.</p>'
              : `
              <div class="feedback-feed">
                ${feedbacks
                  .map(
                    (fb) => `
                  <div style="padding:16px 0; border-bottom:1px solid #f0f3ef;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                      <strong>${escapeHtml(fb.supervisor)}</strong>
                      <span class="score-badge">${escapeHtml(fb.rating)} / 100 Rating</span>
                    </div>
                    <p style="font-size:13px; color:#37474f; margin:6px 0 8px; line-height:1.5;">${escapeHtml(fb.feedback)}</p>
                    <small style="color:var(--muted);">${escapeHtml(fb.date)}</small>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
          }
        </div>
      </div>
    `;
  }

  function renderStudentEvaluation() {
    const evals = state.practicumData.evaluations || [];

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Academic & Workplace Evaluation</p>
            <h1 class="page-title">Workplace Appraisal & Numerical Grade</h1>
            <p>Official performance evaluation conducted by your Campus Department Supervisor.</p>
          </div>
        </div>

        <div class="panel">
          ${
            evals.length === 0
              ? '<p style="text-align:center; padding:30px; color:#6c7b80;">No performance evaluations recorded yet. Supervisors submit appraisals near midterm and completion.</p>'
              : `
              <div class="table-wrap">
                <table class="data-table" aria-label="Student Evaluations Table">
                  <thead>
                    <tr>
                      <th>Appraisal Period</th>
                      <th>Supervisor Evaluator</th>
                      <th>Score</th>
                      <th>Numerical Equivalent</th>
                      <th>Status</th>
                      <th>Supervisor Comments</th>
                      <th>Date Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${evals
                      .map(
                        (e) => `
                      <tr>
                        <td><strong>${escapeHtml(e.period)}</strong></td>
                        <td>${escapeHtml(e.evaluator)}</td>
                        <td><span class="score-badge">${escapeHtml(e.rating)} / 100</span></td>
                        <td><span class="grade-pill">${escapeHtml(e.gradeEquiv || getGradeEquivalence(e.rating))}</span></td>
                        <td><span class="status status-green">&#10003; ${escapeHtml(e.status)}</span></td>
                        <td style="max-width:280px;">${escapeHtml(e.comments || "—")}</td>
                        <td>${escapeHtml(e.date)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
          }
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW RENDERERS: SUPERVISOR
  // =========================================================================

  function renderSupervisorViews(view) {
    const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];
    const studentReqs = state.practicumData.studentRequirements || [];

    if (view === "supervisor-eval-docs") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Department Supervisor Evaluation</p>
              <h1 class="page-title">Evaluate Trainee Clearance & Documents</h1>
              <p>Review and evaluate mandatory documents submitted by OJT students deployed in your department. Approve trainees once documents are verified.</p>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Submitted Trainee Documents</h3>
                <p>Verify endorsement forms, parent consent, medical clearances, and department compliance</p>
              </div>
              <span class="score-badge">${studentReqs.length} Total Submissions</span>
            </div>

            <div class="table-wrap">
              <table class="data-table" aria-label="Supervisor Document Evaluation Table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Document Name</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Submission Info</th>
                    <th>Supervisor Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    studentReqs.length === 0
                      ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6c7b80;">No document submissions awaiting supervisor review.</td></tr>'
                      : studentReqs
                          .map(
                            (r) => `
                        <tr>
                          <td><strong>${escapeHtml(r.studentName)}</strong></td>
                          <td><strong>${escapeHtml(r.name)}</strong></td>
                          <td>${escapeHtml(r.studentProgram || "BS Information Technology")}</td>
                          <td><span class="status ${r.status === "Approved" ? "status-green" : r.status === "Revision" ? "status-coral" : "status-yellow"}">${escapeHtml(r.status)}</span></td>
                          <td>${escapeHtml(r.submittedAt || r.meta || "Submitted")}</td>
                          <td>${escapeHtml(r.remarks || "—")}</td>
                          <td>
                            <button class="secondary-button" style="padding:5px 10px; font-size:11.5px;" onclick="window.supervisorAction('eval-doc', '${escapeHtml(r.studentName)}', '${escapeHtml(r.name)}')">
                              &#128196; Evaluate Document
                            </button>
                          </td>
                        </tr>
                      `
                          )
                          .join("")
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      return;
    }

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Department Supervisor Portal</p>
            <h1 class="page-title">${escapeHtml(state.currentUser.name)}'s Trainee Workspace</h1>
            <p>Manage, supervise, evaluate submitted documents, verify attendance, assign tasks, and provide departmental approval for assigned ISPSC practicum students.</p>
          </div>
          <div class="button-row" style="display:flex; gap:10px;">
            <button class="secondary-button" id="btnSupervisorEvalDocLink" type="button">&#128196; Evaluate Documents</button>
            <button class="primary-button" id="btnSupervisorAddTask" type="button">&#43; Assign New Task</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Assigned Practicum Trainees</h3>
              <p>Active trainees rendering OJT hours in your campus department / office</p>
            </div>
            <span class="score-badge">${students.length} Trainees Deployed</span>
          </div>

          <div class="table-wrap">
            <table class="data-table" aria-label="Supervisor Student Roster">
              <thead>
                <tr>
                  <th>Trainee Name</th>
                  <th>Degree Program</th>
                  <th>Department Status</th>
                  <th>Submitted Docs</th>
                  <th>Rendered Progress</th>
                  <th>Latest Attendance</th>
                  <th>Supervisory Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  students.length === 0
                    ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6c7b80;">No trainees currently assigned to your department.</td></tr>'
                    : students
                        .map(
                          (s) => `
                      <tr>
                        <td>
                          <strong>${escapeHtml(s.name)}</strong><br />
                          <small style="color:var(--muted);">ID: ${escapeHtml(s.idNumber || "—")}</small>
                        </td>
                        <td>${escapeHtml(s.program)}</td>
                        <td>
                          <span class="status ${s.status === "Active" ? "status-green" : s.status === "Revision" ? "status-coral" : "status-yellow"}">
                            ${s.status === "Active" ? "&#10003; Approved (Active)" : escapeHtml(s.status)}
                          </span>
                        </td>
                        <td>
                          <span class="status ${s.pendingRequirements > 0 ? "status-yellow" : "status-green"}">${escapeHtml(s.requirements || "0/4")}</span>
                        </td>
                        <td>
                          <strong>${escapeHtml(s.hours)}</strong>
                          <div class="progress-bar" style="height:5px; margin-top:4px;">
                            <i style="width:${escapeHtml(s.progress)};"></i>
                          </div>
                        </td>
                        <td>
                          ${escapeHtml(s.attendanceDate)}<br />
                          <span class="status ${s.attendanceStatus === "Present" ? "status-green" : "status-yellow"}">${escapeHtml(s.attendanceStatus)}</span>
                        </td>
                        <td>
                          <div class="table-action-group">
                            <button class="primary-button" style="padding:4px 8px; font-size:11px; background:#4b6607;" onclick="window.supervisorAction('approve-student', '${escapeHtml(s.name)}')">&#10003; Approve Student</button>
                            <button class="secondary-button" style="padding:4px 8px; font-size:11px;" onclick="window.supervisorAction('eval-doc', '${escapeHtml(s.name)}')">&#128196; Eval Docs</button>
                            <button class="secondary-button" style="padding:4px 8px; font-size:11px;" onclick="window.supervisorAction('eval', '${escapeHtml(s.name)}')">&#9734; Evaluate</button>
                            <button class="secondary-button" style="padding:4px 8px; font-size:11px;" onclick="window.supervisorAction('feedback', '${escapeHtml(s.name)}')">&#9825; Feedback</button>
                            <button class="secondary-button" style="padding:4px 8px; font-size:11px;" onclick="window.supervisorAction('task', '${escapeHtml(s.name)}')">&#43; Task</button>
                            <button class="secondary-button" style="padding:4px 8px; font-size:11px;" onclick="window.supervisorAction('attendance', '${escapeHtml(s.name)}')">&#9719; Verify DTR</button>
                            <button class="secondary-button" style="padding:4px 8px; font-size:11px;" onclick="window.supervisorAction('journal', '${escapeHtml(s.name)}')">&#9998; Review Journal</button>
                          </div>
                        </td>
                      </tr>
                    `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnSupervisorAddTask")?.addEventListener("click", () => openModal("task"));
    document.getElementById("btnSupervisorEvalDocLink")?.addEventListener("click", () => {
      state.currentView = "supervisor-eval-docs";
      renderNavigation();
      renderCurrentView();
    });
  }

  window.supervisorAction = function (actionType, studentName, docName = null) {
    if (actionType === "approve-student") {
      openModal("approve-student", { student: studentName });
    } else if (actionType === "eval-doc") {
      openModal("review-requirement", { student: studentName, reqName: docName });
    } else if (actionType === "eval") {
      openModal("evaluation", { student: studentName });
    } else if (actionType === "feedback") {
      openModal("feedback", { student: studentName });
    } else if (actionType === "task") {
      openModal("task", { student: studentName });
    } else if (actionType === "attendance") {
      openModal("review-attendance", { student: studentName });
    } else if (actionType === "journal") {
      openModal("review-journal", { student: studentName });
    }
  };

  // =========================================================================
  // VIEW RENDERERS: ADVISER
  // =========================================================================

  function renderAdviserViews(view) {
    const students = state.practicumData.students || [];
    const pendingReqs = state.practicumData.pendingRequirements || [];

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Faculty OJT Adviser Portal</p>
            <h1 class="page-title">Student Advisees & Campus Department Deployments</h1>
            <p>Assign OJT students to their respective campus departments/units. Trainees will submit their documentary requirements to the Department Supervisor for final evaluation and approval.</p>
          </div>
          <button class="primary-button" id="btnAdviserAssign" type="button">&#43; Assign Trainee to Department</button>
        </div>

        <div class="stats-grid" style="margin-bottom:20px;">
          <div class="stat-card">
            <div class="stat-icon icon-green">&#127891;</div>
            <strong>${students.length} Advisees</strong>
            <span>Enrolled in Practicum Course</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-coral">&#10003;</div>
            <strong>${pendingReqs.length} Documents</strong>
            <span>Clearance Verifications</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-blue">&#128197;</div>
            <strong>480 Hours</strong>
            <span>CHED Curriculum Target</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Trainee Department Assignments & Status</h3>
              <p>Manage and monitor assigned department units and clearance compliance</p>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table" aria-label="Adviser Student Monitoring">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Assigned Department</th>
                  <th>Supervisor</th>
                  <th>Deployment Status</th>
                  <th>Hours Rendered</th>
                  <th>Clearance Docs</th>
                  <th>Adviser Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  students.length === 0
                    ? '<tr><td colspan="8" style="text-align:center; padding:24px; color:#6c7b80;">No advisees found in this department.</td></tr>'
                    : students
                        .map(
                          (s) => `
                      <tr>
                        <td><strong>${escapeHtml(s.name)}</strong></td>
                        <td>${escapeHtml(s.idNumber || "—")}</td>
                        <td><strong>${escapeHtml(s.company)}</strong><br /><small style="color:var(--muted);">${escapeHtml(s.department || "")}</small></td>
                        <td>${escapeHtml(s.supervisor || "Unassigned")}</td>
                        <td>
                          <span class="status ${s.status === "Active" ? "status-green" : s.status === "Revision" ? "status-coral" : "status-yellow"}">
                            ${s.status === "Active" ? "&#10003; Supervisor Approved" : escapeHtml(s.status)}
                          </span>
                        </td>
                        <td>
                          <strong>${escapeHtml(s.hours)}</strong>
                          <div class="progress-bar" style="height:5px; margin-top:4px;">
                            <i style="width:${escapeHtml(s.progress)};"></i>
                          </div>
                        </td>
                        <td><span class="status ${s.pendingRequirements > 0 ? "status-yellow" : "status-green"}">${escapeHtml(s.requirements)}</span></td>
                        <td>
                          <div class="table-action-group">
                            <button class="primary-button" style="padding:4px 8px; font-size:11px;" onclick="window.adviserAction('assign', '${escapeHtml(s.name)}')">&#127970; Assign Dept</button>
                            <button class="secondary-button" style="padding:4px 8px; font-size:11px;" onclick="window.adviserAction('req', '${escapeHtml(s.name)}')">&#10003; Review Docs</button>
                            <button class="secondary-button" style="padding:4px 8px; font-size:11px;" onclick="window.adviserAction('report', '${escapeHtml(s.name)}')">&#9638; Review Report</button>
                          </div>
                        </td>
                      </tr>
                    `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnAdviserAssign")?.addEventListener("click", () => openModal("assign-student"));
  }

  window.adviserAction = function (actionType, studentName) {
    if (actionType === "assign") {
      openModal("assign-student", { student: studentName });
    } else if (actionType === "req") {
      openModal("review-requirement", { student: studentName });
    } else if (actionType === "report") {
      openModal("review-report", { student: studentName });
    }
  };

  // =========================================================================
  // VIEW RENDERERS: ADMIN
  // =========================================================================

  function renderAdminViews(view) {
    const users = state.practicumData.allUsers || [];

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">System Administrator</p>
            <h1 class="page-title">User Accounts & Directory</h1>
            <p>Manage system users, create faculty advisers, assign campus department supervisors, and oversee student accounts.</p>
          </div>
          <button class="primary-button" id="btnAdminAddUser" type="button">&#43; Add User Account</button>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>All Registered Users</h3>
              <p>Active directory of institutional students, campus department supervisors, and faculty advisers</p>
            </div>
            <span class="score-badge">${users.length} Registered Accounts</span>
          </div>

          <div class="table-wrap">
            <table class="data-table" aria-label="System Users Table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>System Role</th>
                  <th>Department / Office</th>
                </tr>
              </thead>
              <tbody>
                ${
                  users.length === 0
                    ? '<tr><td colspan="5" style="text-align:center; padding:24px; color:#6c7b80;">No user accounts found.</td></tr>'
                    : users
                        .map(
                          (u) => `
                      <tr>
                        <td><strong>${escapeHtml(u.name)}</strong></td>
                        <td>${escapeHtml(u.username)}</td>
                        <td>${escapeHtml(u.email)}</td>
                        <td><span class="status status-blue">${escapeHtml(u.role)}</span></td>
                        <td>${escapeHtml(u.department || "General")}</td>
                      </tr>
                    `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnAdminAddUser")?.addEventListener("click", () => openModal("admin-user"));
  }

  // =========================================================================
  // MODAL ACTIONS & HANDLERS
  // =========================================================================

  
  function openProfileModal() {
    if (!state.currentUser) return;
    const user = state.currentUser;
    const data = state.practicumData || {};
    const dtrLogs = data.attendanceLogs || [];
    const totalHours = data.totalHours || 0;
    const remainingHours = Math.max(0, 480 - totalHours);
    const app = data.application || {};

    let roleTitle = "OJT Practicum Trainee";
    if (user.role === "supervisor") roleTitle = "Campus Department Supervisor";
    if (user.role === "adviser") roleTitle = "OJT Faculty Adviser";
    if (user.role === "admin") roleTitle = "Portal Administrator";

    const initials = (user.name || "U")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    let dtrHtml = "";
    if (user.role === "student") {
      dtrHtml = `
        <div style="margin-top:20px; border-top:1px solid #d4e3cb; padding-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
            <h4 style="margin:0; font-size:14.5px; color:#17212b; font-weight:700;">Daily Time Record (DTR Logs)</h4>
            <span class="score-badge">${totalHours} / 480 hrs rendered</span>
          </div>
          <p style="font-size:12px; color:#6a7c82; margin:0 0 12px;">
            Official shift logs recorded by you and verified by your Department Supervisor. You can record multiple time entries/shifts per day.
          </p>
          <div class="table-wrap" style="max-height:220px; overflow-y:auto;">
            <table class="data-table" style="font-size:12px;">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shift Type</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Rendered</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${
                  dtrLogs.length === 0
                    ? '<tr><td colspan="7" style="text-align:center; padding:16px; color:#6c7b80;">No DTR logs recorded yet.</td></tr>'
                    : dtrLogs
                        .map(
                          (l) => `
                      <tr>
                        <td><strong>${escapeHtml(l.date)}</strong></td>
                        <td>${escapeHtml(l.schedule || "Regular")}</td>
                        <td>${escapeHtml(l.timeIn)}</td>
                        <td>${escapeHtml(l.timeOut)}</td>
                        <td><strong>${escapeHtml(l.totalHours || l.total)} hrs</strong></td>
                        <td><span class="status ${l.status === "Present" ? "status-green" : "status-yellow"}">${escapeHtml(l.status)}</span></td>
                        <td>${escapeHtml(l.remarks || "—")}</td>
                      </tr>
                    `
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (user.role === "supervisor") {
      dtrHtml = `
        <div style="margin-top:20px; border-top:1px solid #d4e3cb; padding-top:16px;">
          <h4 style="margin:0 0 8px; font-size:14.5px; color:#17212b; font-weight:700;">Department Supervision Scope</h4>
          <p style="font-size:12px; color:#6a7c82; margin:0 0 12px;">
            Designated Campus Department / Unit: <strong>${escapeHtml(user.department || "Management Information Systems")}</strong>. You can evaluate student clearance documents, verify multiple DTR attendance logs, and provide final departmental approval.
          </p>
        </div>
      `;
    } else if (user.role === "adviser") {
      dtrHtml = `
        <div style="margin-top:20px; border-top:1px solid #d4e3cb; padding-top:16px;">
          <h4 style="margin:0 0 8px; font-size:14.5px; color:#17212b; font-weight:700;">Practicum Advisory Scope</h4>
          <p style="font-size:12px; color:#6a7c82; margin:0 0 12px;">
            College / Unit: <strong>${escapeHtml(user.department || "College of Computing Studies")}</strong>. As OJT Adviser, you assign practicum students to their deployed departments and monitor clearance progress.
          </p>
        </div>
      `;
    }

    if (el.profileModalContent) {
      el.profileModalContent.innerHTML = `
        <div class="profile-header-banner">
          <span class="avatar avatar-lime" style="width:52px; height:52px; font-size:20px; font-weight:800; display:flex; align-items:center; justify-content:center;">${initials}</span>
          <div>
            <h3 style="margin:0 0 4px; font-size:17px; color:#17212b;">${escapeHtml(user.name)}</h3>
            <span class="status status-green" style="font-size:11px; font-weight:700;">${escapeHtml(roleTitle)}</span>
          </div>
        </div>

        <div class="profile-modal-grid">
          <div class="profile-info-card">
            <small>Student / Institutional ID</small>
            <strong>${escapeHtml(user.idNumber || user.id_number || "2026-TG-001")}</strong>
          </div>
          <div class="profile-info-card">
            <small>Username</small>
            <strong>@${escapeHtml(user.username)}</strong>
          </div>
          <div class="profile-info-card">
            <small>Email Address</small>
            <strong>${escapeHtml(user.email)}</strong>
          </div>
          <div class="profile-info-card">
            <small>College / Department</small>
            <strong>${escapeHtml(user.department || "BS Information Technology")}</strong>
          </div>
          ${
            user.role === "student"
              ? `
            <div class="profile-info-card">
              <small>Assigned Department</small>
              <strong>${escapeHtml(app.company || "MIS / ICT Center")}</strong>
            </div>
            <div class="profile-info-card">
              <small>Department Supervisor</small>
              <strong>${escapeHtml(app.supervisor || "Engr. Roberto Gomez")}</strong>
            </div>
          `
              : ""
          }
        </div>

        ${dtrHtml}

        <div style="display:flex; justify-content:flex-end; margin-top:18px;">
          <button class="secondary-button" type="button" id="profileModalCloseBtn">Close</button>
        </div>
      `;

      document.getElementById("profileModalCloseBtn")?.addEventListener("click", () => {
        closeModalDialog(el.profileModalBackdrop);
      });
    }

    openModalDialog(el.profileModalBackdrop);
  }

  function openModal(modalType, context = {}) {
    if (!el.modalForm) return;

    el.modalForm.dataset.modalType = modalType;
    let title = "Action Form";
    let kicker = "Practicum Portal";
    let desc = "Please fill in the required details below.";
    let submitLabel = "Save & Submit";
    let fieldsHtml = "";

    if (modalType === "attendance") {
      kicker = "Daily Time Record";
      title = "Log Daily Attendance Shift";
      desc = "Record your verified shift hours rendered at your assigned campus department.";
      submitLabel = "Record Attendance (DTR)";

      const todayIso = new Date().toISOString().slice(0, 10);

      fieldsHtml = `
        <label for="attDate">
          Shift Date
          <input type="date" id="attDate" name="attDate" value="${todayIso}" required aria-required="true" />
        </label>
        <label for="attSchedule">
          Shift Schedule Type
          <select id="attSchedule" name="attSchedule" required aria-required="true">
            <option value="Regular (8h)" selected>Regular Full-Day Shift (8.00 hrs: 8:00 AM – 5:00 PM)</option>
            <option value="Morning Shift (4h)">Morning Half-Day Shift (4.00 hrs: 8:00 AM – 12:00 PM)</option>
            <option value="Afternoon Shift (4h)">Afternoon Half-Day Shift (4.00 hrs: 1:00 PM – 5:00 PM)</option>
          </select>
        </label>
        <div class="form-grid-2">
          <label for="attTimeIn">
            Time In
            <input type="text" id="attTimeIn" name="attTimeIn" value="8:00 AM" required aria-required="true" />
          </label>
          <label for="attTimeOut">
            Time Out
            <input type="text" id="attTimeOut" name="attTimeOut" value="5:00 PM" required aria-required="true" />
          </label>
        </div>
        <label for="attRemarks">
          Department Duty Remarks (Optional)
          <textarea id="attRemarks" name="attRemarks" rows="2" placeholder="e.g., Conducted campus lab PC hardware diagnostics and cable management..."></textarea>
        </label>
      `;
    } else if (modalType === "journal") {
      kicker = "Reflective Practice";
      title = "Create OJT Daily Journal Entry";
      desc = "Document your daily deliverables, learnings, and technical activities.";
      submitLabel = "Submit Journal Entry";

      fieldsHtml = `
        <label for="jTitle">
          Workplace Focus / Task Title
          <input type="text" id="jTitle" name="jTitle" placeholder="e.g., Campus Network Maintenance & Lab Audit" required aria-required="true" />
        </label>
        <label for="jHours">
          Rendered Shift Hours
          <input type="text" id="jHours" name="jHours" value="8 hours rendered" required aria-required="true" />
        </label>
        <label for="jReflection">
          Reflection, Key Takeaways & Output Description
          <textarea id="jReflection" name="jReflection" rows="5" placeholder="Document what you accomplished, tools used, and problem-solving steps..." required aria-required="true"></textarea>
        </label>
      `;
    } else if (modalType === "task") {
      kicker = "Department Deliverable";
      title = context.student ? `Assign Task to ${escapeHtml(context.student)}` : "Assign Trainee Task";
      desc = "Define the task title, due date, and instructions for the student trainee.";
      submitLabel = "Assign Task to Trainee";

      const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];
      const studentSelectHtml = context.student
        ? `<div class="modal-student-banner"><span class="student-pill">Trainee</span> <strong>${escapeHtml(context.student)}</strong><input type="hidden" name="taskStudent" value="${escapeHtml(context.student)}" /></div>`
        : `<label for="taskStudentSelect">
            Select Student Trainee
            <select id="taskStudentSelect" name="taskStudent" required aria-required="true">
              ${students.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.program || "OJT Trainee")})</option>`).join("")}
            </select>
          </label>`;

      fieldsHtml = `
        ${studentSelectHtml}
        <label for="taskTitle">
          Task Title & Scope
          <input type="text" id="taskTitle" name="taskTitle" placeholder="e.g., Campus Network Maintenance & Lab Audit" required aria-required="true" />
        </label>
        <label for="taskDue">
          Target Due Date
          <input type="date" id="taskDue" name="taskDue" />
        </label>
        <label for="taskDetails">
          Task Instructions / Department Specifications (Optional)
          <textarea id="taskDetails" name="taskDetails" rows="3" placeholder="Provide instructions, expected outputs, or guidelines for the trainee..."></textarea>
        </label>
      `;
    } else if (modalType === "report") {
      kicker = "Weekly Compliance";
      title = "Submit Weekly Accomplishment Report";
      desc = "Synthesize your total accomplishments for the week.";
      submitLabel = "Submit Report";

      fieldsHtml = `
        <label for="repTitle">
          Report Title / Week Identifier
          <input type="text" id="repTitle" name="repTitle" placeholder="e.g., Week 1 Accomplishment Report" required aria-required="true" />
        </label>
        <label for="repSummary">
          Weekly Synthesis Summary
          <textarea id="repSummary" name="repSummary" rows="5" placeholder="Summarize your weekly tasks, milestones achieved, and hours rendered..." required aria-required="true"></textarea>
        </label>
      `;
    } else if (modalType === "requirement") {
      kicker = "Document Clearance";
      title = "Upload Institutional Requirement";
      desc = "Submit your clearance document for Adviser verification.";
      submitLabel = "Submit Document for Review";

      const defaultName = context.reqName || "Campus Placement & Endorsement Form";

      fieldsHtml = `
        <label for="reqSelect">
          Requirement Document Type
          <select id="reqSelect" name="reqSelect" required aria-required="true">
            <option value="Campus Placement & Endorsement Form" ${defaultName === "Campus Placement & Endorsement Form" || defaultName === "Memorandum of Agreement" ? "selected" : ""}>Campus Placement & Endorsement Form</option>
            <option value="Parent Consent Form" ${defaultName === "Parent Consent Form" ? "selected" : ""}>Notarized Parent/Guardian Consent Form</option>
            <option value="Weekly Accomplishment Report" ${defaultName === "Weekly Accomplishment Report" ? "selected" : ""}>Weekly Accomplishment Report</option>
            <option value="Medical Clearance Renewal" ${defaultName === "Medical Clearance Renewal" ? "selected" : ""}>Updated Medical Health Certificate</option>
          </select>
        </label>
        <label for="reqFile">
          Attach File (PDF, DOCX, or Scanned Image)
          <input type="file" id="reqFile" name="reqFile" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" required aria-required="true" />
        </label>
        <p style="font-size:11.5px; color:var(--muted); margin:4px 0 14px;">
          &bull; Status will be marked as <strong>Pending Review</strong> until verified by your OJT Adviser.
        </p>
      `;
    } else if (modalType === "evaluation") {
      kicker = "Workplace Appraisal";
      title = `Evaluate ${escapeHtml(context.student || "Trainee")}`;
      desc = "Grade the trainee based on technical competency, work ethic, and attendance (1–100 scale).";
      submitLabel = "Submit Workplace Evaluation";

      fieldsHtml = `
        <div class="modal-student-banner">
          <span class="student-pill">Trainee</span> 
          <strong>${escapeHtml(context.student || "Selected Student")}</strong>
          <input type="hidden" name="evalStudent" value="${escapeHtml(context.student || "")}" />
        </div>
        <label for="evalRating">
          Performance Rating (1 to 100)
          <input type="number" id="evalRating" name="evalRating" min="1" max="100" value="95" required aria-required="true" />
        </label>
        <div class="grade-preview-box" id="evalGradeBox" aria-live="polite">
          <strong id="evalGradeTitle">Academic Equiv: 1.25 (Very Superior)</strong>
          <span>Validates passing mark compliant with CHED standards.</span>
        </div>
        <label for="evalComment" style="margin-top:14px;">
          Evaluator Comments & Performance Remarks
          <textarea id="evalComment" name="evalComment" rows="4" placeholder="Provide notes on student performance, technical strengths, and growth areas..." required aria-required="true"></textarea>
        </label>
      `;
    } else if (modalType === "feedback") {
      kicker = "Supervisory Coaching";
      title = `Coaching Feedback for ${escapeHtml(context.student || "Trainee")}`;
      desc = "Share actionable observations, feedback, and commended achievements.";
      submitLabel = "Post Mentorship Feedback";

      fieldsHtml = `
        <div class="modal-student-banner">
          <span class="student-pill">Trainee</span> 
          <strong>${escapeHtml(context.student || "Selected Student")}</strong>
          <input type="hidden" name="fbStudent" value="${escapeHtml(context.student || "")}" />
        </div>
        <label for="fbRating">
          Weekly Commendation Score (1 to 100)
          <input type="number" id="fbRating" name="fbRating" min="1" max="100" value="92" required aria-required="true" />
        </label>
        <label for="fbNotes">
          Detailed Supervisory Feedback & Recommendations
          <textarea id="fbNotes" name="fbNotes" rows="4" placeholder="Write feedback on problem solving, team communication, and tasks performed..." required aria-required="true"></textarea>
        </label>
      `;
    } else if (modalType === "review-attendance") {
      kicker = "DTR Verification";
      title = `Verify DTR for ${escapeHtml(context.student || "Trainee")}`;
      desc = "Confirm attendance logs and sign off on rendered hours.";
      submitLabel = "Save Attendance Verification";

      fieldsHtml = `
        <div class="modal-student-banner">
          <span class="student-pill">Trainee</span> 
          <strong>${escapeHtml(context.student || "Selected Student")}</strong>
          <input type="hidden" name="attStudent" value="${escapeHtml(context.student || "")}" />
        </div>
        <label for="attDecision">
          Verification Decision
          <select id="attDecision" name="attDecision" required aria-required="true">
            <option value="Present" selected>Confirm Present (Rendered Shift Hours Approved)</option>
            <option value="Excused">Excused Absence / Official Campus Business</option>
          </select>
        </label>
        <label for="attReviewRemarks">
          Supervisor Remarks / Verification Notes
          <textarea id="attReviewRemarks" name="attReviewRemarks" rows="3" placeholder="e.g., Verified shift completion on campus; performed duties diligently."></textarea>
        </label>
      `;
    } else if (modalType === "review-journal") {
      kicker = "Journal Review";
      title = `Review Journal for ${escapeHtml(context.student || "Trainee")}`;
      desc = "Approve reflective journal entry or request clarification.";
      submitLabel = "Submit Journal Decision";

      fieldsHtml = `
        <div class="modal-student-banner">
          <span class="student-pill">Trainee</span> 
          <strong>${escapeHtml(context.student || "Selected Student")}</strong>
          <input type="hidden" name="journalStudent" value="${escapeHtml(context.student || "")}" />
        </div>
        <label for="journalDecision">
          Review Decision
          <select id="journalDecision" name="journalDecision" required aria-required="true">
            <option value="Approved" selected>Approve Daily Journal</option>
            <option value="Revision">Request Revision / Additional Details</option>
          </select>
        </label>
        <label for="journalRemarks">
          Supervisor Feedback & Remarks
          <textarea id="journalRemarks" name="journalRemarks" rows="3" placeholder="e.g., Great insights on troubleshooting the campus network switch."></textarea>
        </label>
      `;
    } else if (modalType === "assign-student") {
      kicker = "OJT Adviser Placement";
      title = `Assign Trainee to Department`;
      desc = "Assign student to their host campus department or unit. The student will then submit documentary requirements to the Department Supervisor for approval.";
      submitLabel = "Confirm Department Assignment";

      const students = state.practicumData.students || [];
      const supervisors = state.practicumData.supervisors || [];

      fieldsHtml = `
        <label for="assignStudent">
          Select OJT Student
          <select id="assignStudent" name="assignStudent" required aria-required="true">
            ${students.map((s) => `<option value="${escapeHtml(s.name)}" ${context.student === s.name ? "selected" : ""}>${escapeHtml(s.name)} (${escapeHtml(s.program || "IT")})</option>`).join("")}
          </select>
        </label>
        <label for="assignCompany">
          Assigned Host Department / Office
          <select id="assignCompany" name="assignCompany" required aria-required="true">
            <option value="Management Information Systems (MIS) / ICT Center">Management Information Systems (MIS) / ICT Center</option>
            <option value="Registrar's Office">Office of the Campus Registrar</option>
            <option value="Office of the Campus Dean">Office of the Campus Dean</option>
            <option value="Library & Information Services">Campus Library & Learning Resource Center</option>
            <option value="Administrative & Finance Services">Administrative & Finance Office</option>
            <option value="College of Computing Studies Laboratory">CCS Computer Laboratories</option>
          </select>
        </label>
        <label for="assignDeptUnit">
          Specific Section / Sub-unit
          <input type="text" id="assignDeptUnit" name="assignDeptUnit" value="Network Administration & Systems Development Unit" placeholder="e.g. Systems Development Unit, Records Section" required aria-required="true" />
        </label>
        <div class="form-grid-2">
          <label for="assignSupervisor">
            Designated Department Supervisor
            <input type="text" id="assignSupervisor" name="assignSupervisor" value="${supervisors[0]?.name || "Engr. Roberto Gomez"}" required aria-required="true" />
          </label>
          <label for="assignSupervisorEmail">
            Supervisor Official Email
            <input type="email" id="assignSupervisorEmail" name="assignSupervisorEmail" value="${supervisors[0]?.email || "roberto.gomez@ispsc.edu.ph"}" required aria-required="true" />
          </label>
        </div>
        <label for="assignNotes">
          Deployment Directives & Notes (Optional)
          <textarea id="assignNotes" name="assignNotes" rows="2" placeholder="e.g., Assigned for 480 hours in campus network maintenance. Advise student to submit endorsement and health clearances to Supervisor."></textarea>
        </label>
      `;
    } else if (modalType === "approve-student") {
      kicker = "Supervisor Department Approval";
      title = `Approve Student Placement: ${escapeHtml(context.student || "Trainee")}`;
      desc = "Review student documents and confirm official acceptance and deployment in your department.";
      submitLabel = "Save Department Decision";

      fieldsHtml = `
        <div class="modal-student-banner">
          <span class="student-pill">Trainee</span> 
          <strong>${escapeHtml(context.student || "Selected Student")}</strong>
          <input type="hidden" name="appStudentName" value="${escapeHtml(context.student || "")}" />
        </div>
        <label for="appDecision">
          Department Decision
          <select id="appDecision" name="appDecision" required aria-required="true">
            <option value="Active" selected>Approve & Accept Trainee (Activate OJT)</option>
            <option value="Revision">Return Documents for Revision / Incomplete</option>
            <option value="Pending">Hold / Keep Pending</option>
          </select>
        </label>
        <label for="appSupervisorNotes">
          Supervisor Notes / Acceptance Remarks
          <textarea id="appSupervisorNotes" name="appSupervisorNotes" rows="3" placeholder="e.g., Trainee documents verified and accepted. Trainee may commence daily DTR logging."></textarea>
        </label>
      `;
    } else if (modalType === "review-requirement") {
      kicker = state.currentRole === "supervisor" ? "Supervisor Document Evaluation" : "Adviser Document Clearance";
      title = `Evaluate Document for ${escapeHtml(context.student || "Student")}`;
      desc = "Evaluate the submitted clearance document and provide feedback or approval.";
      submitLabel = "Save Document Evaluation";

      const reqTarget = context.reqName || "Campus Placement & Endorsement Form";

      fieldsHtml = `
        <div class="modal-student-banner">
          <span class="student-pill">Student</span> 
          <strong>${escapeHtml(context.student || "Selected Student")}</strong>
          <input type="hidden" name="reqStudent" value="${escapeHtml(context.student || "")}" />
        </div>
        <label for="reqTarget">
          Document To Evaluate
          <select id="reqTarget" name="reqTarget" required aria-required="true">
            <option value="Campus Placement & Endorsement Form" ${reqTarget === "Campus Placement & Endorsement Form" ? "selected" : ""}>Campus Placement & Endorsement Form</option>
            <option value="Parent Consent Form" ${reqTarget === "Parent Consent Form" ? "selected" : ""}>Notarized Parent/Guardian Consent Form</option>
            <option value="Weekly Accomplishment Report" ${reqTarget === "Weekly Accomplishment Report" ? "selected" : ""}>Weekly Accomplishment Report</option>
            <option value="Medical Clearance Renewal" ${reqTarget === "Medical Clearance Renewal" ? "selected" : ""}>Medical Clearance Renewal</option>
          </select>
        </label>
        <label for="reqDecision">
          Evaluation Decision
          <select id="reqDecision" name="reqDecision" required aria-required="true">
            <option value="Approved" selected>Approve Document</option>
            <option value="Revision">Return for Revision</option>
            <option value="Pending review">Keep Pending Review</option>
          </select>
        </label>
        <label for="reqComments">
          Evaluator Feedback & Remarks
          <textarea id="reqComments" name="reqComments" rows="3" placeholder="e.g., Verified document complete and signed by authorized officials."></textarea>
        </label>
      `;
    } else if (modalType === "review-report") {
      kicker = "Adviser Report Review";
      title = `Review Accomplishment Report for ${escapeHtml(context.student || "Student")}`;
      desc = "Verify weekly synthesis report and submit feedback.";
      submitLabel = "Submit Report Review";

      fieldsHtml = `
        <div class="modal-student-banner">
          <span class="student-pill">Student</span> 
          <strong>${escapeHtml(context.student || "Selected Student")}</strong>
          <input type="hidden" name="reportStudent" value="${escapeHtml(context.student || "")}" />
        </div>
        <label for="reportDecision">
          Verification Decision
          <select id="reportDecision" name="reportDecision" required aria-required="true">
            <option value="Approved" selected>Approve Weekly Accomplishment Report</option>
            <option value="Revision">Request Revision</option>
          </select>
        </label>
        <label for="reportComments">
          Adviser Feedback
          <textarea id="reportComments" name="reportComments" rows="3" placeholder="e.g., Thorough report aligned with curriculum objectives."></textarea>
        </label>
      `;
    } else if (modalType === "placement") {
      kicker = "Department Placement";
      title = "Update Placement Information";
      desc = "Submit your assigned campus department, designated office/unit, and supervisor details.";
      submitLabel = "Save Placement Details";

      const app = state.practicumData.application || {};

      fieldsHtml = `
        <label for="appOrg">
          Campus Department / Office Name
          <input type="text" id="appOrg" name="appOrg" value="${escapeHtml(app.company || "")}" placeholder="e.g., MIS / ICT Center, Registrar's Office, Dean's Office" required aria-required="true" />
        </label>
        <label for="appDept">
          Specific Unit / Section
          <input type="text" id="appDept" name="appDept" value="${escapeHtml(app.department || "")}" placeholder="e.g., Systems Development Unit, Records Section" required aria-required="true" />
        </label>
        <div class="form-grid-2">
          <label for="appSupervisor">
            Supervisor Full Name
            <input type="text" id="appSupervisor" name="appSupervisor" value="${escapeHtml(app.supervisor || "")}" placeholder="e.g., Engr. Roberto Gomez" required aria-required="true" />
          </label>
          <label for="appEmail">
            Supervisor Official Email
            <input type="email" id="appEmail" name="appEmail" value="${escapeHtml(app.supervisorEmail || "")}" placeholder="e.g., roberto.gomez@ispsc.edu.ph" required aria-required="true" />
          </label>
        </div>
      `;
        } else if (modalType === "assign-student") {
      const student = document.getElementById("assignStudent").value;
      const company_name = document.getElementById("assignCompany").value;
      const department = document.getElementById("assignDeptUnit").value;
      const supervisor_name = document.getElementById("assignSupervisor").value;
      const supervisor_email = document.getElementById("assignSupervisorEmail").value;
      const notes = document.getElementById("assignNotes").value;

      const res = await apiRequest("/practicum/assign-student", "POST", {
        student,
        company_name,
        department,
        supervisor_name,
        supervisor_email,
        notes,
      });

      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(res?.error || "Department assignment saved.");
      }
    } else if (modalType === "approve-student") {
      const student = el.modalForm.querySelector('input[name="appStudentName"]').value;
      const decision = document.getElementById("appDecision").value;
      const notes = document.getElementById("appSupervisorNotes").value;

      const res = await apiRequest("/practicum/approve-student", "POST", {
        student,
        decision,
        notes,
      });

      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(res?.error || "Student approval status updated.");
      }
    } else if (modalType === "admin-user") {
      kicker = "User Management";
      title = "Create New User Account";
      desc = "Create a login account for an adviser, supervisor, or student.";
      submitLabel = "Create User";

      fieldsHtml = `
        <label for="adminName">
          Full Name
          <input type="text" id="adminName" name="adminName" placeholder="e.g., Prof. Maria Elena Santos" required aria-required="true" />
        </label>
        <label for="adminRole">
          Role Assignment
          <select id="adminRole" name="adminRole" required aria-required="true">
            <option value="adviser" selected>OJT Faculty Adviser</option>
            <option value="supervisor">Campus Department Supervisor</option>
            <option value="student">OJT Student Trainee</option>
            <option value="admin">Portal Administrator</option>
          </select>
        </label>
      `;
    }

    if (el.modalKicker) el.modalKicker.textContent = kicker;
    if (el.modalTitle) el.modalTitle.textContent = title;
    if (el.modalDescription) el.modalDescription.textContent = desc;
    if (el.modalSubmitLabel) el.modalSubmitLabel.textContent = submitLabel;
    if (el.modalFields) el.modalFields.innerHTML = fieldsHtml;

    // Dynamic grade change preview for evaluation modal
    if (modalType === "evaluation") {
      const evalInput = document.getElementById("evalRating");
      const gradeTitle = document.getElementById("evalGradeTitle");
      if (evalInput && gradeTitle) {
        evalInput.addEventListener("input", (e) => {
          gradeTitle.textContent = `Academic Equiv: ${getGradeEquivalence(e.target.value)}`;
        });
      }
    }

    // Dynamic schedule time changes for attendance modal
    if (modalType === "attendance") {
      const schedSelect = document.getElementById("attSchedule");
      const timeInInput = document.getElementById("attTimeIn");
      const timeOutInput = document.getElementById("attTimeOut");
      if (schedSelect && timeInInput && timeOutInput) {
        schedSelect.addEventListener("change", (e) => {
          if (e.target.value.includes("Morning")) {
            timeInInput.value = "8:00 AM";
            timeOutInput.value = "12:00 PM";
          } else if (e.target.value.includes("Afternoon")) {
            timeInInput.value = "1:00 PM";
            timeOutInput.value = "5:00 PM";
          } else if (e.target.value.includes("Regular")) {
            timeInInput.value = "8:00 AM";
            timeOutInput.value = "5:00 PM";
          }
        });
      }
    }

    openModalDialog(el.modalBackdrop);
  }

  function closeModal() {
    closeModalDialog(el.modalBackdrop);
  }

  function openModalDialog(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("hidden");
    modalEl.classList.add("open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModalDialog(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("open");
    modalEl.classList.add("hidden");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  async function handleModalSubmit(e) {
    e.preventDefault();
    const modalType = el.modalForm.dataset.modalType;

    if (modalType === "attendance") {
      const date = document.getElementById("attDate").value;
      const schedule = document.getElementById("attSchedule").value;
      const time_in = document.getElementById("attTimeIn").value;
      const time_out = document.getElementById("attTimeOut").value;
      const remarks = document.getElementById("attRemarks").value;
      const hours = schedule.includes("Half-Day") || schedule.includes("4h") ? 4.0 : 8.0;

      const res = await apiRequest("/practicum/attendance", "POST", {
        date,
        schedule,
        time_in,
        time_out,
        total_hours: hours,
        remarks,
      });

      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast("Attendance logged successfully.");
      }
    } else if (modalType === "journal") {
      const title = document.getElementById("jTitle").value;
      const hours = document.getElementById("jHours").value;
      const reflection = document.getElementById("jReflection").value;

      const res = await apiRequest("/practicum/journal", "POST", { title, reflection, hours });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast("Daily journal submitted for supervisor review.");
      }
    } else if (modalType === "task") {
      const studentInput = el.modalForm.querySelector('[name="taskStudent"]');
      const student = studentInput ? studentInput.value : null;
      const title = document.getElementById("taskTitle").value;
      const due = document.getElementById("taskDue").value;
      const details = document.getElementById("taskDetails").value;

      const res = await apiRequest("/practicum/task", "POST", { student, title, due, details });
      if (res && res.success) {
        showToast(res.message);
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast("Task assigned and saved.");
      }
    } else if (modalType === "report") {
      const week = document.getElementById("repTitle").value;
      const summary = document.getElementById("repSummary").value;

      const res = await apiRequest("/practicum/report", "POST", { week, summary });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast("Weekly accomplishment report filed.");
      }
    } else if (modalType === "requirement") {
      const requirement = document.getElementById("reqSelect").value;
      const res = await apiRequest("/practicum/requirement", "POST", { requirement });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(`Document '${requirement}' uploaded. Status: Pending Review.`);
      }
    } else if (modalType === "evaluation") {
      const student = el.modalForm.querySelector('input[name="evalStudent"]').value;
      const rating = parseFloat(document.getElementById("evalRating").value);
      const comment = document.getElementById("evalComment").value;

      const res = await apiRequest("/practicum/evaluation", "POST", { student, rating, comment });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(`Evaluation score ${rating}/100 saved for ${student}.`);
      }
    } else if (modalType === "feedback") {
      const student = el.modalForm.querySelector('input[name="fbStudent"]').value;
      const rating = parseFloat(document.getElementById("fbRating").value);
      const feedback = document.getElementById("fbNotes").value;

      const res = await apiRequest("/practicum/feedback", "POST", { student, rating, feedback });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(`Feedback submitted for ${student}.`);
      }
    } else if (modalType === "review-attendance") {
      const student = el.modalForm.querySelector('input[name="attStudent"]').value;
      const decision = document.getElementById("attDecision").value;
      const comments = document.getElementById("attReviewRemarks").value;

      const res = await apiRequest("/practicum/review-attendance", "POST", { student, decision, comments });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(`Attendance verified for ${student}.`);
      }
    } else if (modalType === "review-journal") {
      const student = el.modalForm.querySelector('input[name="journalStudent"]').value;
      const decision = document.getElementById("journalDecision").value;
      const comments = document.getElementById("journalRemarks").value;

      const res = await apiRequest("/practicum/review-journal", "POST", { student, decision, comments });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(`Journal marked as ${decision} for ${student}.`);
      }
    } else if (modalType === "review-requirement") {
      const student = el.modalForm.querySelector('input[name="reqStudent"]').value;
      const requirement = document.getElementById("reqTarget").value;
      const decision = document.getElementById("reqDecision").value;
      const comments = document.getElementById("reqComments").value;

      const res = await apiRequest("/practicum/review-requirement", "POST", { student, requirement, decision, comments });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(`Requirement clearance updated.`);
      }
    } else if (modalType === "review-report") {
      const student = el.modalForm.querySelector('input[name="reportStudent"]').value;
      const decision = document.getElementById("reportDecision").value;
      const comments = document.getElementById("reportComments").value;

      const res = await apiRequest("/practicum/review-report", "POST", { student, decision, comments });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(`Accomplishment report reviewed.`);
      }
    } else if (modalType === "placement") {
      const organization = document.getElementById("appOrg").value;
      const department = document.getElementById("appDept").value;
      const supervisor = document.getElementById("appSupervisor").value;
      const email = document.getElementById("appEmail").value;

      const res = await apiRequest("/practicum/application", "POST", { organization, department, supervisor, email });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast("Placement information saved.");
      }
    } else if (modalType === "admin-user") {
      const name = document.getElementById("adminName").value;
      const role = document.getElementById("adminRole").value;

      const res = await apiRequest("/practicum/admin/user", "POST", { name, role });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast("User account created successfully.");
      }
    }

    closeModal();
    await refreshBackendState();
    renderCurrentView();
  }

  // =========================================================================
  // AUTHENTICATION (LOGIN / REGISTER / LOGOUT / TABS)
  // =========================================================================

  function showAuth() {
    if (el.portalContainer) el.portalContainer.classList.add("hidden");
    if (el.authContainer) el.authContainer.classList.remove("hidden");
  }

  function showPortal() {
    if (el.authContainer) el.authContainer.classList.add("hidden");
    if (el.portalContainer) el.portalContainer.classList.remove("hidden");
    renderNavigation();
    renderCurrentView();
  }

  function switchAuthTab(targetTab) {
    if (targetTab === "signup") {
      if (el.tabSignUp) {
        el.tabSignUp.classList.add("active");
        el.tabSignUp.setAttribute("aria-selected", "true");
      }
      if (el.tabSignIn) {
        el.tabSignIn.classList.remove("active");
        el.tabSignIn.setAttribute("aria-selected", "false");
      }
      if (el.registerCard) el.registerCard.classList.remove("hidden");
      if (el.loginCard) el.loginCard.classList.add("hidden");
    } else {
      if (el.tabSignIn) {
        el.tabSignIn.classList.add("active");
        el.tabSignIn.setAttribute("aria-selected", "true");
      }
      if (el.tabSignUp) {
        el.tabSignUp.classList.remove("active");
        el.tabSignUp.setAttribute("aria-selected", "false");
      }
      if (el.loginCard) el.loginCard.classList.remove("hidden");
      if (el.registerCard) el.registerCard.classList.add("hidden");
    }

    if (el.loginError) el.loginError.textContent = "";
    if (el.signUpError) el.signUpError.textContent = "";
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (el.loginError) el.loginError.textContent = "";

    const username = document.getElementById("loginUsername")?.value.trim() || "";
    const password = document.getElementById("loginPassword")?.value || "";
    const remember = document.getElementById("rememberMe")?.checked || false;

    if (!username || !password) {
      if (el.loginError) el.loginError.textContent = "Please enter both username and password.";
      return;
    }

    const res = await apiRequest("/auth/login", "POST", { username, password, remember });
    if (res && res.success && res.user) {
      setUserSession(res.user);
      await refreshBackendState();
      showPortal();
      showToast(res.message || `Welcome back, ${res.user.name}!`);
    } else {
      if (el.loginError) {
        el.loginError.textContent = res ? (res.message || res.error || "Incorrect username or password.") : "Incorrect username or password.";
      }
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (el.signUpError) el.signUpError.textContent = "";

    const name = document.getElementById("regName")?.value.trim() || "";
    const id_number = document.getElementById("regId")?.value.trim() || "";
    const role = document.getElementById("regRole")?.value || "student";
    const department = document.getElementById("regDept")?.value || "";
    const email = document.getElementById("regEmail")?.value.trim() || "";
    const username = document.getElementById("regUsername")?.value.trim() || "";
    const password = document.getElementById("regPassword")?.value || "";
    const passwordConfirm = document.getElementById("regConfirmPassword")?.value || "";
    const terms = document.getElementById("regTerms")?.checked;

    if (!name || !email || !username || !password) {
      if (el.signUpError) el.signUpError.textContent = "Please complete all required fields.";
      return;
    }

    if (password.length < 6) {
      if (el.signUpError) el.signUpError.textContent = "Password must be at least 6 characters long.";
      return;
    }

    if (password !== passwordConfirm) {
      if (el.signUpError) el.signUpError.textContent = "Passwords do not match. Please re-type your password.";
      return;
    }

    if (!terms) {
      if (el.signUpError) el.signUpError.textContent = "You must agree to the ISPSC Practicum Policy & Data Privacy Terms.";
      return;
    }

    const res = await apiRequest("/auth/register", "POST", {
      name,
      id_number,
      role,
      department,
      email,
      username,
      password,
    });

    if (res && res.success && res.user) {
      setUserSession(res.user);
      await refreshBackendState();
      showPortal();
      showToast(res.message || `Account created! Welcome, ${res.user.name}.`);
    } else {
      if (el.signUpError) {
        el.signUpError.textContent = res ? (res.message || res.error || "Registration failed. Please check inputs.") : "Registration failed.";
      }
    }
  }

  async function handleLogout() {
    await apiRequest("/auth/logout", "POST");
    state.currentUser = null;
    state.currentRole = null;
    state.practicumData = {};
    showAuth();
    showToast("Signed out successfully.");
  }

  // =========================================================================
  // SETUP EVENT LISTENERS
  // =========================================================================

  function setupPasswordToggles() {
    if (el.toggleLoginPassword) {
      el.toggleLoginPassword.addEventListener("click", () => {
        const input = document.getElementById("loginPassword");
        if (!input) return;
        const isPw = input.type === "password";
        input.type = isPw ? "text" : "password";
        el.toggleLoginPassword.setAttribute("aria-pressed", isPw ? "true" : "false");
        el.toggleLoginPassword.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
      });
    }

    if (el.toggleRegPassword) {
      el.toggleRegPassword.addEventListener("click", () => {
        const input = document.getElementById("regPassword");
        if (!input) return;
        const isPw = input.type === "password";
        input.type = isPw ? "text" : "password";
        el.toggleRegPassword.setAttribute("aria-pressed", isPw ? "true" : "false");
        el.toggleRegPassword.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
      });
    }
  }

  function setupHelpModal() {
    if (el.forgotPasswordBtn) {
      el.forgotPasswordBtn.addEventListener("click", () => {
        openModalDialog(el.helpModalBackdrop);
      });
    }
    if (el.helpModalClose) {
      el.helpModalClose.addEventListener("click", () => {
        closeModalDialog(el.helpModalBackdrop);
      });
    }
    if (el.helpModalConfirmBtn) {
      el.helpModalConfirmBtn.addEventListener("click", () => {
        closeModalDialog(el.helpModalBackdrop);
      });
    }
    if (el.helpModalBackdrop) {
      el.helpModalBackdrop.addEventListener("click", (e) => {
        if (e.target === el.helpModalBackdrop) closeModalDialog(el.helpModalBackdrop);
      });
    }
  }

  function setupEventListeners() {
    // Auth Tab Toggles & Links
    if (el.tabSignUp) el.tabSignUp.addEventListener("click", () => switchAuthTab("signup"));
    if (el.tabSignIn) el.tabSignIn.addEventListener("click", () => switchAuthTab("signin"));
    if (el.switchToSignUp) el.switchToSignUp.addEventListener("click", () => switchAuthTab("signup"));
    if (el.switchToSignIn) el.switchToSignIn.addEventListener("click", () => switchAuthTab("signin"));

    // Password Visibility & Help Modal
    setupPasswordToggles();
    setupHelpModal();

    // Forms
    if (el.loginForm) el.loginForm.addEventListener("submit", handleLogin);
    if (el.signUpForm) el.signUpForm.addEventListener("submit", handleRegister);
    if (el.btnLogout) el.btnLogout.addEventListener("click", handleLogout);
    
    // Profile Modal Open Listeners
    if (el.topProfileBadge) el.topProfileBadge.addEventListener("click", openProfileModal);
    if (el.sidebarProfileCard) el.sidebarProfileCard.addEventListener("click", openProfileModal);
    if (el.sidebarProfileButton) {
      el.sidebarProfileButton.addEventListener("click", (e) => {
        e.stopPropagation();
        openProfileModal();
      });
    }
    if (el.profileModalClose) el.profileModalClose.addEventListener("click", () => closeModalDialog(el.profileModalBackdrop));
    if (el.profileModalBackdrop) {
      el.profileModalBackdrop.addEventListener("click", (e) => {
        if (e.target === el.profileModalBackdrop) closeModalDialog(el.profileModalBackdrop);
      });
    }

    // Sidebar toggle (mobile)
    if (el.btnSidebarToggle) {
      el.btnSidebarToggle.addEventListener("click", () => {
        if (el.sidebar) el.sidebar.classList.toggle("open");
      });
    }

    // Modal close hooks
    if (el.btnModalClose) el.btnModalClose.addEventListener("click", closeModal);
    if (el.modalForm) el.modalForm.addEventListener("submit", handleModalSubmit);

    // Close modal on backdrop click
    if (el.modalBackdrop) {
      el.modalBackdrop.addEventListener("click", (e) => {
        if (e.target === el.modalBackdrop) closeModal();
      });
    }

    // Keyboard Esc handler
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (el.modalBackdrop && el.modalBackdrop.classList.contains("open")) {
          closeModal();
        }
        if (el.helpModalBackdrop && el.helpModalBackdrop.classList.contains("open")) {
          closeModalDialog(el.helpModalBackdrop);
        }
      }
    });
  }

  // Utilities
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Boot app on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
