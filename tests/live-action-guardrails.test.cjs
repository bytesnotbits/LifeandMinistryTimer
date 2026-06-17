const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(repoRoot, 'lifeMinistryTimer.js'), 'utf8');

const sandbox = {
  console,
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: () => 1,
  clearTimeout: () => {},
  Date,
  window: {
    confirm: () => true,
    addEventListener: () => {}
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  document: {
    hidden: false,
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    activeElement: null
  },
  render: {
    timerDisplay: () => {},
    globalTimerDisplay: () => {},
    comments: () => {},
    refreshLiveTimerValues: () => {},
    templateEditor: () => {},
    focusInlinePartEditor: () => {}
  },
  programCockpit: {
    renderAll: () => {}
  }
};

vm.createContext(sandbox);
vm.runInContext(`${source}
globalThis.state = state;
globalThis.DOM = DOM;
globalThis.notify = notify;`, sandbox);

const { state, DOM } = sandbox;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

let confirmation = null;
DOM.showConfirmation = (title, message, onConfirm) => {
  confirmation = { title, message, onConfirm };
};
DOM.updateMeetingForm = () => {};

state.meetingParts = [{ name: 'Active Part', duration: 60, enableComments: false }];
state.activePart = 0;
state.isRunning = true;
state.elapsedTimes = { 0: 12 };
state.requestResetTimer(0);

assert(confirmation, 'Running active timer reset should request confirmation');
assert(confirmation.title === 'Reset active timer?', 'Reset confirmation should explain the action');
assert(state.isRunning === true, 'Reset confirmation should not stop the active timer before confirmation');
assert(state.elapsedTimes[0] === 12, 'Reset confirmation should not clear elapsed time before confirmation');

confirmation = null;
state.meetingIsRunning = true;
state.meetingScheduledStart = Date.now() - 1000;
state.meetingScheduledEnd = Date.now() + 1000;
state.requestEndMeeting();

assert(confirmation, 'Ending a running global meeting should request confirmation');
assert(confirmation.title === 'End meeting?', 'End meeting confirmation should explain the action');
assert(state.meetingIsRunning === true, 'End meeting confirmation should not end the meeting before confirmation');
assert(!state.meetingActualEnd, 'End meeting confirmation should not record actual end before confirmation');

confirmation = null;
state.isRunning = false;
state.elapsedTimes = { 0: 8 };
state.resetTimer = (partIndex) => {
  state.elapsedTimes[partIndex] = 0;
};
state.requestResetTimer(0);

assert(!confirmation, 'Stopped timer reset should remain immediate');
assert(state.elapsedTimes[0] === 0, 'Stopped timer reset should still clear elapsed time');

console.log(JSON.stringify({ ok: true }, null, 2));
