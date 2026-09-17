const fs = require('fs');

// 1. Update welcome.blade.php to ensure both password and confirm password have toggles with proper SVG icons
let blade = fs.readFileSync('C:/Users/BELIAL/Desktop/ISPSC/resources/views/welcome.blade.php', 'utf8');

// Replace login password markup
blade = blade.replace(
  `<button type="button" class="password-toggle" id="toggleLoginPassword" aria-label="Show password" aria-pressed="false">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>`,
  `<button type="button" class="password-toggle" id="toggleLoginPassword" aria-label="Show password" aria-pressed="false">
                  <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg class="eye-closed hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>`
);

// Replace registration password and confirm password markup
blade = blade.replace(
  `<div class="form-grid-2">
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
            </div>`,
  `<div class="form-grid-2">
              <label for="regPassword">
                Password
                <div class="input-with-icon">
                  <input id="regPassword" name="regPassword" type="password" placeholder="Create password" autocomplete="new-password" required aria-required="true" />
                  <button type="button" class="password-toggle" id="toggleRegPassword" aria-label="Show password" aria-pressed="false">
                    <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg class="eye-closed hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
              </label>
              <label for="regConfirmPassword">
                Confirm Password
                <div class="input-with-icon">
                  <input id="regConfirmPassword" name="regConfirmPassword" type="password" placeholder="Repeat password" autocomplete="new-password" required aria-required="true" />
                  <button type="button" class="password-toggle" id="toggleRegConfirmPassword" aria-label="Show password" aria-pressed="false">
                    <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg class="eye-closed hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
              </label>
            </div>`
);

fs.writeFileSync('C:/Users/BELIAL/Desktop/ISPSC/resources/views/welcome.blade.php', blade, 'utf8');

// 2. Update app.js setupPasswordToggles function
let appJs = fs.readFileSync('C:/Users/BELIAL/Desktop/ISPSC/public/app.js', 'utf8');

// Update el cache
if (!appJs.includes('toggleRegConfirmPassword:')) {
  appJs = appJs.replace(
    'toggleRegPassword: document.getElementById("toggleRegPassword"),',
    'toggleRegPassword: document.getElementById("toggleRegPassword"),\n    toggleRegConfirmPassword: document.getElementById("toggleRegConfirmPassword"),'
  );
}

// Update setupPasswordToggles
const newPasswordToggleFn = `  function setupPasswordToggles() {
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
  }`;

const oldToggleRegex = /function setupPasswordToggles\(\) \{[\s\S]*?if \(el\.toggleRegPassword\) \{[\s\S]*?\}\s*\}/;
appJs = appJs.replace(oldToggleRegex, newPasswordToggleFn);

fs.writeFileSync('C:/Users/BELIAL/Desktop/ISPSC/public/app.js', appJs, 'utf8');

// 3. Update styles.css to ensure password-toggle is clearly clickable and positioned
let styles = fs.readFileSync('C:/Users/BELIAL/Desktop/ISPSC/public/styles.css', 'utf8');
if (!styles.includes('.password-toggle svg')) {
  styles += `
/* Password Toggle Eye Icons */
.password-toggle {
  z-index: 5;
  cursor: pointer !important;
}
.password-toggle svg {
  pointer-events: none;
  stroke: #49585f;
}
.password-toggle:hover svg {
  stroke: #17212b;
}
`;
  fs.writeFileSync('C:/Users/BELIAL/Desktop/ISPSC/public/styles.css', styles, 'utf8');
}

console.log('Password toggle updated successfully!');
