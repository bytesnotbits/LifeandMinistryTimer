//---------------------------------------------------------------------------------------------- 
//----------------------------------------------------------------------------------------------
// BEGIN DOM CACHE
const DOM = {
    init() {
        // Initialize DOM cache with null checks
        // This prevents null reference errors if elements are missing from the HTML
        this.partsTemplate = document.getElementById('partsTemplate') || null;
        this.partsDisplay = document.getElementById('partsDisplay') || null;
        this.commentHistory = document.getElementById('commentHistory') || null;
        this.globalCommentCount = document.getElementById('globalCommentCount') || null;
        this.globalAverageDuration = document.getElementById('globalAverageDuration') || null;
        
        // Log warning for missing elements
        if (!this.partsTemplate) console.warn('Element #partsTemplate not found');
        if (!this.partsDisplay) console.warn('Element #partsDisplay not found');
        if (!this.commentHistory) console.warn('Element #commentHistory not found');
        if (!this.globalCommentCount) console.warn('Element #globalCommentCount not found');
        if (!this.globalAverageDuration) console.warn('Element #globalAverageDuration not found');
    }
};

// END DOM CACHE
//----------------------------------------------------------------------------------------------  
//----------------------------------------------------------------------------------------------        
// BEGIN UTILITY FUNCTIONS
  // Increments the timer by 5 seconds (Modified so that the increment/decrement functions are flexible enough to handle both types of parameters.)
  function incrementTimer(param) {
    let index;
    if (typeof param === 'number') {
        index = param;
    } else {
        // Find the closest timer-item parent to get index
        const timerItem = param.closest('.timer-item');
        const allTimerItems = Array.from(document.querySelectorAll('.timer-item'));
        index = allTimerItems.indexOf(timerItem);
    }
    
    if (index < 0 || index >= meetingParts.length) return; // Check bounds
    const maxDuration = meetingParts[index].duration; // Get the maximum duration
    elapsedTimes[index] = Math.min((elapsedTimes[index] || 0) + 5, maxDuration); // Increment by 5 seconds
    render.timerDisplay(); // Render the timer display
}

// Decrements the timer by 5 seconds
function decrementTimer(param) {
    let index;
    if (typeof param === 'number') {
        index = param;
    } else {
        // Find the closest timer-item parent to get index
        const timerItem = param.closest('.timer-item');
        const allTimerItems = Array.from(document.querySelectorAll('.timer-item'));
        index = allTimerItems.indexOf(timerItem);
    }
    
    if (index < 0 || index >= meetingParts.length) return; // Check bounds
    elapsedTimes[index] = Math.max((elapsedTimes[index] || 0) - 5, 0); // Decrement by 5 seconds
    render.timerDisplay(); // Render the timer display
}

// Throttles the execution of a function to a specified limit
function throttle(func, limit) {
    let inThrottle; // Flag to track throttling
    return function(...args) {
        if (!inThrottle) { // If not throttling
            func.apply(this, args); // Execute the function
            inThrottle = true; // Set throttling flag
            setTimeout(() => inThrottle = false, limit); // Reset throttling after limit
        } // Otherwise, ignore the call
    }; // Return the throttled function
}

// Tracks errors and logs them to the console
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

