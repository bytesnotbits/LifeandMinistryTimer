//---------------------------------------------------------------------------------------------- 
//----------------------------------------------------------------------------------------------
// BEGIN DOM CACHE
const DOM = {
    partsTemplate: null,
    partsDisplay: null,
    commentHistory: null,
    globalCommentCount: null,
    globalAverageDuration: null,
    init() {
        this.partsTemplate = document.getElementById('partsTemplate');
        this.partsDisplay = document.getElementById('partsDisplay');
        this.commentHistory = document.getElementById('commentHistory');
        this.globalCommentCount = document.getElementById('globalCommentCount');
        this.globalAverageDuration = document.getElementById('globalAverageDuration');
    }
};

// END DOM CACHE
//----------------------------------------------------------------------------------------------  
//----------------------------------------------------------------------------------------------        
// BEGIN UTILITY FUNCTIONS
        
// This function throttles the execution of a function to a specified limit
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// This function tracks errors and logs them to the console
function trackError(fn, context = 'unknown') {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            console.error(`Error in ${context}:`, error);
            // You could add additional error handling here, like sending to an error tracking service
            throw error; // Re-throw to maintain original behavior
        }
    };
}

// This function sanitizes input to prevent XSS attacks
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

// This function formats the time in minutes and seconds
function formatTime(seconds) {
    // Add NaN protection
    const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
    const mins = Math.floor(Math.abs(safeSeconds) / 60);
    const secs = Math.abs(safeSeconds) % 60;
    const sign = safeSeconds < 0 ? '-' : '';
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
}

