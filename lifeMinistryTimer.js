/**
 * Life and Ministry Timer
 * Version 2.0.0
 * 
 * A comprehensive timer application for managing meeting parts,
 * tracking comments, and maintaining meeting templates.
 */

'use strict';

//----------------------------------------------------------------------------------------------
// DOM CACHE - Centralized access to DOM elements
//----------------------------------------------------------------------------------------------
const DOM = {
    elements: {},
    
    init() {
        // Timer section elements
        this.elements.partsTemplate = document.getElementById('partsTemplate');
        this.elements.partsDisplay = document.getElementById('partsDisplay');
        
        // Comment section elements
        this.elements.commentHistory = document.getElementById('commentHistory');
        this.elements.globalCommentCount = document.getElementById('globalCommentCount');
        this.elements.globalAverageDuration = document.getElementById('globalAverageDuration');
        
        // Template management elements
        this.elements.saveTemplateBtn = document.getElementById('saveTemplateBtn');
        this.elements.loadTemplateBtn = document.getElementById('loadTemplateBtn');
        
        // Modal elements
        this.elements.templateModal = document.getElementById('templateModal');
        this.elements.templatesList = document.getElementById('templatesList');
        this.elements.templateName = document.getElementById('templateName');
        this.elements.closeTemplateModal = document.getElementById('closeTemplateModal');
        this.elements.saveNewTemplate = document.getElementById('saveNewTemplate');
        
        this.elements.confirmationModal = document.getElementById('confirmationModal');
        this.elements.confirmationTitle = document.getElementById('confirmationTitle');
        this.elements.confirmationMessage = document.getElementById('confirmationMessage');
        this.elements.cancelConfirmation = document.getElementById('cancelConfirmation');
        this.elements.confirmAction = document.getElementById('confirmAction');
        
        // Add event listeners to buttons
        this._setupEventListeners();
        
        // Log warning for missing critical elements
        this._checkForMissingElements();
    },
    
    _setupEventListeners() {
        // Template management buttons
        if (this.elements.saveTemplateBtn) {
            this.elements.saveTemplateBtn.addEventListener('click', () => {
                this.elements.templateName.value = '';
                this._showModal(this.elements.templateModal);
            });
        }
        
        if (this.elements.loadTemplateBtn) {
            this.elements.loadTemplateBtn.addEventListener('click', () => {
                templateManager.populateTemplatesList();
                this._showModal(this.elements.templateModal);
            });
        }
        
        // Modal buttons
        if (this.elements.closeTemplateModal) {
            this.elements.closeTemplateModal.addEventListener('click', () => {
                this._hideModal(this.elements.templateModal);
            });
        }
        
        if (this.elements.saveNewTemplate) {
            this.elements.saveNewTemplate.addEventListener('click', () => {
                const name = this.elements.templateName.value.trim();
                if (name) {
                    templateManager.saveTemplate(name);
                    this._hideModal(this.elements.templateModal);
                } else {
                    notify.show('Please enter a template name', 'error');
                }
            });
        }
        
        if (this.elements.cancelConfirmation) {
            this.elements.cancelConfirmation.addEventListener('click', () => {
                this._hideModal(this.elements.confirmationModal);
            });
        }
    },
    
    _checkForMissingElements() {
        const criticalElements = [
            'partsTemplate', 'partsDisplay', 'commentHistory', 
            'globalCommentCount', 'globalAverageDuration'
        ];
        
        criticalElements.forEach(elementName => {
            if (!this.elements[elementName]) {
                console.warn(`Critical element #${elementName} not found in the DOM`);
            }
        });
    },
    
    _showModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('hidden');
            modalElement.classList.add('active');
        }
    },
    
    _hideModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('active');
            modalElement.classList.add('hidden');
        }
    },
    
    showConfirmation(title, message, onConfirm) {
        if (!this.elements.confirmationModal) return;
        
        this.elements.confirmationTitle.textContent = title;
        this.elements.confirmationMessage.textContent = message;
        
        // Set up the confirm action button
        const confirmBtn = this.elements.confirmAction;
        
        // Remove any existing event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        this.elements.confirmAction = newConfirmBtn;
        
        // Add the new event listener
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this._hideModal(this.elements.confirmationModal);
        });
        
        this._showModal(this.elements.confirmationModal);
    }
};

