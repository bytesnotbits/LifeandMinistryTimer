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
        this.globalTimerDisplay();
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

    // Render sticky global meeting timer bar
    globalTimerDisplay() {
        const container = document.getElementById('globalTimerContainer');
        if (!container) return;
        // if no schedule, hide
        if (!state.meetingScheduledStart) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');
        const now = Date.now();
        const start = state.meetingScheduledStart;
        const end = state.meetingScheduledEnd;
        const totalSec = end && start ? (end - start) / 1000 : 0;
        let elapsed = 0;
        if (state.meetingActualEnd) {
            elapsed = (state.meetingActualEnd - start) / 1000;
        } else if (now >= start) {
            elapsed = (now - start) / 1000;
        }
        elapsed = Math.max(0, elapsed);
        const percent = totalSec > 0 ? Math.min(100, (elapsed / totalSec) * 100) : 0;
        const bar = document.getElementById('globalProgress');
        if (bar) {
            bar.style.width = percent + '%';
            // Detect overtime: if elapsed > total and meeting is still running
            const isOvertime = state.meetingIsRunning && !state.meetingActualEnd && elapsed > totalSec && totalSec > 0;
            if (isOvertime) {
                bar.classList.add('overtime-pulse');
            } else {
                bar.classList.remove('overtime-pulse');
            }
        }
        const label = document.getElementById('globalTimerLabel');
        if (label) {
            label.textContent = formatMeetingTime(elapsed);
        }
        const remainingLabel = document.getElementById('globalTimerRemaining');
        if (remainingLabel) {
            const remaining = totalSec > 0 ? (totalSec - elapsed) : 0;
            remainingLabel.textContent = totalSec > 0 ? formatMeetingTimeWithSign(remaining) : '';
        }
        const endBtn = document.getElementById('endMeetingBtn');
        if (endBtn) {
            if (now >= start && !state.meetingActualEnd) {
                endBtn.classList.remove('hidden');
            } else {
                endBtn.classList.add('hidden');
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
        const canReorder = !state.isRunning && state.editingPartIndex === null && state.meetingParts.length > 1;
        
        // Keep drop-zone spacing consistent across running/stopped states.
        this._addDropZone(container, 0);
        
        state.meetingParts.forEach((part, index) => {
            const elapsed = state.elapsedTimes[index] || 0;
            const isActive = index === state.activePart;
            const isOver = elapsed >= part.duration;
            const progressPercent = Math.min(100, (elapsed / part.duration) * 100);
            
            const partElement = document.createElement('div');
            partElement.className = `part-card p-4 rounded shadow ${isActive ? 'active' : ''} ${!isActive && !state.isRunning && state.editingPartIndex === null ? 'clickable' : ''}`;
            partElement.setAttribute('data-part-index', index);
            
            // Enable drag-and-drop reordering while timer is stopped and no inline editor is open.
            if (canReorder) {
                partElement.setAttribute('draggable', 'true');
                partElement.classList.add('reorder-enabled');
                
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
            }
            // Make the entire card clickable if timer is not running and no inline editor is open.
            else if (!state.isRunning && state.editingPartIndex === null) {
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
            
            const isInlineEditing = state.editingPartIndex === index;
            const inlineDraft = (isInlineEditing && state.inlineEditDraft && state.inlineEditDraft.index === index)
                ? state.inlineEditDraft
                : null;
            const inlineNameValue = inlineDraft ? inlineDraft.name : part.name;
            const inlineSpeakerValue = inlineDraft ? inlineDraft.speaker : (part.speaker || '');
            const inlineDurationValue = inlineDraft
                ? inlineDraft.durationValue
                : Math.max(1, Math.floor(part.duration / 60));
            const inlineCommentsChecked = inlineDraft ? inlineDraft.enableComments : part.enableComments;
            const canRemove = !state.isRunning && state.meetingParts.length > 1;
            const removeDisabledClass = canRemove ? '' : 'opacity-40 cursor-not-allowed';
            const removeDisabledAttr = canRemove ? '' : 'disabled';

            // Build part card HTML
            let partHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold flex items-center gap-2">
                        <span>${part.name}</span>
                        <button data-action="edit-part" data-part-index="${index}"
                            class="p-1 text-blue-600 hover:text-blue-800 rounded"
                            aria-label="Edit ${part.name}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M17.414 2.586a2 2 0 010 2.828l-8.5 8.5a1 1 0 01-.447.264l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.264-.447l8.5-8.5a2 2 0 012.828 0zM5.978 10.607l-.5 2 2-.5 7.95-7.95-1.5-1.5-7.95 7.95z"/>
                            </svg>
                        </button>
                    </h3>
                    <div class="text-sm text-gray-600">${part.speaker}</div>
                    <div class="ml-2 flex items-center gap-1">
                        ${canReorder ? `
                            <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded cursor-grab text-xs" aria-label="Move to reorder">
                                Move
                            </span>
                        ` : ''}
                        <button data-action="remove-part" data-part-index="${index}"
                            class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 ${removeDisabledClass}"
                            aria-label="Remove ${part.name}" ${removeDisabledAttr}>
                            ×
                        </button>
                    </div>
                </div>

                ${isInlineEditing ? `
                    <div class="inline-part-editor mb-3 p-3 border rounded bg-gray-50">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div>
                                <label for="editPartName-inline-${index}" class="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                                <input id="editPartName-inline-${index}" type="text" class="w-full px-2 py-1 border rounded" value="${inlineNameValue}">
                            </div>
                            <div>
                                <label for="editPartSpeaker-inline-${index}" class="block text-sm font-medium text-gray-700 mb-1">Speaker</label>
                                <input id="editPartSpeaker-inline-${index}" type="text" class="w-full px-2 py-1 border rounded" value="${inlineSpeakerValue}">
                            </div>
                            <div>
                                <label for="editPartDuration-inline-${index}" class="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <input id="editPartDuration-inline-${index}" type="number" min="1" max="180" class="w-full px-2 py-1 border rounded" value="${inlineDurationValue}">
                            </div>
                            <div class="flex items-end">
                                <label class="inline-flex items-center">
                                    <input id="editPartComments-inline-${index}" type="checkbox" class="mr-2" ${inlineCommentsChecked ? 'checked' : ''}>
                                    <span class="text-sm font-medium text-gray-700">Enable Comments</span>
                                </label>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button data-action="save-inline-part" data-part-index="${index}"
                                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                aria-label="Save ${part.name} changes">
                                Save
                            </button>
                            <button data-action="cancel-inline-part" data-part-index="${index}"
                                class="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                                aria-label="Cancel editing ${part.name}">
                                Cancel
                            </button>
                        </div>
                    </div>
                ` : ''}

                <div class="progress-bar h-8 mb-2">
                    <div data-role="part-progress" class="progress-bar-bg ${progressColor}" style="width: ${progressPercent}%"></div>
                    <span data-role="part-elapsed" class="left-label">${formatTime(elapsed)}</span>
                    <span data-role="part-countdown" class="countdown">${formatTimeWithSign(part.duration - elapsed)}</span>
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
                    </div>

                    ${part.enableComments && isActive && !state.isEditMode ? `
                        <div class="flex items-center">
                            <button data-action="toggle-comment" data-part-index="${index}"
                                class="px-2 py-1 ${state.activeComment ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-500 hover:bg-purple-600'} text-white rounded mr-2"
                                aria-label="${state.activeComment ? 'Stop comment' : 'Start comment'}">
                                ${state.activeComment ? 'Stop Comment' : 'Comment'}
                            </button>
                            ${(() => {
                                // compute the current comment duration for this part (non-negative)
                                let duration = 0;
                                if (state.activeComment && state.activeComment.partIndex === index) {
                                    duration = (state.elapsedTimes[index] || 0) - state.activeComment.startElapsed;
                                    duration = Math.max(0, duration);
                                }
                                const disabledAttr = duration <= 0 ? ' disabled' : '';

                                let html = `<span id="currentComment-${index}" class="font-mono">${formatTime(duration)}</span>`;
                                if (state.activeComment && state.activeComment.partIndex === index) {
                                    html += `
                                        <div class="flex items-center ml-2 gap-1">
                                            <button data-action="adjust-comment" data-part-index="${index}" data-adjust="5"
                                                class="time-adjust-button increment-button"
                                                aria-label="Add 5 seconds to comment">
                                                +5s
                                            </button>
                                            <button data-action="adjust-comment" data-part-index="${index}" data-adjust="-5"
                                                class="time-adjust-button decrement-button"${disabledAttr}
                                                aria-label="Subtract 5 seconds from comment">
                                                -5s
                                            </button>
                                        </div>`;
                                }
                                return html;
                            })()}
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
            
            // Keep spacing stable by always rendering drop zones.
            this._addDropZone(container, index + 1);
        });
    },

    // Update live timer values without rebuilding cards (preserves inline edit focus/typing)
    refreshLiveTimerValues() {
        const container = DOM.elements.partsDisplay;
        if (!container) return;

        state.meetingParts.forEach((part, index) => {
            const partCard = container.querySelector(`.part-card[data-part-index="${index}"]`);
            if (!partCard) return;

            const elapsed = state.elapsedTimes[index] || 0;
            const progressPercent = Math.min(100, (elapsed / part.duration) * 100);
            let progressColor = 'bg-blue-500';
            if (progressPercent >= 90) {
                progressColor = 'bg-red-500';
            } else if (progressPercent >= 75) {
                progressColor = 'bg-yellow-500';
            }

            const progressBar = partCard.querySelector('[data-role="part-progress"]');
            if (progressBar) {
                progressBar.style.width = `${progressPercent}%`;
                progressBar.classList.remove('bg-blue-500', 'bg-yellow-500', 'bg-red-500');
                progressBar.classList.add(progressColor);
            }

            const elapsedLabel = partCard.querySelector('[data-role="part-elapsed"]');
            if (elapsedLabel) {
                elapsedLabel.textContent = formatTime(elapsed);
            }

            const countdownLabel = partCard.querySelector('[data-role="part-countdown"]');
            if (countdownLabel) {
                countdownLabel.textContent = formatTimeWithSign(part.duration - elapsed);
            }

            const commentLabel = partCard.querySelector(`#currentComment-${index}`);
            if (commentLabel) {
                let commentDuration = 0;
                if (state.activeComment && state.activeComment.partIndex === index) {
                    commentDuration = (state.elapsedTimes[index] || 0) - state.activeComment.startElapsed;
                    commentDuration = Math.max(0, commentDuration);
                }
                commentLabel.textContent = formatTime(commentDuration);
            }
        });

        if (state.activeComment && state.activeComment.partIndex === state.activePart) {
            const activeCard = container.querySelector(`.part-card[data-part-index="${state.activePart}"]`);
            const decrementButton = activeCard
                ? activeCard.querySelector('button[data-action="adjust-comment"][data-adjust="-5"]')
                : null;
            if (decrementButton) {
                const duration = Math.max(0, (state.elapsedTimes[state.activePart] || 0) - state.activeComment.startElapsed);
                if (duration <= 0) {
                    decrementButton.setAttribute('disabled', '');
                } else {
                    decrementButton.removeAttribute('disabled');
                }
            }
        }
    },
    
    // Add a drop zone for drag and drop
    _addDropZone(container, index) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone my-1';
        dropZone.setAttribute('data-drop-index', index);
        
        // Add drop event listeners
        dropZone.addEventListener('dragover', (e) => {
            const canDrop = !state.isRunning && state.editingPartIndex === null && state.meetingParts.length > 1;
            if (!canDrop) {
                return;
            }
            e.preventDefault();
            dropZone.classList.add('drop-zone-active');
            e.dataTransfer.dropEffect = 'move';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drop-zone-active');
        });
        
        dropZone.addEventListener('drop', (e) => {
            const canDrop = !state.isRunning && state.editingPartIndex === null && state.meetingParts.length > 1;
            if (!canDrop) {
                return;
            }
            e.preventDefault();
            dropZone.classList.remove('drop-zone-active');
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = parseInt(dropZone.getAttribute('data-drop-index'));
            if (Number.isNaN(fromIndex) || Number.isNaN(toIndex)) {
                return;
            }
            
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

// Format seconds as H:MM:SS for meeting-level timer
function formatMeetingTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format seconds as H:MM:SS with sign for countdown/overtime
function formatMeetingTimeWithSign(seconds) {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    return `${isNegative ? '-' : ''}${formatMeetingTime(absSeconds)}`;
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