// This function calculates the total number of comments and the average duration of comments for a given part
function getPartStatistics(partIndex) {
    const partComments = comments.filter(comment => comment.partIndex === partIndex);
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

// END UTILITY FUNCTIONS
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN PROGRESS MANAGEMENT

// Cache progress calculations
const progressCache = {
    lastUpdate: {},
    getProgressInfo(elapsed, duration, partIndex) {
        const cacheKey = `${elapsed}-${duration}-${partIndex}`;
        if (this.lastUpdate[partIndex] === cacheKey) {
            return this.lastUpdate[`${partIndex}-result`];
        }

        const progress = Math.min((elapsed / duration) * 100, 100);
        const timeRemaining = duration - elapsed;
        let color = 'bg-blue-500';
        
        if (timeRemaining <= duration * 0.1 && timeRemaining > 0) {
            color = 'bg-yellow-500';
        } else if (timeRemaining <= 0) {
            color = 'bg-red-500';
        }

        const result = { progress, color };
        this.lastUpdate[partIndex] = cacheKey;
        this.lastUpdate[`${partIndex}-result`] = result;
        return result;
    }
};

function getProgressInfo(elapsed, duration, partIndex = null) {
    // Use cache if partIndex is provided
    if (partIndex !== null) {
        return progressCache.getProgressInfo(elapsed, duration, partIndex);
    }

    // Fallback for cases where partIndex isn't provided
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
 
// END PROGRESS MANAGEMENT
//----------------------------------------------------------------------------------------------        
//----------------------------------------------------------------------------------------------
// BEGIN PERFORMANCE MONITOR OBJECT DEFINITION

const performanceMonitor = {
    renderTimes: new Map(), // Using Map for better performance
    maxSamples: 100,
    warningThreshold: 16.67, // 60fps threshold in ms
    
    logRenderTime(startTime, operation) {
        const duration = Date.now() - startTime;
        
        if (!this.renderTimes.has(operation)) {
            this.renderTimes.set(operation, []);
        }
        const times = this.renderTimes.get(operation);
        
        times.push(duration);
        
        if (times.length > this.maxSamples) {
            times.shift();
        }
        
        if (duration > this.warningThreshold) {
            console.warn(`Slow ${operation} render: ${duration}ms`);
            this.logPerformanceData(operation);
        }
    },
    
    getAverageRenderTime(operation) {
        const times = this.renderTimes.get(operation);
        if (!times || times.length === 0) return 0;
        
        const sum = times.reduce((acc, curr) => acc + curr, 0);
        return sum / times.length;
    },
    
    logPerformanceData(operation) {
        const times = this.renderTimes.get(operation);
        if (!times) return;
        
        const avg = this.getAverageRenderTime(operation);
        const max = Math.max(...times);
        const min = Math.min(...times);
        
        console.group(`Performance data for ${operation}`);
        console.log(`Average: ${avg.toFixed(2)}ms`);
        console.log(`Max: ${max}ms`);
        console.log(`Min: ${min}ms`);
        console.log(`Samples: ${times.length}`);
        console.groupEnd();
    }
};

// END PERFORMANCE MONITOR OBJECT DEFINITION
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN RENDER OBJECT

const render = {
    template: function() {
        if (!DOM.partsTemplate) return;
        const template = meetingParts.map((part, index) => renderPartTemplate(part, index)).join('');
        if (DOM.partsTemplate.innerHTML !== template) {
            DOM.partsTemplate.innerHTML = template;
        }
    },

    timerDisplay: function() {
        if (!DOM.partsDisplay) return;
        const display = meetingParts.map((part, index) => renderTimerDisplay(part, index)).join('');
        if (DOM.partsDisplay.innerHTML !== display) {
            DOM.partsDisplay.innerHTML = display;
        }
    },

    comments: function() {
        if (!DOM.commentHistory || !DOM.globalCommentCount || !DOM.globalAverageDuration) return;
        const commentCount = comments.length;
        const averageDuration = commentCount > 0 
            ? Math.floor(comments.reduce((a, b) => a + b.duration, 0) / commentCount)
            : 0;

        DOM.globalCommentCount.textContent = commentCount;
        DOM.globalAverageDuration.textContent = formatTime(averageDuration);

        const historyHTML = renderCommentHistory();
        if (DOM.commentHistory.innerHTML !== historyHTML) {
            DOM.commentHistory.innerHTML = historyHTML;
        }
},

timerControls: function() {
    // Update the timer controls (e.g., Start/Stop button text when the website returns to the foreground)
    const timerButton = document.querySelector('[aria-label="Start timer"], [aria-label="Stop timer"]');
    if (timerButton) {
        timerButton.textContent = isRunning ? 'Stop' : 'Start';
        timerButton.setAttribute('aria-label', isRunning ? 'Stop timer' : 'Start timer');
    }
}
};

function renderPartTemplate(part, index) {
    return `
        <div class="flex items-center space-x-2" role="group" aria-label="Meeting part ${index + 1}">
            <div class="flex-1 grid grid-cols-3 gap-2">
                ${renderPartInput('part-name', index, part.name, 'Part Name', 'Name for part')}
                ${renderPartInput('part-duration', index, part.duration / 60, 'Minutes', 'Duration in minutes for part', 'number', 'min="0"')}
                ${renderPartInput('part-speaker', index, part.speaker, 'Speaker', 'Speaker name for part')}
                ${renderCommentsCheckbox(part, index)}
            </div>
            ${renderMoveButton(index, -1, 'Move part up', '↑')}
            ${renderMoveButton(index, 1, 'Move part down', '↓')}
            ${renderRemoveButton(index)}
        </div>
    `;
}

function renderPartInput(idPrefix, index, value, placeholder, ariaLabel, type = 'text', extraAttributes = '') {
    return `
        <div class="flex flex-col">
            <label for="${idPrefix}-${index}" class="sr-only">${placeholder}</label>
            <input
                id="${idPrefix}-${index}"
                type="${type}"
                value="${sanitizeInput(value)}"
                onchange="updatePart(${index}, '${idPrefix.split('-')[1]}', this.value)"
                placeholder="${placeholder}"
                class="px-3 py-2 border rounded"
                aria-label="${ariaLabel} ${index + 1}"
                ${extraAttributes}
            />
        </div>
    `;
}

function renderCommentsCheckbox(part, index) {
    return `
        <div class="flex flex-col">
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
        </div>
    `;
}

function renderMoveButton(index, direction, ariaLabel, symbol) {
    const disabled = (direction === -1 && index === 0) || (direction === 1 && index === meetingParts.length - 1);
    return `
        <button 
            onclick="movePart(${index}, ${direction})" 
            ${disabled ? 'disabled' : ''} 
            class="px-3 py-2 bg-gray-200 rounded"
            aria-label="${ariaLabel} ${index + 1}"
            ${disabled ? 'aria-disabled="true"' : ''}>
            ${symbol}
        </button>
    `;
}

function renderRemoveButton(index) {
    return `
        <button 
            onclick="removePart(${index})" 
            class="px-3 py-2 bg-gray-200 rounded"
            aria-label="Remove part ${index + 1}">
            ×
        </button>
    `;
}

function renderTimerDisplay(part, index) {
    const elapsed = elapsedTimes[index] || 0;
    const { progress, color } = getProgressInfo(elapsed, part.duration, index);
    return `
        <div class="p-4 border rounded-lg part-card ${activePart === index ? 'border-blue-500' : 'border-gray-200'}"
             onclick="selectPart(${index})"
             role="region"
             aria-label="Timer for ${sanitizeInput(part.name)}"
             aria-selected="${activePart === index}">
            ${renderTimerHeader(part, index)}
            ${renderProgressBar(part, elapsed, progress, color)}
            ${part.enableComments ? renderCommentControls(index) : ''}
            ${activePart === index ? renderTimerControls() : ''}
        </div>
    `;
}

function renderTimerHeader(part, index) {
    return `
        <div class="flex justify-between mb-2">
            <div class="flex items-center gap-2">
                <span class="font-medium">${sanitizeInput(part.name)}</span>
                ${part.enableComments ? renderPartStatistics(index) : ''}
            </div>
            <span aria-label="Speaker">${sanitizeInput(part.speaker)}</span>
        </div>
    `;
}

function renderPartStatistics(index) {
    const stats = getPartStatistics(index);
    return stats ? 
        `<span class="text-sm text-gray-600">
            (${stats.count} comments, avg ${formatTime(stats.average)})
        </span>` : 
        '';
}

function renderProgressBar(part, elapsed, progress, color) {
    return `
        <div class="h-8 bg-gray-200 rounded-full overflow-hidden relative progress-bar"
             role="progressbar"
             aria-valuemin="0"
             aria-valuemax="${part.duration}"
             aria-valuenow="${elapsed}"
             aria-label="Progress for ${sanitizeInput(part.name)}">
            <div class="h-full ${color} progress-bar absolute" style="width: ${progress}%">
                <span class="absolute left-2 text-white">${formatTime(elapsed)}</span>
            </div>
            <span class="countdown absolute right-2 text-black font-medium" 
                  aria-label="Time remaining">
                ${formatTime(part.duration - elapsed)}
            </span>
        </div>
    `;
}

function renderCommentControls(index) {
    return `
        <div class="mt-4 space-y-2">
            <div class="flex items-center gap-2">
                <button onclick="event.stopPropagation(); toggleComment(${index})" 
                    class="px-4 py-2 ${activeComment?.partIndex === index ? 'bg-red-500' : 'bg-purple-500'} text-white rounded"
                    aria-label="${activeComment?.partIndex === index ? 'Stop comment' : 'Start comment'}">
                    ${activeComment?.partIndex === index ? 'Stop Comment' : 'Start Comment'}
                </button>
                <span id="currentComment-${index}" 
                      class="text-sm ${activeComment ? '' : 'invisible'}"
                      aria-live="polite"
                      role="timer">
                    ${activeComment ? formatTime((elapsedTimes[index] || 0) - activeComment.startElapsed) : '0:00'}
                </span>
            </div>
        </div>
    `;
}

function renderTimerControls() {
    return `
        <div class="mt-4 flex space-x-2">
            <button onclick="event.stopPropagation(); toggleTimer()" 
                    class="px-4 py-2 ${isRunning ? 'bg-red-500' : 'bg-blue-500'} text-white rounded hover:bg-blue-600"
                    aria-label="${isRunning ? 'Stop timer' : 'Start timer'}">
                ${isRunning ? 'Stop' : 'Start'}
            </button>
            <button onclick="event.stopPropagation(); startNextPart()" 
                    class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    aria-label="Begin next part">
                Begin Next Part
            </button>
        </div>
    `;
}

function renderCommentHistory() {
    const groupedComments = comments.reduce((acc, comment) => {
        const partName = comment.partName || 'Unknown Part';
        if (!acc[partName]) {
            acc[partName] = [];
        }
        acc[partName].push(comment);
        return acc;
    }, {});

    return Object.entries(groupedComments).map(([partName, partComments]) => `
        <div class="mb-4">
            <h3 class="font-semibold text-gray-700 mb-2">${sanitizeInput(partName)}</h3>
            ${partComments.map((comment, i) => renderComment(comment, i)).join('')}
        </div>
    `).join('');
}

function renderComment(comment, index) {
    return `
        <div class="bg-white p-2 rounded shadow-sm mb-2">
            <div class="flex justify-between text-sm">
                <span>Comment ${index + 1}</span>
                <span>${formatTime(comment.duration)}</span>
            </div>
            <div class="text-xs text-gray-500">
                ${new Date(comment.timestamp).toLocaleTimeString()}
            </div>
        </div>
    `;
}

// END RENDER OBJECT       
//----------------------------------------------------------------------------------------------
//BEGIN VISIBILITY MANAGEMENT
/*
The hiddenStartTime variable records the time when the page becomes hidden.
When the page becomes visible again, the hiddenDuration is calculated as the difference between the current time and hiddenStartTime.
The hiddenDuration is added to the elapsed time for the active part.
The resumeTimer function is called to resume the timer if it was running before the page became hidden.
This should ensure that the timer accounts for the time the page was not visible and continues correctly when the user returns to the webpage.
*/

let hiddenStartTime = null;

document.addEventListener('visibilitychange', handleVisibilityChange);

function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        hiddenStartTime = Date.now();
    } else if (document.visibilityState === 'visible' && isRunning) {
        const hiddenDuration = Math.round((Date.now() - hiddenStartTime) / 1000); // Convert to seconds and round
        if (activePart !== null) {
            elapsedTimes[activePart] = (elapsedTimes[activePart] || 0) + hiddenDuration;
            render.timerDisplay();
        }
        resumeTimer();
    }
}

