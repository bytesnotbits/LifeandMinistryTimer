const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(repoRoot, 'programCockpit.js'), 'utf8');

const sandbox = {
  console,
  fetch: async () => ({ ok: false, text: async () => '' }),
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  document: {
    addEventListener: () => {},
    querySelectorAll: () => [],
    getElementById: () => null
  },
  DOMParser: class {
    parseFromString() {
      return {
        querySelectorAll: () => [],
        body: { innerText: '' }
      };
    }
  },
  state: {
    meetingParts: [],
    meetingScheduledStart: null,
    meetingScheduledEnd: null
  }
};

vm.createContext(sandbox);
vm.runInContext(`${source}
globalThis.programCockpit = programCockpit;`, sandbox);

const { programCockpit, state } = sandbox;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

state.meetingParts = [{ name: 'Part 1', duration: 60 }];
state.meetingScheduledStart = null;
state.meetingScheduledEnd = null;

let readiness = programCockpit.getSetupReadiness(2);
assert(readiness.nextAction.action === 'review', 'Inferred timing should recommend review first');
assert(readiness.steps.some((step) => step.state === 'attention'), 'Inferred timing should create an attention step');

readiness = programCockpit.getSetupReadiness(0);
assert(readiness.nextAction.action === 'schedule', 'Reviewed unscheduled program should recommend scheduling');
assert(readiness.steps.find((step) => step.label === 'Meeting scheduled').state === 'pending', 'Missing schedule should remain pending');

state.meetingScheduledStart = 1000;
state.meetingScheduledEnd = 2000;

readiness = programCockpit.getSetupReadiness(0);
assert(readiness.nextAction.action === 'live', 'Reviewed scheduled program should recommend live view');
assert(readiness.steps.every((step) => step.state === 'complete'), 'Reviewed scheduled program should complete all readiness steps');

console.log(JSON.stringify({ ok: true }, null, 2));
