const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const renderSource = fs.readFileSync(path.join(repoRoot, 'render.js'), 'utf8');
const appSource = fs.readFileSync(path.join(repoRoot, 'lifeMinistryTimer.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  !renderSource.includes("partElement.setAttribute('role', 'button')"),
  'Part cards should not masquerade as buttons around nested controls'
);

assert(
  renderSource.includes('data-action="select-part"'),
  'Selectable non-active cards should render a real Select button'
);

assert(
  appSource.includes("case 'select-part':"),
  'Select button action should be handled by the delegated part action handler'
);

console.log(JSON.stringify({ ok: true }, null, 2));