function resumeTimer() {
    if (activePart !== null) {
        startTimer();
    }
}

function startTimer() {
    if (activePart !== null) {
        isRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        render.timerControls();
    }
}

function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    render.timerControls();
}

function toggleTimer() {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
}

function updateTimer() {
    if (activePart !== null) {
        elapsedTimes[activePart] = (elapsedTimes[activePart] || 0) + 1;
        render.timerDisplay();
    }
}

//END VISIBILITY MANAGEMENT
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//BEGIN PERFORMANCE MONITORING CODE
        
 // Update render methods to include performance monitoring
Object.keys(render).forEach(key => {
    const originalMethod = render[key];
    render[key] = function(...args) {
        const startTime = Date.now();
        const result = originalMethod.apply(this, args);
        performanceMonitor.logRenderTime(startTime, key);
        return result;
    };
});

// Add performance monitoring to key functions
    ['toggleTimer', 'startNextPart', 'toggleComment'].forEach(fnName => {
        const originalFn = window[fnName];
        window[fnName] = trackError(function(...args) {
            const startTime = Date.now();
            const result = originalFn.apply(this, args);
            performanceMonitor.logRenderTime(fnName, startTime);
            return result;
        }, fnName);
    });
    
    // Add periodic performance logging
    setInterval(() => {
        if (isRunning) {
            Object.keys(render).forEach(key => {
                performanceMonitor.logPerformanceData(key);
            });
        }
    }, 60000); // Log every minute while running

