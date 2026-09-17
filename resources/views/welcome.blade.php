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
    <link rel="stylesheet" href="{{ asset('styles.css') }}?v={{ file_exists(public_path('styles.css')) ? filemtime(public_path('styles.css')) : time() }}" />
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
                  autocomplete="current-password"
                  required
                  aria-required="true"
                />
                <button type="button" class="password-toggle" id="toggleLoginPassword" aria-label="Show password" aria-pressed="false">
                  <svg class="eye-open" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 1 12 C 1 12 5 4 12 4 C 19 4 23 12 23 12 C 23 12 19 20 12 20 C 5 20 1 12 1 12 Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg class="eye-closed hidden" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
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
                <input id="regName" name="regName" autocomplete="name" required aria-required="true" />
              </label>
              <label for="regId">
                Student / Faculty ID
                <input id="regId" name="regId" required aria-required="true" />
              </label>
            </div>
            <label for="regDept" id="regDeptLabel">
              <span id="regDeptLabelText">College Department / Degree Program</span>
              <select id="regDept" name="regDept" required aria-required="true">
                <option value="BS Information Technology">BS Information Technology</option>
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS Business Administration">BS Business Administration</option>
                <option value="BS Hospitality Management">BS Hospitality Management</option>
                <option value="BS Industrial Technology">BS Industrial Technology</option>
              </select>
            </label>
            <label for="regEmail">
              Email Address
              <input id="regEmail" name="regEmail" type="email" autocomplete="email" placeholder="your.name@ispsc.edu.ph" required aria-required="true" />
            </label>
            <div class="form-grid-2">
              <label for="regUsername">
                Username
                <input id="regUsername" name="regUsername" autocomplete="username" required aria-required="true" />
              </label>
              <label for="regPassword">
                Password
                <div class="input-with-icon">
                  <span class="input-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input id="regPassword" name="regPassword" type="password" autocomplete="new-password" required aria-required="true" />
                  <button type="button" class="password-toggle" id="toggleRegPassword" aria-label="Show password" aria-pressed="false">
                    <svg class="eye-open" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 1 12 C 1 12 5 4 12 4 C 19 4 23 12 23 12 C 23 12 19 20 12 20 C 5 20 1 12 1 12 Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg class="eye-closed hidden" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
              </label>
            </div>
            <div class="form-grid-2">
              <label for="regConfirmPassword">
                Confirm Password
                <div class="input-with-icon">
                  <span class="input-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                  <input id="regConfirmPassword" name="regConfirmPassword" type="password" autocomplete="new-password" required aria-required="true" />
                  <button type="button" class="password-toggle" id="toggleRegConfirmPassword" aria-label="Show password" aria-pressed="false">
                    <svg class="eye-open" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 1 12 C 1 12 5 4 12 4 C 19 4 23 12 23 12 C 23 12 19 20 12 20 C 5 20 1 12 1 12 Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg class="eye-closed hidden" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
              </label>
              <div></div>
            </div>
            <div class="form-row-utility" style="margin-top:4px;">
              <label class="checkbox-label" for="regTerms">
                <input type="checkbox" id="regTerms" required aria-required="true" /> I agree to the ISPSC Practicum Policy & Data Privacy Terms
              </label>
            </div>
            <p class="login-error" id="signUpError" role="alert" aria-live="assertive"></p>
            <button class="primary-button login-button" type="submit" id="regSubmitBtn">
              Register Account
            </button>
          </form>

          <p class="auth-switch-text">
            Already have an account? 
            <button type="button" class="text-link-button inline-link" id="switchToSignIn">Sign in here</button>
          </p>
        </div>

        <!-- FORGOT PASSWORD FORM (STEP 1: REQUEST OTP) -->
        <div id="forgotPasswordContainer" class="hidden" role="region" aria-labelledby="forgotPasswordTitle">
          <p class="eyebrow">Account Recovery</p>
          <h1 id="forgotPasswordTitle">Reset Password</h1>
          <p class="login-copy">Enter your registered email address. We will email you a 6-digit OTP code valid for 15 minutes to verify your identity.</p>

          <form id="forgotPasswordForm" class="login-form" novalidate>
            <label for="forgotEmail">
              Registered Email Address
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </span>
                <input
                  id="forgotEmail"
                  name="email"
                  type="email"
                  autocomplete="email"
                  placeholder="your.name@ispsc.edu.ph"
                  required
                  aria-required="true"
                />
              </div>
            </label>
            <p class="login-error" id="forgotError" role="alert" aria-live="assertive"></p>
            <div id="forgotSuccessBanner" class="hidden" style="margin-bottom:12px; padding:10px 14px; border-radius:8px; background:#eff6ff; border:1px solid #bfdbfe; font-size:13px; color:#1e40af; line-height:1.4;"></div>
            <button class="primary-button login-button" type="submit" id="forgotSubmitBtn">
              Send Password Reset Code (OTP)
            </button>
            <div style="text-align:center; margin-top:14px;">
              <button type="button" class="text-link-button" id="forgotBackToLoginBtn">
                &larr; Remember your password? Back to Sign In
              </button>
            </div>
          </form>
        </div>

        <!-- OTP VERIFICATION FORM (STEP 2: WAIT & ENTER OTP) -->
        <div id="otpVerifyContainer" class="hidden" role="region" aria-labelledby="otpVerifyTitle">
          <p class="eyebrow">Two-Step Verification</p>
          <h1 id="otpVerifyTitle">Enter Verification OTP</h1>
          <p class="login-copy">
            We sent a 6-digit OTP code to <strong id="otpRecipientEmail" style="color:#0f172a;">your email</strong>. Please enter the code below to proceed.
          </p>

          <form id="otpVerifyForm" class="login-form" novalidate>
            <input type="hidden" id="otpTargetEmail" value="" />

            <label for="otpInput">
              6-Digit OTP Code
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input
                  id="otpInput"
                  name="otp"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  autocomplete="one-time-code"
                  placeholder="e.g. 123456"
                  style="letter-spacing: 4px; font-weight: 700; font-size: 16px;"
                  required
                  aria-required="true"
                />
              </div>
            </label>

            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--muted); margin:4px 0 12px;">
              <span>&#9201; Code expires in 15 minutes</span>
              <button type="button" class="text-link-button" id="resendOtpBtn" style="font-size:12px;">Resend code</button>
            </div>

            <p class="login-error" id="otpError" role="alert" aria-live="assertive"></p>
            <button class="primary-button login-button" type="submit" id="otpSubmitBtn">
              Verify OTP & Proceed &rarr;
            </button>
            <div style="text-align:center; margin-top:14px;">
              <button type="button" class="text-link-button" id="otpBackToForgotBtn">
                &larr; Change Email Address
              </button>
            </div>
          </form>
        </div>

        <!-- RESET PASSWORD FORM -->
        <div id="resetPasswordContainer" class="hidden" role="region" aria-labelledby="resetPasswordTitle">
          <p class="eyebrow">Secure Password Reset</p>
          <h1 id="resetPasswordTitle">Set New Password</h1>
          <p class="login-copy">Enter your new password. Password must be at least 8 characters long and include both letters and numbers.</p>

          <form id="resetPasswordForm" class="login-form" novalidate>
            <input type="hidden" id="resetToken" name="token" value="" />
            <input type="hidden" id="resetEmail" name="email" value="" />
            <input type="hidden" id="resetOtp" name="otp" value="" />

            <label for="newPassword">
              New Password
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input
                  id="newPassword"
                  name="password"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Minimum 8 chars, letters & numbers"
                  required
                  aria-required="true"
                />
                <button type="button" class="password-toggle" id="toggleNewPassword" aria-label="Show password" aria-pressed="false">
                  <svg class="eye-open" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 1 12 C 1 12 5 4 12 4 C 19 4 23 12 23 12 C 23 12 19 20 12 20 C 5 20 1 12 1 12 Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg class="eye-closed hidden" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>
              </div>
            </label>

            <label for="newPasswordConfirmation">
              Confirm New Password
              <div class="input-with-icon">
                <span class="input-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input
                  id="newPasswordConfirmation"
                  name="password_confirmation"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Re-enter your new password"
                  required
                  aria-required="true"
                />
                <button type="button" class="password-toggle" id="toggleNewPasswordConfirm" aria-label="Show password" aria-pressed="false">
                  <svg class="eye-open" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M 1 12 C 1 12 5 4 12 4 C 19 4 23 12 23 12 C 23 12 19 20 12 20 C 5 20 1 12 1 12 Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg class="eye-closed hidden" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>
              </div>
            </label>

            <div style="font-size:12px; color:var(--muted); margin:4px 0 10px; line-height:1.4;">
              &#128274; Password must have at least 8 characters and contain both letters and numbers.
            </div>

            <p class="login-error" id="resetError" role="alert" aria-live="assertive"></p>
            <button class="primary-button login-button" type="submit" id="resetSubmitBtn">
              Reset Password & Proceed to Login
            </button>
            <div style="text-align:center; margin-top:14px;">
              <button type="button" class="text-link-button" id="resetBackToLoginBtn">
                &larr; Cancel and Back to Sign In
              </button>
            </div>
          </form>
        </div>

        <p class="login-footer-copy">
          Ilocos Sur Polytechnic State College &bull; Tagudin Campus &bull; OJT & Workplace Training System
        </p>
      </div>
    </section>

    <!-- MAIN PORTAL APP SHELL -->
    <div class="portal-shell hidden" id="appShell">
      <!-- Mobile Sidebar Backdrop Overlay -->
      <div class="sidebar-backdrop" id="sidebarBackdrop" aria-hidden="true"></div>

      <!-- SIDEBAR NAVIGATION -->
      <aside class="sidebar" id="sidebar" aria-label="Portal Navigation">
        <div class="sidebar-header">
          <div class="sidebar-brand-flex">
            <img src="{{ asset('images/ispsc logo.png') }}" alt="ISPSC Logo" class="brand-logo-sidebar" />
            <div class="sidebar-brand-text">
              <strong>ISPSC Tagudin</strong>
              <small>Practicum Portal</small>
            </div>
          </div>
          <button class="icon-button sidebar-close-btn" id="sidebarCloseBtn" aria-label="Close navigation sidebar" type="button">&times;</button>
        </div>

        <nav class="sidebar-nav" id="mainNav" aria-label="Main Navigation">
          <!-- Populated dynamically per user role by JavaScript -->
        </nav>

        <!-- Quota Progress Indicator for Students -->
        <div class="quota-container" id="quotaBlock">
          <div class="quota-header">
            <span>Practicum Target</span>
            <span class="score-badge" id="quotaBadge">480 hrs</span>
          </div>
          <div class="progress-bar" role="progressbar" aria-label="Target hours progress">
            <i id="quotaFill" style="width: 0%"></i>
          </div>
          <p class="quota-footer" id="quotaText">0 / 480 hrs (0%)</p>
        </div>

        <!-- Sidebar User Profile Footer -->
        <div class="sidebar-profile" id="sidebarProfileCard" role="region" aria-label="Current User Summary">
          <div class="user-avatar" id="sidebarAvatar" aria-hidden="true">U</div>
          <div class="user-details">
            <span class="user-name" id="sidebarName">User Name</span>
            <span class="user-role" id="sidebarRole">Role</span>
          </div>
          <button class="profile-gear-btn" id="sidebarProfileButton" type="button" aria-label="View user profile">
            &#9881;
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT CONTAINER -->
      <div class="content-frame">
        <!-- TOP HEADER BAR -->
        <header class="top-bar">
          <div class="top-left">
            <button class="icon-button menu-toggle" id="mobileMenu" aria-label="Toggle navigation sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <nav class="breadcrumbs" aria-label="Breadcrumbs">
              <span class="breadcrumb-root">ISPSC Practicum</span>
              <span class="breadcrumb-separator" aria-hidden="true">/</span>
              <span class="breadcrumb-current" id="breadcrumbCurrent">Dashboard</span>
            </nav>
          </div>

          <div class="top-right">
            <div class="top-user-pill" id="topProfileBadge" role="button" tabindex="0" aria-label="Open profile modal">
              <div class="avatar-small" id="topAvatar" aria-hidden="true">U</div>
              <span class="top-user-name" id="topProfileName">User Name</span>
            </div>
            <button class="secondary-button signout-btn" id="signOut" type="button">Sign Out</button>
          </div>
        </header>

        <!-- DYNAMIC VIEW CONTAINER -->
        <main class="main-content" id="mainContent" tabindex="-1">
          <div id="viewContainer">
            <!-- Rendered by JavaScript dynamically -->
          </div>
        </main>
      </div>
    </div>

    <!-- PROFILE MODAL DIALOG -->
    <div class="modal-backdrop hidden" id="profileModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle" aria-hidden="true">
      <div class="modal-card" style="max-width: 540px;">
        <div class="modal-header">
          <div>
            <p class="modal-kicker">ISPSC Account Profile</p>
            <h2 id="profileModalTitle">User Account Details</h2>
          </div>
          <button type="button" class="icon-button modal-close" id="profileModalClose" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body" id="profileModalContent">
          <!-- Populated by JavaScript -->
        </div>
      </div>
    </div>

    <!-- GENERAL ACTION MODAL DIALOG -->
    <div class="modal-backdrop hidden" id="modalBackdrop" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-hidden="true">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <p class="modal-kicker" id="modalKicker">Action Form</p>
            <h2 id="modalTitle">Form Title</h2>
          </div>
          <button type="button" class="icon-button modal-close" id="modalClose" aria-label="Close dialog">&times;</button>
        </div>
        <p class="modal-intro" id="modalDescription">Form instructions</p>
        <form class="modal-form" id="modalForm" novalidate>
          <div id="modalFields">
            <!-- Populated by JavaScript based on modal action type -->
          </div>
          <div class="modal-actions">
            <button class="secondary-button" type="button" onclick="document.getElementById('modalBackdrop').classList.add('hidden'); document.getElementById('modalBackdrop').classList.remove('open'); document.body.style.overflow='';">
              Cancel
            </button>
            <button class="primary-button" type="submit" id="modalSubmitLabel">
              Confirm & Save
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- NOTIFICATION TOAST -->
    <div class="toast" id="toast" role="status" aria-live="polite"></div>

    <script src="{{ asset('app.js') }}?v={{ file_exists(public_path('app.js')) ? filemtime(public_path('app.js')) : time() }}"></script>
  </body>
</html>
