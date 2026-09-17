<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="ISPSC Tagudin Campus - Practicum & OJT Management Portal for Students, Supervisors, and Faculty Advisers." />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>ISPSC Tagudin Campus - Practicum & OJT Management Portal</title>

    <!-- Open Graph / Link Share Preview -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="ISPSC Tagudin Campus - Practicum & OJT Management Portal" />
    <meta property="og:description" content="Official Practicum & OJT Management System for students, supervisors, and faculty advisers at ISPSC Tagudin Campus." />
    <meta property="og:image" content="{{ asset('images/ISPSC IMAGE LINK SHARE.jpg') }}" />
    <meta property="og:image:secure_url" content="{{ asset('images/ISPSC IMAGE LINK SHARE.jpg') }}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="ISPSC Tagudin Campus Practicum & OJT Portal" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="ISPSC Tagudin Campus - Practicum & OJT Management Portal" />
    <meta name="twitter:description" content="Official Practicum & OJT Management System for students, supervisors, and faculty advisers at ISPSC Tagudin Campus." />
    <meta name="twitter:image" content="{{ asset('images/ISPSC IMAGE LINK SHARE.jpg') }}" />

    <!-- Favicon / Brand Icon -->
    <link rel="icon" type="image/png" href="{{ asset('images/ispsc logo.png') }}" />
    <link rel="apple-touch-icon" href="{{ asset('images/ispsc logo.png') }}" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <!-- Accessibility: Skip Navigation Link for Keyboard & Screen Reader Users -->
    <a href="#mainContent" class="skip-link">Skip to main content</a>

    <!-- AUTHENTICATION (LOGIN & REGISTRATION) SCREEN -->
    <section class="login-screen" id="loginScreen" aria-label="Portal Authentication">
      <div class="login-panel">
        <div class="login-brand">
          <img src="{{ asset('images/ispsc logo.png') }}" alt="ISPSC Logo" class="brand-logo-img" />
          <div class="brand-text-group">
            <span class="brand-title">ISPSC Tagudin Campus</span>
            <span class="brand-subtitle">Practicum & OJT Portal</span>
          </div>
        </div>

        <div class="auth-tabs" role="tablist" aria-label="Authentication Options">
          <button class="auth-tab active" id="tabSignIn" type="button" role="tab" aria-selected="true" aria-controls="signInContainer">
            Sign In
          </button>
          <button class="auth-tab" id="tabSignUp" type="button" role="tab" aria-selected="false" aria-controls="signUpContainer">
            Register Account
          </button>
        </div>

        <!-- SIGN IN FORM -->
        <div id="signInContainer" role="tabpanel" aria-labelledby="tabSignIn">
          <p class="eyebrow">ISPSC Tagudin Campus</p>
          <h1>Welcome back.</h1>
          <p class="login-copy">Sign in to access your OJT dashboard, attendance, and requirements.</p>

          <form id="loginForm" class="login-form" novalidate>
            <label for="loginUsername">
              Username
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <input
                  id="loginUsername"
                  name="username"
                  placeholder="Enter username"
                  autocomplete="username"
                  required
                  aria-required="true"
                />
              </div>
            </label>
            <label for="loginPassword">
              Password
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input
                  id="loginPassword"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  autocomplete="current-password"
                  required
                  aria-required="true"
                />
                <button type="button" class="password-toggle" id="toggleLoginPassword" aria-label="Show password" aria-pressed="false">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>
            </label>
            <div class="form-row-utility">
              <label class="checkbox-label" for="rememberMe">
                <input type="checkbox" id="rememberMe" checked /> Remember credentials
              </label>
              <button type="button" class="text-link-button" id="forgotPasswordBtn">Forgot password?</button>
            </div>
            <p class="login-error" id="loginError" role="alert" aria-live="assertive"></p>
            <button class="primary-button login-button" type="submit" id="loginSubmitBtn">
              Sign in to Portal
            </button>
          </form>

          <p class="auth-switch-text">
            New trainee, adviser, or supervisor? 
            <button type="button" class="text-link-button inline-link" id="switchToSignUp">Create an account</button>
          </p>
        </div>

        <!-- SIGN UP (REGISTRATION) FORM -->
        <div id="signUpContainer" class="hidden" role="tabpanel" aria-labelledby="tabSignUp">
          <p class="eyebrow">New Registration</p>
          <h1>Create account.</h1>
          <p class="login-copy">Register your practicum account with ISPSC Tagudin Campus.</p>

          <form id="signUpForm" class="login-form" novalidate>
            <label for="regRole">
              Account Role
              <select id="regRole" name="regRole" required aria-required="true">
                <option value="student" selected>OJT Student (Practicum Trainee)</option>
                <option value="supervisor">Campus Department Supervisor</option>
                <option value="adviser">OJT Adviser (Faculty Coordinator)</option>
              </select>
            </label>
            <div class="form-grid-2">
              <label for="regName">
                Full Name
                <input id="regName" name="regName" placeholder="e.g., Mark Anthony Ramos" autocomplete="name" required aria-required="true" />
              </label>
              <label for="regId">
                Student / Faculty ID
                <input id="regId" name="regId" placeholder="e.g., 2026-0412-TG" required aria-required="true" />
              </label>
            </div>
            <label for="regDept">
              College Department / Degree Program
              <select id="regDept" name="regDept" required aria-required="true">
                <option value="BS Information Technology">BS Information Technology</option>
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS Business Administration">BS Business Administration</option>
                <option value="BS Hospitality Management">BS Hospitality Management</option>
                <option value="BS Industrial Technology">BS Industrial Technology</option>
              </select>
            </label>
            <div class="form-grid-2">
              <label for="regEmail">
                Email Address
                <input id="regEmail" name="regEmail" type="email" placeholder="name@example.com" autocomplete="email" required aria-required="true" />
              </label>
              <label for="regUsername">
                Username
                <input id="regUsername" name="regUsername" placeholder="Choose username" autocomplete="username" required aria-required="true" />
              </label>
            </div>
            <div class="form-grid-2">
              <label for="regPassword">
                Password
                <div class="input-with-icon">
                  <input id="regPassword" name="regPassword" type="password" placeholder="Create password" autocomplete="new-password" required aria-required="true" />
                  <button type="button" class="password-toggle" id="toggleRegPassword" aria-label="Show password" aria-pressed="false">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                </div>
              </label>
              <label for="regConfirmPassword">
                Confirm Password
                <div class="input-with-icon">
                  <input id="regConfirmPassword" name="regConfirmPassword" type="password" placeholder="Repeat password" autocomplete="new-password" required aria-required="true" />
                </div>
              </label>
            </div>
            <label class="checkbox-label" for="regTerms" style="margin-top: 6px">
              <input type="checkbox" id="regTerms" required aria-required="true" /> I agree to the ISPSC Practicum Policy & Data Privacy Terms.
            </label>
            <p class="login-error" id="signUpError" role="alert" aria-live="assertive"></p>
            <button class="primary-button login-button" type="submit" id="signUpSubmitBtn">
              Complete Registration & Sign In
            </button>
          </form>

          <p class="auth-switch-text">
            Already registered? 
            <button type="button" class="text-link-button inline-link" id="switchToSignIn">Sign in here</button>
          </p>
        </div>
      </div>
    </section>

    <!-- MAIN APPLICATION WORKSPACE -->
    <div class="app-shell hidden" id="appShell">
      <aside class="sidebar" id="sidebar" aria-label="Primary Navigation">
        <div class="brand">
          <img src="{{ asset('images/ispsc logo.png') }}" alt="ISPSC Logo" class="brand-logo-img brand-logo-sidebar" />
          <div class="brand-text-group">
            <span class="brand-title">ISPSC Tagudin</span>
            <span class="brand-accent">OJT Portal</span>
          </div>
        </div>
        <div class="workspace-switcher" id="sidebarProfileCard" role="button" tabindex="0" aria-label="View user profile" style="cursor:pointer;">
          <span class="avatar avatar-lime" id="sidebarAvatar" aria-hidden="true">US</span>
          <span>
            <strong id="sidebarName">User Account</strong>
            <small id="sidebarRole">ISPSC Tagudin Campus</small>
          </span>
          <button
            class="icon-button"
            id="sidebarProfileButton"
            aria-label="View user details"
            type="button"
          >
            &#9662;
          </button>
        </div>
        <nav class="main-nav" id="mainNav" aria-label="Workspace Sections">
          <p class="nav-label">Workspace</p>
          <button class="nav-item active" data-view="overview" type="button">
            <span class="nav-icon" aria-hidden="true">&#9632;</span>Overview
          </button>
          <button class="nav-item" data-view="application" type="button">
            <span class="nav-icon" aria-hidden="true">&#9823;</span>Application
          </button>
          <button class="nav-item" data-view="requirements" type="button">
            <span class="nav-icon" aria-hidden="true">&#10003;</span>Requirements
          </button>
          <button class="nav-item" data-view="attendance" type="button">
            <span class="nav-icon" aria-hidden="true">&#9719;</span>Attendance
          </button>
          <button class="nav-item" data-view="tasks" type="button">
            <span class="nav-icon" aria-hidden="true">&#8801;</span>Assigned tasks
          </button>
          <button class="nav-item" data-view="journal" type="button">
            <span class="nav-icon" aria-hidden="true">&#9998;</span>OJT journal
          </button>
          <button class="nav-item" data-view="reports" type="button">
            <span class="nav-icon" aria-hidden="true">&#9638;</span>Reports
          </button>
          <p class="nav-label nav-label-spaced">Personal</p>
          <button class="nav-item" data-view="feedback" type="button">
            <span class="nav-icon" aria-hidden="true">&#9825;</span>Feedback
          </button>
          <button class="nav-item" data-view="evaluation" type="button">
            <span class="nav-icon" aria-hidden="true">&#9734;</span>Evaluation results
          </button>
        </nav>
        
        <div class="sidebar-quota-box" id="quotaBlock" role="region" aria-label="OJT Quota Progress">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <small style="font-weight:700; font-size:10.5px; text-transform:uppercase; color:#49585f; letter-spacing:0.8px;">OJT Quota</small>
            <span style="font-size:11px; font-weight:700; color:#3b5006;" id="quotaBadge">480 hrs</span>
          </div>
          <div class="progress-bar" style="height:7px; background:#e1ebd7; border-radius:4px; overflow:hidden;" role="progressbar" id="quotaProgressBar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="480" aria-valuetext="0 hours of 480 hours completed">
            <i id="quotaFill" style="display:block; height:100%; width:0%; background:#8ba71b; border-radius:4px; transition:0.3s;"></i>
          </div>
          <div id="quotaText" style="margin-top:6px; font-size:11.5px; font-weight:700; color:#17212b;">0 / 480 hrs (0%)</div>
        </div>

        <div class="sidebar-bottom">
          <button class="nav-item" id="signOut" type="button">
            <span class="nav-icon" aria-hidden="true">&#10005;</span>Sign out
          </button>
        </div>
      </aside>

      <main class="main-content" id="mainContent" tabindex="-1">
        <header class="topbar" role="banner">
          <button
            class="mobile-menu"
            id="mobileMenu"
            aria-label="Toggle navigation menu"
            aria-expanded="false"
            aria-controls="sidebar"
            type="button"
          >
            &#9776;
          </button>
          <div class="breadcrumb" aria-label="Breadcrumb">
            ISPSC Tagudin Campus <span aria-hidden="true">/</span>
            <strong id="breadcrumbCurrent">Overview</strong>
          </div>
          <div class="topbar-actions">
            <button
              class="notification-button"
              id="notificationButton"
              aria-label="View notifications"
              type="button"
            >
              <span aria-hidden="true">&#9888;</span>
            </button>
            <div class="top-profile" id="topProfileBadge" role="button" tabindex="0" aria-label="User profile">
              <span class="avatar avatar-coral" id="topAvatar" aria-hidden="true">US</span>
              <span class="top-profile-name" id="topProfileName">User Account</span>
            </div>
          </div>
        </header>
        <div class="view-container" id="viewContainer" role="region" aria-live="polite"></div>
      </main>
    </div>

    <!-- ACCESSIBLE MODAL POPUP DIALOG -->
    <div
      class="modal-backdrop"
      id="modalBackdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      aria-describedby="modalDescription"
      aria-hidden="true"
    >
      <div class="modal" id="modalDialog">
        <button class="modal-close" id="modalClose" aria-label="Close dialog" type="button">
          &times;
        </button>
        <span class="modal-kicker" id="modalKicker">Manage Record</span>
        <h2 id="modalTitle">Update Details</h2>
        <p id="modalDescription">Complete the fields below to proceed.</p>
        <form id="modalForm" novalidate>
          <div id="modalFields"></div>
          <button class="primary-button" type="submit" id="modalSubmit">
            <span id="modalSubmitLabel">Save</span>
          </button>
        </form>
      </div>
    </div>

    <!-- ACCESSIBLE PROFILE / USER INFO MODAL -->
    <div
      class="modal-backdrop"
      id="profileModalBackdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profileModalTitle"
      aria-hidden="true"
    >
      <div class="modal modal-lg" id="profileModalDialog">
        <button class="modal-close" id="profileModalClose" aria-label="Close profile dialog" type="button">
          &times;
        </button>
        <span class="modal-kicker">User Information</span>
        <h2 id="profileModalTitle">My Profile &amp; Account Details</h2>
        <div id="profileModalContent"></div>
      </div>
    </div>

    <!-- ACCESSIBLE FORGOT PASSWORD / HELP MODAL -->
    <div
      class="modal-backdrop"
      id="helpModalBackdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="helpModalTitle"
      aria-describedby="helpModalDescription"
      aria-hidden="true"
    >
      <div class="modal" id="helpModalDialog">
        <button class="modal-close" id="helpModalClose" aria-label="Close help dialog" type="button">
          &times;
        </button>
        <span class="modal-kicker">Campus Support</span>
        <h2 id="helpModalTitle">Account & Password Recovery</h2>
        <p id="helpModalDescription">In accordance with ISPSC Tagudin Campus Data Privacy & IT Security Guidelines:</p>
        
        <div style="background:#f4f8ed; border:1px solid #d4e5c5; border-radius:8px; padding:14px; margin-bottom:16px; font-size:12.5px; line-height:1.6; color:#2c3e50;">
          <p style="margin:0 0 8px;"><strong>Steps to Reset Password:</strong></p>
          <ol style="margin:0; padding-left:18px;">
            <li>Visit the <strong>OJT Faculty Coordinator Office / ICT Center</strong> (Admin Building, 2nd Floor).</li>
            <li>Present your official <strong>ISPSC Student / Faculty ID</strong> card.</li>
            <li>Or contact the practicum focal person via official email: <a href="mailto:ojt.tagudin@ispsc.edu.ph" style="color:#4b6607; font-weight:700;">ojt.tagudin@ispsc.edu.ph</a></li>
          </ol>
        </div>

        <div style="display:flex; justify-content:flex-end;">
          <button class="primary-button" type="button" id="helpModalConfirmBtn">
            Got it, return to login
          </button>
        </div>
      </div>
    </div>

    <!-- ACCESSIBLE NOTIFICATIONS TOAST -->
    <div class="toast" id="toast" role="status" aria-live="polite"></div>

    <script src="/app.js"></script>
  </body>   
</html>