// Sanitizes input to prevent XSS attacks
function sanitizeInput(input) {
    if (typeof input !== 'string') return input; // Return input if not a string
    return input // Otherwise, sanitize the input
        .replace(/&/g, '&amp;') // Replace special characters
        .replace(/</g, '&lt;')  // Replace less than
        .replace(/>/g, '&gt;') // Replace greater than
        .replace(/"/g, '&quot;') // Replace double quotes
        .replace(/'/g, '&#039;') // Replace single quotes
        .trim(); // Trim whitespace
}

// Formats the time in minutes and seconds
function formatTime(seconds) {
    // Add NaN protection
    const safeSeconds = Number.isFinite(seconds) ? seconds : 0; // Convert NaN to 0
    const mins = Math.floor(Math.abs(safeSeconds) / 60); // Get the whole minutes
    const secs = Math.abs(safeSeconds) % 60; // Get the remainder
    const sign = safeSeconds < 0 ? '-' : ''; // Add sign for negative times
    return `${sign}${mins}:${secs.toString().padStart(2, '0')}`; // Format as MM:SS
}

// Calculates the total number of comments and the average duration of comments for a given part
function getPartStatistics(partIndex) {
    // Filter comments for the specified part
    const partComments = comments.filter(comment => comment.partIndex === partIndex); // Filter by partIndex
    if (partComments.length === 0) return null; // Return null if no comments
    
    // Calculate total comments and average duration
    const totalComments = partComments.length; // Total number of comments
    const averageDuration = Math.floor( // Round down to nearest second
        partComments.reduce((sum, comment) => sum + comment.duration, 0) / totalComments // Average duration
    );
    
    return {
        // Return the total number of comments and the average duration
        count: totalComments,
        average: averageDuration
    };
}

function renderTimerDisplay(part, index) {
    const elapsed = elapsedTimes[index] || 0;
    const { progress, color } = getProgressInfo(elapsed, part.duration, index);
    return `
        <div class="p-4 border rounded-lg part-card timer-item ${activePart === index ? 'border-blue-500' : 'border-gray-200'}"
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

// END UTILITY FUNCTIONS
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN PROGRESS MANAGEMENT

// Cache progress calculations
const progressCache = {
    // Cache for progress calculations
    lastUpdate: {},
    getProgressInfo(elapsed, duration, partIndex) { // Get progress info for a part
        // Check cache for existing result
        const cacheKey = `${elapsed}-${duration}-${partIndex}`; // Create cache key
        if (this.lastUpdate[partIndex] === cacheKey) { // If cache key matches
            return this.lastUpdate[`${partIndex}-result`]; // Return cached result
        } // Otherwise, calculate progress and color
        
        const progress = Math.min((elapsed / duration) * 100, 100); // Calculate progress
        const timeRemaining = duration - elapsed; // Calculate time remaining
        let color = 'bg-blue-500'; // Default color
        
        // Update color based on time remaining
        if (timeRemaining <= duration * 0.1 && timeRemaining > 0) { // Less than 10% time remaining
            color = 'bg-yellow-500'; // Change to yellow
        } else if (timeRemaining <= 0) { // Time is up
            color = 'bg-red-500'; // Change to red
        }

        const result = { progress, color }; // Create result object
        this.lastUpdate[partIndex] = cacheKey; // Update cache key
        this.lastUpdate[`${partIndex}-result`] = result; // Update cached result
        return result; // Return the result
    }
};

function getProgressInfo(elapsed, duration, partIndex = null) { // Get progress info for a part
    if (partIndex !== null) { // If partIndex is provided
        return progressCache.getProgressInfo(elapsed, duration, partIndex); // Use cached calculation
    } // Otherwise, calculate progress and color

    // Fallback for cases where partIndex isn't provided
    const progress = Math.min((elapsed / duration) * 100, 100); // Calculate progress
    const timeRemaining = duration - elapsed; // Calculate time remaining
    let color = 'bg-blue-500'; // Default color
    
    if (timeRemaining <= duration * 0.1 && timeRemaining > 0) { // Less than 10% time remaining
        color = 'bg-yellow-500'; // Change to yellow
    } else if (timeRemaining <= 0) { // Time is up
        color = 'bg-red-500'; // Change to red
    }

    return { progress, color };
}
 
// END PROGRESS MANAGEMENT
//----------------------------------------------------------------------------------------------        
//----------------------------------------------------------------------------------------------
// BEGIN PERFORMANCE MONITOR OBJECT DEFINITION

const performanceMonitor = {
    // Performance monitoring object
    renderTimes: new Map(), // Using Map for better performance
    maxSamples: 100, // Maximum number of samples to store
    warningThreshold: 16.67, // 60fps threshold in ms
    
    logRenderTime(startTime, operation) { // Log the render time for an operation
        const duration = Date.now() - startTime; // Calculate the duration
        
        if (!this.renderTimes.has(operation)) { // If operation doesn't exist
            this.renderTimes.set(operation, []); // Create a new entry
        }
        const times = this.renderTimes.get(operation); // Get the render times
        
        times.push(duration); // Add the duration to the list of render times
        if (times.length > this.maxSamples) { // If the list is too long
            times.shift(); // Remove the oldest sample
        } // Log warning for slow renders
        
        if (duration > this.warningThreshold) { // If duration exceeds warning threshold
            console.warn(`Slow ${operation} render: ${duration}ms`); // Log a warning
            this.logPerformanceData(operation); // Log performance data
        } // Log the render time
    },
    
    getAverageRenderTime(operation) { // Calculate the average render time for an operation
        const times = this.renderTimes.get(operation); // Get the render times
        if (!times || times.length === 0) return 0; // Return 0 if no times
        
        const sum = times.reduce((acc, curr) => acc + curr, 0); // Calculate the sum
        return sum / times.length; // Return the average
    },
    
    logPerformanceData(operation) { // Log performance data for an operation
        const times = this.renderTimes.get(operation); // Get the render times
        if (!times) return; // Return if no times
        
        const avg = this.getAverageRenderTime(operation); // Calculate the average
        const max = Math.max(...times); // Calculate the maximum
        const min = Math.min(...times); // Calculate the minimum
        
        console.group(`Performance data for ${operation}`); // Log performance data
        console.log(`Average: ${avg.toFixed(2)}ms`); // Log the average
        console.log(`Max: ${max}ms`); // Log the maximum
        console.log(`Min: ${min}ms`); // Log the minimum
        console.log(`Samples: ${times.length}`); // Log the number of samples
        console.groupEnd(); // End the group
    } // Log the performance data
};

// END PERFORMANCE MONITOR OBJECT DEFINITION
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN RENDER OBJECT

const render = { // Render object for updating the UI
    template: function() { // Update the template for meeting parts
        if (!DOM.partsTemplate) return; // Return if template element doesn't exist
        const template = meetingParts.map((part, index) => renderPartTemplate(part, index)).join(''); // Generate the template
        if (DOM.partsTemplate.innerHTML !== template) { // If the content has changed
            DOM.partsTemplate.innerHTML = template; // Update the template
        }
    },

    timerDisplay: function() { // Update the timer display for meeting parts
        if (!DOM.partsDisplay) return; // Return if display element doesn't exist
        const display = meetingParts.map((part, index) => renderTimerDisplay(part, index)).join('');  // Generate the display
        if (DOM.partsDisplay.innerHTML !== display) { // If the content has changed
            DOM.partsDisplay.innerHTML = display; // Update the display
        }
    },

    comments: function() { // Update the comments and comment history
        if (!DOM.commentHistory || !DOM.globalCommentCount || !DOM.globalAverageDuration) return; // Return if elements don't exist
        const commentCount = comments.length; // Get the total number of comments
        const averageDuration = commentCount > 0 // If there are comments
            ? Math.floor(comments.reduce((a, b) => a + b.duration, 0) / commentCount) // Calculate the average
            : 0; // Otherwise, set to 0

        DOM.globalCommentCount.textContent = commentCount; // Update the comment count
        DOM.globalAverageDuration.textContent = formatTime(averageDuration); // Update the average duration

        const historyHTML = renderCommentHistory(); // Generate the comment history
        // Only update if the content has changed to prevent unnecessary reflows
        if (DOM.commentHistory.innerHTML !== historyHTML) { // If the content has changed
            DOM.commentHistory.innerHTML = historyHTML; // Update the comment history
        }
},

timerControls: function() { // Update the timer controls (e.g., Start/Stop button text)
    // Update the timer controls (e.g., Start/Stop button text when the website returns to the foreground)
    const timerButton = document.querySelector('[aria-label="Start timer"], [aria-label="Stop timer"]'); // Find the timer button
    if (timerButton) { // If the button exists
        timerButton.textContent = isRunning ? 'Stop' : 'Start'; // Update the button text
        timerButton.setAttribute('aria-label', isRunning ? 'Stop timer' : 'Start timer'); // Update the button label
    }
}
};

function renderPartTemplate(part, index) { // Render the template for a meeting part
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

function renderPartInput(idPrefix, index, value, placeholder, ariaLabel, type = 'text', extraAttributes = '') { // Render an input field for a meeting part
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

function renderCommentsCheckbox(part, index) { // Render a checkbox to enable comments for a meeting part
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

function renderMoveButton(index, direction, ariaLabel, symbol) { // Render a button to move a meeting part up or down
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

function renderRemoveButton(index) { // Render a button to remove a meeting part
    return `
        <button 
            onclick="removePart(${index})" 
            class="px-3 py-2 bg-gray-200 rounded"
            aria-label="Remove part ${index + 1}">
            ×
        </button>
    `;
}

function renderTimerControls() { // Render the timer controls
    const isLastPart = activePart >= meetingParts.length - 1; // Check if the active part is the last part
    return `
        <div class="mt-4 flex space-x-2">
            <button onclick="event.stopPropagation(); toggleTimer()" 
                    class="px-4 py-2 ${isRunning ? 'bg-red-500' : 'bg-blue-500'} text-white rounded"
                    aria-label="${isRunning ? 'Stop timer' : 'Start timer'}">
                ${isRunning ? 'Stop' : 'Start'}
            </button>
            ${!isLastPart ? `
            <button onclick="event.stopPropagation(); startNextPart()" 
                    class="px-4 py-2 bg-green-500 text-white rounded"
                    aria-label="Begin next part">
                Begin Next Part
            </button>` : ''}
            <button onclick="incrementTimer(activePart)" class="px-2 py-1 bg-green-500 text-white rounded" aria-label="Increment timer by 5 seconds">+5s</button>
            <button onclick="decrementTimer(activePart)" class="px-2 py-1 bg-red-500 text-white rounded" aria-label="Decrement timer by 5 seconds">-5s</button>
        </div>
    `;
}

function renderTimerHeader(part, index) { // Render the header for a meeting part
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

function renderPartStatistics(index) { // Render the statistics for a meeting part
    const stats = getPartStatistics(index); // Get the part statistics
    return stats ? // If statistics exist
        `<span class="text-sm text-gray-600">
            (${stats.count} comments, avg ${formatTime(stats.average)})
        </span>` : 
        '';
}

function renderProgressBar(part, elapsed, progress, color) { // Render the progress bar for a meeting part
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

function renderCommentControls(index) { // Render the comment controls for a meeting part
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

function renderCommentHistory() { // Render the comment history
    const groupedComments = comments.reduce((acc, comment) => { // Group comments by part
        const partName = comment.partName || 'Unknown Part'; // Get the part name
        if (!acc[partName]) { // If the part doesn't exist
            acc[partName] = []; // Create a new array
        }
        acc[partName].push(comment); // Add the comment to the part
        return acc; // Return the accumulator
    }, {}); // Initialize the accumulator

    // Sort comments by timestamp
    return Object.entries(groupedComments).map(([partName, partComments]) => `
        <div class="mb-4">
            <h3 class="font-semibold text-gray-700 mb-2">${sanitizeInput(partName)}</h3>
            ${partComments.map((comment, i) => renderComment(comment, i)).join('')}
        </div>
    `).join(''); // Render the comments
}

function renderComment(comment, index) { // Render a comment\
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

let hiddenStartTime = null; // Variable to store the time when the page becomes hidden

document.addEventListener('visibilitychange', handleVisibilityChange); // Listen for visibility change events

function handleVisibilityChange() { // Function to handle visibility changes
    if (document.visibilityState === 'hidden') { // If the page is hidden
        hiddenStartTime = Date.now(); // Record the time
    } else if (document.visibilityState === 'visible' && isRunning) { // If the page is visible and the timer is running
        const hiddenDuration = Math.round((Date.now() - hiddenStartTime) / 1000); // Convert to seconds and round
        if (activePart !== null) { // If an active part exists
            elapsedTimes[activePart] = (elapsedTimes[activePart] || 0) + hiddenDuration; // Add the hidden duration
            render.timerDisplay(); // Update the timer display
        }
        resumeTimer(); // Resume the timer
    }
}

function resumeTimer() { // Function to resume the timer
    if (activePart !== null) { // If an active part exists
        startTimer(); // Start the timer
    }
}

function startTimer() { // Function to start the timer
    if (activePart !== null) { // If an active part exists
        isRunning = true; // Set the running flag
        timerInterval = setInterval(updateTimer, 1000); // Start the timer interval
        render.timerControls(); // Update the timer controls
    }
}

function stopTimer() { // Function to stop the timer
    isRunning = false; // Clear the running flag
    clearInterval(timerInterval); // Clear the timer interval
    render.timerControls(); // Update the timer controls
}

function toggleTimer() { // Function to toggle the timer
    if (isRunning) { // If the timer is running
        stopTimer(); // Stop the timer
    } else { // Otherwise
        startTimer(); // Start the timer
    }
}

function updateTimer() { // Function to update the timer
    if (activePart !== null) { // If an active part exists
        elapsedTimes[activePart] = (elapsedTimes[activePart] || 0) + 1; // Increment the elapsed time
        render.timerDisplay(); // Update the timer display
    }
}

//END VISIBILITY MANAGEMENT
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//BEGIN PERFORMANCE MONITORING CODE
        
 // Update render methods to include performance monitoring
Object.keys(render).forEach(key => { // Iterate over render methods
    const originalMethod = render[key]; // Get the original method
    render[key] = function(...args) { // Replace the method with a new function
        const startTime = Date.now(); // Record the start time
        const result = originalMethod.apply(this, args); // Call the original method
        performanceMonitor.logRenderTime(startTime, key); // Log the render time
        return result; // Return the result
    };
});

// Add performance monitoring to key functions
['toggleTimer', 'startNextPart', 'toggleComment'].forEach(fnName => { // Iterate over functions
    const originalFn = window[fnName]; // Get the original function
    window[fnName] = trackError(function(...args) { // Replace the function with a new function
        const startTime = Date.now(); // Record the start time
        const result = originalFn.apply(this, args); // Call the original function
        performanceMonitor.logRenderTime(startTime, fnName); // Log the render time (Fixed parameter order)
        return result;
    }, fnName);
});
    
    // Add periodic performance logging
    setInterval(() => { // Set an interval to log performance data
        if (isRunning) { // If the timer is running
            Object.keys(render).forEach(key => { // Iterate over render methods
                performanceMonitor.logPerformanceData(key); // Log performance data
            });
        }
    }, 60000); // Log every minute while running

// Add debounced save function to reduce storage operations
const debouncedSave = (function() { // Create a debounced save function
    let timeout; // Initialize timeout variable
    return function(data, key) { // Return a debounced save function
        clearTimeout(timeout); // Clear the timeout
        timeout = setTimeout(() => { // Set a new timeout
            try { // Try to save the data
                localStorage.setItem(key, JSON.stringify(data)); // Save the data to local storage
            } catch (error) { // Catch any errors
                console.error('Failed to save to localStorage:', error); // Log the error
            } // Save the data
        }, 1000); // Wait 1 second after last change before saving
    };
})(); // Return the debounced save function

//END PERFORMANCE MONITORING CODE
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//BEGIN CONSTANTS AND STATE
        
    const DEFAULT_PARTS = [
        { name: 'Opening Comments', duration: 60, speaker: '', enableComments: false },
        { name: 'Treasures', duration: 600, speaker: '', enableComments: false },
        { name: 'Spiritual Gems', duration: 600, speaker: '', enableComments: true},
        { name: 'Bible Reading', duration: 300, speaker: '', enableComments: false },
        { name: 'Apply yourself 1', duration: 180, speaker: '', enableComments: false },
        { name: 'Apply yourself 2', duration: 180, speaker: '', enableComments: false },
        { name: 'Student Talk', duration: 300, speaker: '', enableComments: false },
        { name: 'CBS', duration: 1800, speaker: '', enableComments: false }
   ];
        const COMMENT_LIMIT = 240; // Limit comments to 4 minutes
        
        let meetingParts = [];
        let activePart = 0;
        let isRunning = false;
        let elapsedTimes = {};
        let timerInterval = null;
        let commentInterval = null;
        
        // Comment Management
        let comments = JSON.parse(localStorage.getItem('meetingComments')) || []; // Load comments from local storage
        let activeComment = null; // Active comment object

//END CONSTANTS AND STATE
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN STATE MANAGEMENT

function saveState() { // Save the current state to local storage
    localStorage.setItem('elapsedTimes', JSON.stringify(elapsedTimes)); // Save elapsed times
    localStorage.setItem('activePart', activePart); // Save active part
} // Save the current state

function loadState() { // Load the previous state from local storage
    const savedTimes = localStorage.getItem('elapsedTimes'); // Get saved elapsed times
    if (savedTimes) { // If saved times exist
        elapsedTimes = JSON.parse(savedTimes); // Parse the saved times
    } // Load the saved times
    activePart = parseInt(localStorage.getItem('activePart')) || 0; // Get the active part
} // Load the previous state

function saveTemplate() { // Save the meeting template to local storage
    localStorage.setItem('meetingTemplate', JSON.stringify(meetingParts)); // Save the meeting template
}

function loadTemplate() { // Load the meeting template from local storage
    const saved = localStorage.getItem('meetingTemplate'); // Get the saved template
    meetingParts = saved ? JSON.parse(saved) : DEFAULT_PARTS; // Parse the saved template or use default
    activePart = meetingParts.length > 0 ? 0 : null; // Set active part to first part or null
    render.template(); // Render the template
    render.timerDisplay(); // Render the timer display
} // Load the meeting template

function resetData() { // Reset all data to default values
    elapsedTimes = {}; // Reset elapsed times
    comments = []; // Reset comments
    activeComment = null; // Reset active comment
    localStorage.removeItem('meetingComments'); // Remove comments from local storage
    render.comments(); // Render the comments
    activePart = null; // Reset active part
    isRunning = false; // Reset running flag
    clearInterval(timerInterval); // Clear the timer interval
    clearInterval(commentInterval); // Clear the comment interval
    commentInterval = null; // Reset comment interval
    render.timerDisplay(); // Render the timer display
}

function clearLocalStorage() { // Clear all data from local storage
    localStorage.removeItem('meetingTemplate'); // Remove the meeting template
    meetingParts = DEFAULT_PARTS; // Reset meeting parts to default
    resetData(); // Reset all data
    render.template(); // Render the template
    render.timerDisplay(); // Render the timer display
}

// END STATE MANAGEMENT
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN TEMPLATE MANAGEMENT

function addPart() { // Add a new part to the meeting template
    meetingParts.push({ // Add a new part to the meeting template
        name: '',   // Initialize with default values
        duration: 180,  // Default duration is 3 minutes
        speaker: '',  // Default speaker is empty
        enableComments: false // Default comments are disabled
    }); // Add a new part
    saveTemplate(); // Save the template
    render.template(); // Render the template
    render.timerDisplay(); // Render the timer display
}

function updatePart(index, field, value) { // Update a part in the meeting template
    if (field === 'duration') { // If the field is duration
        value = Math.round(Math.max(0, parseFloat(value) || 0) * 60); // Convert minutes to seconds
    } else if (field === 'enableComments') { // If the field is enableComments
        value = Boolean(value); // Ensure boolean type
    } else { // Otherwise
        value = sanitizeInput(value); // Sanitize the input
    }
    meetingParts[index][field] = value; // Update the part
    saveTemplate(); // Save the template
    render.template(); // Render the template
    render.timerDisplay(); // Render the timer display
}

function movePart(index, direction) { // Move a part in the meeting template
    if ((direction === -1 && index === 0) || (direction === 1 && index === meetingParts.length - 1)) return; // Check bounds
    const newIndex = index + direction; // Calculate new index

    [meetingParts[index], meetingParts[newIndex]] = [meetingParts[newIndex], meetingParts[index]]; // Swap parts

    // Swap elapsed times
    const tempElapsed = elapsedTimes[index];
    elapsedTimes[index] = elapsedTimes[newIndex];
    elapsedTimes[newIndex] = tempElapsed;

    // Update activePart if moved
    if (activePart === index) { // If active part is moved
        activePart = newIndex; // Update active part
    } else if (activePart === newIndex) { // If active part is moved
        activePart = index; // Update active part
    }

    saveTemplate(); // Save the template
    saveState(); // Save the state
    render.template(); // Render the template
    render.timerDisplay(); // Render the timer display
}

function removePart(index) { // Remove a part from the meeting template
    meetingParts.splice(index, 1); // Remove the part

    // Adjust elapsedTimes indices
    const newElapsedTimes = {}; // Create a new object
    Object.keys(elapsedTimes).forEach(key => { // Iterate over elapsed times
        const numKey = parseInt(key, 10); // Parse the key
        if (numKey < index) newElapsedTimes[numKey] = elapsedTimes[key]; // Update the index
        else if (numKey > index) newElapsedTimes[numKey - 1] = elapsedTimes[key]; // Update the index
    }); // Adjust elapsed times
    elapsedTimes = newElapsedTimes; // Update elapsed times

    // Adjust activePart
    if (activePart >= index) { // If active part is greater than or equal to index
        activePart = meetingParts.length === 0 ? null : Math.max(0, activePart - 1); // Update active part
    }

    saveTemplate(); // Save the template
    saveState(); // Save the state
    render.template(); // Render the template
    render.timerDisplay(); // Render the timer display
}
        
// END TEMPLATE MANAGEMENT
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN TIMER AND COMMENT CONTROLS

function toggleTimer() { // Toggle the timer
    if (activePart === null) { // If no active part
        activePart = 0; // Set active part to first part
        elapsedTimes[activePart] = elapsedTimes[activePart] || 0; // Initialize elapsed time
    } // Set active part and initialize elapsed time

    isRunning = !isRunning; // Toggle running flag

    if (isRunning) { // If timer is running
        timerInterval = setInterval(updateTimer, 1000); // Start the timer interval
    } else { // Otherwise
        clearInterval(timerInterval); // Clear the timer interval
        // Stop active comment if exists
        if (activeComment) { // If active comment exists
            const partIndex = activeComment.partIndex; // Get the part index
            const duration = elapsedTimes[partIndex] - activeComment.startElapsed; // Calculate duration
            if (duration >= 1) { // If duration is at least 1 second
                const finalDuration = Math.min(duration, COMMENT_LIMIT); // Limit duration
                comments.push({ // Add comment to list
                    duration: finalDuration, // Add comment duration
                    timestamp: Date.now(), // Add comment timestamp
                    partName: meetingParts[partIndex].name // Add part name
                }); // Add comment
                localStorage.setItem('meetingComments', JSON.stringify(comments)); // Save comments
                render.comments(); // Render comments
            } // Add comment
            clearInterval(commentInterval); // Clear the comment interval
            activeComment = null; // Reset active comment
            render.timerDisplay(); // Render the timer display
        } // Stop active comment if exists
    } // Toggle running flag
    render.timerDisplay(); // Render the timer display
}

function updateTimer() { // Update the timer
    if (activePart === null) return; // Return if no active part
    elapsedTimes[activePart] = (elapsedTimes[activePart] || 0) + 1; // Increment elapsed time
    render.timerDisplay(); // Render the timer display
}

function startNextPart() { // Start the next part
    if (activePart === null || activePart >= meetingParts.length - 1) return; // Return if no active part or at end
    activePart++; // Increment active part
    if (!isRunning) toggleTimer(); // Start the timer if not running
    render.timerDisplay(); // Render the timer display
}

function selectPart(index) { // Select a part
    if (isRunning) { // If timer is running
        return; // Return without changing active part
    }
    activePart = index; // Set active part
    render.timerDisplay(); // Render the timer display
}

/*
function toggleComment(partIndex) { // Toggle a comment
    if (activePart !== partIndex || !isRunning) { // If part is not active or timer is not running
        return; // Return without toggling comment
    }

    if (activeComment) { // If active comment exists
        // Calculate duration based on elapsed time
        const duration = elapsedTimes[partIndex] - activeComment.startElapsed; // Calculate duration

        const finalDuration = Math.min(duration, COMMENT_LIMIT); // Limit duration
        comments.push({ // Add comment to list
            duration: finalDuration, // Add comment duration
            timestamp: Date.now(), // Add comment timestamp
            partName: meetingParts[partIndex].name, // Add part name
            partIndex: partIndex  // Track which part the comment was made on
        }); // Add comment
        localStorage.setItem('meetingComments', JSON.stringify(comments)); // Save comments
        activeComment = null; // Reset active comment
        clearInterval(commentInterval); // Clear the comment interval
        render.comments(); // Render comments
    } else { // Otherwise
        activeComment = { // Set active comment
            startElapsed: elapsedTimes[partIndex] || 0, // Set start elapsed time
            partIndex: partIndex // Set part index
        };
        commentInterval = setInterval(() => { // Set interval to update comment duration
            const currentElement = document.getElementById(`currentComment-${partIndex}`); // Get current comment element
            if (currentElement) { // If element exists
                const currentElapsed = elapsedTimes[partIndex] || 0; // Get current elapsed time
                const commentDuration = currentElapsed - activeComment.startElapsed; // Calculate comment duration
                currentElement.textContent = formatTime(Math.max(0, commentDuration)); // Update comment duration
            } // Update comment duration
        }, 200); // Update every 200ms
    } // Toggle comment
    render.timerDisplay(); // Render the timer display
}
*/

//This adds better error checking and improves clarity of the function's logic.
function toggleComment(partIndex) { // Toggle a comment
    // Ensure timer is running
    if (!isRunning) { // If timer is not running
        return; // Return without toggling comment
    }
    
    // Check if active part matches the part index
    if (activePart !== partIndex) { // If active part does not match part index
        console.warn(`Active part (${activePart}) does not match comment part (${partIndex})`); // Log warning
        return; // Return without toggling comment
    }

    if (activeComment) { // If active comment exists
        // Calculate duration based on elapsed time and limit to COMMENT_LIMIT
        const duration = elapsedTimes[partIndex] - activeComment.startElapsed; // Calculate duration
        const finalDuration = Math.min(duration, COMMENT_LIMIT); // Limit duration
        
        // Only add comment if duration is meaningful
        if (finalDuration >= 1) { // If duration is at least 1 second
            comments.push({ // Add comment to list
                duration: finalDuration, // Add comment duration
                timestamp: Date.now(), // Add comment timestamp
                partName: meetingParts[partIndex].name, // Add part name
                partIndex: partIndex // Track which part the comment was made on
            });
            localStorage.setItem('meetingComments', JSON.stringify(comments)); // Save comments
            render.comments(); // Render comments
        }
        
        activeComment = null; // Reset active comment
        clearInterval(commentInterval); // Clear the comment interval
    } else { // Otherwise
        activeComment = { // Set active comment
            startElapsed: elapsedTimes[partIndex] || 0, // Set start elapsed time
            partIndex: partIndex // Set part index
        };
        
        commentInterval = setInterval(() => { // Set interval to update comment duration
            const currentElement = document.getElementById(`currentComment-${partIndex}`); // Get current comment element
            if (currentElement) { // If element exists
                const currentElapsed = elapsedTimes[partIndex] || 0; // Get current elapsed time
                const commentDuration = currentElapsed - activeComment.startElapsed; // Calculate comment duration
                currentElement.textContent = formatTime(Math.max(0, commentDuration)); // Update comment duration
            }
        }, 200); // Update every 200ms
    }
    
    render.timerDisplay(); // Render the timer display
}

// END TIMER AND COMMENT CONTROLS
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
// BEGIN APPLICATION LIFECYCLE MANAGEMENT

function cleanupResources() { // Cleanup resources when the application is hidden or closed
    // Clear all intervals
    clearInterval(timerInterval); // Clear the timer interval
    clearInterval(commentInterval); // Clear the comment interval
    
    // Clear performance monitoring data
    performanceMonitor.renderTimes.clear(); // Clear render times
    
    // Save state before cleanup
    if (isRunning) { // If timer is running
        saveState(); // Save the state
    }
}

function initializeApplication() { // Initialize the application
    // Initialize DOM cache
    DOM.init(); // Initialize the DOM cache
    
    // Load saved data
    loadTemplate(); // Load the template
    loadState(); // Load the state
    
    // Initialize UI
    render.comments(); // Render the comments
    render.timerDisplay(); // Render the timer display
    
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