// Add debounced save function to reduce storage operations
const debouncedSave = (function() {
    let timeout;
    return function(data, key) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
            }
        }, 1000); // Wait 1 second after last change before saving
    };
})();

//END PERFORMANCE MONITORING CODE
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//BEGIN CONSTANTS AND STATE
        
    const DEFAULT_PARTS = [
        { name: 'Opening Comments', duration: 180, speaker: '', enableComments: false },
        { name: 'Treasures', duration: 600, speaker: '', enableComments: false },
        { name: 'Spiritual Gems', duration: 600, speaker: '', enableComments: true},
        { name: 'Bible Reading', duration: 300, speaker: '', enableComments: false },
        { name: 'Apply yourself 1', duration: 180, speaker: '', enableComments: false },
        { name: 'Apply yourself 2', duration: 180, speaker: '', enableComments: false },
        { name: 'Student Talk', duration: 300, speaker: '', enableComments: false },
        { name: 'CBS', duration: 1800, speaker: '', enableComments: false }
   ];
        const COMMENT_LIMIT = 240; // 4 minutes in seconds
        
        let meetingParts = [];
        let activePart = 0;
        let isRunning = false;
        let elapsedTimes = {};
        let timerInterval = null;
        let commentInterval = null;
        // Comment Management
        let comments = JSON.parse(localStorage.getItem('meetingComments')) || [];
        let activeComment = null;

