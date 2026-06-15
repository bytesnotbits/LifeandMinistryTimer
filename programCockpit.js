/**
 * Life and Ministry Timer - Program Cockpit
 *
 * Imports flexible weekly meeting programs and adds prepare/run/review dashboards.
 */

'use strict';

const PROGRAM_META_KEY = 'programCockpitMeta';

const PROGRAM_SECTIONS = [
    "TREASURES FROM GOD'S WORD",
    'APPLY YOURSELF TO THE FIELD MINISTRY',
    'LIVING AS CHRISTIANS'
];

const MONTH_PATTERN = '(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)';
const DATE_DASH_PATTERN = '[-\\u2013â€“]';

const SAMPLE_PROGRAM_TEXT = `
JUNE 15-21
JEREMIAH 7-8
Song 152 and Prayer | Opening Comments (1 min.)
TREASURES FROM GOD'S WORD
1. The Happy Life That Comes From Pure Worship
(10 min.)
2. Spiritual Gems
(10 min.)
3. Bible Reading
(4 min.) Jer 7:1-15 (th study 11)
APPLY YOURSELF TO THE FIELD MINISTRY
4. Starting a Conversation
(3 min.) HOUSE TO HOUSE. (lmd lesson 1 point 3)
5. Following Up
(4 min.) PUBLIC WITNESSING. (lmd lesson 7 point 4)
6. Making Disciples
(5 min.) lff lesson 16 introduction and point 1 (lmd lesson 11 point 3)
LIVING AS CHRISTIANS
Song 34
7. Show Love by Being Prepared for the Ministry
(15 min.) Discussion.
8. Congregation Bible Study
(30 min.) lfb lessons 94-95
Concluding Comments (3 min.) | Song 71 and Prayer
`;

