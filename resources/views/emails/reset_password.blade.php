<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password - ISPSC Practicum Portal</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f6f8;
      padding: 30px 15px;
    }
    .email-container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .email-header {
      background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%);
      padding: 28px 32px;
      text-align: center;
      color: #ffffff;
    }
    .email-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .email-header p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #bfdbfe;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .email-body {
      padding: 32px;
      line-height: 1.6;
      color: #374151;
      font-size: 15px;
    }
    .email-body h2 {
      margin-top: 0;
      font-size: 18px;
      color: #111827;
      font-weight: 600;
    }
    .otp-card {
      background: #f0fdf4;
      border: 2px dashed #16a34a;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #15803d;
      margin-bottom: 6px;
    }
    .otp-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #0f172a;
      margin: 4px 0;
      user-select: all;
    }
    .otp-sub {
      font-size: 12px;
      color: #166534;
      margin-top: 4px;
    }
    .btn-container {
      text-align: center;
      margin: 24px 0 16px;
    }
    .btn-reset {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 11px 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }
    .btn-reset:hover {
      background-color: #1d4ed8;
    }
    .notice-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
      color: #92400e;
    }
    .fallback-url {
      background-color: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      word-break: break-all;
      font-family: monospace;
      font-size: 11px;
      color: #4b5563;
      margin-top: 8px;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 20px 32px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <h1>Ilocos Sur Polytechnic State College</h1>
        <p>Practicum & Workplace Training Portal</p>
      </div>
      <div class="email-body">
        <h2>Hello {{ $userName }},</h2>
        <p>We received a request to reset the password for your account linked to <strong>{{ $userEmail }}</strong>.</p>
        
        <div class="otp-card">
          <div class="otp-label">Your One-Time Verification Code (OTP)</div>
          <div class="otp-code">{{ $otp }}</div>
          <div class="otp-sub">Enter this 6-digit code on the portal verification screen to reset your password.</div>
        </div>

        <div class="notice-box">
          <strong>Security Note:</strong> This OTP code and reset link are valid for <strong>{{ $expiresInMinutes }} minutes</strong>. If you did not request a password reset, you can safely ignore this email; your account will remain secure.
        </div>

        <p style="font-size: 13px; color: #4b5563;">
          You can also click the button below to directly open the password reset page:
        </p>
        <div class="btn-container">
          <a href="{{ $resetUrl }}" class="btn-reset" target="_blank" rel="noopener">Open Password Reset Form</a>
        </div>

        <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
          Direct Link:
        </p>
        <div class="fallback-url">
          <a href="{{ $resetUrl }}" style="color: #2563eb; text-decoration: underline;">{{ $resetUrl }}</a>
        </div>
      </div>
      <div class="email-footer">
        <p><strong>ISPSC Tagudin Campus &bull; On-the-Job Training & Placement Office</strong><br />
        Tagudin, Ilocos Sur, Philippines</p>
        <p style="margin-top: 8px; font-size: 11px; color: #9ca3af;">
          This is an automated system notification. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
