// Refactored JavaScript File: lifeMinistryTimer.js

// DOM Cache
const DOM = {
    partsTemplate: document.getElementById('partsTemplate'),
    partsDisplay: document.getElementById('partsDisplay'),
    commentHistory: document.getElementById('commentHistory'),
    globalCommentCount: document.getElementById('globalCommentCount'),
    globalAverageDuration: document.getElementById('globalAverageDuration'),
};

// Utility Functions
const Utils = {
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input.replace(/[&<>"]'/g, (match) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        })[match]).trim();
    },
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

// State Management
const State = {
    meetingParts: JSON.parse(localStorage.getItem('meetingTemplate')) || [
        { name: 'Opening Comments', duration: 180, speaker: '', enableComments: false },
        { name: 'Treasures', duration: 600, speaker: '', enableComments: false },
        { name: 'Spiritual Gems', duration: 600, speaker: '', enableComments: true },
        { name: 'Bible Reading', duration: 300, speaker: '', enableComments: false }
    ],
    activePart: 0,
    isRunning: false,
    elapsedTimes: JSON.parse(localStorage.getItem('elapsedTimes')) || {},
    comments: JSON.parse(localStorage.getItem('meetingComments')) || [],
    activeComment: null,
};

// Rendering Functions
const Render = {
    template: () => {
        DOM.partsTemplate.innerHTML = State.meetingParts.map((part, index) => `
            <div class="flex items-center space-x-2">
                <input type="text" value="${Utils.sanitizeInput(part.name)}" 
                       onchange="updatePart(${index}, 'name', this.value)" />
                <input type="number" value="${part.duration / 60}" 
                       onchange="updatePart(${index}, 'duration', this.value * 60)" />
                <button class="remove" onclick="removePart(${index})">Remove</button>
            </div>
        `).join('');
    },
    timerDisplay: () => {
        DOM.partsDisplay.innerHTML = State.meetingParts.map((part, index) => {
            const elapsed = State.elapsedTimes[index] || 0;
            return `
                <div class="timer-block">
                    <span>${Utils.sanitizeInput(part.name)}</span>
                    <div class="progress-bar">
                        <div class="progress-bar-inner" style="width: ${(elapsed / part.duration) * 100}%"></div>
                    </div>
                    <span>${Utils.formatTime(elapsed)}</span>
                    <button class="${State.isRunning ? 'stop' : 'start'}" onclick="toggleTimer(${index})">${State.isRunning ? 'Stop' : 'Start'}</button>
                </div>
            `;
        }).join('');
    },
    comments: () => {
        DOM.commentHistory.innerHTML = State.comments.map(comment => `
            <div class="comment-card">
                <p>${Utils.sanitizeInput(comment.partName)} - ${Utils.formatTime(comment.duration)}</p>
                <span class="comment-time">${new Date(comment.timestamp).toLocaleTimeString()}</span>
            </div>
        `).join('');
        DOM.globalCommentCount.textContent = State.comments.length;
        DOM.globalAverageDuration.textContent = Utils.formatTime(
            State.comments.length ? Math.floor(
                State.comments.reduce((acc, comment) => acc + comment.duration, 0) / State.comments.length
            ) : 0
        );
    }
};

// Event Listeners
window.onload = () => {
    Render.template();
    Render.timerDisplay();
    Render.comments();
};

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        localStorage.setItem('elapsedTimes', JSON.stringify(State.elapsedTimes));
    }
});
