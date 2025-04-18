/**
 * Life and Ministry Timer - Rendering Module
 * Version 2.1.0
 * 
 * Handles all DOM updates and rendering for the Life and Ministry Timer application
 */

'use strict';

//----------------------------------------------------------------------------------------------
// RENDERING - Handles all DOM updates
//----------------------------------------------------------------------------------------------
const render = {
    // Initialize rendering
    init() {
        this.templateEditor();
        this.timerDisplay();
        this.comments();
        
        // Initialize edit mode UI
        const editModeControls = document.getElementById('editModeControls');
        const editModeInstructions = document.getElementById('editModeInstructions');
        
        if (state.isEditMode) {
            if (editModeControls) {
                editModeControls.classList.remove('hidden');
            }
            if (editModeInstructions) {
                editModeInstructions.classList.remove('hidden');
            }
        } else {
            if (editModeControls) {
                editModeControls.classList.add('hidden');
            }
            if (editModeInstructions) {
                editModeInstructions.classList.add('hidden');
            }
        }
    },
    
    // Render template editor
    templateEditor() {
        const container = DOM.elements.partsTemplate;
        if (!container) return;
        
        container.innerHTML = '';
        
        state.meetingParts.forEach((part, index) => {
            const partElement = document.createElement('div');
            partElement.className = 'bg-white p-4 rounded shadow mb-2';
            partElement.innerHTML = `
                <div class="flex flex-wrap justify-between items-center gap-2">
                    <div class="flex-1">
                        <input type="text" value="${part.name}" 
                            class="w-full px-2 py-1 border rounded" 
                            placeholder="Part name"
                            onchange="updatePartName(${index}, this.value)">
                    </div>
                    <div class="flex-1">
                        <input type="text" value="${part.speaker}" 
                            class="w-full px-2 py-1 border rounded" 
                            placeholder="Speaker (optional)"
                            onchange="updatePartSpeaker(${index}, this.value)">
                    </div>
                    <div class="w-24">
                        <input type="number" value="${Math.floor(part.duration / 60)}" 
                            class="w-full px-2 py-1 border rounded" 
                            min="1" max="60"
                            onchange="updatePartDuration(${index}, this.value)">
                    </div>
                    <div class="flex items-center">
                        <label class="flex items-center cursor-pointer">
                            <input type="checkbox" class="mr-1" 
                                ${part.enableComments ? 'checked' : ''}
                                onchange="updatePartComments(${index}, this.checked)">
                            <span class="text-sm">Comments</span>
                        </label>
                    </div>
                    <div>
                        <button onclick="removePart(${index})" 
                            class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            aria-label="Remove part">
                            &times;
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(partElement);
        });
        
        // Save template to localStorage
        localStorage.setItem('meetingTemplate', JSON.stringify(state.meetingParts));
    },
    
    // Render timer display
    timerDisplay() {
        const container = DOM.elements.partsDisplay;
        if (!container) return;
        
        container.innerHTML = '';
        
        // Add drop zone at the beginning if in edit mode
        if (state.isEditMode) {
            this._addDropZone(container, 0);
        }
        
        state.meetingParts.forEach((part, index) => {
            const elapsed = state.elapsedTimes[index] || 0;
            const isActive = index === state.activePart;
            const isOver = elapsed >= part.duration;
            const progressPercent = Math.min(100, (elapsed / part.duration) * 100);
            
            const partElement = document.createElement('div');
            partElement.className = `part-card p-4 rounded shadow ${isActive ? 'active' : ''} ${!isActive && !state.isRunning && !state.isEditMode ? 'clickable' : ''}`;
            partElement.setAttribute('data-part-index', index);
            
            // Add drag and drop attributes if in edit mode
            if (state.isEditMode) {
                partElement.setAttribute('draggable', 'true');
                partElement.classList.add('edit-mode');
                
                // Add drag event listeners
                partElement.addEventListener('dragstart', (e) => {
                    state.startDrag(index);
                    partElement.classList.add('dragging');
                    e.dataTransfer.setData('text/plain', index);
                    e.dataTransfer.effectAllowed = 'move';
                });
                
                partElement.addEventListener('dragend', () => {
                    partElement.classList.remove('dragging');
                    state.endDrag();
                });
                
                // Edit part on click in edit mode
                partElement.onclick = function(e) {
                    // Only if the click is on the part itself, not on a button
                    if (e.target === partElement || e.target.tagName !== 'BUTTON') {
                        state.editPart(index);
                    }
                };
            }
            // Make the entire card clickable if timer is not running and not in edit mode
            else if (!state.isRunning) {
                partElement.onclick = function() { state.selectPart(index); };
                partElement.setAttribute('role', 'button');
                partElement.setAttribute('aria-label', `Select ${part.name} part`);
                partElement.setAttribute('tabindex', '0');
                
                // Add keyboard support (Enter and Space keys)
                partElement.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
                        e.preventDefault();
                        state.selectPart(index);
                    }
                });
            }
            
            // Calculate progress bar color based on progress
            let progressColor = 'bg-blue-500';
            if (progressPercent >= 90) {
                progressColor = 'bg-red-500';
            } else if (progressPercent >= 75) {
                progressColor = 'bg-yellow-500';
            }
            
            // Build part card HTML
            // Build part card HTML
            let partHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold">${part.name}</h3>
                    <div class="text-sm text-gray-600">${part.speaker}</div>
                    ${state.isEditMode ? `
                        <button data-action="remove-part" data-part-index="${index}"
                            class="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            aria-label="Remove part">
                            ×
                        </button>
                    ` : ''}
                </div>

                <div class="progress-bar h-8 mb-2">
                    <div class="progress-bar-bg ${progressColor}" style="width: ${progressPercent}%"></div>
                    <span class="left-label">${formatTime(elapsed)}</span>
                    <span class="countdown">${formatTimeWithSign(part.duration - elapsed)}</span>
                </div>

                <div class="flex justify-between items-center">
                    <div class="flex space-x-2">
                        ${isActive && !state.isEditMode ? `
                            <button data-action="toggle-timer" data-part-index="${index}"
                                class="px-2 py-1 ${state.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded"
                                aria-label="${state.isRunning ? 'Stop timer' : 'Start timer'}">
                                ${state.isRunning ? 'Stop' : 'Start'}
                            </button>

                            ${index < state.meetingParts.length - 1 ? `
                                <button data-action="next-part" data-part-index="${index}"
                                    class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    aria-label="Next part">
                                    Next
                                </button>
                            ` : ''}
                        ` : ''}

                        ${state.isEditMode ? `
                            <button data-action="edit-part" data-part-index="${index}"
                                class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                aria-label="Edit part">
                                Edit
                            </button>
                        ` : ''}
                    </div>

                    ${part.enableComments && isActive && !state.isEditMode ? `
                        <div class="flex items-center">
                            <button data-action="toggle-comment" data-part-index="${index}"
                                class="px-2 py-1 ${state.activeComment ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'} text-white rounded mr-2"
                                aria-label="${state.activeComment ? 'Stop comment' : 'Start comment'}">
                                ${state.activeComment ? 'Stop Comment' : 'Comment'}
                            </button>
                            <span id="currentComment-${index}" class="font-mono">
                                ${state.activeComment && state.activeComment.partIndex === index ?
                                    formatTime((state.elapsedTimes[index] || 0) - state.activeComment.startElapsed) :
                                    '0:00'}
                            </span>
                        </div>
                    ` : ''}
                </div>

                <div class="timer-controls">
                     ${isActive && !state.isEditMode ? `
                        <button data-action="adjust-timer" data-part-index="${index}" data-adjust="5"
                            class="time-adjust-button increment-button"
                            aria-label="Add 5 seconds">
                            +5s
                        </button>
                        <button data-action="adjust-timer" data-part-index="${index}" data-adjust="-5"
                            class="time-adjust-button decrement-button"
                            aria-label="Subtract 5 seconds">
                            -5s
                        </button>
                    ` : ''}
                    ${!state.isEditMode ? `
                        <button data-action="reset-timer" data-part-index="${index}"
                            class="time-adjust-button reset-button"
                            aria-label="Reset timer">
                            Reset
                        </button>
                    ` : ''}
                </div>

                ${state.isEditMode ? `
                    <div class="edit-controls mt-2 flex justify-between">
                        <button data-action="add-part-before" data-part-index="${index}"
                            class="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            aria-label="Add part before">
                            Add Before
                        </button>
                        <button data-action="add-part-after" data-part-index="${index}"
                            class="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            aria-label="Add part after">
                            Add After
                        </button>
                    </div>
                ` : ''}
            `;
            
            partElement.innerHTML = partHTML;
            container.appendChild(partElement);
            
            // Add drop zone after each part if in edit mode
            if (state.isEditMode) {
                this._addDropZone(container, index + 1);
            }
        });
    },
    
    // Add a drop zone for drag and drop
    _addDropZone(container, index) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone my-1';
        dropZone.setAttribute('data-drop-index', index);
        
        // Add drop event listeners
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drop-zone-active');
            e.dataTransfer.dropEffect = 'move';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drop-zone-active');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drop-zone-active');
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = parseInt(dropZone.getAttribute('data-drop-index'));
            
            // Adjust toIndex if dropping after the dragged item
            const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
            
            state.movePart(fromIndex, adjustedToIndex);
        });
        
        container.appendChild(dropZone);
    },
    
    // Render comments
    comments() {
        const container = DOM.elements.commentHistory;
        const countElement = DOM.elements.globalCommentCount;
        const averageElement = DOM.elements.globalAverageDuration;
        
        if (!container || !countElement || !averageElement) return;
        
        // Update global comment stats
        const commentCount = state.comments.length;
        countElement.textContent = commentCount;
        
        // Calculate average duration
        if (commentCount > 0) {
            const totalDuration = state.comments.reduce((sum, comment) => sum + comment.duration, 0);
            const averageDuration = Math.round(totalDuration / commentCount);
            averageElement.textContent = formatTime(averageDuration);
        } else {
            averageElement.textContent = '0:00';
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Sort comments by timestamp (newest first)
        const sortedComments = [...state.comments].sort((a, b) => b.timestamp - a.timestamp);
        
        // Add comments to container
        sortedComments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-item bg-white p-2 rounded shadow flex justify-between items-center';
            commentElement.innerHTML = `
                <div>
                    <span class="font-medium">${comment.partName}</span>
                    <span class="text-sm text-gray-600 ml-2">${formatTime(comment.duration)}</span>
                </div>
                <button data-comment-id="${comment.id}" // <-- Add data-comment-id here
                    class="delete-button px-2 text-red-500 hover:text-red-700"
                    aria-label="Delete comment">
                    ×
                </button>
            `; // Remove onclick="state.deleteComment(...)"
            container.appendChild(commentElement);
        });
    }
};