//----------------------------------------------------------------------------------------------
// CONSTANTS AND APPLICATION STATE
//----------------------------------------------------------------------------------------------
const DEFAULT_PARTS = [
    { name: 'Opening Comments', duration: 60, speaker: '', enableComments: false },
    { name: 'Treasures', duration: 600, speaker: '', enableComments: false },
    { name: 'Spiritual Gems', duration: 600, speaker: '', enableComments: true },
    { name: 'Bible Reading', duration: 300, speaker: '', enableComments: false },
    { name: 'Apply yourself 1', duration: 180, speaker: '', enableComments: false },
    { name: 'Apply yourself 2', duration: 180, speaker: '', enableComments: false },
    { name: 'Student Talk', duration: 300, speaker: '', enableComments: false },
    { name: 'CBS', duration: 1800, speaker: '', enableComments: false }
];

const COMMENT_LIMIT = 240; // Limit comments to 4 minutes
const TIMER_UPDATE_INTERVAL = 1000; // 1 second interval for timer updates
const COMMENT_DISPLAY_UPDATE_INTERVAL = 200; // 200ms for smoother comment timer display

// Application state
let state = {
    meetingParts: [],
    activePart: 0,
    isRunning: false,
    elapsedTimes: {},
    timerInterval: null,
    commentInterval: null,
    activeComment: null,
    comments: [],
    
    // Initialize application state
    init() {
        this.loadState();
    },
    
    // Load state from localStorage
    loadState() {
        try {
            // Load meeting parts
            const savedTemplate = localStorage.getItem('meetingTemplate');
            this.meetingParts = savedTemplate ? JSON.parse(savedTemplate) : DEFAULT_PARTS;
            
            // Load elapsed times
            const savedTimes = localStorage.getItem('elapsedTimes');
            this.elapsedTimes = savedTimes ? JSON.parse(savedTimes) : {};
            
            // Load active part
            this.activePart = parseInt(localStorage.getItem('activePart')) || 0;
            
            // Load comments
            const savedComments = localStorage.getItem('meetingComments');
            this.comments = savedComments ? JSON.parse(savedComments) : [];
            
        } catch (error) {
            console.error('Error loading state:', error);
            // Fallback to defaults if loading fails
            this.meetingParts = DEFAULT_PARTS;
            this.elapsedTimes = {};
            this.activePart = 0;
            this.comments = [];
        }
    },
    
    // Save current state to localStorage
    saveState() {
        try {
            localStorage.setItem('elapsedTimes', JSON.stringify(this.elapsedTimes));
            localStorage.setItem('activePart', this.activePart.toString());
            localStorage.setItem('meetingComments', JSON.stringify(this.comments));
        } catch (error) {
            console.error('Error saving state:', error);
            notify.show('Failed to save state to local storage', 'error');
        }
    },
    
    // Reset timer data (keeps template)
    resetTimers() {
        this.elapsedTimes = {};
        this.comments = [];
        this.activeComment = null;
        this.stopTimer();
        this.activePart = 0;
        this.saveState();
    },
    
    // Reset a specific timer
    resetTimer(partIndex) {
        if (partIndex >= 0 && partIndex < this.meetingParts.length) {
            this.elapsedTimes[partIndex] = 0;
            this.saveState();
        }
    },
    
    // Clear all data and reset to defaults
    clearAllData() {
        localStorage.removeItem('meetingTemplate');
        localStorage.removeItem('elapsedTimes');
        localStorage.removeItem('activePart');
        localStorage.removeItem('meetingComments');
        
        this.meetingParts = DEFAULT_PARTS;
        this.resetTimers();
    },
    
    // Start the timer
    startTimer() {
        if (this.activePart !== null) {
            this.isRunning = true;
            
            // Clear any existing interval
            clearInterval(this.timerInterval);
            
            this.timerInterval = setInterval(() => {
                this.elapsedTimes[this.activePart] = (this.elapsedTimes[this.activePart] || 0) + 1;
                this.saveState();
                render.timerDisplay();
            }, TIMER_UPDATE_INTERVAL);
        }
    },
    
    // Stop the timer
    stopTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        // Also stop any active comment
        if (this.activeComment) {
            this.finalizeComment();
        }
    },
    
    // Toggle timer on/off
    toggleTimer() {
        if (this.isRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
        render.timerDisplay();
    },
    
    // Move to the next part
    startNextPart() {
        if (this.activePart < this.meetingParts.length - 1) {
            this.activePart++;
            
            // Ensure we have an elapsed time for the new part
            if (!this.elapsedTimes[this.activePart]) {
                this.elapsedTimes[this.activePart] = 0;
            }
            
            this.saveState();
            
            // If timer wasn't running, start it
            if (!this.isRunning) {
                this.startTimer();
            }
            
            render.timerDisplay();
        }
    },
    
    // Select a specific part
    selectPart(index) {
        if (!this.isRunning && index >= 0 && index < this.meetingParts.length) {
            this.activePart = index;
            this.saveState();
            render.timerDisplay();
        }
    },
    
    // Start or stop comment for current part
    toggleComment(partIndex) {
        if (!this.isRunning || this.activePart !== partIndex) {
            return;
        }
        
        if (this.activeComment) {
            this.finalizeComment();
        } else {
            this.startComment(partIndex);
        }
        
        render.timerDisplay();
    },
    
    // Start a new comment
    startComment(partIndex) {
        this.activeComment = {
            startElapsed: this.elapsedTimes[partIndex] || 0,
            partIndex: partIndex
        };
        
        clearInterval(this.commentInterval);
        
        this.commentInterval = setInterval(() => {
            const currentElement = document.getElementById(`currentComment-${partIndex}`);
            if (currentElement && this.activeComment) {
                const currentElapsed = this.elapsedTimes[partIndex] || 0;
                const commentDuration = currentElapsed - this.activeComment.startElapsed;
                currentElement.textContent = formatTime(Math.max(0, commentDuration));
            }
        }, COMMENT_DISPLAY_UPDATE_INTERVAL);
    },
    
    // Finalize the active comment
    finalizeComment() {
        if (!this.activeComment) return;
        
        const partIndex = this.activeComment.partIndex;
        const duration = (this.elapsedTimes[partIndex] || 0) - this.activeComment.startElapsed;
        
        // Only add comment if duration is at least 1 second
        if (duration >= 1) {
            const finalDuration = Math.min(duration, COMMENT_LIMIT);
            
            this.comments.push({
                duration: finalDuration,
                timestamp: Date.now(),
                partName: this.meetingParts[partIndex].name,
                partIndex: partIndex,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Unique ID
            });
            
            this.saveState();
            render.comments();
        }
        
        clearInterval(this.commentInterval);
        this.commentInterval = null;
        this.activeComment = null;
    },
    
    // Delete a comment
    deleteComment(commentId) {
        const initialCount = this.comments.length;
        this.comments = this.comments.filter(comment => comment.id !== commentId);
        
        if (initialCount !== this.comments.length) {
            this.saveState();
            render.comments();
        }
    },
    
    // Adjust timer by given seconds
    adjustTimer(partIndex, seconds) {
        if (partIndex < 0 || partIndex >= this.meetingParts.length) return;
        
        const currentValue = this.elapsedTimes[partIndex] || 0;
        const maxDuration = this.meetingParts[partIndex].duration;
        
        // Ensure we don't go below 0 or above max duration
        this.elapsedTimes[partIndex] = Math.max(0, Math.min(currentValue + seconds, maxDuration));
        
        this.saveState();
        render.timerDisplay();
    },
    
    // Adjust active comment timer
    adjustCommentTimer(seconds) {
        if (!this.activeComment) return;
        
        const partIndex = this.activeComment.partIndex;
        const currentPartTime = this.elapsedTimes[partIndex] || 0;
        
        // Calculate the new start elapsed time to adjust comment duration
        // For example, if we want to add 5 seconds, we subtract 5 from the start time
        const newStartElapsed = Math.max(0, this.activeComment.startElapsed - seconds);
        
        // Ensure we don't make the comment longer than COMMENT_LIMIT
        const potentialDuration = currentPartTime - newStartElapsed;
        if (potentialDuration <= COMMENT_LIMIT) {
            this.activeComment.startElapsed = newStartElapsed;
        }
        
        // Update display immediately
        const currentElement = document.getElementById(`currentComment-${partIndex}`);
        if (currentElement) {
            const commentDuration = currentPartTime - this.activeComment.startElapsed;
            currentElement.textContent = formatTime(Math.max(0, commentDuration));
        }
    }
};