//END CONSTANTS AND STATE
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN STATE MANAGEMENT

function saveState() {
    localStorage.setItem('elapsedTimes', JSON.stringify(elapsedTimes));
    localStorage.setItem('activePart', activePart);
}

function loadState() {
    const savedTimes = localStorage.getItem('elapsedTimes');
    if (savedTimes) {
        elapsedTimes = JSON.parse(savedTimes);
    }
    activePart = parseInt(localStorage.getItem('activePart')) || 0;
}

function saveTemplate() {
    localStorage.setItem('meetingTemplate', JSON.stringify(meetingParts));
}

function loadTemplate() {
    const saved = localStorage.getItem('meetingTemplate');
    meetingParts = saved ? JSON.parse(saved) : DEFAULT_PARTS;
    activePart = meetingParts.length > 0 ? 0 : null;
    render.template();
    render.timerDisplay();
}

function resetData() {
    elapsedTimes = {};
    comments = [];
    activeComment = null;
    localStorage.removeItem('meetingComments');
    render.comments();
    activePart = null;
    isRunning = false;
    clearInterval(timerInterval);
    clearInterval(commentInterval);
    commentInterval = null;
    render.timerDisplay();
}

function clearLocalStorage() {
    localStorage.removeItem('meetingTemplate');
    meetingParts = DEFAULT_PARTS;
    resetData();
    render.template();
    render.timerDisplay();
}

// END STATE MANAGEMENT
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN TEMPLATE MANAGEMENT

function addPart() {
    meetingParts.push({ 
        name: '', 
        duration: 180, 
        speaker: '', 
        enableComments: false
    });
    saveTemplate();
    render.template();
    render.timerDisplay();
}

function updatePart(index, field, value) {
    if (field === 'duration') {
        value = Math.round(Math.max(0, parseFloat(value) || 0) * 60); // Convert minutes to seconds
    } else if (field === 'enableComments') {
        value = Boolean(value); // Ensure boolean type
    } else {
        value = sanitizeInput(value);
    }
    meetingParts[index][field] = value;
    saveTemplate();
    render.template();
    render.timerDisplay();
}

function movePart(index, direction) {
    if ((direction === -1 && index === 0) || (direction === 1 && index === meetingParts.length - 1)) return;
    const newIndex = index + direction;

    // Swap parts
    [meetingParts[index], meetingParts[newIndex]] = [meetingParts[newIndex], meetingParts[index]];

    // Swap elapsed times
    const tempElapsed = elapsedTimes[index];
    elapsedTimes[index] = elapsedTimes[newIndex];
    elapsedTimes[newIndex] = tempElapsed;

    // Update activePart if moved
    if (activePart === index) {
        activePart = newIndex;
    } else if (activePart === newIndex) {
        activePart = index;
    }

    saveTemplate();
    saveState();
    render.template();
    render.timerDisplay();
}

function removePart(index) {
    meetingParts.splice(index, 1);

    // Adjust elapsedTimes indices
    const newElapsedTimes = {};
    Object.keys(elapsedTimes).forEach(key => {
        const numKey = parseInt(key, 10);
        if (numKey < index) newElapsedTimes[numKey] = elapsedTimes[key];
        else if (numKey > index) newElapsedTimes[numKey - 1] = elapsedTimes[key];
    });
    elapsedTimes = newElapsedTimes;

    // Adjust activePart
    if (activePart >= index) {
        activePart = meetingParts.length === 0 ? null : Math.max(0, activePart - 1);
    }

    saveTemplate();
    saveState();
    render.template();
    render.timerDisplay();
}
        
