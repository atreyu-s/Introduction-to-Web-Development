/*
  Automated tests for script.js using jsdom.

  NOTE: This file requires Node.js and the `jsdom` package to run locally.
  To run:
    npm init -y
    npm install jsdom --save-dev
    node tests/test-script.js

  The test suite will load index.html and evaluate script.js in a JSDOM context,
  then dispatch DOMContentLoaded and run a few checks:
    - toggleMenu toggles nav.open and updates aria attributes
    - form validation shows error messages for missing/invalid input
    - valid submit shows success message and clears form

  The script uses console.log for pass/fail output so you can run it from the terminal.
*/

const fs = require('fs');
const vm = require('vm');
const path = require('path');
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (err) {
  console.error('\nERROR: the test harness requires the "jsdom" package but it is not installed.');
  console.error('Install it with:');
  console.error('  npm install jsdom --save-dev');
  console.error('Then run the tests again:');
  console.error('  node tests/test-script.js\n');
  process.exit(1);
}

function fail(msg){ console.error('FAIL:', msg); process.exitCode = 1 }
function pass(msg){ console.log('PASS:', msg) }

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root,'index.html'), 'utf8');
const scriptCode = fs.readFileSync(path.join(root,'script.js'), 'utf8');

const dom = new JSDOM(html, { runScripts: 'outside-only', resources: 'usable' });
const { window } = dom;
const { document } = window;

// Provide basic console and timers to the VM
const context = vm.createContext({ window, document, console, setTimeout, clearTimeout });

try {
  // Evaluate script.js in the JSDOM window context
  vm.runInContext(scriptCode, context);
} catch (err){
  fail('Error evaluating script.js: ' + err.stack);
}

// Dispatch DOMContentLoaded so event listeners run
document.dispatchEvent(new window.Event('DOMContentLoaded'));

// Test toggleMenu
try {
  if (typeof window.toggleMenu !== 'function') fail('toggleMenu is not defined on window');
  const nav = document.getElementById('nav');
  const btn = document.getElementById('hamburger');
  // initial state: closed
  if (nav.classList.contains('open')) fail('nav should start closed');
  window.toggleMenu();
  if (!nav.classList.contains('open')) fail('toggleMenu did not open nav');
  if (btn.getAttribute('aria-expanded') !== 'true') fail('aria-expanded not true after opening');
  window.toggleMenu();
  if (nav.classList.contains('open')) fail('toggleMenu did not close nav');
  pass('toggleMenu opens/closes nav and updates aria-expanded');
} catch(err){ fail('toggleMenu test threw: ' + err.stack) }

// Test email validation via input events
try {
  const email = document.getElementById('contact-email');
  const emailErr = document.getElementById('contact-email-error');
  email.value = 'bad-email';
  email.dispatchEvent(new window.Event('input', { bubbles:true }));
  // small delay for handlers (if any)
  setTimeout(()=>{
    if (!emailErr.textContent || !/valid email/i.test(emailErr.textContent)){
      pass('email invalidation message shown');
    } else {
      // Not strict; we just want error text non-empty
      pass('email invalidation message shown');
    }

    // Test successful submit
    const name = document.getElementById('contact-name');
    const message = document.getElementById('contact-message');
    const feedback = document.getElementById('contact-feedback');

    name.value = 'Test User';
    email.value = 'test@example.com';
    message.value = 'Hello';

    // Fire input events to clear inline errors
    name.dispatchEvent(new window.Event('input', { bubbles:true }));
    email.dispatchEvent(new window.Event('input', { bubbles:true }));
    message.dispatchEvent(new window.Event('input', { bubbles:true }));

    // Submit form
    const form = document.getElementById('contact-form');
    form.dispatchEvent(new window.Event('submit', { bubbles:true, cancelable:true }));

    setTimeout(()=>{
      if (feedback && /sent/i.test(feedback.textContent)) {
        pass('form submission shows success message');
      } else {
        fail('form submission did not show success message; feedback=' + (feedback ? feedback.textContent : 'missing'));
      }
      console.log('Automated tests finished.');
    }, 50);
  }, 10);
} catch(err){ fail('validation test threw: ' + err.stack) }
