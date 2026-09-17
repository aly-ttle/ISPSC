const fs = require('fs');
const path = require('path');

const welcomeHtml = fs.readFileSync(path.join(__dirname, 'resources/views/welcome.blade.php'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'public/app.js'), 'utf8');

console.log('=== AUDITING BUTTONS AND HANDLERS ===');

// 1. Find all onclick handlers in appJs and welcomeHtml
const onclickRegex = /onclick="([^"(]+)/g;
let match;
const onclicks = new Set();
while ((match = onclickRegex.exec(appJs)) !== null) {
  onclicks.add(match[1].replace('window.', ''));
}
while ((match = onclickRegex.exec(welcomeHtml)) !== null) {
  onclicks.add(match[1].replace('window.', ''));
}

console.log('Found onclick functions:', Array.from(onclicks));

// Check if these functions are defined on window or in appJs
for (const fn of onclicks) {
  const isDefined = appJs.includes(`window.${fn}`) || appJs.includes(`function ${fn}`);
  console.log(`Handler ${fn}: ${isDefined ? 'DEFINED OK' : 'MISSING / UNDEFINED!'}`);
}

// 2. Find all button IDs in HTML and app.js
const btnIdRegex = /<button[^>]*id="([^"]+)"/g;
const btnIds = new Set();
while ((match = btnIdRegex.exec(welcomeHtml)) !== null) {
  btnIds.add(match[1]);
}
while ((match = btnIdRegex.exec(appJs)) !== null) {
  btnIds.add(match[1]);
}

console.log('\nFound button IDs:', Array.from(btnIds));

// Check if each button ID is referenced in appJs
for (const id of btnIds) {
  const isReferenced = appJs.includes(`"${id}"`) || appJs.includes(`'${id}'`) || appJs.includes(`\`${id}\``);
  console.log(`Button ID #${id}: ${isReferenced ? 'REFERENCED' : 'UNREFERENCED!'}`);
}

// 3. Find all modal types opened via openModal
const modalRegex = /openModal\("([^"]+)"/g;
const modalTypes = new Set();
while ((match = modalRegex.exec(appJs)) !== null) {
  modalTypes.add(match[1]);
}

console.log('\nFound modal types requested:', Array.from(modalTypes));

// Check if openModal has handlers for each modal type
for (const m of modalTypes) {
  const hasOpenHandler = appJs.includes(`modalType === "${m}"`) || appJs.includes(`modalType === '${m}'`);
  console.log(`Modal Type "${m}": ${hasOpenHandler ? 'HANDLED IN openModal' : 'MISSING IN openModal!'}`);
}

// 4. Find all API endpoints called via apiRequest
const apiRegex = /apiRequest\("([^"]+)",\s*"([^"]+)"/g;
const apiEndpoints = [];
while ((match = apiRegex.exec(appJs)) !== null) {
  apiEndpoints.push({ url: match[1], method: match[2] });
}

console.log('\nFound API calls from frontend:', apiEndpoints);