// END TEMPLATE MANAGEMENT
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN TIMER AND COMMENT CONTROLS

function toggleTimer() {
    if (activePart === null) {
        activePart = 0;
        elapsedTimes[activePart] = elapsedTimes[activePart] || 0;
    }

    isRunning = !isRunning;

    if (isRunning) {
        timerInterval = setInterval(updateTimer, 1000);
    } else {
        clearInterval(timerInterval);
        // Stop active comment if exists
        if (activeComment) {
            const partIndex = activeComment.partIndex;
            const duration = elapsedTimes[partIndex] - activeComment.startElapsed;
            if (duration >= 5) {
                const finalDuration = Math.min(duration, COMMENT_LIMIT);
                comments.push({
                    duration: finalDuration,
                    timestamp: Date.now(),
                    partName: meetingParts[partIndex].name
                });
                localStorage.setItem('meetingComments', JSON.stringify(comments));
                render.comments();
            }
            clearInterval(commentInterval);
            activeComment = null;
            render.timerDisplay();
        }
    }
    render.timerDisplay();
}

function updateTimer() {
    if (activePart === null) return;
    elapsedTimes[activePart] = (elapsedTimes[activePart] || 0) + 1;
    render.timerDisplay();
}

function startNextPart() {
    if (activePart === null || activePart >= meetingParts.length - 1) return;
    activePart++;
    if (!isRunning) toggleTimer();
    render.timerDisplay();
}

function selectPart(index) {
    if (isRunning) {
        alert('Cannot switch parts while timer is active!');
        return;
    }
    activePart = index;
    render.timerDisplay();
}

function toggleComment(partIndex) {
    if (activePart !== partIndex || !isRunning) {
        alert('Part timer must be running to record comments!');
        return;
    }

    if (activeComment) {
        // Calculate duration based on elapsed time
        const duration = elapsedTimes[partIndex] - activeComment.startElapsed;

/*        if (duration < 5) {
            alert('Comment too short!');
            return;
            
        }
*/

        const finalDuration = Math.min(duration, COMMENT_LIMIT);
        comments.push({
            duration: finalDuration,
            timestamp: Date.now(),
            partName: meetingParts[partIndex].name,
            partIndex: partIndex  // Track which part the comment was made on
        });
        localStorage.setItem('meetingComments', JSON.stringify(comments));
        activeComment = null;
        clearInterval(commentInterval);
        render.comments();
    } else {
        activeComment = {
            startElapsed: elapsedTimes[partIndex] || 0,
            partIndex: partIndex
        };
        commentInterval = setInterval(() => {
            const currentElement = document.getElementById(`currentComment-${partIndex}`);
            if (currentElement) {
                const currentElapsed = elapsedTimes[partIndex] || 0;
                const commentDuration = currentElapsed - activeComment.startElapsed;
                currentElement.textContent = formatTime(Math.max(0, commentDuration));
            }
        }, 200);
    }
    render.timerDisplay();
}

// END TIMER AND COMMENT CONTROLS
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN APPLICATION LIFECYCLE MANAGEMENT

function cleanupResources() {
    // Clear all intervals
    clearInterval(timerInterval);
    clearInterval(commentInterval);
    
    // Clear performance monitoring data
    performanceMonitor.renderTimes.clear();
    
    // Save state before cleanup
    if (isRunning) {
        saveState();
    }
}

function initializeApplication() {
    // Initialize DOM cache
    DOM.init();
    
    // Load saved data
    loadTemplate();
    loadState();
    
    // Initialize UI
    render.comments();
    render.timerDisplay();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            toggleTimer();
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApplication);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cleanupResources();
    }
});

window.addEventListener('beforeunload', (e) => {
    cleanupResources();
    if (isRunning) {
        e.preventDefault();
        e.returnValue = '';
    }
});

window.addEventListener('error', (event) => {
    console.error('Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // Attempt recovery
    try {
        resetData();
        render.template();
        render.timerDisplay();
        alert('An error occurred. The application has been reset.');
    } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        alert('Application error. Please refresh the page.');
    }
});
  
// END APPLICATION LIFECYCLE MANAGEMENT
//---------------------------------------------------------------------------------------------- 