//----------------------------------------------------------------------------------------------
// TEMPLATE MANAGEMENT
//----------------------------------------------------------------------------------------------
const templateManager = {
    // Get all saved templates
    getTemplates() {
        try {
            const templates = localStorage.getItem('savedTemplates');
            return templates ? JSON.parse(templates) : {};
        } catch (error) {
            console.error('Error loading templates:', error);
            return {};
        }
    },
    
    // Save current template with a name
    saveTemplate(name) {
        try {
            const templates = this.getTemplates();
            templates[name] = state.meetingParts;
            localStorage.setItem('savedTemplates', JSON.stringify(templates));
            notify.show(`Template "${name}" saved successfully`, 'success');
        } catch (error) {
            console.error('Error saving template:', error);
            notify.show('Failed to save template', 'error');
        }
    },
    
    // Load a template by name
    loadTemplate(name) {
        try {
            const templates = this.getTemplates();
            if (templates[name]) {
                state.meetingParts = templates[name];
                localStorage.setItem('meetingTemplate', JSON.stringify(state.meetingParts));
                state.resetTimers();
                render.template();
                render.timerDisplay();
                notify.show(`Template "${name}" loaded successfully`, 'success');
            }
        } catch (error) {
            console.error('Error loading template:', error);
            notify.show('Failed to load template', 'error');
        }
    },
    
    // Delete a template by name
    deleteTemplate(name) {
        try {
            const templates = this.getTemplates();
            if (templates[name]) {
                delete templates[name];
                localStorage.setItem('savedTemplates', JSON.stringify(templates));
                this.populateTemplatesList();
                notify.show(`Template "${name}" deleted`, 'success');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            notify.show('Failed to delete template', 'error');
        }
    },
    
    // Populate the templates list in the modal
    populateTemplatesList() {
        const templatesListElement = DOM.elements.templatesList;
        if (!templatesListElement) return;
        
        const templates = this.getTemplates();
        let html = '';
        
        if (Object.keys(templates).length === 0) {
            html = '<p class="text-gray-500">No saved templates</p>';
        } else {
            html = Object.keys(templates).map(name => `
                <div class="flex justify-between items-center p-2 border rounded mb-2">
                    <span class="template-name">${sanitizeInput(name)}</span>
                    <div class="flex space-x-2">
                        <button 
                            class="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                            data-action="load" 
                            data-template="${sanitizeInput(name)}">
                            Load
                        </button>
                        <button 
                            class="px-2 py-1 bg-red-500 text-white rounded text-sm"
                            data-action="delete" 
                            data-template="${sanitizeInput(name)}">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        templatesListElement.innerHTML = html;
        
        // Add event listeners to template actions
        templatesListElement.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                const templateName = e.target.getAttribute('data-template');
                
                if (action === 'load') {
                    if (state.isRunning) {
                        DOM.showConfirmation(
                            'Load Template',
                            'Loading a new template will stop the current timer. Continue?',
                            () => this.loadTemplate(templateName)
                        );
                    } else {
                        this.loadTemplate(templateName);
                    }
                } else if (action === 'delete') {
                    DOM.showConfirmation(
                        'Delete Template',
                        `Are you sure you want to delete the template "${templateName}"?`,
                        () => this.deleteTemplate(templateName)
                    );
                }
            });
        });
    }
};

//----------------------------------------------------------------------------------------------
// MEETING PARTS MANAGEMENT
//----------------------------------------------------------------------------------------------
function addPart() {
    state.meetingParts.push({
        name: '',
        duration: 180,
        speaker: '',
        enableComments: false
    });
    
    localStorage.setItem('meetingTemplate', JSON.stringify(state.meetingParts));
    render.template();
    render.timerDisplay();
}

function updatePart(index, field, value) {
    if (index < 0 || index >= state.meetingParts.length) return;
    
    let processedValue = value;
    
    if (field === 'duration') {
        // Convert minutes to seconds, ensure it's a positive number
        processedValue = Math.round(Math.max(0, parseFloat(value) || 0) * 60);
    } else if (field === 'enableComments') {
        processedValue = Boolean(value);
    } else {
        processedValue = sanitizeInput(value);
    }
    
    state.meetingParts[index][field] = processedValue;
    localStorage.setItem('meetingTemplate', JSON.stringify(state.meetingParts));
    
    render.template();
    render.timerDisplay();
}

function movePart(index, direction) {
    if (index < 0 || index >= state.meetingParts.length) return;
    if ((direction === -1 && index === 0) || 
        (direction === 1 && index === state.meetingParts.length - 1)) {
        return;
    }
    
    const newIndex = index + direction;
    
    // Swap meeting parts
    [state.meetingParts[index], state.meetingParts[newIndex]] = 
    [state.meetingParts[newIndex], state.meetingParts[index]];
    
    // Swap elapsed times
    const tempElapsed = state.elapsedTimes[index];
    state.elapsedTimes[index] = state.elapsedTimes[newIndex];
    state.elapsedTimes[newIndex] = tempElapsed;
    
    // Update active part if needed
    if (state.activePart === index) {
        state.activePart = newIndex;
    } else if (state.activePart === newIndex) {
        state.activePart = index;
    }
    
    localStorage.setItem('meetingTemplate', JSON.stringify(state.meetingParts));
    state.saveState();
    
    render.template();
    render.timerDisplay();
}

function removePart(index) {
    if (index < 0 || index >= state.meetingParts.length) return;
    
    // Show confirmation if timer is running for this part
    if (state.isRunning && state.activePart === index) {
        DOM.showConfirmation(
            'Remove Part',
            'This part is currently active. Removing it will stop the timer. Continue?',
            () => executeRemovePart(index)
        );
    } else {
        executeRemovePart(index);
    }
}

function executeRemovePart(index) {
    // Remove the part
    state.meetingParts.splice(index, 1);
    
    // Adjust elapsed times
    const newElapsedTimes = {};
    Object.keys(state.elapsedTimes).forEach(key => {
        const numKey = parseInt(key, 10);
        if (numKey < index) {
            newElapsedTimes[numKey] = state.elapsedTimes[key];
        } else if (numKey > index) {
            newElapsedTimes[numKey - 1] = state.elapsedTimes[key];
        }
    });
    state.elapsedTimes = newElapsedTimes;
    
    // Adjust active part
    if (state.meetingParts.length === 0) {
        state.activePart = null;
        state.stopTimer();
    } else if (state.activePart >= index) {
        state.activePart = Math.max(0, state.activePart - 1);
    }
    
    localStorage.setItem('meetingTemplate', JSON.stringify(state.meetingParts));
    state.saveState();
    
    render.template();
    render.timerDisplay();
}

//----------------------------------------------------------------------------------------------
// TIMER CONTROL FUNCTIONS - User interface functions that call state methods
//----------------------------------------------------------------------------------------------
function toggleTimer() {
    state.toggleTimer();
}

function startNextPart() {
    state.startNextPart();
}

function selectPart(index) {
    state.selectPart(index);
}

function toggleComment(partIndex) {
    state.toggleComment(partIndex);
}

function incrementTimer(partIndex) {
    state.adjustTimer(partIndex, 5);
}

function decrementTimer(partIndex) {
    state.adjustTimer(partIndex, -5);
}

function incrementCommentTimer() {
    state.adjustCommentTimer(5);
}

function decrementCommentTimer() {
    state.adjustCommentTimer(-5);
}

function resetPartTimer(partIndex) {
    if (state.isRunning && state.activePart === partIndex) {
        DOM.showConfirmation(
            'Reset Timer',
            'This will reset the timer for the current part. Continue?',
            () => state.resetTimer(partIndex)
        );
    } else {
        state.resetTimer(partIndex);
        render.timerDisplay();
    }
}

function deleteComment(commentId) {
    DOM.showConfirmation(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        () => state.deleteComment(commentId)
    );
}

function resetData() {
    if (state.isRunning) {
        DOM.showConfirmation(
            'Reset Timers',
            'This will stop all timers and clear all comments. Continue?',
            () => {
                state.resetTimers();
                render.timerDisplay();
                render.comments();
            }
        );
    } else {
        state.resetTimers();
        render.timerDisplay();
        render.comments();
    }
}

function clearLocalStorage() {
    DOM.showConfirmation(
        'Clear Template',
        'This will reset all data including the meeting template. Continue?',
        () => {
            state.clearAllData();
            render.template();
            render.timerDisplay();
            render.comments();
        }
    );
}

//----------------------------------------------------------------------------------------------
// UTILITY FUNCTIONS
//----------------------------------------------------------------------------------------------
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .trim();
}

function formatTime(seconds) {
    // Add NaN protection
    const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
    const mins = Math.floor(Math.abs(safeSeconds) / 60);
    const secs = Math.abs(safeSeconds) % 60;
    const sign = safeSeconds < 0 ? '-' : '';
    
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
}

function getProgressInfo(elapsed, duration, partIndex = null) {
    const progress = Math.min((elapsed / duration) * 100, 100);
    const timeRemaining = duration - elapsed;
    let color = 'bg-blue-500';
    
    if (timeRemaining <= duration * 0.1 && timeRemaining > 0) {
        color = 'bg-yellow-500';
    } else if (timeRemaining <= 0) {
        color = 'bg-red-500';
    }
    
    return { progress, color };
}

function getPartStatistics(partIndex) {
    // Filter comments for the specified part
    const partComments = state.comments.filter(comment => comment.partIndex === partIndex);
    if (partComments.length === 0) return null;
    
    const totalComments = partComments.length;
    const averageDuration = Math.floor(
        partComments.reduce((sum, comment) => sum + comment.duration, 0) / totalComments
    );
    
    return {
        count: totalComments,
        average: averageDuration
    };
}

//----------------------------------------------------------------------------------------------
// NOTIFICATION SYSTEM
//----------------------------------------------------------------------------------------------
const notify = {
    container: null,
    
    init() {
        // Create notification container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const notificationElement = document.createElement('div');
        notificationElement.className = `${colors[type]} text-white rounded-lg px-4 py-2 shadow-lg transform transition-all duration-300 fade-in`;
        notificationElement.textContent = message;
        
        this.container.appendChild(notificationElement);
        
        // Remove notification after duration
        setTimeout(() => {
            notificationElement.style.opacity = '0';
            notificationElement.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                if (notificationElement.parentNode === this.container) {
                    this.container.removeChild(notificationElement);
                }
            }, 300);
        }, duration);
    }
};

//----------------------------------------------------------------------------------------------
// VISIBILITY MANAGEMENT
//----------------------------------------------------------------------------------------------
let hiddenStartTime = null;

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        hiddenStartTime = Date.now();
        
        // Save state when tab becomes hidden
        if (state.isRunning) {
            state.saveState();
        }
    } else if (document.visibilityState === 'visible' && hiddenStartTime && state.isRunning) {
        const hiddenDuration = Math.round((Date.now() - hiddenStartTime) / 1000);
        
        if (state.activePart !== null) {
            state.elapsedTimes[state.activePart] = (state.elapsedTimes[state.activePart] || 0) + hiddenDuration;
            state.saveState();
        }
        
        // Restart the timer
        state.startTimer();
        render.timerDisplay();
    }
});

//----------------------------------------------------------------------------------------------
// RENDERING FUNCTIONS
//----------------------------------------------------------------------------------------------
const render = {
    template() {
        const templateElement = DOM.elements.partsTemplate;
        if (!templateElement) return;
        
        const templateHTML = state.meetingParts.map((part, index) => this.renderPartTemplate(part, index)).join('');
        templateElement.innerHTML = templateHTML;
    },
    
    renderPartTemplate(part, index) {
        return `
            <div class="flex items-center space-x-2 flex-wrap" role="group" aria-label="Meeting part ${index + 1}">
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 sm:mb-0">
                    <div class="flex flex-col">
                        <label for="part-name-${index}" class="text-xs text-gray-600">Part Name</label>
                        <input
                            id="part-name-${index}"
                            type="text"
                            value="${sanitizeInput(part.name)}"
                            onchange="updatePart(${index}, 'name', this.value)"
                            placeholder="Part Name"
                            class="px-3 py-2 border rounded"
                            aria-label="Name for part ${index + 1}"
                        />
                    </div>
                    <div class="flex flex-col">
                        <label for="part-duration-${index}" class="text-xs text-gray-600">Duration (min)</label>
                        <input
                            id="part-duration-${index}"
                            type="number"
                            value="${part.duration / 60}"
                            onchange="updatePart(${index}, 'duration', this.value)"
                            placeholder="Minutes"
                            class="px-3 py-2 border rounded"
                            aria-label="Duration in minutes for part ${index + 1}"
                            min="0"
                            step="0.5"
                        />
                    </div>
                    <div class="flex flex-col">
                        <label for="part-speaker-${index}" class="text-xs text-gray-600">Speaker</label>
                        <input
                            id="part-speaker-${index}"
                            type="text"
                            value="${sanitizeInput(part.speaker)}"
                            onchange="updatePart(${index}, 'speaker', this.value)"
                            placeholder="Speaker"
                            class="px-3 py-2 border rounded"
                            aria-label="Speaker name for part ${index + 1}"
                        />
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <label class="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            ${part.enableComments ? 'checked' : ''}
                            onchange="updatePart(${index}, 'enableComments', this.checked)"
                            class="form-checkbox"
                            aria-label="Enable comments for this part"
                        />
                        <span class="text-sm">Comments</span>
                    </label>
                    <button 
                        onclick="movePart(${index}, -1)" 
                        ${index === 0 ? 'disabled' : ''} 
                        class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        aria-label="Move part up ${index + 1}"
                        ${index === 0 ? 'aria-disabled="true"' : ''}>
                        ↑
                    </button>
                    <button 
                        onclick="movePart(${index}, 1)" 
                        ${index === state.meetingParts.length - 1 ? 'disabled' : ''} 
                        class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        aria-label="Move part down ${index + 1}"
                        ${index === state.meetingParts.length - 1 ? 'aria-disabled="true"' : ''}>
                        ↓
                    </button>
                    <button 
                        onclick="removePart(${index})" 
                        class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        aria-label="Remove part ${index + 1}">
                        ×
                    </button>
                </div>
            </div>
        `;
    },
    
    timerDisplay() {
        const displayElement = DOM.elements.partsDisplay;
        if (!displayElement) return;
        
        const displayHTML = state.meetingParts.map((part, index) => this.renderTimerDisplay(part, index)).join('');
        displayElement.innerHTML = displayHTML;
    },
    
    renderTimerDisplay(part, index) {
        const elapsed = state.elapsedTimes[index] || 0;
        const { progress, color } = getProgressInfo(elapsed, part.duration, index);
        const isActive = state.activePart === index;
        
        return `
            <div class="p-4 border rounded-lg part-card ${isActive ? 'active border-blue-500' : 'border-gray-200'}"
                 onclick="selectPart(${index})"
                 role="region"
                 aria-label="Timer for ${sanitizeInput(part.name)}"
                 aria-selected="${isActive}">
                ${this.renderTimerHeader(part, index)}
                ${this.renderProgressBar(part, elapsed, progress, color)}
                ${part.enableComments ? this.renderCommentControls(index) : ''}
                ${this.renderTimerControls(index, isActive)}
            </div>
        `;
    },
    
    renderTimerHeader(part, index) {
        return `
            <div class="flex justify-between mb-2 flex-wrap">
                <div class="flex flex-col">
                    <span class="font-medium">${sanitizeInput(part.name)}</span>
                    ${part.enableComments ? this.renderPartStatistics(index) : ''}
                </div>
                <span aria-label="Speaker" class="text-gray-600">${sanitizeInput(part.speaker)}</span>
            </div>
        `;
    },
    
    renderPartStatistics(index) {
        const stats = getPartStatistics(index);
        return stats ? 
            `<span class="text-sm text-gray-600">
                (${stats.count} comments, avg ${formatTime(stats.average)})
            </span>` : 
            '';
    },
    
    renderProgressBar(part, elapsed, progress, color) {
        return `
            <div class="h-8 bg-gray-200 rounded-full overflow-hidden relative progress-bar"
                 role="progressbar"
                 aria-valuemin="0"
                 aria-valuemax="${part.duration}"
                 aria-valuenow="${elapsed}"
                 aria-label="Progress for ${sanitizeInput(part.name)}">
                <div class="h-full ${color} progress-bar-bg" style="width: ${progress}%"></div>
                <span class="left-label">${formatTime(elapsed)}</span>
                <span class="countdown" aria-label="Time remaining">
                    ${formatTime(part.duration - elapsed)}
                </span>
            </div>
        `;
    },
    
    renderCommentControls(index) {
        const isActiveComment = state.activeComment?.partIndex === index;
        
        return `
            <div class="mt-4 space-y-2">
                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick="event.stopPropagation(); toggleComment(${index})" 
                        class="px-4 py-2 ${isActiveComment ? 'bg-red-500' : 'bg-purple-500'} text-white rounded hover:${isActiveComment ? 'bg-red-600' : 'bg-purple-600'}"
                        aria-label="${isActiveComment ? 'Stop comment' : 'Start comment'}">
                        ${isActiveComment ? 'Stop Comment' : 'Start Comment'}
                    </button>
                    <span id="currentComment-${index}" 
                          class="text-sm font-medium ${isActiveComment ? '' : 'invisible'}"
                          aria-live="polite"
                          role="timer">
                        ${isActiveComment ? formatTime((state.elapsedTimes[index] || 0) - state.activeComment.startElapsed) : '0:00'}
                    </span>
                    ${isActiveComment ? `
                        <div class="flex space-x-1">
                            <button onclick="event.stopPropagation(); incrementCommentTimer()" 
                                class="time-adjust-button increment-button"
                                aria-label="Add 5 seconds to comment">
                                +5s
                            </button>
                            <button onclick="event.stopPropagation(); decrementCommentTimer()" 
                                class="time-adjust-button decrement-button"
                                aria-label="Subtract 5 seconds from comment">
                                -5s
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    renderTimerControls(index, isActive) {
        if (!isActive) {
            return `
                <div class="mt-4">
                    <button onclick="event.stopPropagation(); resetPartTimer(${index})" 
                            class="time-adjust-button reset-button"
                            aria-label="Reset timer for this part">
                        Reset Timer
                    </button>
                </div>
            `;
        }
        
        const isLastPart = index >= state.meetingParts.length - 1;
        
        return `
            <div class="mt-4 timer-controls">
                <button onclick="event.stopPropagation(); toggleTimer()" 
                        class="px-4 py-2 ${state.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded"
                        aria-label="${state.isRunning ? 'Stop timer' : 'Start timer'}">
                    ${state.isRunning ? 'Stop' : 'Start'}
                </button>
                ${!isLastPart ? `
                <button onclick="event.stopPropagation(); startNextPart()" 
                        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        aria-label="Begin next part">
                    Begin Next Part
                </button>` : ''}
                <button onclick="event.stopPropagation(); incrementTimer(${index})" 
                        class="time-adjust-button increment-button"
                        aria-label="Add 5 seconds to timer">
                    +5s
                </button>
                <button onclick="event.stopPropagation(); decrementTimer(${index})" 
                        class="time-adjust-button decrement-button"
                        aria-label="Subtract 5 seconds from timer">
                    -5s
                </button>
                <button onclick="event.stopPropagation(); resetPartTimer(${index})" 
                        class="time-adjust-button reset-button"
                        aria-label="Reset timer for this part">
                    Reset
                </button>
            </div>
        `;
    },
    
    comments() {
        const commentHistoryElement = DOM.elements.commentHistory;
        const globalCommentCountElement = DOM.elements.globalCommentCount;
        const globalAverageDurationElement = DOM.elements.globalAverageDuration;
        
        if (!commentHistoryElement || !globalCommentCountElement || !globalAverageDurationElement) return;
        
        const commentCount = state.comments.length;
        const averageDuration = commentCount > 0
            ? Math.floor(state.comments.reduce((a, b) => a + b.duration, 0) / commentCount)
            : 0;
        
        globalCommentCountElement.textContent = commentCount;
        globalAverageDurationElement.textContent = formatTime(averageDuration);
        
        commentHistoryElement.innerHTML = this.renderCommentHistory();
    },
    
    renderCommentHistory() {
        // Group comments by part
        const groupedComments = state.comments.reduce((acc, comment) => {
            const partName = comment.partName || 'Unknown Part';
            if (!acc[partName]) {
                acc[partName] = [];
            }
            acc[partName].push(comment);
            return acc;
        }, {});
        
        // No comments
        if (Object.keys(groupedComments).length === 0) {
            return '<p class="text-gray-500 text-center p-4">No comments recorded yet</p>';
        }
        
        // Sort by part name and render each group
        return Object.entries(groupedComments).map(([partName, partComments]) => `
            <div class="mb-4">
                <h3 class="font-semibold text-gray-700 mb-2">${sanitizeInput(partName)}</h3>
                ${partComments.map((comment, i) => this.renderComment(comment, i)).join('')}
            </div>
        `).join('');
    },
    
    renderComment(comment, index) {
        return `
            <div class="bg-white p-2 rounded shadow-sm mb-2 comment-item" data-comment-id="${comment.id || ''}">
                <div class="flex justify-between text-sm">
                    <span>Comment ${index + 1}</span>
                    <div class="flex items-center">
                        <span class="mr-2">${formatTime(comment.duration)}</span>
                        <button 
                            onclick="deleteComment('${comment.id || ''}')" 
                            class="text-red-500 delete-button text-sm"
                            aria-label="Delete this comment">
                            ×
                        </button>
                    </div>
                </div>
                <div class="text-xs text-gray-500">
                    ${new Date(comment.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `;
    }
};

//----------------------------------------------------------------------------------------------
// EVENT LISTENERS AND INITIALIZATION
//----------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM cache
    DOM.init();
    
    // Initialize application state
    state.init();
    
    // Render the UI
    render.template();
    render.timerDisplay();
    render.comments();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space to toggle timer when not in a form field
        if (e.code === 'Space' && 
            !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            toggleTimer();
        }
        
        // Escape to close any open modals
        if (e.key === 'Escape') {
            if (!DOM.elements.templateModal.classList.contains('hidden')) {
                DOM.elements.templateModal.classList.add('hidden');
            }
            if (!DOM.elements.confirmationModal.classList.contains('hidden')) {
                DOM.elements.confirmationModal.classList.add('hidden');
            }
        }
    });
    
    // Confirm page refresh if timer is running
    window.addEventListener('beforeunload', (e) => {
        if (state.isRunning) {
            // This will trigger a browser confirmation dialog
            e.preventDefault();
            e.returnValue = 'You have a timer running. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
});

//----------------------------------------------------------------------------------------------
// ERROR HANDLING
//----------------------------------------------------------------------------------------------
window.addEventListener('error', (event) => {
    console.error('Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // Display error to user
    notify.show('An error occurred. Attempting to recover...', 'error');
    
    // Attempt recovery
    try {
        clearInterval(state.timerInterval);
        clearInterval(state.commentInterval);
        state.isRunning = false;
        
        // Re-render the interface
        render.template();
        render.timerDisplay();
        render.comments();
    } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        notify.show('Application error. Please refresh the page.', 'error');
    }
});
