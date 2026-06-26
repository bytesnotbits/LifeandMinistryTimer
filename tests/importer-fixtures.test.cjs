const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(repoRoot, 'programCockpit.js'), 'utf8');

const sandbox = {
  console,
  fetch,
  setTimeout,
  clearTimeout,
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
  }
};

vm.createContext(sandbox);
vm.runInContext(`${source}\nglobalThis.programCockpit = programCockpit;`, sandbox);

const { programCockpit } = sandbox;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function partByName(parts, name) {
  return parts.find((part) => part.name === name);
}

function partByPrefix(parts, prefix) {
  return parts.find((part) => part.name.startsWith(prefix));
}

function minutes(part) {
  return part.duration / 60;
}

assert(
  programCockpit.buildReaderUrl('https://wol.jw.org/en/wol/d/r1/lp-e/202026167') ===
    'https://r.jina.ai/https://wol.jw.org/en/wol/d/r1/lp-e/202026167',
  'Reader URL should prepend the Jina Reader prefix once'
);

const readerLikeFixture = [
  'Title: June 15-21 - Watchtower ONLINE LIBRARY',
  '',
  'URL Source: https://wol.jw.org/en/wol/d/r1/lp-e/202026167',
  '',
  '## [**JEREMIAH 7-8**](https://wol.jw.org/en/wol/bc/r1/lp-e/202026167/0/0)',
  '',
  '### [**Song 152**](https://wol.jw.org/en/wol/pc/r1/lp-e/202026167/0/0)**and Prayer | Opening Comments**(1 min.)',
  '',
  '## **TREASURES FROM GOD’S WORD**',
  '',
  '### **1. They Treated Jehovah’s Temple With Contempt**',
  '',
  '(10 min.)',
  '',
  '### **2. Spiritual Gems**',
  '',
  '(10 min.)',
  '',
  '### **3. Bible Reading**',
  '',
  '## **APPLY YOURSELF TO THE FIELD MINISTRY**',
  '',
  '### **4. Starting a Conversation**',
  '',
  '(3 min.) INFORMAL WITNESSING.',
  '',
  '### **5. Following Up**',
  '',
  '(4 min.) HOUSE TO HOUSE.',
  '',
  '### **6. Making Disciples**',
  '',
  '## **LIVING AS CHRISTIANS**',
  '',
  '### [**Song 91**](https://wol.jw.org/en/wol/pc/r1/lp-e/202026167/11/0)',
  '',
  '### **7. How We Can Show Appreciation for Our Kingdom Halls**',
  '',
  '(5 min.) Discussion.',
  '',
  '### **8. How Your Donations Are Used—Maintaining Our Kingdom Halls**',
  '',
  '(10 min.) Discussion based on the article.',
  '',
  '### **9. Congregation Bible Study**',
  '',
  '### **Concluding Comments**(3 min.)**|**[**Song 71**](https://wol.jw.org/en/wol/pc/r1/lp-e/202026167/15/0)**and Prayer**'
].join('\n');

const pastedTextFixture = [
  'JUNE 15-21',
  'JEREMIAH 7-8',
  'Song 152 and Prayer | Opening Comments (1 min.)',
  'TREASURES FROM GOD’S WORD',
  '### **3. Bible Reading**',
  'Some assignment details on one line.',
  '(6 min.) more details on a later line.',
  'APPLY YOURSELF TO THE FIELD MINISTRY',
  '### **4. Starting a Conversation**',
  '(2 min.) Details.',
  'LIVING AS CHRISTIANS',
  '### **9. Congregation Bible Study**',
  'A detail line before timing.',
  '(27 min.) Custom study timing.',
  'Concluding Comments (3 min.) | Song 71 and Prayer'
].join('\n');

const readerParsed = programCockpit.parseProgram(readerLikeFixture, 'fixture:reader-like');
const readerParts = readerParsed.parts;

assert(readerParsed.meta.week === 'June 15-21', 'Reader fixture should parse week');
assert(readerParsed.meta.reading === 'Jeremiah 7-8', 'Reader fixture should parse Bible reading');
assert(readerParts[0].name === 'Opening Comments', 'Opening row should be comments only');
assert(minutes(readerParts[0]) === 1, 'Opening comments should be 1 minute');
assert(!readerParts.some((part) => /^Song \d+/.test(part.name)), 'Standalone songs should not become timer rows');

const readerBible = partByName(readerParts, '3. Bible Reading');
assert(readerBible, 'Reader fixture should include numbered Bible Reading');
assert(minutes(readerBible) === 4, 'Reader fixture should infer Bible Reading as 4 minutes when omitted');
assert(readerBible.durationSource === 'inferred', 'Reader fixture should mark omitted Bible Reading time as inferred');

const readerStudy = partByName(readerParts, '9. Congregation Bible Study');
const readerDiscussion = partByName(readerParts, '7. How We Can Show Appreciation for Our Kingdom Halls');
const readerArticleDiscussion = partByPrefix(readerParts, '8. How Your Donations Are Used');
assert(readerStudy, 'Reader fixture should include numbered Congregation Bible Study');
assert(minutes(readerStudy) === 30, 'Reader fixture should infer Congregation Bible Study as 30 minutes when omitted');
assert(readerStudy.durationSource === 'inferred', 'Reader fixture should mark omitted study time as inferred');
assert(readerDiscussion, 'Reader fixture should include discussion part');
assert(readerDiscussion.type === 'discussion', 'Timing-line Discussion label should classify the part as discussion');
assert(readerDiscussion.enableComments, 'Timing-line Discussion label should enable comment tracking');
assert(readerArticleDiscussion, 'Reader fixture should include article discussion part');
assert(readerArticleDiscussion.type === 'discussion', 'Discussion based on the article should classify as discussion');
assert(readerArticleDiscussion.enableComments, 'Discussion based on the article should enable comment tracking');

const pastedParsed = programCockpit.parseProgram(pastedTextFixture, 'fixture:pasted-text');
const pastedParts = pastedParsed.parts;
const pastedBible = partByName(pastedParts, '3. Bible Reading');
const pastedStudy = partByName(pastedParts, '9. Congregation Bible Study');
const pastedConversation = partByName(pastedParts, '4. Starting a Conversation');

assert(pastedBible, 'Pasted fixture should include Bible Reading');
assert(minutes(pastedBible) === 6, 'Block duration should override Bible Reading default');
assert(pastedBible.durationSource === 'imported', 'Custom Bible Reading time should be imported');
assert(pastedStudy, 'Pasted fixture should include Congregation Bible Study');
assert(minutes(pastedStudy) === 27, 'Block duration should override Congregation Bible Study default');
assert(pastedStudy.durationSource === 'imported', 'Custom study time should be imported');
assert(pastedConversation, 'Pasted fixture should include Starting a Conversation');
assert(minutes(pastedConversation) === 2, 'Custom ministry duration should be imported');

console.log(JSON.stringify({
  ok: true,
  readerParts: readerParts.map((part) => ({
    name: part.name,
    minutes: minutes(part),
    durationSource: part.durationSource,
    type: part.type,
    enableComments: part.enableComments
  })),
  pastedParts: pastedParts.map((part) => ({
    name: part.name,
    minutes: minutes(part),
    durationSource: part.durationSource
  }))
}, null, 2));