const programCockpit = {
    meta: {
        week: '',
        reading: '',
        sourceUrl: '',
        importedAt: null
    },
    view: 'prepare',

    init() {
        this.loadMeta();
        this.bindEvents();
        this.renderAll();
        this.decorateTimerCards();
    },

    bindEvents() {
        document.querySelectorAll('[data-program-view]').forEach((button) => {
            button.addEventListener('click', () => this.setView(button.dataset.programView));
        });

        const fetchButton = document.getElementById('fetchWolProgramBtn');
        if (fetchButton) {
            fetchButton.addEventListener('click', () => this.fetchAndImport());
        }

        const importTextButton = document.getElementById('importWolTextBtn');
        if (importTextButton) {
            importTextButton.addEventListener('click', () => {
                const text = document.getElementById('wolImportText')?.value || '';
                const url = document.getElementById('wolImportUrl')?.value || '';
                this.importProgram(text, url);
            });
        }

        const sampleButton = document.getElementById('loadSampleProgramBtn');
        if (sampleButton) {
            sampleButton.addEventListener('click', () => {
                const textArea = document.getElementById('wolImportText');
                if (textArea) {
                    textArea.value = SAMPLE_PROGRAM_TEXT.trim();
                }
                this.importProgram(SAMPLE_PROGRAM_TEXT, 'sample:june-15-21');
            });
        }

        const runView = document.getElementById('programRunView');
        if (runView) {
            runView.addEventListener('click', (event) => {
                const action = event.target.closest('[data-run-action]')?.dataset.runAction;
                if (!action) return;
                if (action === 'start') {
                    state.startTimer();
                    notify.show('Program run started', 'success');
                } else if (action === 'stop') {
                    state.stopTimer();
                    notify.show('Program run paused', 'info');
                } else if (action === 'next') {
                    state.startNextPart();
                    notify.show('Advanced to the next part', 'success');
                }
                state.saveState();
                render.timerDisplay();
                this.renderAll();
            });
        }
    },

    setView(view) {
        this.view = view;
        document.querySelectorAll('[data-program-view]').forEach((button) => {
            const isActive = button.dataset.programView === view;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
        });
        document.querySelectorAll('.program-view').forEach((panel) => {
            panel.classList.remove('active');
        });
        const panel = document.getElementById(`program${view.charAt(0).toUpperCase()}${view.slice(1)}View`);
        if (panel) {
            panel.classList.add('active');
        }
        this.renderAll();
    },

    async fetchAndImport() {
        const urlInput = document.getElementById('wolImportUrl');
        const url = urlInput ? urlInput.value.trim() : '';
        if (!url) {
            this.setStatus('Add a weekly meeting URL first.', 'warning');
            return;
        }

        this.setStatus('Fetching the weekly program...', 'loading');
        try {
            const text = await this.fetchProgramText(url);
            const textArea = document.getElementById('wolImportText');
            if (textArea) {
                textArea.value = text;
            }
            this.importProgram(text, url);
        } catch (error) {
            console.warn('Could not fetch WOL program directly:', error);
            this.setStatus('The URL import was blocked. Paste the page text and use Import From Text.', 'warning');
        }
    },

    async fetchProgramText(url) {
        const isWolUrl = /^https?:\/\/wol\.jw\.org\//i.test(url);
        const attempts = isWolUrl
            ? [
                { url: this.buildReaderUrl(url), kind: 'text' },
                { url, kind: 'html' }
            ]
            : [
                { url, kind: 'html' },
                { url: this.buildReaderUrl(url), kind: 'text' }
            ];

        let lastError = null;
        for (const attempt of attempts) {
            try {
                const response = await fetch(attempt.url, { mode: 'cors' });
                if (!response.ok) {
                    throw new Error(`Fetch failed with ${response.status}`);
                }
                const content = await response.text();
                return attempt.kind === 'html' ? this.extractTextFromHtml(content) : content;
            } catch (error) {
                lastError = error;
                console.warn(`Program fetch failed for ${attempt.url}:`, error);
            }
        }

        throw lastError || new Error('Program fetch failed');
    },

    buildReaderUrl(url) {
        return `https://r.jina.ai/http://r.jina.ai/http://${url}`;
    },

    extractTextFromHtml(html) {
        const documentFragment = new DOMParser().parseFromString(html, 'text/html');
        documentFragment.querySelectorAll('script, style, nav, footer').forEach((node) => node.remove());
        return documentFragment.body ? documentFragment.body.innerText : html;
    },

    importProgram(rawText, sourceUrl = '') {
        const parsed = this.parseProgram(rawText, sourceUrl);
        if (!parsed.parts.length) {
            this.setStatus('I could not find timed meeting parts in that text.', 'error');
            return;
        }

        if (state.isRunning) {
            state.stopTimer();
        }

        this.meta = parsed.meta;
        state.meetingParts = parsed.parts;
        state.resetTimers();
        persistence.setJson(STORAGE_KEYS.meetingTemplate, state.meetingParts);
        this.saveMeta();

        render.templateEditor();
        render.timerDisplay();
        render.comments();
        this.renderAll();
        this.decorateTimerCards();

        this.setStatus(`Imported ${parsed.parts.length} parts for ${parsed.meta.week || 'this week'}.`, 'success');
    },

    parseProgram(rawText, sourceUrl = '') {
        const sourceLines = String(rawText || '')
            .replace(/\u00a0/g, ' ')
            .replace(/[“”]/g, '"')
            .split(/\r?\n/)
            .map((line) => this.cleanSourceLine(line));

        const titleLine = sourceLines.find((line) => /^title:/i.test(line)) || '';
        const lines = sourceLines
            .filter(Boolean)
            .filter((line) => !/^(title:|url source:|markdown content:|your answer|share|log in|log out|sorry, there was an error|no video available)$/i.test(line));

        const week = this.findWeek(lines) || this.findWeek([titleLine.replace(/^title:\s*/i, '')]);
        const reading = this.findReading(lines);
        const parts = [];
        let currentSection = 'Opening';

        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index];
            const normalized = this.normalizeHeading(line);

            if (PROGRAM_SECTIONS.includes(normalized)) {
                currentSection = this.titleCaseSection(normalized);
                continue;
            }

            if (this.shouldSkipLine(line)) {
                continue;
            }

            const isPartHeading = this.isPartHeading(line);
            const isOpening = /song\s+\d+.*opening comments/i.test(line);
            const isClosing = /concluding comments/i.test(line);
            const isSongOnly = /^song\s+\d+$/i.test(line);

            if (isSongOnly) {
                continue;
            }

            if (!isPartHeading && !isOpening && !isClosing && !isSongOnly) {
                continue;
            }

            const partBlock = this.collectPartBlock(lines, index);
            const duration = this.extractDurationFromBlock(partBlock) || this.inferDefaultDuration(line, currentSection);
            if (duration === null) {
                continue;
            }

            const name = isOpening ? 'Opening Comments' : isClosing ? 'Concluding Comments' : this.cleanPartName(line);
            const detailLines = this.collectDetails(partBlock.slice(1), 0);
            const section = isOpening ? 'Opening' : isClosing ? 'Closing' : currentSection;
            const type = this.inferPartType(name, section, detailLines.join(' '));
            const usedInferredDuration = !this.extractDurationFromBlock(partBlock);

            parts.push({
                name,
                duration: duration * 60,
                speaker: '',
                enableComments: this.shouldEnableComments(name, type),
                section,
                type,
                notes: [
                    ...detailLines.slice(0, 3),
                    ...(usedInferredDuration ? [`Review time: inferred ${duration} min.`] : [])
                ].join(' '),
                durationSource: usedInferredDuration ? 'inferred' : 'imported',
                sourceUrl
            });
        }

        return {
            meta: {
                week,
                reading,
                sourceUrl,
                importedAt: Date.now()
            },
            parts: this.mergeDuplicateSongs(parts)
        };
    },

    cleanSourceLine(line) {
        return String(line || '')
            .trim()
            .replace(/^#{1,6}\s*/, '')
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\*\*/g, '')
            .replace(/__/g, '')
            .replace(/[_`]/g, '')
            .replace(/\\\[/g, '[')
            .replace(/\\\]/g, ']')
            .replace(/(Song\s+\d+)(and Prayer)/ig, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim();
    },

    findWeek(lines) {
        const sameMonthRange = new RegExp(`^${MONTH_PATTERN} \\d{1,2}${DATE_DASH_PATTERN}\\d{1,2}$`);
        const crossMonthRange = new RegExp(`^${MONTH_PATTERN} \\d{1,2}${DATE_DASH_PATTERN}${MONTH_PATTERN} \\d{1,2}$`);
        const weekLine = lines.find((line) => sameMonthRange.test(line.toUpperCase()) || crossMonthRange.test(line.toUpperCase()));
        if (weekLine) return this.toTitleText(weekLine);

        const sameMonthMatch = lines
            .map((line) => line.toUpperCase().match(new RegExp(`${MONTH_PATTERN} \\d{1,2}${DATE_DASH_PATTERN}\\d{1,2}`)))
            .find(Boolean);
        if (sameMonthMatch) return this.toTitleText(sameMonthMatch[0]);

        const crossMonthMatch = lines
            .map((line) => line.toUpperCase().match(new RegExp(`${MONTH_PATTERN} \\d{1,2}${DATE_DASH_PATTERN}${MONTH_PATTERN} \\d{1,2}`)))
            .find(Boolean);
        return crossMonthMatch ? this.toTitleText(crossMonthMatch[0]) : '';
    },

    findReading(lines) {
        const ignored = new Set(['BIBLE', 'PUBLICATIONS', 'MEETINGS']);
        const sameMonthRange = new RegExp(`^${MONTH_PATTERN} \\d{1,2}${DATE_DASH_PATTERN}\\d{1,2}$`);
        const crossMonthRange = new RegExp(`^${MONTH_PATTERN} \\d{1,2}${DATE_DASH_PATTERN}${MONTH_PATTERN} \\d{1,2}$`);
        const readingLine = lines.find((line) => {
            const upper = line.toUpperCase();
            const isDateRange = sameMonthRange.test(upper) || crossMonthRange.test(upper);
            const isSong = /^SONG\s+\d+/.test(upper);
            const looksLikeBibleReading = /^[1-3]?\s?[A-Z][A-Z]+(?:\s+[0-9]+[-–0-9]*)+$/.test(upper);
            return looksLikeBibleReading && !isDateRange && !isSong && !ignored.has(upper);
        });
        return readingLine ? this.toTitleText(readingLine) : '';
    },

    shouldSkipLine(line) {
        return /^(our christian life and ministry|mwb\d|english publications|copyright|terms of use|privacy)/i.test(line)
            || /^image:/i.test(line);
    },

    isPartHeading(line) {
        return /^\d+\.\s+/.test(line) || /^(concluding comments|song\s+\d+.*opening comments|song\s+\d+\s+and prayer.*opening comments)/i.test(line);
    },

    extractDuration(line) {
        const match = String(line || '').match(/\((\d+)\s*min\.\)/i);
        return match ? parseInt(match[1], 10) : null;
    },

    extractDurationFromBlock(lines) {
        const durationLine = lines.find((line) => this.extractDuration(line) !== null);
        return durationLine ? this.extractDuration(durationLine) : null;
    },

    collectPartBlock(lines, startIndex) {
        const block = [];
        for (let i = startIndex; i < lines.length; i += 1) {
            const line = lines[i];
            if (i > startIndex && this.isPartBoundary(line)) {
                break;
            }
            block.push(line);
        }
        return block;
    },

    inferDefaultDuration(line, section = '') {
        const text = String(line || '').toLowerCase();
        if (/opening comments/.test(text)) return 1;
        if (/concluding comments/.test(text)) return 3;
        if (/^1\.\s+/.test(text) && section === "Treasures From God's Word") return 10;
        if (/spiritual gems/.test(text)) return 10;
        if (/bible reading/.test(text)) return 4;
        if (/starting a conversation/.test(text)) return 3;
        if (/following up/.test(text)) return 4;
        if (/making disciples/.test(text)) return 5;
        if (/congregation bible study/.test(text)) return 30;
        return null;
    },

    cleanPartName(line) {
        return line
            .replace(/\(\d+\s*min\.\)/ig, '')
            .replace(/\s*\|\s*/g, ' | ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    collectDetails(lines, startIndex) {
        const details = [];
        for (let i = startIndex; i < lines.length && details.length < 4; i += 1) {
            const line = lines[i];
            if (this.isPartBoundary(line)) {
                break;
            }
            if (!this.extractDuration(line) && !this.shouldSkipLine(line)) {
                details.push(line);
            }
        }
        return details;
    },

    isPartBoundary(line) {
        return PROGRAM_SECTIONS.includes(this.normalizeHeading(line))
            || this.isPartHeading(line)
            || /^song\s+\d+$/i.test(line);
    },

    inferPartType(name, section, details) {
        const text = `${name} ${details}`.toLowerCase();
        if (/song|prayer/.test(text)) return 'song-prayer';
        if (/spiritual gems/.test(text)) return 'audience-discussion';
        if (/congregation bible study/.test(text)) return 'study';
        if (/bible reading/.test(text)) return 'student-reading';
        if (/starting a conversation|following up|making disciples/.test(text)) return 'student-assignment';
        if (/local needs/.test(text)) return 'local-needs';
        if (/discussion|ask the audience|video|whiteboard animation/.test(text)) return 'discussion';
        if (/talk/.test(text)) return section === 'Apply Yourself to the Field Ministry' ? 'student-talk' : 'talk';
        return 'part';
    },

    shouldEnableComments(name, type) {
        return /spiritual gems|congregation bible study/i.test(name) || ['discussion', 'study', 'audience-discussion'].includes(type);
    },

    mergeDuplicateSongs(parts) {
        return parts.filter((part, index) => {
            if (part.duration > 0) return true;
            const next = parts[index + 1];
            if (!next || next.section !== part.section) return true;
            next.name = `${part.name} | ${next.name}`;
            return false;
        });
    },

    normalizeHeading(line) {
        return String(line || '').replace(/[’]/g, "'").toUpperCase();
    },

    titleCaseSection(section) {
        if (section === "TREASURES FROM GOD'S WORD") return "Treasures From God's Word";
        if (section === 'APPLY YOURSELF TO THE FIELD MINISTRY') return 'Apply Yourself to the Field Ministry';
        if (section === 'LIVING AS CHRISTIANS') return 'Living as Christians';
        return this.toTitleText(section);
    },

    toTitleText(text) {
        return String(text || '').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
    },

    saveMeta() {
        localStorage.setItem(PROGRAM_META_KEY, JSON.stringify(this.meta));
    },

    loadMeta() {
        try {
            const saved = JSON.parse(localStorage.getItem(PROGRAM_META_KEY) || 'null');
            if (saved && typeof saved === 'object') {
                this.meta = { ...this.meta, ...saved };
            }
        } catch (error) {
            console.warn('Could not load program metadata:', error);
        }
    },

    renderAll() {
        this.renderHeader();
        this.renderSectionSummary();
        this.renderRunDashboard();
        this.renderReviewDashboard();
    },

    renderHeader() {
        const totalDuration = state.meetingParts.reduce((sum, part) => sum + (part.duration || 0), 0);
        this.setText('programWeekLabel', this.meta.week || 'Not imported');
        this.setText('programReadingLabel', this.meta.reading || '-');
        this.setText('programDurationLabel', formatMeetingTime(totalDuration));
        this.setText('programSubtitle', this.meta.sourceUrl
            ? `Source: ${this.meta.sourceUrl}`
            : 'Import a weekly meeting page, assign names, then run the program as a live meeting flow.');
    },

    renderSectionSummary() {
        const container = document.getElementById('programSectionSummary');
        if (!container) return;

        const grouped = this.groupPartsBySection();
        if (!state.meetingParts.length) {
            container.innerHTML = '<p class="empty-copy">No weekly program loaded yet.</p>';
            return;
        }

        container.innerHTML = Object.entries(grouped).map(([section, parts]) => {
            const sectionDuration = parts.reduce((sum, part) => sum + part.duration, 0);
            return `
                <article class="section-pill">
                    <div>
                        <strong>${this.escapeHtml(section)}</strong>
                        <span>${parts.length} parts</span>
                    </div>
                    <b>${formatMeetingTime(sectionDuration)}</b>
                </article>
            `;
        }).join('');
    },

    renderRunDashboard() {
        const container = document.getElementById('runDashboard');
        if (!container) return;

        const current = state.meetingParts[state.activePart];
        const totalPlanned = state.meetingParts.reduce((sum, part) => sum + part.duration, 0);
        const totalElapsed = Object.values(state.elapsedTimes).reduce((sum, seconds) => sum + Number(seconds || 0), 0);
        const variance = totalElapsed - totalPlanned;
        const next = state.meetingParts[state.activePart + 1];

        if (!current) {
            container.innerHTML = '<p class="empty-copy">Import a program to run the meeting.</p>';
            return;
        }

        container.innerHTML = `
            <div class="run-now">
                <span class="run-label">Current Part</span>
                <h3>${this.escapeHtml(current.name)}</h3>
                <p>${this.escapeHtml(current.section || 'Meeting')} ${current.speaker ? `- ${this.escapeHtml(current.speaker)}` : ''}</p>
                <div class="run-metrics">
                    <div><span>Planned</span><strong>${formatTime(current.duration)}</strong></div>
                    <div><span>Actual</span><strong>${formatTime(state.elapsedTimes[state.activePart] || 0)}</strong></div>
                    <div><span>Meeting Pace</span><strong>${variance > 0 ? '+' : ''}${formatMeetingTime(Math.abs(variance))}</strong></div>
                </div>
                <div class="run-actions">
                    <button type="button" class="primary-action" data-run-action="${state.isRunning ? 'stop' : 'start'}">
                        ${state.isRunning ? 'Pause Current Part' : 'Start Current Part'}
                    </button>
                    <button type="button" data-run-action="next" ${state.activePart >= state.meetingParts.length - 1 ? 'disabled' : ''}>
                        Next Part
                    </button>
                </div>
            </div>
            <div class="run-next">
                <span class="run-label">Next</span>
                <strong>${next ? this.escapeHtml(next.name) : 'End of meeting'}</strong>
                <p>${next ? this.escapeHtml(next.section || '') : 'Ready for concluding review.'}</p>
            </div>
        `;
    },

    renderReviewDashboard() {
        const container = document.getElementById('reviewDashboard');
        if (!container) return;

        if (!state.meetingParts.length) {
            container.innerHTML = '<p class="empty-copy">Run or import a meeting to see timing review.</p>';
            return;
        }

        const rows = state.meetingParts.map((part, index) => {
            const actual = state.elapsedTimes[index] || 0;
            const variance = actual - part.duration;
            const varianceClass = variance > 0 ? 'behind' : variance < 0 ? 'ahead' : '';
            return `
                <tr>
                    <td>${this.escapeHtml(part.name)}</td>
                    <td>${formatTime(part.duration)}</td>
                    <td>${formatTime(actual)}</td>
                    <td class="${varianceClass}">${variance > 0 ? '+' : variance < 0 ? '-' : ''}${formatTime(Math.abs(variance))}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table class="review-table">
                <thead>
                    <tr>
                        <th>Part</th>
                        <th>Planned</th>
                        <th>Actual</th>
                        <th>Variance</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    },

    decorateTimerCards() {
        const originalTimerDisplay = render.timerDisplay.bind(render);
        if (render._programCockpitDecorated) return;
        render.timerDisplay = (...args) => {
            originalTimerDisplay(...args);
            this.addCardMetadata();
            this.renderAll();
        };
        render._programCockpitDecorated = true;
        this.addCardMetadata();
    },

    addCardMetadata() {
        state.meetingParts.forEach((part, index) => {
            const card = document.querySelector(`.part-card[data-part-index="${index}"]`);
            if (!card || card.querySelector('.part-meta-row')) return;
            const heading = card.querySelector('h3');
            if (!heading) return;
            const meta = document.createElement('div');
            meta.className = 'part-meta-row';
            meta.innerHTML = `
                <span>${this.escapeHtml(part.section || 'Meeting')}</span>
                <span>${this.escapeHtml(part.type || 'part')}</span>
                <span>${part.durationSource === 'inferred' ? 'time inferred' : 'time imported'}</span>
                ${part.notes ? `<span title="${this.escapeHtml(part.notes)}">Notes</span>` : ''}
            `;
            heading.insertAdjacentElement('afterend', meta);
        });
    },

    groupPartsBySection() {
        return state.meetingParts.reduce((groups, part) => {
            const key = part.section || 'Meeting';
            if (!groups[key]) groups[key] = [];
            groups[key].push(part);
            return groups;
        }, {});
    },

    setStatus(message, kind = '') {
        const status = document.getElementById('programImportStatus');
        if (!status) return;
        status.textContent = message;
        status.dataset.status = kind;
    },

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    },

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    programCockpit.init();
});