//----------------------------------------------------------------------------------------------
// UTILITY FUNCTIONS
//----------------------------------------------------------------------------------------------

// Format seconds as MM:SS
function formatTime(seconds) {
    // Handle fractional seconds
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format seconds as MM:SS with sign for negative values
function formatTimeWithSign(seconds) {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    return `${isNegative ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update part name
function updatePartName(index, name) {
    if (index >= 0 && index < state.meetingParts.length) {
        state.meetingParts[index].name = name;
        render.templateEditor();
    }
}

// Update part speaker
function updatePartSpeaker(index, speaker) {
    if (index >= 0 && index < state.meetingParts.length) {
        state.meetingParts[index].speaker = speaker;
        render.templateEditor();
    }
}

// Update part duration
function updatePartDuration(index, minutes) {
    if (index >= 0 && index < state.meetingParts.length) {
        const mins = parseInt(minutes) || 1;
        state.meetingParts[index].duration = mins * 60;
        render.templateEditor();
        render.timerDisplay();
    }
}

// Update part comments
function updatePartComments(index, enableComments) {
    if (index >= 0 && index < state.meetingParts.length) {
        state.meetingParts[index].enableComments = enableComments;
        render.templateEditor();
        render.timerDisplay();
    }
}

// Remove a part
function removePart(index) {
    if (index >= 0 && index < state.meetingParts.length) {
        state.meetingParts.splice(index, 1);
        
        // Adjust active part if needed
        if (state.activePart >= state.meetingParts.length) {
            state.activePart = Math.max(0, state.meetingParts.length - 1);
        }
        
        render.templateEditor();
        render.timerDisplay();
    }
}

// Reset all timers
function resetData() {
    if (confirm('Are you sure you want to reset all timers? This will keep your template but clear all timing data.')) {
        state.resetTimers();
        render.timerDisplay();
        render.comments();
    }
}

// Clear all data and reset to defaults
function clearLocalStorage() {
    if (confirm('Are you sure you want to clear all data? This will reset the template to default and clear all timing data.')) {
        state.clearAllData();
        render.templateEditor();
        render.timerDisplay();
        render.comments();
    }
}
