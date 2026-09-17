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
    currentView: "application",
    practicumData: {},
    isLoading: false,
    activeSubTab: "all",
    selectedDepartmentFilter: "all",
    lastRequirementSubmission: null,
  };

  // DOM Elements Cache
  const el = {
    authContainer: document.getElementById("loginScreen"),
    portalContainer: document.getElementById("appShell"),
    loginCard: document.getElementById("signInContainer"),
    registerCard: document.getElementById("signUpContainer"),
    authTabs: document.querySelector(".auth-tabs"),
    tabSignIn: document.getElementById("tabSignIn"),
    tabSignUp: document.getElementById("tabSignUp"),
    switchToSignUp: document.getElementById("switchToSignUp"),
    switchToSignIn: document.getElementById("switchToSignIn"),
    loginForm: document.getElementById("loginForm"),
    signUpForm: document.getElementById("signUpForm"),
    loginError: document.getElementById("loginError"),
    signUpError: document.getElementById("signUpError"),
    forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),
    forgotPasswordContainer: document.getElementById("forgotPasswordContainer"),
    otpVerifyContainer: document.getElementById("otpVerifyContainer"),
    resetPasswordContainer: document.getElementById("resetPasswordContainer"),
    forgotPasswordForm: document.getElementById("forgotPasswordForm"),
    otpVerifyForm: document.getElementById("otpVerifyForm"),
    resetPasswordForm: document.getElementById("resetPasswordForm"),
    forgotError: document.getElementById("forgotError"),
    otpError: document.getElementById("otpError"),
    resetError: document.getElementById("resetError"),
    forgotBackToLoginBtn: document.getElementById("forgotBackToLoginBtn"),
    otpBackToForgotBtn: document.getElementById("otpBackToForgotBtn"),
    resetBackToLoginBtn: document.getElementById("resetBackToLoginBtn"),
    resendOtpBtn: document.getElementById("resendOtpBtn"),
    helpModalBackdrop: document.getElementById("helpModalBackdrop"),
    helpModalClose: document.getElementById("helpModalClose"),
    helpModalConfirmBtn: document.getElementById("helpModalConfirmBtn"),
    toggleLoginPassword: document.getElementById("toggleLoginPassword"),
    toggleRegPassword: document.getElementById("toggleRegPassword"),
    toggleRegConfirmPassword: document.getElementById("toggleRegConfirmPassword"),
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
      Accept: "application/json",
      "X-CSRF-TOKEN": getCsrfToken(),
      "X-Requested-With": "XMLHttpRequest",
    };

    if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";

    const options = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = body instanceof FormData ? body : JSON.stringify(body);
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
    openResetLink();
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
        state.currentView = "application";
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
      { id: "supervisor-students", label: "Trainees & Department Approval", icon: "&#128101;" },
      { id: "supervisor-eval-docs", label: "Evaluate Trainee Documents", icon: "&#128196;" },
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

  
  function openMobileSidebar() {
    if (el.sidebar) el.sidebar.classList.add("open");
    if (el.sidebarBackdrop) el.sidebarBackdrop.classList.add("open");
    if (window.innerWidth <= 900) document.body.style.overflow = "hidden";
  }

  function closeMobileSidebar() {
    if (el.sidebar) el.sidebar.classList.remove("open");
    if (el.sidebarBackdrop) el.sidebarBackdrop.classList.remove("open");
    document.body.style.overflow = "";
  }

  function renderNavigation() {
    if (!el.sidebarNav || !state.currentRole) return;
    const items = navConfigurations[state.currentRole] || [];

    el.sidebarNav.innerHTML = items
      .map(
        (item) => `
        <button class="nav-item ${state.currentView === item.id ? "active" : ""}" data-view="${item.id}" type="button">
          <span class="nav-icon" aria-hidden="true">${item.icon}</span>
          <span class="nav-text">${item.label}</span>
        </button>
      `
      )
      .join("");

    el.sidebarNav.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.currentView = btn.dataset.view;
        renderNavigation();
        renderCurrentView();
        if (window.innerWidth <= 900) {
          closeMobileSidebar();
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
      "supervisor-students": "Trainees & Department Approval",
      "supervisor-eval-docs": "Evaluate Trainee Clearance Documents",
      "attendance-mgmt": "Daily Time Record (DTR) Verification",
      "tasks-mgmt": "Workplace Tasks & Project Deliverables",
      "journal-mgmt": "Review Trainee Reflection Journals",
      "feedback-mgmt": "Supervisory Mentorship & Coaching",
      "eval-mgmt": "Midterm & Final Workplace Evaluation",
      "adviser-students": "Student Advisees Roster & Compliance",
      "requirements-mgmt": "Verify Clearance Documents",
      "reports-mgmt": "Accomplishment Reports Verification",
      "adviser-appraisal": "Student Workplace Appraisals",
      "admin-users": "System User Directory & Roles",
      "admin-placements": "Campus Departments & Placement Management",
      "admin-logs": "Institutional Audit Logs",
      reports: "Accomplishment Reports",
      feedback: "Supervisor Performance Feedback",
      evaluation: "Midterm & Final Workplace Evaluation",
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
          renderStudentApplication();
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
    const app = d.application;

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

        ${
          app
            ? `
          <div class="panel" style="margin-bottom:20px; border-left:4px solid ${app.status === "Active" ? "#4b6607" : "#d97706"}; background:${app.status === "Active" ? "#f9fcf6" : "#fffbeb"};">
            <div class="panel-header" style="padding-bottom:10px;">
              <div>
                <span class="eyebrow" style="color:${app.status === "Active" ? "#4b6607" : "#b45309"}; font-weight:700;">
                  ${app.status === "Active" ? "&#10003; Official Department Placement Approved" : "&#9888; Campus Department Placement Assigned &bull; Action Required"}
                </span>
                <h3 style="margin:4px 0 2px; font-size:16px;">${escapeHtml(app.company)} &bull; ${escapeHtml(app.department)}</h3>
                <p style="margin:0; font-size:13px; color:#4a5b60;">
                  Designated Supervisor: <strong>${escapeHtml(app.supervisor)}</strong> ${app.supervisorEmail ? `(${escapeHtml(app.supervisorEmail)})` : ""}
                </p>
              </div>
              <span class="status ${app.status === "Active" ? "status-green" : "status-yellow"}" style="font-size:12px;">
                ${app.status === "Active" ? "&#10003; Approved" : "Pending Supervisor Approval"}
              </span>
            </div>
            ${
              app.notes
                ? `<div style="font-size:12.5px; color:#53676e; background:rgba(255,255,255,0.7); padding:8px 12px; border-radius:6px; margin:6px 0 12px;">
                    <strong>Directives / Notes:</strong> ${escapeHtml(app.notes)}
                  </div>`
                : ""
            }
            ${
              app.status !== "Active"
                ? `<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding-top:4px;">
                    <p style="margin:0; font-size:12.5px; color:#92400e;">
                      Please submit your documentary requirements (Endorsement Form, Parent Consent, Medical Clearance) to your Department Supervisor for official approval.
                    </p>
                    <button class="primary-button" id="btnOverviewSubmitDocs" style="padding:6px 14px; font-size:12px;" type="button">
                      &#128196; Submit Clearance Documents
                    </button>
                  </div>`
                : `<div style="display:flex; justify-content:flex-end;">
                    <button class="secondary-button" id="btnOverviewViewPlacement" style="padding:5px 12px; font-size:12px;" type="button">
                      View Full Placement Details &rarr;
                    </button>
                  </div>`
            }
          </div>
        `
            : `
          <div class="panel" style="margin-bottom:20px; border-left:4px solid #3b82f6; background:#eff6ff;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div>
                <h4 style="margin:0 0 4px; color:#1e40af;">Awaiting Campus Department Assignment</h4>
                <p style="margin:0; font-size:13px; color:#3b82f6;">Your OJT Faculty Adviser will assign your host campus department and supervisor.</p>
              </div>
              <button class="secondary-button" id="btnOverviewViewPlacement" style="padding:6px 12px; font-size:12px;" type="button">Placement Details</button>
            </div>
          </div>
        `
        }

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
                          <td>${escapeHtml(log.schedule)} (${escapeHtml(log.timeIn)} &ndash; ${escapeHtml(log.timeOut)})</td>
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
                  ? '<div style="text-align:center; padding:20px; color:#6c7b80;">No tasks assigned yet.</div>'
                  : (d.tasks || [])
                      .slice(0, 4)
                      .map(
                        (t) => `
                    <div class="task-item ${t.done ? "task-done" : ""}">
                      <input type="checkbox" class="task-check" data-id="${t.id}" ${t.done ? "checked" : ""} aria-label="Mark task done" />
                      <div class="task-content">
                        <strong>${escapeHtml(t.title)}</strong>
                        <p>${escapeHtml(t.details || "")}</p>
                        <span class="task-due">Due: ${escapeHtml(t.due)} &bull; ${escapeHtml(t.meta || "Department Task")}</span>
                      </div>
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

    // Hook overview buttons
    document.getElementById("btnOverviewSubmitDocs")?.addEventListener("click", () => {
      state.currentView = "requirements";
      renderNavigation();
      renderCurrentView();
    });

    document.getElementById("btnOverviewViewPlacement")?.addEventListener("click", () => {
      state.currentView = "application";
      renderNavigation();
      renderCurrentView();
    });

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
            <p class="eyebrow">Institutional Practicum Record &bull; Read-Only</p>
            <h1 class="page-title">Campus Placement Details</h1>
            <p>Official in-campus department endorsement and designated supervisor assignment recorded by the OJT Faculty Adviser.</p>
          </div>
          <div class="date-chip" style="background:#eef6e8; border:1px solid #cce2bf; color:#2e4402; font-weight:600; font-size:12px;">
            &#128274; Read-Only (Managed by OJT Adviser)
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Assigned Campus Department & Supervisor</h3>
              <p>Official placement details recorded with the ISPSC OJT Office</p>
            </div>
            <span class="status ${app && app.status === "Active" ? "status-green" : app ? "status-yellow" : "status-coral"}">
              ${app ? (app.status === "Active" ? "&#10003; Approved" : "Pending Supervisor Approval") : "Awaiting Adviser Assignment"}
            </span>
          </div>

          ${
            app
              ? `
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Placement Reference ID</span>
                <span class="detail-value"><strong>${escapeHtml(app.id)}</strong></span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Academic Period</span>
                <span class="detail-value">${escapeHtml(app.period || "AY 2025–2026")}</span>
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
                <span class="detail-value"><strong>${escapeHtml(app.supervisor)}</strong></span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Supervisor Institutional Email</span>
                <span class="detail-value">${escapeHtml(app.supervisorEmail || "—")}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Authorized Shift Hours</span>
                <span class="detail-value">${escapeHtml(app.officeHours || "8:00 AM – 5:00 PM (Mon–Fri)")}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date Assigned / Endorsed</span>
                <span class="detail-value">${escapeHtml(app.dateSubmitted)}</span>
              </div>
            </div>

            ${
              app.notes
                ? `<div style="margin-top:16px; padding:12px 14px; background:#f5f8fa; border:1px solid #d5e1e6; border-radius:8px; font-size:13px; color:#3b4e54;">
                    <strong>Adviser Directives & Placement Notes:</strong><br />
                    ${escapeHtml(app.notes)}
                  </div>`
                : ""
            }

            <div style="margin-top:20px; padding-top:14px; border-top:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <p style="margin:0; font-size:12px; color:var(--muted);">
                &bull; Note: Department assignments are configured and verified exclusively by your OJT Faculty Adviser. If you need modifications, please consult your adviser.
              </p>
              ${
                app.status !== "Active"
                  ? `<button class="primary-button" id="btnPlacementSubmitDocs" style="padding:6px 14px; font-size:12px;" type="button">
                      &#128196; Submit Clearance Documents
                    </button>`
                  : ""
              }
            </div>
          `
              : `
            <div style="text-align:center; padding:36px 20px; color:#6c7b80;">
              <div style="font-size:32px; margin-bottom:10px;">&#127970;</div>
              <h4 style="margin:0 0 6px; color:#17212b;">Awaiting Official Campus Department Assignment</h4>
              <p style="margin:0 auto; max-width:440px; font-size:13px; line-height:1.5;">
                Your OJT Faculty Adviser is currently assigning your host campus department, designated unit, and supervisor. Your official placement details will appear here once assigned.
              </p>
            </div>
          `
          }
        </div>
      </div>
    `;

    document.getElementById("btnPlacementSubmitDocs")?.addEventListener("click", () => {
      state.currentView = "requirements";
      renderNavigation();
      renderCurrentView();
    });
  }

  function renderStudentRequirements() {
    const reqs = state.practicumData.requirements || [];
    const submission = state.lastRequirementSubmission;

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Clearance & Compliance</p>
            <h1 class="page-title">Documentary Requirements</h1>
            <p>Institutional clearances verified by your OJT Faculty Adviser and Department Supervisor.</p>
          </div>
          <button class="primary-button" id="btnUploadReq" type="button">&#128196; Upload Requirement</button>
        </div>

        ${submission ? `
          <div class="submission-success-banner" role="status">
            <strong>Document submitted successfully.</strong>
            <span>${escapeHtml(submission.name)} is now waiting for Supervisor / Adviser review.</span>
          </div>
        ` : ""}

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
                  <tr class="${submission && r.name === submission.name && r.status === "Pending review" ? "requirement-submitted-row" : ""}">
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
  // VIEW RENDERERS: SUPERVISOR (STRICTLY SCOPED TO SUPERVISOR'S DEPARTMENT)
  // =========================================================================

  function renderSupervisorViews(view) {
    const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];
    const studentReqs = state.practicumData.studentRequirements || [];
    const attendances = state.practicumData.attendanceLogs || [];
    const tasks = state.practicumData.tasks || [];
    const journals = state.practicumData.journals || [];
    const feedbacks = state.practicumData.feedbacks || [];
    const evaluations = state.practicumData.evaluations || [];
    const deptName = state.practicumData.supervisorDepartment || state.currentUser?.department || "Campus Host Department";

    const supervisorDeptBadge = `
      <div class="dept-scope-badge">
        <span class="dept-icon">&#127970;</span>
        <span>Host Department: <strong>${escapeHtml(deptName)}</strong></span>
        <span class="dept-pill-badge">&#128274; Department Restricted</span>
      </div>
    `;

    // =========================================================================
    // VIEW: EVALUATE TRAINEE DOCUMENTS
    // =========================================================================
    if (view === "supervisor-eval-docs") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Department Supervisor Clearance</p>
              <h1 class="page-title">Evaluate Trainee Clearance Documents</h1>
              <p>Review and evaluate mandatory documents submitted by OJT students deployed in your department. Approve trainees once documents are verified.</p>
              ${supervisorDeptBadge}
            </div>
            ${students.length > 0 ? '<button class="btn-approve-student" id="btnSupervisorEvalDocApproveTrainee" type="button">&#10003; Approve Student Placement</button>' : ''}
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Submitted Trainee Documents & Clearances</h3>
                <p>Verify endorsement forms, parent consent, medical clearances, and department compliance</p>
              </div>
              <span class="score-badge">${studentReqs.length} Total Submissions</span>
            </div>

            ${
              students.length === 0
                ? `<div class="dept-empty-box">
                    <div class="empty-icon">&#127970;</div>
                    <h3>No Trainees Assigned to ${escapeHtml(deptName)}</h3>
                    <p>Only students assigned to your department are visible here. Coordinate with the OJT Faculty Adviser for student endorsements.</p>
                  </div>`
                : `
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
            `
            }
          </div>
        </div>
      `;

      document.getElementById("btnSupervisorEvalDocApproveTrainee")?.addEventListener("click", () => {
        if (students.length > 0) {
          openModal("approve-student", { student: students[0].name });
        }
      });
      return;
    }

    // =========================================================================
    // VIEW: VERIFY ATTENDANCE (DTR)
    // =========================================================================
    if (view === "attendance-mgmt") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Supervisory Attendance Verification</p>
              <h1 class="page-title">Daily Time Record (DTR) Verification</h1>
              <p>Review and verify daily attendance logs, shifts, and rendered hours of assigned practicum trainees.</p>
              ${supervisorDeptBadge}
            </div>
            ${students.length > 0 ? '<button class="primary-button" id="btnSupervisorLogDtrForStudent" type="button">&#9719; Verify Trainee Shift</button>' : ''}
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Trainee Shift & Attendance Logs</h3>
                <p>Logs submitted by trainees for morning, afternoon, and regular shifts</p>
              </div>
              <span class="score-badge">${attendances.length} Total Logs</span>
            </div>

            ${
              students.length === 0
                ? `<div class="dept-empty-box">
                    <div class="empty-icon">&#127970;</div>
                    <h3>No Trainees Assigned to ${escapeHtml(deptName)}</h3>
                    <p>Only students assigned to your department are visible here.</p>
                  </div>`
                : `
              <div class="table-wrap">
                <table class="data-table" aria-label="Attendance Verification Table">
                  <thead>
                    <tr>
                      <th>Trainee Name</th>
                      <th>Date</th>
                      <th>Schedule</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Hours Rendered</th>
                      <th>Status</th>
                      <th>Trainee Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      attendances.length === 0
                        ? '<tr><td colspan="9" style="text-align:center; padding:24px; color:#6c7b80;">No attendance records submitted yet.</td></tr>'
                        : attendances
                            .map(
                              (a) => `
                          <tr>
                            <td><strong>${escapeHtml(a.studentName)}</strong></td>
                            <td><strong>${escapeHtml(a.date)}</strong></td>
                            <td>${escapeHtml(a.schedule || "Regular")}</td>
                            <td>${escapeHtml(a.timeIn)}</td>
                            <td>${escapeHtml(a.timeOut)}</td>
                            <td><span class="score-badge">${escapeHtml(a.total)}</span></td>
                            <td><span class="status ${a.status === "Present" ? "status-green" : a.status === "Late" ? "status-yellow" : "status-coral"}">&#10003; ${escapeHtml(a.status)}</span></td>
                            <td>${escapeHtml(a.remarks || "—")}</td>
                            <td>
                              <button class="secondary-button" style="padding:5px 10px; font-size:11.5px;" onclick="window.supervisorAction('attendance', '${escapeHtml(a.studentName)}')">
                                &#9719; Verify Shift
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
            `
            }
          </div>
        </div>
      `;

      document.getElementById("btnSupervisorLogDtrForStudent")?.addEventListener("click", () => {
        if (students.length > 0) {
          openModal("review-attendance", { student: students[0].name });
        }
      });
      return;
    }

    // =========================================================================
    // VIEW: ASSIGNED WORK TASKS
    // =========================================================================
    if (view === "tasks-mgmt") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Department Deliverables & Assignments</p>
              <h1 class="page-title">Assigned Workplace Tasks</h1>
              <p>Create, assign, and track technical deliverables, maintenance duties, and department assignments for trainees.</p>
              ${supervisorDeptBadge}
            </div>
            ${students.length > 0 ? '<button class="primary-button" id="btnSupervisorCreateTask" type="button">&#43; Assign New Task</button>' : ''}
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Department Tasks Roster</h3>
                <p>Ongoing and completed project deliverables assigned to department trainees</p>
              </div>
              <span class="score-badge">${tasks.length} Total Tasks</span>
            </div>

            ${
              students.length === 0
                ? `<div class="dept-empty-box">
                    <div class="empty-icon">&#127970;</div>
                    <h3>No Trainees Assigned to ${escapeHtml(deptName)}</h3>
                    <p>When trainees are assigned to your department, you can assign them workplace tasks and projects.</p>
                  </div>`
                : `
              <div class="table-wrap">
                <table class="data-table" aria-label="Tasks Management Table">
                  <thead>
                    <tr>
                      <th>Assigned Trainee</th>
                      <th>Task Title</th>
                      <th>Work Details / Deliverable</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      tasks.length === 0
                        ? '<tr><td colspan="6" style="text-align:center; padding:24px; color:#6c7b80;">No tasks assigned yet. Click "+ Assign New Task" to create one.</td></tr>'
                        : tasks
                            .map(
                              (t) => `
                          <tr>
                            <td><strong>${escapeHtml(t.studentName)}</strong></td>
                            <td><strong>${escapeHtml(t.title)}</strong></td>
                            <td style="max-width:280px;">${escapeHtml(t.details || "—")}</td>
                            <td>${escapeHtml(t.due)}</td>
                            <td>
                              <span class="status ${t.done ? "status-green" : "status-yellow"}">
                                ${t.done ? "&#10003; Completed" : "In Progress"}
                              </span>
                            </td>
                            <td>
                              <button class="secondary-button" style="padding:5px 10px; font-size:11.5px;" onclick="window.supervisorAction('task', '${escapeHtml(t.studentName)}')">
                                &#43; Assign Another
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
            `
            }
          </div>
        </div>
      `;

      document.getElementById("btnSupervisorCreateTask")?.addEventListener("click", () => openModal("task"));
      return;
    }

    // =========================================================================
    // VIEW: REVIEW DAILY JOURNALS
    // =========================================================================
    if (view === "journal-mgmt") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Trainee Daily Journal Review</p>
              <h1 class="page-title">Review Trainee Reflection Journals</h1>
              <p>Review daily activities, technical learnings, and reflections submitted by students. Provide supervisory feedback.</p>
              ${supervisorDeptBadge}
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Submitted Reflection Journals</h3>
                <p>Daily learning synthesis and hours claimed by practicum trainees</p>
              </div>
              <span class="score-badge">${journals.length} Submissions</span>
            </div>

            ${
              students.length === 0
                ? `<div class="dept-empty-box">
                    <div class="empty-icon">&#127970;</div>
                    <h3>No Trainees Assigned to ${escapeHtml(deptName)}</h3>
                    <p>Reflection journals submitted by students assigned to your department will appear here.</p>
                  </div>`
                : `
              <div class="table-wrap">
                <table class="data-table" aria-label="Journal Review Table">
                  <thead>
                    <tr>
                      <th>Trainee Name</th>
                      <th>Date</th>
                      <th>Journal Topic / Title</th>
                      <th>Reflection Summary</th>
                      <th>Claimed Hours</th>
                      <th>Review Status</th>
                      <th>Supervisor Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      journals.length === 0
                        ? '<tr><td colspan="8" style="text-align:center; padding:24px; color:#6c7b80;">No reflection journals submitted yet.</td></tr>'
                        : journals
                            .map(
                              (j) => `
                          <tr>
                            <td><strong>${escapeHtml(j.studentName)}</strong></td>
                            <td><strong>${escapeHtml(j.date)}</strong></td>
                            <td><strong>${escapeHtml(j.title)}</strong></td>
                            <td style="max-width:260px;">${escapeHtml(j.reflection || "—")}</td>
                            <td><span class="score-badge">${escapeHtml(j.hours)} hrs</span></td>
                            <td>
                              <span class="status ${j.status === "Approved" ? "status-green" : j.status === "Revision" ? "status-coral" : "status-yellow"}">
                                ${escapeHtml(j.status)}
                              </span>
                            </td>
                            <td>${escapeHtml(j.remarks || "—")}</td>
                            <td>
                              <button class="secondary-button" style="padding:5px 10px; font-size:11.5px;" onclick="window.supervisorAction('journal', '${escapeHtml(j.studentName)}')">
                                &#9998; Review Journal
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
            `
            }
          </div>
        </div>
      `;
      return;
    }

    // =========================================================================
    // VIEW: SUPERVISORY COACHING
    // =========================================================================
    if (view === "feedback-mgmt") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Mentorship & Supervisory Guidance</p>
              <h1 class="page-title">Supervisory Coaching & Feedback</h1>
              <p>Provide constructive mentoring, feedback ratings, and commendations for assigned student trainees.</p>
              ${supervisorDeptBadge}
            </div>
            ${students.length > 0 ? '<button class="primary-button" id="btnSupervisorAddFeedback" type="button">&#9825; Give Coaching Feedback</button>' : ''}
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Coaching & Feedback History</h3>
                <p>Mentorship logs and supervisory ratings given to practicum students</p>
              </div>
              <span class="score-badge">${feedbacks.length} Feedback Logs</span>
            </div>

            ${
              students.length === 0
                ? `<div class="dept-empty-box">
                    <div class="empty-icon">&#127970;</div>
                    <h3>No Trainees Assigned to ${escapeHtml(deptName)}</h3>
                    <p>You can give coaching feedback once students are deployed in your department.</p>
                  </div>`
                : `
              <div class="table-wrap">
                <table class="data-table" aria-label="Supervisor Feedback Table">
                  <thead>
                    <tr>
                      <th>Trainee Name</th>
                      <th>Coaching Rating</th>
                      <th>Supervisor Coaching Notes & Advice</th>
                      <th>Date Provided</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      feedbacks.length === 0
                        ? '<tr><td colspan="5" style="text-align:center; padding:24px; color:#6c7b80;">No coaching feedback recorded yet. Click "Give Coaching Feedback" above.</td></tr>'
                        : feedbacks
                            .map(
                              (f) => `
                          <tr>
                            <td><strong>${escapeHtml(f.studentName)}</strong></td>
                            <td><span class="score-badge">&#9733; ${escapeHtml(f.rating)} / 5</span></td>
                            <td style="max-width:320px;">${escapeHtml(f.notes || "—")}</td>
                            <td>${escapeHtml(f.date)}</td>
                            <td>
                              <button class="secondary-button" style="padding:5px 10px; font-size:11.5px;" onclick="window.supervisorAction('feedback', '${escapeHtml(f.studentName)}')">
                                &#9825; Update Feedback
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
            `
            }
          </div>
        </div>
      `;

      document.getElementById("btnSupervisorAddFeedback")?.addEventListener("click", () => {
        if (students.length > 0) {
          openModal("feedback", { student: students[0].name });
        }
      });
      return;
    }

    // =========================================================================
    // VIEW: PERFORMANCE EVALUATION
    // =========================================================================
    if (view === "eval-mgmt") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Workplace Performance Appraisal</p>
              <h1 class="page-title">Trainee Performance Evaluation</h1>
              <p>Conduct official midterm and final workplace performance appraisal for trainees based on CHED and ISPSC competencies.</p>
              ${supervisorDeptBadge}
            </div>
            ${students.length > 0 ? '<button class="primary-button" id="btnSupervisorConductEval" type="button">&#9734; Conduct Trainee Evaluation</button>' : ''}
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Official Workplace Appraisals</h3>
                <p>Numeric ratings (0&ndash;100) and academic grade equivalencies</p>
              </div>
              <span class="score-badge">${evaluations.length} Appraisals Completed</span>
            </div>

            ${
              students.length === 0
                ? `<div class="dept-empty-box">
                    <div class="empty-icon">&#127970;</div>
                    <h3>No Trainees Assigned to ${escapeHtml(deptName)}</h3>
                    <p>Official performance evaluation forms can be completed once students are assigned to your unit.</p>
                  </div>`
                : `
              <div class="table-wrap">
                <table class="data-table" aria-label="Performance Evaluation Table">
                  <thead>
                    <tr>
                      <th>Trainee Name</th>
                      <th>Appraisal Period</th>
                      <th>Numerical Score</th>
                      <th>Academic Equivalence</th>
                      <th>Supervisor Comments</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      evaluations.length === 0
                        ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6c7b80;">No performance evaluations submitted yet. Click "Conduct Trainee Evaluation" to begin.</td></tr>'
                        : evaluations
                            .map(
                              (e) => `
                          <tr>
                            <td><strong>${escapeHtml(e.studentName)}</strong></td>
                            <td><strong>${escapeHtml(e.period)}</strong></td>
                            <td><span class="score-badge">${escapeHtml(e.rating)} / 100</span></td>
                            <td><span class="grade-pill">${escapeHtml(e.gradeEquiv || getGradeEquivalence(e.rating))}</span></td>
                            <td style="max-width:280px;">${escapeHtml(e.comments || "—")}</td>
                            <td><span class="status status-green">&#10003; ${escapeHtml(e.status)}</span></td>
                            <td>
                              <button class="secondary-button" style="padding:5px 10px; font-size:11.5px;" onclick="window.supervisorAction('eval', '${escapeHtml(e.studentName)}')">
                                &#9734; Conduct / Edit Eval
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
            `
            }
          </div>
        </div>
      `;

      document.getElementById("btnSupervisorConductEval")?.addEventListener("click", () => {
        if (students.length > 0) {
          openModal("evaluation", { student: students[0].name });
        }
      });
      return;
    }

    // =========================================================================
    // DEFAULT VIEW: TRAINEE ROSTER & DEPARTMENT APPROVAL (supervisor-students)
    // =========================================================================
    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Department Supervisor Portal</p>
            <h1 class="page-title">${escapeHtml(state.currentUser.name)}'s Trainee Workspace</h1>
            <p>Manage assigned trainees, evaluate submitted clearance documents, verify attendance, and approve department placement.</p>
            ${supervisorDeptBadge}
          </div>
          <div class="button-row" style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="secondary-button" id="btnSupervisorEvalDocLink" type="button">&#128196; Evaluate Documents</button>
            ${students.length > 0 ? '<button class="primary-button" id="btnSupervisorAddTask" type="button">&#43; Assign New Task</button>' : ''}
          </div>
        </div>

        <div class="stats-grid" style="margin-bottom:20px;">
          <div class="stat-card">
            <div class="stat-icon icon-green">&#128101;</div>
            <strong>${students.length} Trainees</strong>
            <span>Assigned to ${escapeHtml(deptName)}</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-coral">&#128196;</div>
            <strong>${studentReqs.length} Documents</strong>
            <span>Clearance Submissions</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-blue">&#128197;</div>
            <strong>${attendances.length} DTR Logs</strong>
            <span>Attendance Records</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-gold">&#9745;</div>
            <strong>${tasks.length} Tasks</strong>
            <span>Department Assignments</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Assigned Practicum Trainees & Department Approval</h3>
              <p>Review trainee placement status, verify clearance requirements, and activate OJT deployment</p>
            </div>
            <span class="score-badge">${students.length} Trainees Deployed</span>
          </div>

          ${
            students.length === 0
              ? `<div class="dept-empty-box">
                  <div class="empty-icon">&#127970;</div>
                  <h3>No Trainees Currently Assigned to ${escapeHtml(deptName)}</h3>
                  <p>You can only view and manage students assigned to your department. When the OJT Adviser assigns trainees to your unit, they will automatically appear here for document verification and attendance logging.</p>
                </div>`
              : `
            <div class="table-wrap">
              <table class="data-table" aria-label="Supervisor Student Roster">
                <thead>
                  <tr>
                    <th>Trainee Name</th>
                    <th>Degree Program</th>
                    <th>Department Placement Status</th>
                    <th>Submitted Clearances</th>
                    <th>Rendered Progress</th>
                    <th>Latest Attendance</th>
                    <th>Department Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${students
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
                          ${s.status === "Active" ? "&#10003; Approved" : escapeHtml(s.status || "Pending Approval")}
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
                          <button class="btn-approve-student" onclick="window.supervisorAction('approve-student', '${escapeHtml(s.name)}')">&#10003; Approve Student</button>
                          <button class="secondary-button" style="padding:4px 9px; font-size:11.5px;" onclick="window.supervisorAction('eval-doc', '${escapeHtml(s.name)}')">&#128196; Eval Docs</button>
                        </div>
                      </td>
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
  // VIEW RENDERERS: ADVISER (WITH DEPARTMENT FILTERING & SELECTION)
  // =========================================================================

  function getAvailableDepartmentsList() {
    if (state.practicumData.availableDepartments && state.practicumData.availableDepartments.length > 0) {
      return state.practicumData.availableDepartments;
    }
    return [
      "Management Information Systems (MIS) / ICT Center",
      "Office of the Campus Registrar",
      "Campus Library & Learning Resource Center",
      "Office of the Campus Dean",
      "Administrative & Finance Services",
      "College of Computing Studies Laboratory",
      "Campus Clinic / Health Services"
    ];
  }

  function renderAdviserDeptFilterBar(filteredCount, totalCount) {
    const depts = getAvailableDepartmentsList();
    return `
      <div class="dept-filter-bar">
        <div class="dept-filter-group">
          <label for="adviserDeptSelect" class="dept-filter-label">
            <span>&#127970;</span> Filter by Host Department:
          </label>
          <select id="adviserDeptSelect" class="dept-filter-select">
            <option value="all" ${state.selectedDepartmentFilter === "all" ? "selected" : ""}>All Campus Departments (${totalCount} Total Advisees)</option>
            ${depts.map((d) => `<option value="${escapeHtml(d)}" ${state.selectedDepartmentFilter === d ? "selected" : ""}>${escapeHtml(d)}</option>`).join("")}
          </select>
        </div>
        <span class="dept-filter-count">
          ${state.selectedDepartmentFilter === "all" ? `Showing all ${totalCount} trainees` : `Showing ${filteredCount} trainee(s) in department`}
        </span>
      </div>
    `;
  }

  function bindAdviserDeptFilter() {
    const select = document.getElementById("adviserDeptSelect");
    if (select) {
      select.addEventListener("change", (e) => {
        state.selectedDepartmentFilter = e.target.value;
        renderCurrentView();
      });
    }
  }

  function filterBySelectedDepartment(items, isStudentList = true) {
    if (!state.selectedDepartmentFilter || state.selectedDepartmentFilter === "all") {
      return items;
    }
    const filter = state.selectedDepartmentFilter.toLowerCase();
    return items.filter((item) => {
      const company = (item.company || item.company_name || "").toLowerCase();
      const dept = (item.department || "").toLowerCase();
      const studentName = (item.studentName || item.name || "").toLowerCase();
      
      // Match by company/department or student belonging to that department
      if (company.includes(filter) || filter.includes(company) || dept.includes(filter)) {
        return true;
      }
      
      // If it's a submission, find the student's company
      if (item.studentName) {
        const student = (state.practicumData.students || []).find((s) => s.name === item.studentName);
        if (student) {
          const sCompany = (student.company || "").toLowerCase();
          const sDept = (student.department || "").toLowerCase();
          return sCompany.includes(filter) || filter.includes(sCompany) || sDept.includes(filter);
        }
      }
      return false;
    });
  }

  function renderAdviserViews(view) {
    const allStudents = state.practicumData.students || [];
    const allReviewReqs = state.practicumData.reviewRequirements || state.practicumData.pendingRequirements || [];
    const allReports = state.practicumData.reports || [];

    const students = filterBySelectedDepartment(allStudents, true);
    const reviewReqs = filterBySelectedDepartment(allReviewReqs, false);
    const reports = filterBySelectedDepartment(allReports, false);

    // =========================================================================
    // VIEW: CLEARANCE VERIFICATION (requirements-mgmt)
    // =========================================================================
    if (view === "requirements-mgmt") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Adviser Clearance Hub</p>
              <h1 class="page-title">Clearance Document Verification</h1>
              <p>Review and verify institutional clearance documents submitted by advisees across campus departments.</p>
            </div>
          </div>

          ${renderAdviserDeptFilterBar(reviewReqs.length, allReviewReqs.length)}

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Pending Clearance Documents</h3>
                <p>Documents submitted by advisees</p>
              </div>
                <span class="score-badge">${reviewReqs.length} Documents</span>
            </div>

            <div class="table-wrap">
              <table class="data-table" aria-label="Adviser Requirements Verification">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Document Name</th>
                    <th>Program</th>
                    <th>Submission Info</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    reviewReqs.length === 0
                      ? '<tr><td colspan="5" style="text-align:center; padding:24px; color:#6c7b80;">No uploaded clearance documents in the selected department.</td></tr>'
                      : reviewReqs
                          .map(
                            (r) => `
                        <tr>
                          <td><strong>${escapeHtml(r.studentName)}</strong></td>
                          <td><strong>${escapeHtml(r.name)}</strong></td>
                          <td>${escapeHtml(r.studentProgram || "BS Information Technology")}</td>
                          <td>${escapeHtml(r.submittedAt || r.meta || "Submitted")}</td>
                          <td>
                            <button class="secondary-button" style="padding:4px 9px; font-size:11.5px;${r.previewUrl ? "" : "; opacity:0.55; cursor:not-allowed;"}" ${r.previewUrl ? `onclick="window.previewRequirement('${escapeHtml(r.previewUrl)}', '${escapeHtml(r.name)}')"` : 'disabled title="No file is attached to this submission"'}>&#128065; View Document</button>
                            ${r.previewUrl ? "" : '<small style="display:block; margin-top:4px; color:#b45309;">No file attached</small>'}
                            <button class="primary-button" style="padding:4px 9px; font-size:11.5px;" onclick="window.adviserAction('req', '${escapeHtml(r.studentName)}', '${escapeHtml(r.name)}')">
                              &#10003; Verify Clearance
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
      bindAdviserDeptFilter();
      return;
    }

    // =========================================================================
    // VIEW: ACCOMPLISHMENT REPORTS (reports-mgmt)
    // =========================================================================
    if (view === "reports-mgmt") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Adviser Academic Review</p>
              <h1 class="page-title">Accomplishment Reports Verification</h1>
              <p>Review weekly synthesis and periodic accomplishment reports submitted by practicum advisees.</p>
            </div>
          </div>

          ${renderAdviserDeptFilterBar(reports.length, allReports.length)}

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Advisee Accomplishment Reports</h3>
                <p>Synthesis submissions aligned with curriculum outcomes</p>
              </div>
              <span class="score-badge">${reports.length} Total Reports</span>
            </div>

            <div class="table-wrap">
              <table class="data-table" aria-label="Adviser Reports Verification">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Report Title</th>
                    <th>Summary / Scope</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    reports.length === 0
                      ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6c7b80;">No accomplishment reports found in selected department.</td></tr>'
                      : reports
                          .map(
                            (rep) => `
                        <tr>
                          <td><strong>${escapeHtml(rep.studentName)}</strong></td>
                          <td><strong>${escapeHtml(rep.title)}</strong></td>
                          <td style="max-width:280px;">${escapeHtml(rep.summary || "—")}</td>
                          <td>${escapeHtml(rep.period || "Weekly")}</td>
                          <td><span class="status ${rep.status === "Approved" ? "status-green" : rep.status === "Revision" ? "status-coral" : "status-yellow"}">${escapeHtml(rep.status)}</span></td>
                          <td>${escapeHtml(rep.submitted)}</td>
                          <td>
                            <button class="primary-button" style="padding:4px 9px; font-size:11.5px;" onclick="window.adviserAction('report', '${escapeHtml(rep.studentName)}')">
                              &#9638; Review Report
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
      bindAdviserDeptFilter();
      return;
    }

    // =========================================================================
    // VIEW: STUDENT APPRAISALS (adviser-appraisal)
    // =========================================================================
    if (view === "adviser-appraisal") {
      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Practicum Academic Evaluation</p>
              <h1 class="page-title">Student Appraisals & Final Grades</h1>
              <p>View workplace evaluation scores submitted by Department Supervisors and compute academic ratings.</p>
            </div>
          </div>

          ${renderAdviserDeptFilterBar(students.length, allStudents.length)}

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Advisees Performance & Appraisal Summary</h3>
                <p>Supervisor numeric scores and institutional grade equivalents</p>
              </div>
              <span class="score-badge">${students.length} Advisees</span>
            </div>

            <div class="table-wrap">
              <table class="data-table" aria-label="Student Appraisals Table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Department & Supervisor</th>
                    <th>Rendered Progress</th>
                    <th>Supervisor Score</th>
                    <th>Institutional Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    students.length === 0
                      ? '<tr><td colspan="6" style="text-align:center; padding:24px; color:#6c7b80;">No advisees found in selected department.</td></tr>'
                      : students
                          .map(
                            (s) => `
                        <tr>
                          <td><strong>${escapeHtml(s.name)}</strong><br /><small style="color:var(--muted);">ID: ${escapeHtml(s.idNumber || "—")}</small></td>
                          <td><strong>${escapeHtml(s.company)}</strong><br /><small style="color:var(--muted);">Sup: ${escapeHtml(s.supervisor || "Unassigned")}</small></td>
                          <td>
                            <strong>${escapeHtml(s.hours)}</strong>
                            <div class="progress-bar" style="height:5px; margin-top:4px;">
                              <i style="width:${escapeHtml(s.progress)};"></i>
                            </div>
                          </td>
                          <td>
                            ${s.evalRating ? `<span class="score-badge">${escapeHtml(s.evalRating)} / 100</span>` : '<span style="color:#8ca0aa;">Pending</span>'}
                          </td>
                          <td>
                            <span class="grade-pill">${escapeHtml(s.evalGrade || "Pending")}</span>
                          </td>
                          <td>
                            <button class="secondary-button" style="padding:4px 9px; font-size:11.5px;" onclick="window.adviserAction('records', '${escapeHtml(s.name)}')">
                              View Records
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
      bindAdviserDeptFilter();
      return;
    }

    // =========================================================================
    // DEFAULT VIEW: ADVISEES ROSTER (adviser-students)
    // =========================================================================
    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Faculty OJT Adviser Portal</p>
            <h1 class="page-title">Student Advisees & Campus Department Deployments</h1>
            <p>Assign OJT students to their respective campus host departments. Trainees will submit their documentary requirements directly to their Department Supervisor for clearance and approval.</p>
          </div>
        </div>

        <div class="stats-grid" style="margin-bottom:20px;">
          <div class="stat-card">
            <div class="stat-icon icon-green">&#127891;</div>
            <strong>${allStudents.length} Advisees</strong>
            <span>Enrolled in Practicum</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-coral">&#10003;</div>
            <strong>${allReviewReqs.length} Documents</strong>
            <span>Uploaded Clearances</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-blue">&#128197;</div>
            <strong>480 Hours</strong>
            <span>Curriculum Target</span>
          </div>
        </div>

        ${renderAdviserDeptFilterBar(students.length, allStudents.length)}

        <div class="panel adviser-roster-panel">
          <div class="panel-header">
            <div>
              <h3>Trainee Department Assignments & Status</h3>
              <p>Manage and monitor assigned department units, supervisors, and clearance compliance</p>
            </div>
          </div>

          <div class="adviser-roster-grid" aria-label="Adviser Student Monitoring">
            ${
              students.length === 0
                ? '<div class="adviser-roster-empty">No advisees found matching this department filter.</div>'
                : students
                    .map(
                      (s) => `
                <article class="adviser-student-card">
                  <div class="adviser-student-card__header">
                    <div class="adviser-student-identity">
                      <div class="adviser-student-avatar" aria-hidden="true">${escapeHtml((s.name || "S").charAt(0).toUpperCase())}</div>
                      <div>
                        <h4>${escapeHtml(s.name)}</h4>
                        <span>ID ${escapeHtml(s.idNumber || "—")}</span>
                      </div>
                    </div>
                    <span class="status ${s.status === "Active" ? "status-green" : s.status === "Revision" ? "status-coral" : "status-yellow"}">
                      ${s.status === "Active" ? "&#10003; Approved" : escapeHtml(s.status || "Pending Approval")}
                    </span>
                  </div>

                  <div class="adviser-student-card__placement">
                    <span class="adviser-card-label">Host Department</span>
                    <strong>${escapeHtml(s.company)}</strong>
                    <small>${escapeHtml(s.department || "Department unit not specified")}</small>
                  </div>

                  <div class="adviser-student-card__details">
                    <div>
                      <span class="adviser-card-label">Supervisor</span>
                      <strong>${escapeHtml(s.supervisor || "Unassigned")}</strong>
                      <small>${escapeHtml(s.supervisorEmail || "No email assigned")}</small>
                    </div>
                    <div>
                      <span class="adviser-card-label">Clearance</span>
                      <strong>${escapeHtml(s.requirements)}</strong>
                      <span class="status ${s.pendingRequirements > 0 ? "status-yellow" : "status-green"}">${s.pendingRequirements > 0 ? "Needs review" : "Complete"}</span>
                    </div>
                  </div>

                  <div class="adviser-student-card__progress">
                    <div><span class="adviser-card-label">Hours rendered</span><strong>${escapeHtml(s.hours)}</strong></div>
                    <span>${escapeHtml(s.progress)}</span>
                  </div>
                  <div class="progress-bar adviser-progress-bar"><i style="width:${escapeHtml(s.progress)};"></i></div>

                  <div class="adviser-student-card__actions">
                    <button class="primary-button" type="button" onclick="window.adviserAction('assign', '${escapeHtml(s.name)}')">&#127970; Assign Department</button>
                    <button class="secondary-button" type="button" onclick="window.adviserAction('req', '${escapeHtml(s.name)}')">&#10003; Review Documents</button>
                    <button class="secondary-button adviser-report-action" type="button" onclick="window.adviserAction('report', '${escapeHtml(s.name)}')">&#9638; Report</button>
                  </div>
                </article>
              `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    `;

    bindAdviserDeptFilter();
  }

  window.previewRequirement = function (previewUrl, documentName) {
    document.getElementById("requirementPreviewBackdrop")?.remove();

    const backdrop = document.createElement("div");
    backdrop.id = "requirementPreviewBackdrop";
    backdrop.className = "modal-backdrop open";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.innerHTML = `
      <div class="modal-card document-preview-card">
        <div class="modal-header">
          <div>
            <p class="modal-kicker">Document Preview</p>
            <h2>${escapeHtml(documentName)}</h2>
          </div>
          <button type="button" class="icon-button modal-close" aria-label="Close document preview">&times;</button>
        </div>
        <iframe src="${escapeHtml(previewUrl)}" title="${escapeHtml(documentName)}" style="width:100%; flex:1; min-height:0; border:1px solid var(--line); border-radius:8px; background:#f8fafc;"></iframe>
      </div>
    `;
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    const close = () => {
      backdrop.remove();
      document.body.style.overflow = "";
    };
    backdrop.querySelector(".modal-close")?.addEventListener("click", close);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close();
    });
  };

  window.adviserAction = async function (actionType, studentName, docName) {
    if (actionType === "assign") {
      openModal("assign-student", { student: studentName });
    } else if (actionType === "records") {
      openModal("adviser-records", { student: studentName });
    } else if (actionType === "req") {
      if (docName) {
        openModal("review-requirement", { student: studentName, reqName: docName });
      } else {
        await refreshBackendState();
        state.currentView = "requirements-mgmt";
        renderNavigation();
        renderCurrentView();
      }
    } else if (actionType === "report") {
      openModal("review-report", { student: studentName });
    }
  };

  // =========================================================================
  // VIEW RENDERERS: ADMIN
  // =========================================================================

  function renderAdminViews(view) {
    const users = state.practicumData.allUsers || [];
    const students = state.practicumData.students || [];
    const supervisors = state.practicumData.supervisors || [];
    const deptsSummary = state.practicumData.departmentsSummary || [];
    const auditLogs = state.practicumData.auditLogs || [];

    // =========================================================================
    // VIEW 1: PLACEMENT & DEPARTMENTS (admin-placements)
    // =========================================================================
    if (view === "admin-placements") {
      const activeCount = students.filter((s) => s.status === "Approved" || s.status === "Active").length;
      const pendingCount = students.length - activeCount;

      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Campus Unit Placement Administration</p>
              <h1 class="page-title">Placement & Campus Departments</h1>
              <p>Monitor host campus departments, supervise designated campus units, and manage trainee assignments.</p>
            </div>
            <button class="primary-button" id="btnAdminAssignTrainee" type="button">&#43; Assign Trainee to Department</button>
          </div>

          <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card">
              <div class="stat-icon icon-blue">&#127970;</div>
              <strong>${deptsSummary.length || 7} Host Units</strong>
              <span>Campus Departments</span>
            </div>
            <div class="stat-card">
              <div class="stat-icon icon-green">&#128101;</div>
              <strong>${students.length} Trainees</strong>
              <span>Total Assigned</span>
            </div>
            <div class="stat-card">
              <div class="stat-icon icon-green">&#10003;</div>
              <strong>${activeCount} Active</strong>
              <span>Department Approved</span>
            </div>
            <div class="stat-card">
              <div class="stat-icon icon-gold">&#9203;</div>
              <strong>${pendingCount} Pending</strong>
              <span>Awaiting Document Approval</span>
            </div>
          </div>

          <!-- DEPARTMENT OVERVIEW CARDS -->
          <div class="section-heading">
            <h2>Campus Host Departments Summary</h2>
            <span class="score-badge">${deptsSummary.length} Campus Units</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin-bottom:24px;">
            ${deptsSummary
              .map(
                (dept) => `
              <div class="panel" style="display:flex; flex-direction:column; justify-content:space-between; margin-bottom:0;">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                    <div class="stat-icon icon-blue" style="margin-bottom:0;">&#127970;</div>
                    <span class="score-badge" style="font-size:11px;">${dept.traineesCount} Trainee${dept.traineesCount === 1 ? "" : "s"}</span>
                  </div>
                  <h4 style="font-size:14px; font-weight:700; color:var(--ink); margin:0 0 6px;">${escapeHtml(dept.name)}</h4>
                  <p style="font-size:12px; color:var(--muted); margin:0 0 10px; line-height:1.4;">
                    <strong>Supervisor:</strong> ${escapeHtml(dept.supervisorDisplay || "Unassigned")}
                  </p>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f0f3ed; padding-top:10px; margin-top:8px;">
                  <span style="font-size:11.5px; color:#576574;">
                    <strong style="color:#274005;">${dept.activeCount} Active</strong> &bull; <span style="color:#b45309;">${dept.pendingCount} Pending</span>
                  </span>
                  <button class="secondary-button" style="padding:4px 9px; font-size:11.5px;" onclick="window.adminFilterDept('${escapeHtml(dept.name)}')">
                    View Trainees &rarr;
                  </button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <!-- MASTER PLACEMENT ROSTER -->
          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Master Trainee Placement Roster</h3>
                <p>All institutional student trainees and their assigned host departments</p>
              </div>
              <div style="display:flex; gap:10px; align-items:center;">
                <input type="search" id="adminPlacementSearch" placeholder="Search trainee or department..." style="padding:6px 12px; border-radius:6px; border:1px solid var(--line); font-size:12.5px; width:220px;" />
              </div>
            </div>

            <div class="table-wrap">
              <table class="data-table" id="adminPlacementsTable" aria-label="Master Trainee Placement Roster">
                <thead>
                  <tr>
                    <th>Trainee Name</th>
                    <th>Degree Program</th>
                    <th>Assigned Department</th>
                    <th>Designated Supervisor</th>
                    <th>Rendered Progress</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    students.length === 0
                      ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6c7b80;">No trainee placements recorded yet. Click "+ Assign Trainee to Department" to begin.</td></tr>'
                      : students
                          .map(
                            (s) => `
                        <tr data-student-search="${escapeHtml((s.name + " " + (s.company || "") + " " + (s.supervisor || "") + " " + (s.program || "")).toLowerCase())}">
                          <td>
                            <strong>${escapeHtml(s.name)}</strong><br />
                            <small style="color:var(--muted);">ID: ${escapeHtml(s.idNumber || "—")}</small>
                          </td>
                          <td>${escapeHtml(s.program || "BS Information Technology")}</td>
                          <td><strong>${escapeHtml(s.company || "Unassigned")}</strong></td>
                          <td>${escapeHtml(s.supervisor || "Unassigned")}</td>
                          <td>
                            <strong>${escapeHtml(s.hours || "0 / 480 hrs")}</strong>
                            <div class="progress-bar" style="height:5px; margin-top:4px;">
                              <i style="width:${escapeHtml(s.progress || "0%")};"></i>
                            </div>
                          </td>
                          <td>
                            <span class="status ${s.status === "Approved" || s.status === "Active" ? "status-green" : "status-yellow"}">
                              ${s.status === "Approved" || s.status === "Active" ? "&#10003; Approved" : escapeHtml(s.status || "Pending")}
                            </span>
                          </td>
                          <td>
                            <button class="secondary-button" style="padding:4px 9px; font-size:11.5px;" onclick="window.adminAssignStudent('${escapeHtml(s.name)}')">
                              &#127970; Reassign / Edit
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

      document.getElementById("btnAdminAssignTrainee")?.addEventListener("click", () => openModal("assign-student"));

      const searchInput = document.getElementById("adminPlacementSearch");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          const query = e.target.value.toLowerCase().trim();
          const rows = document.querySelectorAll("#adminPlacementsTable tbody tr[data-student-search]");
          rows.forEach((row) => {
            const text = row.getAttribute("data-student-search") || "";
            row.style.display = text.includes(query) ? "" : "none";
          });
        });
      }

      window.adminFilterDept = function (deptName) {
        if (searchInput) {
          searchInput.value = deptName;
          searchInput.dispatchEvent(new Event("input"));
          searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };
      return;
    }

    // =========================================================================
    // VIEW 2: INSTITUTIONAL AUDIT LOGS (admin-logs)
    // =========================================================================
    if (view === "admin-logs") {
      const placementLogsCount = auditLogs.filter((l) => l.category === "Placement").length;
      const clearanceLogsCount = auditLogs.filter((l) => l.category === "Clearance").length;
      const attendanceLogsCount = auditLogs.filter((l) => l.category === "Attendance").length;
      const evalLogsCount = auditLogs.filter((l) => l.category === "Evaluation").length;

      el.viewContainer.innerHTML = `
        <div class="page">
          <div class="page-intro">
            <div>
              <p class="eyebrow">Institutional Accountability & Security Trail</p>
              <h1 class="page-title">Institutional Audit Logs</h1>
              <p>System-wide activity trail of placement assignments, clearance evaluations, biometric DTR logs, and performance appraisals.</p>
            </div>
            <button class="secondary-button" id="btnAdminRefreshLogs" type="button">&#8635; Refresh Audit Trail</button>
          </div>

          <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card">
              <div class="stat-icon icon-green">&#128220;</div>
              <strong>${auditLogs.length} Events</strong>
              <span>Total Audit Trail</span>
            </div>
            <div class="stat-card">
              <div class="stat-icon icon-blue">&#127970;</div>
              <strong>${placementLogsCount} Placements</strong>
              <span>Host Assignments</span>
            </div>
            <div class="stat-card">
              <div class="stat-icon icon-coral">&#128196;</div>
              <strong>${clearanceLogsCount} Clearances</strong>
              <span>Evaluated Documents</span>
            </div>
            <div class="stat-card">
              <div class="stat-icon icon-gold">&#128197;</div>
              <strong>${attendanceLogsCount} DTR Logs</strong>
              <span>Biometric Records</span>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Institutional System Activity History</h3>
                <p>Timestamped chronological log of all actions performed across the ISPSC Practicum Portal</p>
              </div>
              <div style="display:flex; gap:10px; align-items:center;">
                <input type="search" id="adminLogSearch" placeholder="Search logs..." style="padding:6px 12px; border-radius:6px; border:1px solid var(--line); font-size:12.5px; width:220px;" />
              </div>
            </div>

            <!-- AUDIT CATEGORY FILTER TABS -->
            <div class="sub-tabs" id="adminLogFilterTabs">
              <button class="sub-tab active" data-log-cat="all" type="button">All Activities (${auditLogs.length})</button>
              <button class="sub-tab" data-log-cat="Placement" type="button">Placements (${placementLogsCount})</button>
              <button class="sub-tab" data-log-cat="Clearance" type="button">Clearances (${clearanceLogsCount})</button>
              <button class="sub-tab" data-log-cat="Attendance" type="button">Attendance / DTR (${attendanceLogsCount})</button>
              <button class="sub-tab" data-log-cat="Evaluation" type="button">Evaluations (${evalLogsCount})</button>
              <button class="sub-tab" data-log-cat="User Accounts" type="button">Accounts</button>
            </div>

            <div class="table-wrap">
              <table class="data-table" id="adminLogsTable" aria-label="Institutional Audit Trail Table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Category</th>
                    <th>Action / Event</th>
                    <th>Initiator (Actor)</th>
                    <th>Target Trainee / Unit</th>
                    <th>Details</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    auditLogs.length === 0
                      ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6c7b80;">No audit events recorded yet.</td></tr>'
                      : auditLogs
                          .map((log) => {
                            const badgeClass =
                              log.category === "Placement"
                                ? "status-blue"
                                : log.category === "Clearance"
                                ? "status-yellow"
                                : log.category === "Attendance"
                                ? "status-green"
                                : log.category === "Evaluation"
                                ? "status-coral"
                                : "status-gold";

                            const statusClass =
                              log.status === "Approved" || log.status === "Present" || log.status === "Active" || log.status === "Completed"
                                ? "status-green"
                                : log.status === "Revision"
                                ? "status-coral"
                                : "status-yellow";

                            const searchStr = (log.timestamp + " " + log.category + " " + log.action + " " + log.actor + " " + log.target + " " + log.details + " " + log.status).toLowerCase();

                            return `
                        <tr data-log-category="${escapeHtml(log.category)}" data-log-search="${escapeHtml(searchStr)}">
                          <td><small style="color:var(--muted); font-weight:600;">${escapeHtml(log.timestamp)}</small></td>
                          <td><span class="status ${badgeClass}">${escapeHtml(log.category)}</span></td>
                          <td><strong>${escapeHtml(log.action)}</strong></td>
                          <td>${escapeHtml(log.actor)}</td>
                          <td><strong>${escapeHtml(log.target)}</strong></td>
                          <td style="max-width:320px; font-size:12px; color:#49585f;">${escapeHtml(log.details)}</td>
                          <td><span class="status ${statusClass}">${escapeHtml(log.status)}</span></td>
                        </tr>
                      `;
                          })
                          .join("")
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.getElementById("btnAdminRefreshLogs")?.addEventListener("click", async () => {
        await refreshBackendState();
        renderCurrentView();
      });

      // Filter tabs and search logic for audit logs
      let activeCat = "all";
      let activeQuery = "";

      function filterAuditLogs() {
        const rows = document.querySelectorAll("#adminLogsTable tbody tr[data-log-category]");
        rows.forEach((row) => {
          const cat = row.getAttribute("data-log-category");
          const search = row.getAttribute("data-log-search") || "";
          const matchesCat = activeCat === "all" || cat === activeCat;
          const matchesQuery = !activeQuery || search.includes(activeQuery);
          row.style.display = matchesCat && matchesQuery ? "" : "none";
        });
      }

      document.querySelectorAll("#adminLogFilterTabs .sub-tab").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.querySelectorAll("#adminLogFilterTabs .sub-tab").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          activeCat = btn.getAttribute("data-log-cat") || "all";
          filterAuditLogs();
        });
      });

      const logSearch = document.getElementById("adminLogSearch");
      if (logSearch) {
        logSearch.addEventListener("input", (e) => {
          activeQuery = e.target.value.toLowerCase().trim();
          filterAuditLogs();
        });
      }
      return;
    }

    // =========================================================================
    // DEFAULT VIEW: USER ACCOUNTS DIRECTORY (admin-users)
    // =========================================================================
    const studentsCount = users.filter((u) => u.roleKey === "student").length;
    const supervisorsCount = users.filter((u) => u.roleKey === "supervisor").length;
    const advisersCount = users.filter((u) => u.roleKey === "adviser").length;
    const adminsCount = users.filter((u) => u.roleKey === "admin").length;

    el.viewContainer.innerHTML = `
      <div class="page">
        <div class="page-intro">
          <div>
            <p class="eyebrow">Portal Administration & User Management</p>
            <h1 class="page-title">User Accounts & Directory</h1>
            <p>Manage system users, assign supervisor roles, coordinate faculty advisers, and oversee student accounts.</p>
          </div>
          <button class="primary-button" id="btnAdminAddUser" type="button">&#43; Assign Supervisor Role</button>
        </div>

        <div class="stats-grid" style="margin-bottom:20px;">
          <div class="stat-card">
            <div class="stat-icon icon-blue">&#128101;</div>
            <strong>${users.length} Users</strong>
            <span>Total Registered</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-green">&#127891;</div>
            <strong>${studentsCount} Students</strong>
            <span>OJT Trainees</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-coral">&#127970;</div>
            <strong>${supervisorsCount} Supervisors</strong>
            <span>Department Mentors</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon icon-gold">&#128100;</div>
            <strong>${advisersCount + adminsCount} Faculty/Admin</strong>
            <span>Advisers & Portal Staff</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Institutional User Directory</h3>
              <p>Active accounts of students, department supervisors, faculty advisers, and administrators</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <input type="search" id="adminUserSearch" placeholder="Search user directory..." style="padding:6px 12px; border-radius:6px; border:1px solid var(--line); font-size:12.5px; width:220px;" />
            </div>
          </div>

          <!-- ROLE FILTER TABS -->
          <div class="sub-tabs" id="adminUserFilterTabs">
            <button class="sub-tab active" data-user-role="all" type="button">All Accounts (${users.length})</button>
            <button class="sub-tab" data-user-role="student" type="button">Students (${studentsCount})</button>
            <button class="sub-tab" data-user-role="supervisor" type="button">Supervisors (${supervisorsCount})</button>
            <button class="sub-tab" data-user-role="adviser" type="button">Advisers (${advisersCount})</button>
            <button class="sub-tab" data-user-role="admin" type="button">Admins (${adminsCount})</button>
          </div>

          <div class="table-wrap">
            <table class="data-table" id="adminUsersTable" aria-label="System Users Table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th>Department / Office</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${
                  users.length === 0
                    ? '<tr><td colspan="7" style="text-align:center; padding:24px; color:#6c7b80;">No user accounts found.</td></tr>'
                    : users
                        .map((u) => {
                          const roleBadgeClass =
                            u.roleKey === "supervisor"
                              ? "status-green"
                              : u.roleKey === "adviser"
                              ? "status-coral"
                              : u.roleKey === "admin"
                              ? "status-gold"
                              : "status-blue";

                          const searchStr = (u.name + " " + u.username + " " + u.email + " " + (u.department || "") + " " + u.role).toLowerCase();

                          return `
                      <tr data-user-role-key="${escapeHtml(u.roleKey || "student")}" data-user-search="${escapeHtml(searchStr)}">
                        <td>
                          <strong>${escapeHtml(u.name)}</strong><br />
                          <small style="color:var(--muted);">ID: ${escapeHtml(u.idNumber || "—")}</small>
                        </td>
                        <td>${escapeHtml(u.username)}</td>
                        <td>${escapeHtml(u.email)}</td>
                        <td><span class="status ${roleBadgeClass}">${escapeHtml(u.role)}</span></td>
                        <td>${escapeHtml(u.department || "General")}</td>
                        <td><small style="color:var(--muted);">${escapeHtml(u.createdAt || "—")}</small></td>
                        <td>
                          ${
                            u.roleKey === "supervisor"
                              ? `<button class="secondary-button" style="padding:4px 9px; font-size:11.5px;" onclick="window.adminAssignRole('${escapeHtml(u.name)}')">&#9881; Assign Role</button>`
                              : u.roleKey === "student"
                              ? `<button class="secondary-button" style="padding:4px 9px; font-size:11.5px;" onclick="window.adminAssignStudent('${escapeHtml(u.name)}')">&#127970; Assign Dept</button>`
                              : `<span style="color:var(--muted); font-size:12px;">Active</span>`
                          }
                        </td>
                      </tr>
                    `;
                        })
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnAdminAddUser")?.addEventListener("click", () => openModal("admin-user"));

    // Filter tabs and search logic for user directory
    let activeUserRole = "all";
    let activeUserQuery = "";

    function filterUsers() {
      const rows = document.querySelectorAll("#adminUsersTable tbody tr[data-user-role-key]");
      rows.forEach((row) => {
        const role = row.getAttribute("data-user-role-key");
        const search = row.getAttribute("data-user-search") || "";
        const matchesRole = activeUserRole === "all" || role === activeUserRole;
        const matchesQuery = !activeUserQuery || search.includes(activeUserQuery);
        row.style.display = matchesRole && matchesQuery ? "" : "none";
      });
    }

    document.querySelectorAll("#adminUserFilterTabs .sub-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#adminUserFilterTabs .sub-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeUserRole = btn.getAttribute("data-user-role") || "all";
        filterUsers();
      });
    });

    const userSearch = document.getElementById("adminUserSearch");
    if (userSearch) {
      userSearch.addEventListener("input", (e) => {
        activeUserQuery = e.target.value.toLowerCase().trim();
        filterUsers();
      });
    }
  }

  window.adminAssignRole = function (supervisorName) {
    openModal("admin-user", { supervisorName, name: supervisorName });
  };

  window.adminAssignStudent = function (studentName) {
    openModal("assign-student", { student: studentName });
  };

  // =========================================================================
  // MODAL ACTIONS & HANDLERS
  // =========================================================================

  function openProfileModal() {
    if (!state.currentUser) return;
    const user = state.currentUser;
    const data = state.practicumData || {};
    const dtrLogs = data.attendanceLogs || [];
    const totalHours = data.totalHours || 0;
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
            Official shift logs recorded by you and verified by your Department Supervisor.
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
            Host Department: <strong>${escapeHtml(user.department || "Not Assigned")}</strong>. You can evaluate student clearance documents, verify daily attendance logs, and grant official department approval for your assigned trainees.
          </p>
        </div>
      `;
    } else if (user.role === "adviser") {
      dtrHtml = `
        <div style="margin-top:20px; border-top:1px solid #d4e3cb; padding-top:16px;">
          <h4 style="margin:0 0 8px; font-size:14.5px; color:#17212b; font-weight:700;">Practicum Advisory Scope</h4>
          <p style="font-size:12px; color:#6a7c82; margin:0 0 12px;">
            Faculty Coordinator: <strong>${escapeHtml(user.department || "Not Assigned")}</strong>. As OJT Adviser, you assign practicum students to campus host departments and monitor their institutional clearance progress.
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
            <strong>${escapeHtml(user.idNumber || user.id_number || "—")}</strong>
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
            <strong>${escapeHtml(user.department || "—")}</strong>
          </div>
          ${
            user.role === "student"
              ? `
            <div class="profile-info-card">
              <small>Assigned Department</small>
              <strong>${escapeHtml(app.company || "Not Assigned")}</strong>
            </div>
            <div class="profile-info-card">
              <small>Department Supervisor</small>
              <strong>${escapeHtml(app.supervisor || "Not Assigned")}</strong>
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
    if (el.modalBackdrop) el.modalBackdrop.dataset.modalType = modalType;
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
            <option value="Regular (8h)" selected>Regular Full-Day Shift (8.00 hrs: 8:00 AM &ndash; 5:00 PM)</option>
            <option value="Morning Shift (4h)">Morning Half-Day Shift (4.00 hrs: 8:00 AM &ndash; 12:00 PM)</option>
            <option value="Afternoon Shift (4h)">Afternoon Half-Day Shift (4.00 hrs: 1:00 PM &ndash; 5:00 PM)</option>
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
          <textarea id="attRemarks" name="attRemarks" rows="2"></textarea>
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
          <input type="text" id="jTitle" name="jTitle" required aria-required="true" />
        </label>
        <label for="jHours">
          Rendered Shift Hours
          <input type="text" id="jHours" name="jHours" value="8 hours rendered" required aria-required="true" />
        </label>
        <label for="jReflection">
          Reflection, Key Takeaways & Output Description
          <textarea id="jReflection" name="jReflection" rows="5" required aria-required="true"></textarea>
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
          <input type="text" id="taskTitle" name="taskTitle" required aria-required="true" />
        </label>
        <label for="taskDue">
          Target Due Date
          <input type="date" id="taskDue" name="taskDue" />
        </label>
        <label for="taskDetails">
          Task Instructions / Department Specifications (Optional)
          <textarea id="taskDetails" name="taskDetails" rows="3"></textarea>
        </label>
      `;
    } else if (modalType === "report") {
      kicker = "Weekly Compliance";
      title = "Submit Weekly Accomplishment Report";
      desc = "Synthesize your total accomplishments for the week.";
      submitLabel = "Submit Report";

      fieldsHtml = `
        <div class="modal-form-section">
          <p class="modal-section-label">Report identification</p>
        <label for="repTitle">
          Report Title / Week Identifier
          <input type="text" id="repTitle" name="repTitle" required aria-required="true" />
        </label>
        </div>
        <div class="modal-form-section">
          <p class="modal-section-label">Accomplishment summary</p>
        <label for="repSummary">
          Weekly Synthesis Summary
          <textarea id="repSummary" name="repSummary" rows="5" required aria-required="true"></textarea>
        </label>
        </div>
      `;
    } else if (modalType === "requirement") {
      kicker = "Document Clearance";
      title = "Upload Institutional Requirement";
      desc = "Submit your clearance document for Adviser / Supervisor verification.";
      submitLabel = "Submit Document for Review";

      const defaultName = context.reqName || "Parent Consent Form";

      fieldsHtml = `
        <label for="reqSelect">
          Requirement Document Type
          <select id="reqSelect" name="reqSelect" required aria-required="true">
            <option value="Parent Consent Form" ${defaultName === "Parent Consent Form" ? "selected" : ""}>Notarized Parent/Guardian Consent Form</option>
            <option value="Weekly Accomplishment Report" ${defaultName === "Weekly Accomplishment Report" ? "selected" : ""}>Weekly Accomplishment Report</option>
            <option value="Medical" ${defaultName === "Medical" ? "selected" : ""}>Medical</option>
          </select>
        </label>
        <label for="reqFile">
          Attach File (PDF or Scanned Image)
          <input type="file" id="reqFile" name="reqFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif" required aria-required="true" />
          <span id="reqFileStatus" class="file-selection-status" aria-live="polite">No document selected</span>
        </label>
        <p style="font-size:11.5px; color:var(--muted); margin:4px 0 14px;">
          &bull; Status will be marked as <strong>Pending Review</strong> until verified by your Supervisor / Adviser.
        </p>
      `;
    } else if (modalType === "evaluation") {
      kicker = "Workplace Appraisal";
      title = `Evaluate ${escapeHtml(context.student || "Trainee")}`;
      desc = "Grade the trainee based on technical competency, work ethic, and attendance (1–100 scale).";
      submitLabel = "Submit Workplace Evaluation";

      const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];
      const studentHtml = context.student
        ? `<div class="modal-student-banner">
            <span class="student-pill">Trainee</span> 
            <strong>${escapeHtml(context.student)}</strong>
            <input type="hidden" name="evalStudent" value="${escapeHtml(context.student)}" />
          </div>`
        : `<label for="evalStudentSelect">
            Select Trainee
            <select id="evalStudentSelect" name="evalStudent" required aria-required="true">
              ${students.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
          </label>`;

      fieldsHtml = `
        ${studentHtml}
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
          <textarea id="evalComment" name="evalComment" rows="4" required aria-required="true"></textarea>
        </label>
      `;
    } else if (modalType === "feedback") {
      kicker = "Supervisory Coaching";
      title = `Coaching Feedback for ${escapeHtml(context.student || "Trainee")}`;
      desc = "Share actionable observations, feedback, and commended achievements.";
      submitLabel = "Post Mentorship Feedback";

      const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];
      const studentHtml = context.student
        ? `<div class="modal-student-banner">
            <span class="student-pill">Trainee</span> 
            <strong>${escapeHtml(context.student)}</strong>
            <input type="hidden" name="fbStudent" value="${escapeHtml(context.student)}" />
          </div>`
        : `<label for="fbStudentSelect">
            Select Trainee
            <select id="fbStudentSelect" name="fbStudent" required aria-required="true">
              ${students.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
          </label>`;

      fieldsHtml = `
        ${studentHtml}
        <label for="fbRating">
          Weekly Commendation Score (1 to 100)
          <input type="number" id="fbRating" name="fbRating" min="1" max="100" value="92" required aria-required="true" />
        </label>
        <label for="fbNotes">
          Detailed Supervisory Feedback & Recommendations
          <textarea id="fbNotes" name="fbNotes" rows="4" required aria-required="true"></textarea>
        </label>
      `;
    } else if (modalType === "review-attendance") {
      kicker = "DTR Verification";
      title = `Verify DTR for ${escapeHtml(context.student || "Trainee")}`;
      desc = "Confirm attendance logs and sign off on rendered hours.";
      submitLabel = "Save Attendance Verification";

      const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];
      const studentHtml = context.student
        ? `<div class="modal-student-banner">
            <span class="student-pill">Trainee</span> 
            <strong>${escapeHtml(context.student)}</strong>
            <input type="hidden" name="attStudent" value="${escapeHtml(context.student)}" />
          </div>`
        : `<label for="attStudentSelect">
            Select Trainee
            <select id="attStudentSelect" name="attStudent" required aria-required="true">
              ${students.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
          </label>`;

      fieldsHtml = `
        ${studentHtml}
        <label for="attDecision">
          Verification Decision
          <select id="attDecision" name="attDecision" required aria-required="true">
            <option value="Present" selected>Confirm Present (Rendered Shift Hours Approved)</option>
            <option value="Excused">Excused Absence / Official Campus Business</option>
          </select>
        </label>
        <label for="attReviewRemarks">
          Supervisor Remarks / Verification Notes
          <textarea id="attReviewRemarks" name="attReviewRemarks" rows="3"></textarea>
        </label>
      `;
    } else if (modalType === "review-journal") {
      kicker = "Journal Review";
      title = `Review Journal for ${escapeHtml(context.student || "Trainee")}`;
      desc = "Approve reflective journal entry or request clarification.";
      submitLabel = "Submit Journal Decision";

      const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];
      const studentHtml = context.student
        ? `<div class="modal-student-banner">
            <span class="student-pill">Trainee</span> 
            <strong>${escapeHtml(context.student)}</strong>
            <input type="hidden" name="journalStudent" value="${escapeHtml(context.student)}" />
          </div>`
        : `<label for="journalStudentSelect">
            Select Trainee
            <select id="journalStudentSelect" name="journalStudent" required aria-required="true">
              ${students.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
          </label>`;

      fieldsHtml = `
        ${studentHtml}
        <label for="journalDecision">
          Review Decision
          <select id="journalDecision" name="journalDecision" required aria-required="true">
            <option value="Approved" selected>Approve Daily Journal</option>
            <option value="Revision">Request Revision / Additional Details</option>
          </select>
        </label>
        <label for="journalRemarks">
          Supervisor Feedback & Remarks
          <textarea id="journalRemarks" name="journalRemarks" rows="3"></textarea>
        </label>
      `;
    } else if (modalType === "assign-student") {
      kicker = "OJT Adviser Placement";
      title = "Assign Trainee to Department";
      desc = "Assign student to their host campus department or unit. The student will then submit documentary requirements to the Department Supervisor for approval.";
      submitLabel = "Confirm Department Assignment";

      const students = state.practicumData.students || [];
      const supervisors = state.practicumData.supervisors || [];

      fieldsHtml = `
        <div class="modal-form-section">
          <p class="modal-section-label">Trainee placement</p>
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
            <option value="Office of the Campus Registrar">Office of the Campus Registrar</option>
            <option value="Campus Library & Learning Resource Center">Campus Library & Learning Resource Center</option>
            <option value="Office of the Campus Dean">Office of the Campus Dean</option>
            <option value="Administrative & Finance Services">Administrative & Finance Services</option>
            <option value="College of Computing Studies Laboratory">College of Computing Studies Laboratory</option>
            <option value="Campus Clinic / Health Services">Campus Clinic / Health Services</option>
          </select>
        </label>
        <label for="assignSupervisorPicker">
          Select Department Supervisor
          <select id="assignSupervisorPicker" name="assignSupervisorPicker" required aria-required="true"></select>
        </label>
        <label for="assignDeptUnit">
          Specific Section / Sub-unit
          <input type="text" id="assignDeptUnit" name="assignDeptUnit" value="" required aria-required="true" />
        </label>
        </div>
        <div class="modal-form-section">
          <p class="modal-section-label">Supervisor contact</p>
        <div class="form-grid-2">
          <label for="assignSupervisor">
            Designated Supervisor Name
            <input type="text" id="assignSupervisor" name="assignSupervisor" value="" required aria-required="true" readonly />
          </label>
          <label for="assignSupervisorEmail">
            Supervisor Official Email
            <input type="email" id="assignSupervisorEmail" name="assignSupervisorEmail" value="" required aria-required="true" readonly />
          </label>
        </div>
        </div>
        <div class="modal-form-section">
          <p class="modal-section-label">Assignment notes</p>
        <label for="assignNotes">
          Deployment Directives & Notes (Optional)
          <textarea id="assignNotes" name="assignNotes" rows="2"></textarea>
        </label>
        </div>
      `;
    } else if (modalType === "approve-student") {
      kicker = "Supervisor Department Approval";
      title = context.student ? `Approve Placement: ${escapeHtml(context.student)}` : "Approve Student Placement";
      desc = "Review student documents and confirm official acceptance and deployment in your department.";
      submitLabel = "Save Department Decision";

      const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];

      const studentHtml = context.student
        ? `<div class="modal-student-banner">
            <span class="student-pill">Trainee</span> 
            <strong>${escapeHtml(context.student)}</strong>
            <input type="hidden" name="appStudentName" value="${escapeHtml(context.student)}" />
          </div>`
        : `<label for="appStudentSelect">
            Select Student Trainee
            <select id="appStudentSelect" name="appStudentName" required aria-required="true">
              ${students.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)} (${escapeHtml(s.program || "Trainee")})</option>`).join("")}
            </select>
          </label>`;

      fieldsHtml = `
        ${studentHtml}
        <label for="appDecision">
          Department Decision
          <select id="appDecision" name="appDecision" required aria-required="true">
            <option value="Approved" selected>Approve Trainee (Activate Deployment)</option>
            <option value="Revision">Return Documents for Revision / Incomplete</option>
            <option value="Pending">Hold / Keep Pending</option>
          </select>
        </label>
        <label for="appSupervisorNotes">
          Supervisor Notes / Acceptance Remarks
          <textarea id="appSupervisorNotes" name="appSupervisorNotes" rows="3"></textarea>
        </label>
      `;
    } else if (modalType === "review-requirement") {
      kicker = state.currentRole === "supervisor" ? "Supervisor Document Evaluation" : "Adviser Document Clearance";
      title = context.student ? `Evaluate Document for ${escapeHtml(context.student)}` : "Evaluate Clearance Document";
      desc = "Evaluate the submitted clearance document and provide feedback or approval.";
      submitLabel = "Save Document Review";

      const students = state.practicumData.students || (state.practicumData.supervisorData && state.practicumData.supervisorData.students) || [];
      const studentHtml = context.student
        ? `<div class="modal-student-banner">
            <span class="student-pill">Student</span> 
            <strong>${escapeHtml(context.student)}</strong>
            <input type="hidden" name="reqStudent" value="${escapeHtml(context.student)}" />
          </div>`
        : `<label for="reqStudentSelect">
            Select Student
            <select id="reqStudentSelect" name="reqStudent" required aria-required="true">
              ${students.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
          </label>`;

      const reqTarget = context.reqName || "Parent Consent Form";
      const requirementHtml = context.reqName
        ? `<div class="modal-student-banner">
            <span class="student-pill">Clearance</span>
            <strong>${escapeHtml(context.reqName)}</strong>
            <input type="hidden" name="reqTarget" value="${escapeHtml(context.reqName)}" />
          </div>`
        : `<label for="reqTarget">
            Document To Evaluate
            <select id="reqTarget" name="reqTarget" required aria-required="true">
              <option value="Parent Consent Form" ${reqTarget === "Parent Consent Form" ? "selected" : ""}>Notarized Parent/Guardian Consent Form</option>
              <option value="Weekly Accomplishment Report" ${reqTarget === "Weekly Accomplishment Report" ? "selected" : ""}>Weekly Accomplishment Report</option>
              <option value="Medical" ${reqTarget === "Medical" ? "selected" : ""}>Medical</option>
            </select>
          </label>`;

      fieldsHtml = `
        <div class="modal-form-section">
          <p class="modal-section-label">Document to review</p>
        ${studentHtml}
        ${requirementHtml}
        </div>
        <div class="modal-form-section">
          <p class="modal-section-label">Review decision</p>
        <label for="reqDecision">
          Evaluation Decision
          <select id="reqDecision" name="reqDecision" required aria-required="true">
            <option value="Pending review" selected>Keep Pending Review</option>
            <option value="Approved">Approve Document</option>
            <option value="Revision">Return for Revision</option>
          </select>
        </label>
        <label for="reqComments">
          Evaluator Feedback & Remarks
          <textarea id="reqComments" name="reqComments" rows="3"></textarea>
        </label>
        </div>
      `;
    } else if (modalType === "review-report") {
      kicker = "Adviser Report Review";
      title = context.student ? `Review Report for ${escapeHtml(context.student)}` : "Review Accomplishment Report";
      desc = "Review trainee accomplishment report and provide academic feedback.";
      submitLabel = "Save Report Review";

      const students = state.practicumData.students || [];
      const studentHtml = context.student
        ? `<div class="modal-student-banner">
            <span class="student-pill">Advisee</span> 
            <strong>${escapeHtml(context.student)}</strong>
            <input type="hidden" name="reportStudent" value="${escapeHtml(context.student)}" />
          </div>`
        : `<label for="repStudentSelect">
            Select Advisee
            <select id="repStudentSelect" name="reportStudent" required aria-required="true">
              ${students.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
          </label>`;

      fieldsHtml = `
        <div class="modal-form-section">
          <p class="modal-section-label">Report owner</p>
        ${studentHtml}
        </div>
        <div class="modal-form-section">
          <p class="modal-section-label">Review outcome</p>
        <label for="reportDecision">
          Academic Decision
          <select id="reportDecision" name="reportDecision" required aria-required="true">
            <option value="Approved" selected>Accept & Approve Report</option>
            <option value="Revision">Request Revision</option>
          </select>
        </label>
        <label for="reportComments">
          Adviser Feedback
          <textarea id="reportComments" name="reportComments" rows="3"></textarea>
        </label>
        </div>
      `;
    } else if (modalType === "adviser-records") {
      kicker = "Adviser Student Records";
      title = context.student ? `Records for ${escapeHtml(context.student)}` : "Student Records";
      desc = "Review placement, clearance, progress, and supervisor appraisal details for this advisee.";
      submitLabel = "Close Records";

      const student = (state.practicumData.students || []).find((item) => item.name === context.student);
      fieldsHtml = student
        ? `
          <div class="modal-form-section">
            <p class="modal-section-label">Placement</p>
            <p><strong>Host Department:</strong> ${escapeHtml(student.company || "Unassigned")}</p>
            <p><strong>Unit:</strong> ${escapeHtml(student.department || "Unassigned")}</p>
            <p><strong>Supervisor:</strong> ${escapeHtml(student.supervisor || "Unassigned")}</p>
          </div>
          <div class="modal-form-section">
            <p class="modal-section-label">Progress & Clearance</p>
            <p><strong>Hours:</strong> ${escapeHtml(student.hours || "0 / 480 hrs")}</p>
            <p><strong>Clearance:</strong> ${escapeHtml(student.requirements || "No records")}</p>
            <p><strong>Status:</strong> ${escapeHtml(student.status || "Pending")}</p>
          </div>
          <div class="modal-form-section">
            <p class="modal-section-label">Supervisor Appraisal</p>
            <p><strong>Score:</strong> ${student.evalRating ? `${escapeHtml(student.evalRating)} / 100` : "Pending"}</p>
            <p><strong>Grade:</strong> ${escapeHtml(student.evalGrade || "Pending")}</p>
          </div>
        `
        : '<p>No records found for this student.</p>';
    } else if (modalType === "admin-user") {
      kicker = "System Role Management";
      title = "Assign Supervisor Role & Permissions";
      desc = "Assign system roles (Adviser, Supervisor, Student, Administrator) and update department assignments.";
      submitLabel = "Save Role Assignment";

      const supervisors = state.practicumData.supervisors || [];
      const allUsers = state.practicumData.allUsers || [];
      const preselected = context.supervisorName || context.name || (supervisors[0] ? supervisors[0].name : "");

      fieldsHtml = `
        <label for="adminName">
          Select Department Supervisor / User
          <select id="adminName" name="adminName" required aria-required="true">
            ${supervisors.map((s) => `<option value="${escapeHtml(s.name)}" ${preselected === s.name ? "selected" : ""}>${escapeHtml(s.name)} &mdash; Supervisor (${escapeHtml(s.department || "General")})</option>`).join("")}
            ${allUsers.filter((u) => u.roleKey !== "supervisor").map((u) => `<option value="${escapeHtml(u.name)}" ${preselected === u.name ? "selected" : ""}>${escapeHtml(u.name)} &mdash; ${escapeHtml(u.role)}</option>`).join("")}
          </select>
        </label>
        <label for="adminRole">
          Assigned System Role
          <select id="adminRole" name="adminRole" required aria-required="true">
            <option value="supervisor">Campus Department Supervisor</option>
            <option value="adviser">OJT Faculty Adviser</option>
            <option value="student">OJT Student Trainee</option>
            <option value="admin">Portal Administrator</option>
          </select>
        </label>
        <label for="adminDept">
          Designated Campus Department / College
          <input type="text" id="adminDept" name="adminDept" value="${supervisors.find((s) => s.name === preselected)?.department || "Management Information Systems (MIS) / ICT Center"}" required aria-required="true" />
        </label>
      `;
    }

    if (el.modalKicker) el.modalKicker.textContent = kicker;
    if (el.modalTitle) el.modalTitle.textContent = title;
    if (el.modalDescription) el.modalDescription.textContent = desc;
    if (el.modalSubmitLabel) el.modalSubmitLabel.textContent = submitLabel;
    if (el.modalFields) el.modalFields.innerHTML = fieldsHtml;
    el.modalForm.querySelector('button[type="submit"]')?.classList.toggle("hidden", modalType === "adviser-records");

    if (modalType === "requirement") {
      const requirementFile = document.getElementById("reqFile");
      const submitRequirement = el.modalForm.querySelector('button[type="submit"]');
      if (submitRequirement) {
        submitRequirement.disabled = true;
        submitRequirement.setAttribute("aria-disabled", "true");
      }
      const updateRequirementFileState = () => {
        const hasFile = Boolean(requirementFile.files?.length);
        const fileStatus = document.getElementById("reqFileStatus");
        if (submitRequirement) {
          submitRequirement.disabled = !hasFile;
          submitRequirement.setAttribute("aria-disabled", String(!hasFile));
        }
        if (fileStatus) {
          fileStatus.textContent = hasFile ? `Selected: ${requirementFile.files[0].name}` : "No document selected";
          fileStatus.classList.toggle("has-file", hasFile);
        }
      };
      requirementFile?.addEventListener("change", updateRequirementFileState);
      requirementFile?.addEventListener("input", updateRequirementFileState);
    }

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

    // Dynamic supervisor picker synchronization for assign-student modal
    if (modalType === "assign-student") {
      const supPicker = document.getElementById("assignSupervisorPicker");
      const compSelect = document.getElementById("assignCompany");
      const supNameInput = document.getElementById("assignSupervisor");
      const supEmailInput = document.getElementById("assignSupervisorEmail");
      const supervisors = state.practicumData.supervisors || [];
      if (supPicker && compSelect && supNameInput && supEmailInput) {
        const normalize = (value) => (value || "").trim().toLowerCase();
        const matchesDepartment = (supervisorDepartment, selectedDepartment) => {
          const supervisorValue = normalize(supervisorDepartment);
          const selectedValue = normalize(selectedDepartment);
          const supervisorParts = supervisorValue.split(/\s*\/\s*|\s*\([^)]*\)/).map((part) => part.trim()).filter((part) => part.length >= 3);
          const selectedParts = selectedValue.split(/\s*\/\s*|\s*\([^)]*\)/).map((part) => part.trim()).filter((part) => part.length >= 3);

          return supervisorValue && selectedValue && (supervisorValue === selectedValue || supervisorValue.includes(selectedValue) || selectedValue.includes(supervisorValue) || supervisorParts.some((part) => selectedValue.includes(part)) || selectedParts.some((part) => supervisorValue.includes(part)));
        };
        const updateSupervisors = () => {
          const selectedDepartment = compSelect.value;
          const matchingSupervisors = supervisors.filter((supervisor) => matchesDepartment(supervisor.department, selectedDepartment));

          supPicker.innerHTML = matchingSupervisors.length
            ? matchingSupervisors.map((sup) => `<option value="${escapeHtml(sup.name)}" data-email="${escapeHtml(sup.email || "")}" data-dept="${escapeHtml(sup.department || "")}">${escapeHtml(sup.name)} &mdash; ${escapeHtml(sup.department || "Supervisor")}</option>`).join("")
            : '<option value="" disabled selected>No supervisor assigned to this department</option>';

          const selectedSupervisor = matchingSupervisors[0];
          supNameInput.value = selectedSupervisor?.name || "";
          supEmailInput.value = selectedSupervisor?.email || "";
        };

        compSelect.addEventListener("change", updateSupervisors);
        supPicker.addEventListener("change", (e) => {
          const opt = e.target.options[e.target.selectedIndex];
          if (opt) {
            supNameInput.value = opt.value;
            supEmailInput.value = opt.dataset.email || "";
          }
        });

        updateSupervisors();
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
      const student = studentInput ? studentInput.value : (document.getElementById("taskStudentSelect") ? document.getElementById("taskStudentSelect").value : "");
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
      const file = document.getElementById("reqFile")?.files[0];
      if (!file) {
        showToast("Please select a PDF or image document before submitting.");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        showToast("The document must be 25 MB or smaller.");
        return;
      }

      const formData = new FormData();
      formData.append("requirement", requirement);
      formData.append("file", file);
      const res = await apiRequest("/practicum/requirement", "POST", formData);
      if (res && res.success) {
        await refreshBackendState();
        closeModal();
        state.lastRequirementSubmission = {
          name: requirement,
        };
        renderCurrentView();
        showToast(res.message);
      } else if (res && (res.message || res.error)) {
        showToast(res.message || res.error);
      }
    } else if (modalType === "evaluation") {
      const studentInput = el.modalForm.querySelector('[name="evalStudent"]');
      const student = studentInput ? studentInput.value : (document.getElementById("evalStudentSelect") ? document.getElementById("evalStudentSelect").value : "");
      const rating = parseFloat(document.getElementById("evalRating").value);
      const comment = document.getElementById("evalComment").value;

      const res = await apiRequest("/practicum/evaluation", "POST", { student, rating, comment });
      if (res && res.success) {
        showToast(res.message);
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast(`Evaluation score ${rating}/100 saved for ${student}.`);
      }
    } else if (modalType === "feedback") {
      const studentInput = el.modalForm.querySelector('[name="fbStudent"]');
      const student = studentInput ? studentInput.value : (document.getElementById("fbStudentSelect") ? document.getElementById("fbStudentSelect").value : "");
      const rating = parseFloat(document.getElementById("fbRating").value);
      const feedback = document.getElementById("fbNotes").value;

      const res = await apiRequest("/practicum/feedback", "POST", { student, rating, feedback });
      if (res && res.success) {
        showToast(res.message);
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast(`Feedback submitted for ${student}.`);
      }
    } else if (modalType === "review-attendance") {
      const studentInput = el.modalForm.querySelector('[name="attStudent"]');
      const student = studentInput ? studentInput.value : (document.getElementById("attStudentSelect") ? document.getElementById("attStudentSelect").value : "");
      const decision = document.getElementById("attDecision").value;
      const comments = document.getElementById("attReviewRemarks").value;

      const res = await apiRequest("/practicum/review-attendance", "POST", { student, decision, comments });
      if (res && res.success) {
        showToast(res.message);
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast(`Attendance verified for ${student}.`);
      }
    } else if (modalType === "review-journal") {
      const studentInput = el.modalForm.querySelector('[name="journalStudent"]');
      const student = studentInput ? studentInput.value : (document.getElementById("journalStudentSelect") ? document.getElementById("journalStudentSelect").value : "");
      const decision = document.getElementById("journalDecision").value;
      const comments = document.getElementById("journalRemarks").value;

      const res = await apiRequest("/practicum/review-journal", "POST", { student, decision, comments });
      if (res && res.success) {
        showToast(res.message);
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast(`Journal marked as ${decision} for ${student}.`);
      }
    } else if (modalType === "review-requirement") {
      const studentInput = el.modalForm.querySelector('[name="reqStudent"]');
      const student = studentInput ? studentInput.value : (document.getElementById("reqStudentSelect") ? document.getElementById("reqStudentSelect").value : "");
      const requirementInput = el.modalForm.querySelector('[name="reqTarget"]');
      const requirement = requirementInput ? requirementInput.value : "";
      const decision = document.getElementById("reqDecision").value;
      const comments = document.getElementById("reqComments").value;

      const res = await apiRequest("/practicum/review-requirement", "POST", { student, requirement, decision, comments });
      if (res && res.success) {
        showToast(res.message);
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast(`Requirement clearance updated.`);
      }
    } else if (modalType === "review-report") {
      const studentInput = el.modalForm.querySelector('[name="reportStudent"]');
      const student = studentInput ? studentInput.value : (document.getElementById("repStudentSelect") ? document.getElementById("repStudentSelect").value : "");
      const decision = document.getElementById("reportDecision").value;
      const comments = document.getElementById("reportComments").value;

      const res = await apiRequest("/practicum/review-report", "POST", { student, decision, comments });
      if (res && res.success) {
        showToast(res.message);
      } else {
        showToast(`Accomplishment report reviewed.`);
      }
    } else if (modalType === "approve-student") {
      const studentInput = el.modalForm.querySelector('[name="appStudentName"]');
      const student = studentInput ? studentInput.value : (document.getElementById("appStudentSelect") ? document.getElementById("appStudentSelect").value : "");
      const decision = document.getElementById("appDecision").value;
      const notes = document.getElementById("appSupervisorNotes").value;

      const res = await apiRequest("/practicum/approve-student", "POST", { student, decision, notes });
      if (res && res.success) {
        showToast(res.message);
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast(`Student status updated to ${decision}.`);
      }
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
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast("Student assigned to department successfully.");
      }
    } else if (modalType === "admin-user") {
      const name = document.getElementById("adminName").value;
      const role = document.getElementById("adminRole").value;
      const department = document.getElementById("adminDept")?.value || "";

      const res = await apiRequest("/practicum/admin/user", "POST", { name, role, department });
      if (res && res.success) {
        showToast(res.message);
      } else if (res && res.error) {
        showToast(res.error);
      } else {
        showToast("Role assigned successfully.");
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
    showRecoveryStep("login");
  }

  function showPortal() {
    if (el.authContainer) el.authContainer.classList.add("hidden");
    if (el.portalContainer) el.portalContainer.classList.remove("hidden");
    renderNavigation();
    renderCurrentView();
  }

  function openResetLink() {
    if (state.currentUser) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "reset-password") return;

    const email = params.get("email") || "";
    const token = params.get("token") || "";
    if (!email || !token) return;

    const resetEmail = document.getElementById("resetEmail");
    const resetToken = document.getElementById("resetToken");
    if (resetEmail) resetEmail.value = email;
    if (resetToken) resetToken.value = token;
    showRecoveryStep("reset");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function switchAuthTab(targetTab) {
    showRecoveryStep("login");

    const isSignup = targetTab === "signup";
    if (el.authTabs) el.authTabs.classList.toggle("signup-selected", isSignup);
    if (el.authContainer) {
      el.authContainer.classList.remove("auth-switching-signin", "auth-switching-signup");
      el.authContainer.classList.add(isSignup ? "auth-switching-signup" : "auth-switching-signin");
    }

    if (isSignup) {
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
      el.registerCard?.classList.remove("auth-form-enter-left", "auth-form-enter-right");
      void el.registerCard?.offsetWidth;
      el.registerCard?.classList.add("auth-form-enter-right");
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
      el.loginCard?.classList.remove("auth-form-enter-left", "auth-form-enter-right");
      void el.loginCard?.offsetWidth;
      el.loginCard?.classList.add("auth-form-enter-left");
    }

    if (el.loginError) el.loginError.textContent = "";
    if (el.signUpError) el.signUpError.textContent = "";
  }

  function showRecoveryStep(step) {
    const recoverySteps = {
      forgot: el.forgotPasswordContainer,
      otp: el.otpVerifyContainer,
      reset: el.resetPasswordContainer,
    };

    const activeContainer = step === "login" ? el.loginCard : recoverySteps[step];
    const entryClass = step === "login" ? "auth-recovery-enter-left" : "auth-recovery-enter-right";
    [el.loginCard, el.registerCard, ...Object.values(recoverySteps)].forEach((container) => {
      container?.classList.remove("auth-recovery-enter-left", "auth-recovery-enter-right");
    });

    if (activeContainer) {
      void activeContainer.offsetWidth;
      activeContainer.classList.add(entryClass);
    }

    if (el.loginCard) el.loginCard.classList.toggle("hidden", step !== "login");
    if (el.registerCard) el.registerCard.classList.add("hidden");
    if (el.authTabs) el.authTabs.classList.toggle("hidden", step !== "login");
    Object.entries(recoverySteps).forEach(([name, container]) => {
      if (container) container.classList.toggle("hidden", name !== step);
    });
    if (el.tabSignIn) {
      el.tabSignIn.classList.add("active");
      el.tabSignIn.setAttribute("aria-selected", "true");
    }
    if (el.tabSignUp) {
      el.tabSignUp.classList.remove("active");
      el.tabSignUp.setAttribute("aria-selected", "false");
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail")?.value.trim() || "";
    if (el.forgotError) el.forgotError.textContent = "";
    if (!email) {
      if (el.forgotError) el.forgotError.textContent = "Please enter your registered email address.";
      return;
    }

    const res = await apiRequest("/auth/forgot-password", "POST", { email });
    if (res && res.success) {
      document.getElementById("otpTargetEmail").value = res.email || email;
      document.getElementById("otpRecipientEmail").textContent = res.email || email;
      showRecoveryStep("otp");
    } else if (el.forgotError) {
      el.forgotError.textContent = res?.message || res?.error || "Unable to send the reset code.";
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const email = document.getElementById("otpTargetEmail")?.value || "";
    const otp = document.getElementById("otpInput")?.value.trim() || "";
    if (el.otpError) el.otpError.textContent = "";
    if (!email || otp.length !== 6) {
      if (el.otpError) el.otpError.textContent = "Please enter the 6-digit OTP code from your email.";
      return;
    }

    const res = await apiRequest("/auth/verify-otp", "POST", { email, otp });
    if (res && res.success) {
      document.getElementById("resetEmail").value = res.email || email;
      document.getElementById("resetToken").value = res.token || "";
      document.getElementById("resetOtp").value = otp;
      showRecoveryStep("reset");
    } else if (el.otpError) {
      el.otpError.textContent = res?.message || res?.error || "The OTP code could not be verified.";
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    const email = document.getElementById("resetEmail")?.value || "";
    const token = document.getElementById("resetToken")?.value || "";
    const otp = document.getElementById("resetOtp")?.value || "";
    const password = document.getElementById("newPassword")?.value || "";
    const password_confirmation = document.getElementById("newPasswordConfirmation")?.value || "";
    if (el.resetError) el.resetError.textContent = "";

    const res = await apiRequest("/auth/reset-password", "POST", {
      email,
      token,
      otp,
      password,
      password_confirmation,
    });
    if (res && res.success) {
      showRecoveryStep("login");
      if (el.loginError) el.loginError.textContent = "";
      showToast(res.message || "Your password has been reset. You can now sign in.");
    } else if (el.resetError) {
      el.resetError.textContent = res?.message || res?.error || "Unable to reset your password.";
    }
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
    function bindToggle(buttonId, inputId) {
      const btn = document.getElementById(buttonId);
      const input = document.getElementById(inputId);
      if (!btn || !input) return;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isPw = input.getAttribute("type") === "password";
        input.setAttribute("type", isPw ? "text" : "password");
        btn.setAttribute("aria-pressed", isPw ? "true" : "false");
        btn.setAttribute("aria-label", isPw ? "Hide password" : "Show password");

        const eyeOpen = btn.querySelector(".eye-open");
        const eyeClosed = btn.querySelector(".eye-closed");
        if (eyeOpen && eyeClosed) {
          if (isPw) {
            eyeOpen.classList.add("hidden");
            eyeClosed.classList.remove("hidden");
          } else {
            eyeOpen.classList.remove("hidden");
            eyeClosed.classList.add("hidden");
          }
        }
      });
    }

    bindToggle("toggleLoginPassword", "loginPassword");
    bindToggle("toggleRegPassword", "regPassword");
    bindToggle("toggleRegConfirmPassword", "regConfirmPassword");
    bindToggle("toggleNewPassword", "newPassword");
    bindToggle("toggleNewPasswordConfirm", "newPasswordConfirmation");
  }

  function setupHelpModal() {
    if (el.forgotPasswordBtn) {
      el.forgotPasswordBtn.addEventListener("click", () => {
        showRecoveryStep("forgot");
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

  function setupRegistrationRoleWatcher() {
    const roleSelect = document.getElementById("regRole");
    const deptSelect = document.getElementById("regDept");
    const deptLabelText = document.getElementById("regDeptLabelText");

    if (!roleSelect || !deptSelect) return;

    roleSelect.addEventListener("change", (e) => {
      const role = e.target.value;
      if (role === "student") {
        if (deptLabelText) deptLabelText.textContent = "College Degree Program";
        deptSelect.innerHTML = `
          <option value="BS Information Technology">BS Information Technology</option>
          <option value="BS Computer Science">BS Computer Science</option>
          <option value="BS Business Administration">BS Business Administration</option>
          <option value="BS Hospitality Management">BS Hospitality Management</option>
          <option value="BS Industrial Technology">BS Industrial Technology</option>
        `;
      } else if (role === "supervisor") {
        if (deptLabelText) deptLabelText.textContent = "Assigned Campus Host Department / Office";
        deptSelect.innerHTML = `
          <option value="Management Information Systems (MIS) / ICT Center">Management Information Systems (MIS) / ICT Center</option>
          <option value="Office of the Campus Registrar">Office of the Campus Registrar</option>
          <option value="Campus Library & Learning Resource Center">Campus Library & Learning Resource Center</option>
          <option value="Office of the Campus Dean">Office of the Campus Dean</option>
          <option value="Administrative & Finance Services">Administrative & Finance Services</option>
          <option value="College of Computing Studies Laboratory">College of Computing Studies Laboratory</option>
          <option value="Campus Clinic / Health Services">Campus Clinic / Health Services</option>
        `;
      } else if (role === "adviser") {
        if (deptLabelText) deptLabelText.textContent = "Faculty College / Department";
        deptSelect.innerHTML = `
          <option value="College of Computing Studies">College of Computing Studies</option>
          <option value="College of Business Management">College of Business Management</option>
          <option value="College of Teacher Education">College of Teacher Education</option>
          <option value="College of Hospitality and Tourism">College of Hospitality and Tourism</option>
          <option value="College of Technology">College of Technology</option>
        `;
      }
    });
  }

  function setupDemoAccountChips() {
    document.querySelectorAll(".demo-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const user = chip.dataset.user;
        const pass = chip.dataset.pass;
        const usernameInput = document.getElementById("loginUsername");
        const passwordInput = document.getElementById("loginPassword");
        if (usernameInput && passwordInput) {
          usernameInput.value = user;
          passwordInput.value = pass;
          // Auto-submit login for convenient testing
          if (el.loginForm) {
            el.loginForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
          }
        }
      });
    });
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
    setupRegistrationRoleWatcher();
    setupDemoAccountChips();

    // Forms
    if (el.loginForm) el.loginForm.addEventListener("submit", handleLogin);
    if (el.signUpForm) el.signUpForm.addEventListener("submit", handleRegister);
    if (el.forgotPasswordForm) el.forgotPasswordForm.addEventListener("submit", handleForgotPassword);
    if (el.otpVerifyForm) el.otpVerifyForm.addEventListener("submit", handleVerifyOtp);
    if (el.resetPasswordForm) el.resetPasswordForm.addEventListener("submit", handleResetPassword);
    if (el.forgotBackToLoginBtn) el.forgotBackToLoginBtn.addEventListener("click", () => showRecoveryStep("login"));
    if (el.otpBackToForgotBtn) el.otpBackToForgotBtn.addEventListener("click", () => showRecoveryStep("forgot"));
    if (el.resetBackToLoginBtn) el.resetBackToLoginBtn.addEventListener("click", () => showRecoveryStep("login"));
    if (el.resendOtpBtn) el.resendOtpBtn.addEventListener("click", () => el.forgotPasswordForm?.requestSubmit());
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
        if (el.sidebar && el.sidebar.classList.contains("open")) {
          closeMobileSidebar();
        } else {
          openMobileSidebar();
        }
      });
    }
    if (el.sidebarCloseBtn) {
      el.sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
    }
    if (el.sidebarBackdrop) {
      el.sidebarBackdrop.addEventListener("click", closeMobileSidebar);
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
