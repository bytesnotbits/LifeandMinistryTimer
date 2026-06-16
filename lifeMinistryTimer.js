/**
 * Life and Ministry Timer
 * Version 3.7.3
 * 
 * A comprehensive timer application for managing meeting parts,
 * tracking comments, and maintaining meeting templates.
 */

'use strict';

//----------------------------------------------------------------------------------------------
// UTILITY FUNCTIONS
//----------------------------------------------------------------------------------------------
// Format a timestamp as local date string for date input
function formatLocalDate(timestamp) {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format a timestamp as local time string for time input
function formatLocalTime(timestamp) {
    const d = new Date(timestamp);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
}

// Build local timestamp from date + time input values
function buildLocalTimestamp(dateVal, timeVal) {
    if (!dateVal || !timeVal) return NaN;

    const rawDate = String(dateVal).trim();
    const rawTime = String(timeVal).trim();

    // Parse date as local calendar date.
    let year;
    let month;
    let day;

    // Preferred: YYYY-MM-DD
    const isoDateMatch = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoDateMatch) {
        year = parseInt(isoDateMatch[1], 10);
        month = parseInt(isoDateMatch[2], 10);
        day = parseInt(isoDateMatch[3], 10);
    } else {
        // Fallback: M/D/YYYY or M-D-YYYY or M.D.YYYY
        const usDateMatch = rawDate.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
        if (usDateMatch) {
            month = parseInt(usDateMatch[1], 10);
            day = parseInt(usDateMatch[2], 10);
            year = parseInt(usDateMatch[3], 10);
            if (year < 100) year += 2000;
        }
    }

    if (!year || !month || !day) {
        // Last resort: let Date parse it.
        const parsedDate = new Date(rawDate);
        if (isNaN(parsedDate.getTime())) return NaN;
        year = parsedDate.getFullYear();
        month = parsedDate.getMonth() + 1;
        day = parsedDate.getDate();
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) return NaN;

    // Parse time in either 24h (HH:mm[:ss]) or 12h (h:mm am/pm) form.
    const t = rawTime.toLowerCase();
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    const hasAm = /\bam\b/.test(t);
    const hasPm = /\bpm\b/.test(t);
    const timeNums = t.match(/\d+/g);
    if (!timeNums || timeNums.length < 2) return NaN;

    hours = parseInt(timeNums[0], 10);
    minutes = parseInt(timeNums[1], 10);
    seconds = timeNums[2] ? parseInt(timeNums[2], 10) : 0;

    if (hasAm || hasPm) {
        if (hours < 1 || hours > 12) return NaN;
        if (hasPm && hours !== 12) hours += 12;
        if (hasAm && hours === 12) hours = 0;
    } else {
        if (hours > 23) return NaN;
    }

    if (minutes > 59 || seconds > 59) return NaN;

    const dateObj = new Date(year, month - 1, day, hours, minutes, seconds, 0);
    if (isNaN(dateObj.getTime())) return NaN;

    // Prevent JS date overflow (e.g. month 13, day 32) from silently normalizing.
    if (dateObj.getFullYear() !== year || (dateObj.getMonth() + 1) !== month || dateObj.getDate() !== day) {
        return NaN;
    }

    return dateObj.getTime();
}

//----------------------------------------------------------------------------------------------
// DOM CACHE - Centralized access to DOM elements
//----------------------------------------------------------------------------------------------
const DOM = { // eslint-disable-line no-unused-vars
    elements: {},
    
    init() {
        this._cacheElements({
            partsTemplate: 'partsTemplate',
            partsDisplay: 'partsDisplay',
            commentHistory: 'commentHistory',
            globalCommentCount: 'globalCommentCount',
            globalAverageDuration: 'globalAverageDuration',
            saveTemplateBtn: 'saveTemplateBtn',
            loadTemplateBtn: 'loadTemplateBtn',
            templateModal: 'templateModal',
            templatesList: 'templatesList',
            templateName: 'templateName',
            templateDescription: 'templateDescription',
            templateCategory: 'templateCategory',
            templateSearch: 'templateSearch',
            templateCategoryFilter: 'templateCategoryFilter',
            templateSort: 'templateSort',
            closeTemplateModal: 'closeTemplateModal',
            saveNewTemplate: 'saveNewTemplate',
            importTemplateBtn: 'importTemplateBtn',
            exportAllTemplatesBtn: 'exportAllTemplatesBtn',
            addCategoryBtn: 'addCategoryBtn',
            categoryModal: 'categoryModal',
            newCategoryName: 'newCategoryName',
            closeCategoryModal: 'closeCategoryModal',
            saveNewCategory: 'saveNewCategory',
            previewModal: 'previewModal',
            previewTitle: 'previewTitle',
            previewDescription: 'previewDescription',
            previewCategory: 'previewCategory',
            previewCreated: 'previewCreated',
            previewModified: 'previewModified',
            previewParts: 'previewParts',
            previewTotalParts: 'previewTotalParts',
            previewTotalDuration: 'previewTotalDuration',
            closePreviewModal: 'closePreviewModal',
            loadPreviewedTemplate: 'loadPreviewedTemplate',
            exportPreviewedTemplate: 'exportPreviewedTemplate',
            importModal: 'importModal',
            importFile: 'importFile',
            importPreview: 'importPreview',
            importList: 'importList',
            closeImportModal: 'closeImportModal',
            confirmImport: 'confirmImport',
            meetingDateInput: 'meetingDateInput',
            meetingStartTimeInput: 'meetingStartTimeInput',
            meetingEndTimeInput: 'meetingEndTimeInput',
            scheduleMeetingBtn: 'scheduleMeetingBtn',
            meetingRepeatCheckbox: 'meetingRepeatCheckbox',
            midweekMeetingDayInput: 'midweekMeetingDayInput',
            midweekMeetingStartInput: 'midweekMeetingStartInput',
            midweekMeetingEndInput: 'midweekMeetingEndInput',
            scheduleMidweekMeetingBtn: 'scheduleMidweekMeetingBtn',
            weekendMeetingDayInput: 'weekendMeetingDayInput',
            weekendMeetingStartInput: 'weekendMeetingStartInput',
            weekendMeetingEndInput: 'weekendMeetingEndInput',
            scheduleWeekendMeetingBtn: 'scheduleWeekendMeetingBtn',
            endMeetingBtn: 'endMeetingBtn',
            globalTimerContainer: 'globalTimerContainer',
            confirmationModal: 'confirmationModal',
            confirmationTitle: 'confirmationTitle',
            confirmationMessage: 'confirmationMessage',
            cancelConfirmation: 'cancelConfirmation',
            confirmAction: 'confirmAction',
            shortcutsBtn: 'shortcutsBtn',
            shortcutsModal: 'shortcutsModal',
            closeShortcutsModal: 'closeShortcutsModal',
            editModeToggle: 'editModeToggle',
            editModeControls: 'editModeControls',
            editModeInstructions: 'editModeInstructions',
            addPartBtn: 'addPartBtn',
            partEditorModal: 'partEditorModal',
            editPartName: 'editPartName',
            editPartSpeaker: 'editPartSpeaker',
            editPartDuration: 'editPartDuration',
            editPartComments: 'editPartComments',
            closePartEditorModal: 'closePartEditorModal',
            savePartEdits: 'savePartEdits'
        });

        this._setupEventListeners(); // eslint-disable-line no-underscore-dangle
        this._checkForMissingElements(); // eslint-disable-line no-underscore-dangle
    },

    _cacheElements(elementIds) {
        Object.entries(elementIds).forEach(([name, id]) => {
            this.elements[name] = document.getElementById(id);
        });
    },

    // Populate scheduler inputs from state
    updateMeetingForm() {
        if (state.meetingScheduledStart) {
            if (this.elements.meetingDateInput) {
                this.elements.meetingDateInput.value = formatLocalDate(state.meetingScheduledStart);
            }
            if (this.elements.meetingStartTimeInput) {
                this.elements.meetingStartTimeInput.value = formatLocalTime(state.meetingScheduledStart);
            }
        }
        if (this.elements.meetingEndTimeInput && state.meetingScheduledEnd) {
            this.elements.meetingEndTimeInput.value = formatLocalTime(state.meetingScheduledEnd);
        }
        // update repeat checkbox and refresh timer bar on form update
        if (this.elements.meetingRepeatCheckbox) {
            this.elements.meetingRepeatCheckbox.checked = !!state.meetingRepeatsWeekly;
        }

        const schedules = state.weeklyMeetingSchedules || DEFAULT_WEEKLY_MEETING_SCHEDULES;
        const midweek = schedules.midweek || DEFAULT_WEEKLY_MEETING_SCHEDULES.midweek;
        const weekend = schedules.weekend || DEFAULT_WEEKLY_MEETING_SCHEDULES.weekend;
        if (this.elements.midweekMeetingDayInput) this.elements.midweekMeetingDayInput.value = midweek.day;
        if (this.elements.midweekMeetingStartInput) this.elements.midweekMeetingStartInput.value = midweek.start;
        if (this.elements.midweekMeetingEndInput) this.elements.midweekMeetingEndInput.value = midweek.end;
        if (this.elements.weekendMeetingDayInput) this.elements.weekendMeetingDayInput.value = weekend.day;
        if (this.elements.weekendMeetingStartInput) this.elements.weekendMeetingStartInput.value = weekend.start;
        if (this.elements.weekendMeetingEndInput) this.elements.weekendMeetingEndInput.value = weekend.end;

        render.globalTimerDisplay();
    },
    _setupEventListeners() {
        this._setupTemplateListeners();
        this._setupTemplateEditorListeners();
        this._setupModalListeners();
        this._setupSchedulerListeners();
        this._setupPartDisplayListeners();
        this._setupCommentHistoryListeners();
        this._setupEditListeners();
    }, // End of _setupEventListeners

    
    _setupPartDisplayListeners() {
if (this.elements.partsDisplay) {
            const HANDLED_ON_POINTERDOWN = 'handledOnPointerdown';
            const handlePartAction = (event) => {
                const button = event.target.closest('button[data-action]');
                if (!button) return;
                event.stopPropagation();

                const action = button.dataset.action;
                const partCard = button.closest('.part-card');
                const partIndex = partCard ? parseInt(partCard.dataset.partIndex) : -1;

                 if (partIndex === -1 && action !== 'add-part-end') { // Added check for add-part-end which might not have an index
                     console.warn('Could not determine part index for action:', action);
                     return;
                 }

                // --- Handle actions based on data-action attribute ---
                switch (action) {
                    case 'toggle-timer':
                        if (!state.isEditMode && partIndex === state.activePart) {
                            state.toggleTimer();
                        }
                        break;
                    case 'next-part':
                        if (!state.isEditMode && partIndex === state.activePart && partIndex < state.meetingParts.length - 1) {
                            state.startNextPart();
                        }
                        break;
                    case 'toggle-comment':
                         if (!state.isEditMode && partIndex === state.activePart && state.meetingParts[partIndex]?.enableComments) {
                            state.toggleComment(partIndex);
                        }
                        break;
                    case 'adjust-timer':
                        if (!state.isEditMode && partIndex === state.activePart) {
                           const adjustment = parseInt(button.dataset.adjust ?? 0);
                           if (adjustment !== 0) {
                                state.adjustTimer(partIndex, adjustment);
                           }
                        }
                        break;
                    case 'adjust-comment':
                        if (!state.isEditMode && partIndex === state.activePart &&
                            state.activeComment && state.activeComment.partIndex === partIndex) {
                            const adjustment = parseInt(button.dataset.adjust ?? 0);
                            if (adjustment !== 0) {
                                state.adjustCommentTimer(adjustment);
                            }
                        }
                        break;
                    case 'reset-timer':
                         if (!state.isEditMode && partIndex !== -1) {
                            state.resetTimer(partIndex);
                         }
                        break;
                    case 'edit-part':
                         if (partIndex !== -1) {
                            state.editPart(partIndex);
                         }
                         break;
                    case 'save-inline-part':
                         if (partIndex !== -1) {
                            state.saveInlinePartEdits(partIndex);
                         }
                         break;
                    case 'cancel-inline-part':
                         state.cancelPartEdits();
                         break;
                    case 'remove-part':
                         if (partIndex !== -1) {
                            state.removePart(partIndex);
                         }
                         break;
                    case 'add-part-before':
                         if ((state.isEditMode || state.editingPartIndex === partIndex) && partIndex !== -1) {
                             state.addPartAt(partIndex);
                         }
                         break;
                    case 'add-part-after':
                         if ((state.isEditMode || state.editingPartIndex === partIndex) && partIndex !== -1) {
                             state.addPartAt(partIndex + 1);
                         }
                         break;
                    default:
                        console.warn(`Unknown action: ${action}`);
                }
            };

            // While timer is running, cards re-render frequently and click can be dropped.
            // Handle primary pointer press immediately so controls remain reliable.
            this.elements.partsDisplay.addEventListener('pointerdown', (event) => {
                if (typeof event.button === 'number' && event.button !== 0) return;
                if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
                const button = event.target.closest('button[data-action]');
                if (!button) return;
                button.dataset[HANDLED_ON_POINTERDOWN] = 'true';
                handlePartAction(event);
            });

            // Keep click for keyboard activation and non-pointer interactions.
            this.elements.partsDisplay.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-action]');
                if (!button) return;
                if (button.dataset[HANDLED_ON_POINTERDOWN] === 'true') {
                    delete button.dataset[HANDLED_ON_POINTERDOWN];
                    return;
                }
                handlePartAction(event);
            });

            const syncInlineDraftFromEvent = (event) => {
                const input = event.target.closest('input');
                if (!input) return;
                const partCard = input.closest('.part-card');
                if (!partCard) return;
                const partIndex = parseInt(partCard.dataset.partIndex, 10);
                if (Number.isNaN(partIndex)) return;
                if (state.editingPartIndex !== partIndex) return;
                state.syncInlineEditDraft(partIndex);
            };

            // Track inline editor changes so typed values survive full re-renders.
            this.elements.partsDisplay.addEventListener('input', syncInlineDraftFromEvent);
            this.elements.partsDisplay.addEventListener('change', syncInlineDraftFromEvent);
            this.elements.partsDisplay.addEventListener('keydown', (event) => {
                const editor = event.target.closest('.inline-part-editor');
                if (!editor) return;

                const partCard = editor.closest('.part-card');
                const partIndex = partCard ? parseInt(partCard.dataset.partIndex, 10) : -1;
                if (Number.isNaN(partIndex) || state.editingPartIndex !== partIndex) return;

                if (event.key === 'Escape') {
                    event.preventDefault();
                    state.cancelPartEdits();
                    return;
                }

                if ((event.key === 'Enter' && event.ctrlKey) || (event.key === 'Enter' && event.target.type === 'number')) {
                    event.preventDefault();
                    state.saveInlinePartEdits(partIndex);
                }
            });

            // Handle part selection via click (only if not running and not edit mode)
             this.elements.partsDisplay.addEventListener('click', (event) => {
                 if (state.isRunning || state.isEditMode || state.editingPartIndex !== null) return; // Don't select if running or editing

                 // Check if the click was on a part card itself, not a button inside it
                 const partCard = event.target.closest('.part-card');
                 const button = event.target.closest('button'); // Check if click target is button or inside button

                 // Only select if the click originated directly on the card or its non-button children,
                 // *and* the card itself exists
                 if (partCard && (!button || !partCard.contains(button)) ) {
                     const partIndex = parseInt(partCard.dataset.partIndex);
                     if (!isNaN(partIndex)) {
                         state.selectPart(partIndex);
                     }
                 }
             });


            // Handle part selection via keyboard (Enter/Space)
            this.elements.partsDisplay.addEventListener('keydown', (event) => {
                if (state.isRunning || state.isEditMode || state.editingPartIndex !== null) return; // Don't select if running or editing

                if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
                     // Check if focus is on a part card
                     const partCard = event.target.closest('.part-card');
                     // Check that the event target *is* the part card (or maybe direct children like h3?)
                     // And that the currently focused element in the document *is* this card.
                     // This prevents triggering selection if focus is on an inner button.
                     if (partCard && document.activeElement === partCard) {
                         event.preventDefault(); // Prevent default space scroll
                         const partIndex = parseInt(partCard.dataset.partIndex);
                          if (!isNaN(partIndex)) {
                             state.selectPart(partIndex);
                         }
                     }
                }
            });
        } // End of partsDisplay listeners
    },

    _setupCommentHistoryListeners() {
if (this.elements.commentHistory) {
             this.elements.commentHistory.addEventListener('click', (event) => {
                 const deleteButton = event.target.closest('button.delete-button[data-comment-id]');
                 if (deleteButton) {
                     const commentId = deleteButton.dataset.commentId;
                     if (commentId) {
                         // Optional: Add confirmation here if desired
                         // DOM.showConfirmation('Delete Comment', 'Are you sure?', () => state.deleteComment(commentId));
                         state.deleteComment(commentId); // Call directly for now
                     }
                 }
             });
        } // End of commentHistory listener
    },
    _setupEditListeners() {
// Edit mode toggle
        if (this.elements.editModeToggle) { // Edit mode toggle
            this.elements.editModeToggle.addEventListener('click', () => {
                state.toggleEditMode(); // Toggle edit mode
            });
        }

        // Part editor modal buttons
        if (this.elements.closePartEditorModal) { // Close part editor modal button
            this.elements.closePartEditorModal.addEventListener('click', () => {
                state.cancelPartEdits(); // Cancel part edits
            });
        }

        if (this.elements.savePartEdits) { // Save part edits button
            this.elements.savePartEdits.addEventListener('click', () => {
                state.savePartEdits(); // Save part edits
            });
        }

        // Add part button (The global one at the bottom in edit mode)
        this._on(this.elements.addPartBtn, 'click', () => {
            if (state.isEditMode) {
                // Use the new addPart method when in edit mode
                state.addPart(); // This adds to the end
            }
            // Removed legacy behavior as it's probably not needed now
        });
    },
    _on(element, eventName, handler) {
        if (element) {
            element.addEventListener(eventName, handler);
        }
    },

    _setupTemplateEditorListeners() {
        this._on(this.elements.partsTemplate, 'change', (event) => {
            const templateCard = event.target.closest('[data-template-index]');
            if (!templateCard) return;

            const index = parseInt(templateCard.dataset.templateIndex, 10);
            if (Number.isNaN(index) || index < 0 || index >= state.meetingParts.length) return;

            const field = event.target.dataset.templateField;
            if (!field) return;

            if (field === 'duration') {
                const minutes = parseInt(event.target.value, 10) || 1;
                state.meetingParts[index].duration = minutes * 60;
                render.timerDisplay();
            } else if (field === 'enableComments') {
                state.meetingParts[index].enableComments = event.target.checked;
                render.timerDisplay();
            } else if (field === 'name' || field === 'speaker') {
                state.meetingParts[index][field] = event.target.value;
            }

            render.templateEditor();
        });

        this._on(this.elements.partsTemplate, 'click', (event) => {
            const removeButton = event.target.closest('[data-template-action="remove-part"]');
            if (!removeButton) return;

            const templateCard = removeButton.closest('[data-template-index]');
            if (!templateCard) return;

            const index = parseInt(templateCard.dataset.templateIndex, 10);
            if (Number.isNaN(index) || index < 0 || index >= state.meetingParts.length) return;

            state.meetingParts.splice(index, 1);
            if (state.activePart >= state.meetingParts.length) {
                state.activePart = Math.max(0, state.meetingParts.length - 1);
            }

            render.templateEditor();
            render.timerDisplay();
        });
    },
    _setupTemplateListeners() {
        this._on(this.elements.saveTemplateBtn, 'click', () => {
            this.elements.templateName.value = '';
            this.elements.templateDescription.value = '';
            this.elements.templateCategory.value = '';
            this._showModal(this.elements.templateModal);
        });

        this._on(this.elements.loadTemplateBtn, 'click', () => {
            templateManager.populateTemplatesList();
            this._showModal(this.elements.templateModal);
        });

        this._on(this.elements.saveNewTemplate, 'click', () => {
            const name = this.elements.templateName.value.trim();
            if (name) {
                const description = this.elements.templateDescription.value.trim();
                const category = this.elements.templateCategory.value.trim();
                templateManager.saveTemplate(name, description, category);
                this._hideModal(this.elements.templateModal);
            } else {
                notify.show('Please enter a template name', 'error');
            }
        });

        this._on(this.elements.importTemplateBtn, 'click', () => {
            this._hideModal(this.elements.templateModal);
            this.elements.importFile.value = '';
            this.elements.importPreview.classList.add('hidden');
            this.elements.confirmImport.disabled = true;
            this._showModal(this.elements.importModal);
        });

        this._on(this.elements.exportAllTemplatesBtn, 'click', () => {
            templateManager.exportAllTemplates();
        });

        this._on(this.elements.addCategoryBtn, 'click', () => {
            this.elements.newCategoryName.value = '';
            this._showModal(this.elements.categoryModal);
        });

        this._on(this.elements.templateSearch, 'input', () => {
            templateManager.populateTemplatesList();
        });

        this._on(this.elements.templateCategoryFilter, 'change', () => {
            templateManager.populateTemplatesList();
        });

        this._on(this.elements.templateSort, 'change', () => {
            templateManager.populateTemplatesList();
        });
    },

    _setupModalListeners() {
        this._on(this.elements.closeTemplateModal, 'click', () => {
            this._hideModal(this.elements.templateModal);
        });

        this._on(this.elements.closeCategoryModal, 'click', () => {
            this._hideModal(this.elements.categoryModal);
        });

        this._on(this.elements.saveNewCategory, 'click', () => {
            const name = this.elements.newCategoryName.value.trim();
            if (name) {
                templateManager.addCategory(name);
                this._hideModal(this.elements.categoryModal);
            } else {
                notify.show('Please enter a category name', 'error');
            }
        });

        this._on(this.elements.closePreviewModal, 'click', () => {
            this._hideModal(this.elements.previewModal);
        });

        this._on(this.elements.importFile, 'change', (event) => {
            templateManager.handleImportFile(event.target.files[0]);
        });

        this._on(this.elements.closeImportModal, 'click', () => {
            this._hideModal(this.elements.importModal);
        });

        this._on(this.elements.confirmImport, 'click', () => {
            templateManager.importTemplates();
            this._hideModal(this.elements.importModal);
        });

        this._on(this.elements.cancelConfirmation, 'click', () => {
            this._hideModal(this.elements.confirmationModal);
        });

        this._on(this.elements.shortcutsBtn, 'click', () => {
            this.showShortcutsModal();
        });

        this._on(this.elements.closeShortcutsModal, 'click', () => {
            this._hideModal(this.elements.shortcutsModal);
        });
    },
      _setupSchedulerListeners() {
        const scheduleWeeklyPreset = (kind) => {
            const dayInput = kind === 'midweek' ? this.elements.midweekMeetingDayInput : this.elements.weekendMeetingDayInput;
            const startInput = kind === 'midweek' ? this.elements.midweekMeetingStartInput : this.elements.weekendMeetingStartInput;
            const endInput = kind === 'midweek' ? this.elements.midweekMeetingEndInput : this.elements.weekendMeetingEndInput;
            const label = kind === 'midweek' ? 'Midweek meeting' : 'Weekend meeting';
            const dayVal = dayInput ? dayInput.value : '';
            const startTimeVal = startInput ? startInput.value : '';
            const endTimeVal = endInput ? endInput.value : '';
            if (!dayVal || !startTimeVal || !endTimeVal) {
                notify.show(`Please provide ${label.toLowerCase()} day, start time, and end time`, 'error');
                return;
            }
            state.weeklyMeetingSchedules = {
                ...(state.weeklyMeetingSchedules || DEFAULT_WEEKLY_MEETING_SCHEDULES),
                [kind]: { day: dayVal, start: startTimeVal, end: endTimeVal }
            };
            const nextMeeting = state.scheduleNextWeeklyMeeting(Date.now());
            this.updateMeetingForm();
            if (nextMeeting) {
                notify.show(`${label} saved`, 'success');
            } else {
                notify.show('Invalid meeting day/time format', 'error');
            }
        };

        if (this.elements.scheduleMidweekMeetingBtn) {
            this.elements.scheduleMidweekMeetingBtn.addEventListener('click', () => scheduleWeeklyPreset('midweek'));
        }

        if (this.elements.scheduleWeekendMeetingBtn) {
            this.elements.scheduleWeekendMeetingBtn.addEventListener('click', () => scheduleWeeklyPreset('weekend'));
        }

        if (this.elements.scheduleMeetingBtn) {
            this.elements.scheduleMeetingBtn.addEventListener('click', () => {
                const dateVal = this.elements.meetingDateInput ? this.elements.meetingDateInput.value : '';
                const startTimeVal = this.elements.meetingStartTimeInput ? this.elements.meetingStartTimeInput.value : '';
                const endTimeVal = this.elements.meetingEndTimeInput ? this.elements.meetingEndTimeInput.value : '';
                if (!dateVal || !startTimeVal || !endTimeVal) {
                    notify.show('Please provide meeting date, start time, and end time', 'error');
                    return;
                }
                const startTs = buildLocalTimestamp(dateVal, startTimeVal);
                let endTs = buildLocalTimestamp(dateVal, endTimeVal);
                if (isNaN(startTs) || isNaN(endTs)) {
                    notify.show('Invalid meeting date/time format', 'error');
                    return;
                }
                if (endTs <= startTs) {
                    // If end clock time is before start clock time, treat it as crossing midnight.
                    endTs = meetingScheduleModel.normalizeEndTime(startTs, endTs);
                }

                const repeatChecked = this.elements.meetingRepeatCheckbox ? this.elements.meetingRepeatCheckbox.checked : true;
                const recurringTimeChanged = meetingScheduleModel.didRecurringTimeChange(state, startTimeVal, endTimeVal);

                // If currently repeating and the user changes the time, ask whether to apply to recurring schedule
                if (state.meetingRepeatsWeekly && state.recurringBaseStart && repeatChecked && recurringTimeChanged) {
                    const applyToAll = window.confirm('Update the recurring meeting time for future meetings?\n\nOK = Update recurring schedule. Cancel = Apply as a one-time change.');
                    if (applyToAll) {
                        state.scheduleMeeting(startTs, endTs, true);
                    } else {
                        state.scheduleOneTimeChange(startTs, endTs);
                    }
                } else {
                    if (repeatChecked) {
                        state.scheduleMeeting(startTs, endTs, true);
                    } else {
                        // schedule as non-repeating (single instance)
                        state.scheduleMeeting(startTs, endTs, false);
                    }
                }

                this.updateMeetingForm();
                notify.show('Meeting scheduled', 'success');
            });
        }

        if (this.elements.endMeetingBtn) {
            this.elements.endMeetingBtn.addEventListener('click', () => {
                state.endMeeting();
                this.updateMeetingForm();
                notify.show('Meeting ended', 'info');
            });
        }
    },

  _checkForMissingElements() { // eslint-disable-line no-unused-vars
        const criticalElements = [ // List of critical elements
            'partsTemplate', 'partsDisplay', 'commentHistory',
            'globalCommentCount', 'globalAverageDuration'
        ];
        
        criticalElements.forEach(elementName => { // Loop through each critical element
            if (!this.elements[elementName]) { // If element is missing
                console.warn(`Critical element #${elementName} not found in the DOM`); // Log a warning
            }
        });
    },
    
    _showModal(modalElement) { // Show a modal
        if (modalElement) { // If modal element exists
            modalElement.classList.remove('hidden'); // Remove the hidden class
            modalElement.classList.add('active'); // Add the active class
        }
    },
    
    _hideModal(modalElement) { // Hide a modal
        if (modalElement) { // If modal element exists
            modalElement.classList.remove('active'); // Remove the active class
            modalElement.classList.add('hidden'); // Add the hidden class
        }
    },
    
    showConfirmation(title, message, onConfirm) { // Show a confirmation dialog
        if (!this.elements.confirmationModal) return; // If confirmation modal doesn't exist
        
        this.elements.confirmationTitle.textContent = title; // Set the confirmation title
        this.elements.confirmationMessage.textContent = message; // Set the confirmation message
        
        // Set up the confirm action button
        const confirmBtn = this.elements.confirmAction; // Get the confirm action button
        
        // Remove any existing event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true); // Clone the confirm button
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn); // Replace the confirm button
        this.elements.confirmAction = newConfirmBtn; // Set the new confirm button
        
        // Add the new event listener
        newConfirmBtn.addEventListener('click', () => { // Add event listener
            onConfirm(); // Call the onConfirm function
            this._hideModal(this.elements.confirmationModal); // Hide the confirmation modal
        });
        
        this._showModal(this.elements.confirmationModal); // Show the confirmation modal
    },
    
    showShortcutsModal() { // Show the keyboard shortcuts modal
        if (!this.elements.shortcutsModal) return; // If shortcuts modal doesn't exist
        this._showModal(this.elements.shortcutsModal); // Show the shortcuts modal
    }
};

//----------------------------------------------------------------------------------------------
// CONSTANTS AND APPLICATION STATE
//----------------------------------------------------------------------------------------------
const DEFAULT_PARTS = [
    { name: 'Opening Comments', duration: 1*60, speaker: '', enableComments: false },
    { name: 'Treasures', duration: 10*60, speaker: '', enableComments: false },
    { name: 'Council', duration: 1*60, speaker: 'Chairman', enableComments: false },
    { name: 'Spiritual Gems', duration: 10*60, speaker: '', enableComments: true },
    { name: 'Council', duration: 1*60, speaker: 'Chairman', enableComments: false },
    { name: 'Bible Reading', duration: 5*60, speaker: '', enableComments: false },
    { name: 'Council', duration: 1*60, speaker: 'Chairman', enableComments: false },
    { name: 'Apply yourself 1', duration: 3*60, speaker: '', enableComments: false },
    { name: 'Council', duration: 1*60, speaker: 'Chairman', enableComments: false },
    { name: 'Apply yourself 2', duration: 3*60, speaker: '', enableComments: false },
    { name: 'Council', duration: 1*60, speaker: 'Chairman', enableComments: false },
    { name: 'Student Talk', duration: 5*60, speaker: '', enableComments: false },
    { name: 'Council', duration: 1*60, speaker: 'Chairman', enableComments: false },
    { name: 'Living as Christians', duration: 15*60, speaker: '', enableComments: false },
    { name: 'Chairman', duration: 1*60, speaker: 'Chairman', enableComments: false },
    { name: 'CBS', duration: 30*60, speaker: '', enableComments: true },
    { name: 'Closing Comments', duration: 3*60, speaker: 'Chairman', enableComments: false },
];

const COMMENT_LIMIT = 4*60; // Limit comments to 4 minutes
const TIMER_UPDATE_INTERVAL = 100; // 100ms interval for more accurate timer updates
const COMMENT_DISPLAY_UPDATE_INTERVAL = 200; // 200ms for smoother comment timer display

const STORAGE_KEYS = {
    meetingTemplate: 'meetingTemplate',
    elapsedTimes: 'elapsedTimes',
    activePart: 'activePart',
    meetingComments: 'meetingComments',
    isEditMode: 'isEditMode',
    meetingScheduledStart: 'meetingScheduledStart',
    meetingScheduledEnd: 'meetingScheduledEnd',
    meetingActualEnd: 'meetingActualEnd',
    meetingRepeatsWeekly: 'meetingRepeatsWeekly',
    recurringBaseStart: 'recurringBaseStart',
    recurringDurationMs: 'recurringDurationMs',
    meetingOverride: 'meetingOverride',
    weeklyMeetingSchedules: 'weeklyMeetingSchedules',
    savedTemplates: 'savedTemplates',
    adminSidebarCollapsed: 'adminSidebarCollapsed',
    theme: 'theme',
    soundEnabled: 'soundEnabled'
};

const DEFAULT_WEEKLY_MEETING_SCHEDULES = {
    midweek: { day: '3', start: '19:00', end: '20:45' },
    weekend: { day: '6', start: '10:00', end: '11:45' }
};

const persistence = {
    getString(key) {
        return localStorage.getItem(key);
    },

    setString(key, value) {
        localStorage.setItem(key, String(value));
    },

    getJson(key, fallback = null) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    },

    setJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    setOptionalNumber(key, value) {
        if (value) {
            this.setString(key, value);
        } else {
            this.remove(key);
        }
    },

    setOptionalJson(key, value) {
        if (value) {
            this.setJson(key, value);
        } else {
            this.remove(key);
        }
    }
};

const meetingScheduleModel = {
    WEEK_MS: 7 * 24 * 60 * 60 * 1000,
    DAY_MS: 24 * 60 * 60 * 1000,

    normalizeEndTime(startTs, endTs) {
        return endTs <= startTs ? endTs + this.DAY_MS : endTs;
    },

    getDurationMs(startTs, endTs) {
        return startTs && endTs ? endTs - startTs : null;
    },

    didRecurringTimeChange({ recurringBaseStart, recurringDurationMs }, startTimeVal, endTimeVal) {
        const recurringStartTime = recurringBaseStart ? formatLocalTime(recurringBaseStart) : '';
        if (!recurringDurationMs) {
            return recurringStartTime !== startTimeVal;
        }

        return (
            recurringStartTime !== startTimeVal
            || formatLocalTime(recurringBaseStart + recurringDurationMs) !== endTimeVal
        );
    },

    shouldStartMeeting({ meetingScheduledStart, meetingIsRunning, meetingActualEnd }, now) {
        return !!meetingScheduledStart && !meetingIsRunning && !meetingActualEnd && now >= meetingScheduledStart;
    },

    getFailsafeCutoff({ meetingScheduledStart, meetingScheduledEnd, recurringDurationMs }) {
        const totalMs = this.getDurationMs(meetingScheduledStart, meetingScheduledEnd) || recurringDurationMs || 0;
        return totalMs > 0 ? meetingScheduledStart + Math.floor(totalMs * 1.5) : null;
    },

    shouldAutoEndMeeting(schedule, now) {
        if (!schedule.meetingIsRunning || !schedule.meetingScheduledStart || schedule.meetingActualEnd) return false;
        const cutoff = this.getFailsafeCutoff(schedule);
        return cutoff !== null && now >= cutoff;
    },

    getNextRecurringStart(baseStart, afterTs) {
        let next = baseStart;
        while (next <= afterTs) {
            next += this.WEEK_MS;
        }
        return next;
    },

    getNextWeeklyWindow(dayOfWeek, startTimeVal, endTimeVal, now = Date.now()) {
        const today = new Date(now);
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const daysAhead = (Number(dayOfWeek) - date.getDay() + 7) % 7;
        date.setDate(date.getDate() + daysAhead);
        const dateVal = formatLocalDate(date.getTime());
        let startTs = buildLocalTimestamp(dateVal, startTimeVal);
        let endTs = buildLocalTimestamp(dateVal, endTimeVal);
        if (Number.isNaN(startTs) || Number.isNaN(endTs)) {
            return null;
        }
        endTs = this.normalizeEndTime(startTs, endTs);
        if (startTs <= now) {
            startTs += this.WEEK_MS;
            endTs += this.WEEK_MS;
        }
        return { startTs, endTs };
    },

    getDisplayState(schedule, now) {
        const start = schedule.meetingScheduledStart;
        const end = schedule.meetingScheduledEnd;
        if (!start) {
            return null;
        }

        const durationMs = this.getDurationMs(start, end);
        const totalSec = durationMs ? durationMs / 1000 : 0;
        let elapsed = 0;
        if (schedule.meetingActualEnd) {
            elapsed = (schedule.meetingActualEnd - start) / 1000;
        } else if (now >= start) {
            elapsed = (now - start) / 1000;
        }

        elapsed = Math.max(0, elapsed);
        const remaining = totalSec > 0 ? totalSec - elapsed : 0;

        return {
            elapsed,
            totalSec,
            remaining,
            percent: totalSec > 0 ? Math.min(100, (elapsed / totalSec) * 100) : 0,
            isOvertime: !!schedule.meetingIsRunning && !schedule.meetingActualEnd && elapsed > totalSec && totalSec > 0,
            canEnd: now >= start && !schedule.meetingActualEnd
        };
    }
};

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
    isEditMode: false,
    editingPartIndex: null,
    inlineEditDraft: null,
    draggedPartIndex: null,
    timerStartTime: null,
    lastUpdateTime: null,
    visibilityPaused: false,

    // Global meeting scheduler state
    meetingScheduledStart: null,
    meetingScheduledEnd: null,
    meetingActualEnd: null,   // timestamp when user clicked end
    meetingIsRunning: false,
    meetingInterval: null,
    meetingRepeatsWeekly: true,
    recurringBaseStart: null, // base timestamp for recurring pattern
    recurringDurationMs: null,
    meetingOverride: null, // { start, end } for one-time overrides
    weeklyMeetingSchedules: JSON.parse(JSON.stringify(DEFAULT_WEEKLY_MEETING_SCHEDULES)),
    
    // Initialize application state
    init() {
        this.loadState();
        
        this.updateEditModeUi();
        
// Set up visibility change handler
        document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
        this._visibilityChangeHandlerSet = true;
        
        // If a meeting is scheduled, start it if due and keep the global timer current.
        if (this.meetingScheduledStart) {
            this.startMeetingIfDue();
            this._setupMeetingInterval();
            render.globalTimerDisplay();
        }
    },
    
    // Load state from localStorage
    loadState() {
        try {
            // Load meeting parts
            this.meetingParts = persistence.getJson(STORAGE_KEYS.meetingTemplate, DEFAULT_PARTS);
            
            // Load elapsed times
            this.elapsedTimes = persistence.getJson(STORAGE_KEYS.elapsedTimes, {});
            
            // Load active part
            this.activePart = parseInt(persistence.getString(STORAGE_KEYS.activePart), 10) || 0;
            
            // Load comments
            this.comments = persistence.getJson(STORAGE_KEYS.meetingComments, []);
            
            // Load meeting schedule
            const savedStart = persistence.getString(STORAGE_KEYS.meetingScheduledStart);
            this.meetingScheduledStart = savedStart ? parseInt(savedStart, 10) : null;
            const savedEnd = persistence.getString(STORAGE_KEYS.meetingScheduledEnd);
            this.meetingScheduledEnd = savedEnd ? parseInt(savedEnd, 10) : null;
            const savedActual = persistence.getString(STORAGE_KEYS.meetingActualEnd);
            this.meetingActualEnd = savedActual ? parseInt(savedActual, 10) : null;
            const savedRepeats = persistence.getString(STORAGE_KEYS.meetingRepeatsWeekly);
            this.meetingRepeatsWeekly = savedRepeats !== null ? (savedRepeats === 'true') : true;
            const savedRecurring = persistence.getString(STORAGE_KEYS.recurringBaseStart);
            this.recurringBaseStart = savedRecurring ? parseInt(savedRecurring, 10) : null;
            const savedRecDur = persistence.getString(STORAGE_KEYS.recurringDurationMs);
            this.recurringDurationMs = savedRecDur ? parseInt(savedRecDur, 10) : null;
            this.meetingOverride = persistence.getJson(STORAGE_KEYS.meetingOverride, null);
            this.weeklyMeetingSchedules = {
                ...DEFAULT_WEEKLY_MEETING_SCHEDULES,
                ...persistence.getJson(STORAGE_KEYS.weeklyMeetingSchedules, {})
            };
            // meetingIsRunning will be determined later in init
            
            // Legacy edit-mode toggle is no longer user-facing; always default to card-level editing.
            this.isEditMode = false;
            persistence.remove(STORAGE_KEYS.isEditMode);
            
        } catch (error) {
            console.error('Error loading state:', error);
            // Fallback to defaults if loading fails
            this.meetingParts = DEFAULT_PARTS;
            this.elapsedTimes = {};
            this.activePart = 0;
            this.comments = [];
            this.isEditMode = false;
        }
    },
    
    // Save current state to localStorage
    saveState() {
        try {
            persistence.setJson(STORAGE_KEYS.elapsedTimes, this.elapsedTimes);
            persistence.setString(STORAGE_KEYS.activePart, this.activePart);
            persistence.setJson(STORAGE_KEYS.meetingComments, this.comments);
            // persist meeting schedule information
            persistence.setOptionalNumber(STORAGE_KEYS.meetingScheduledStart, this.meetingScheduledStart);
            persistence.setOptionalNumber(STORAGE_KEYS.meetingScheduledEnd, this.meetingScheduledEnd);
            persistence.setOptionalNumber(STORAGE_KEYS.meetingActualEnd, this.meetingActualEnd);
            persistence.setString(STORAGE_KEYS.meetingRepeatsWeekly, this.meetingRepeatsWeekly ? 'true' : 'false');
            persistence.setOptionalNumber(STORAGE_KEYS.recurringBaseStart, this.recurringBaseStart);
            persistence.setOptionalNumber(STORAGE_KEYS.recurringDurationMs, this.recurringDurationMs);
            persistence.setOptionalJson(STORAGE_KEYS.meetingOverride, this.meetingOverride);
            persistence.setJson(STORAGE_KEYS.weeklyMeetingSchedules, this.weeklyMeetingSchedules || DEFAULT_WEEKLY_MEETING_SCHEDULES);
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
            // Only stop the timer if the part being reset is the active part
            if (this.isRunning && partIndex === this.activePart) {
                this.stopTimer();
            }
            
            this.elapsedTimes[partIndex] = 0;
            this.saveState();
            render.timerDisplay(); // Explicitly re-render the timer display
        }
    },
    
    // Clear all data and reset to defaults
    clearAllData() {
        persistence.remove(STORAGE_KEYS.meetingTemplate);
        persistence.remove(STORAGE_KEYS.elapsedTimes);
        persistence.remove(STORAGE_KEYS.activePart);
        persistence.remove(STORAGE_KEYS.meetingComments);
        persistence.remove(STORAGE_KEYS.isEditMode);
        persistence.remove(STORAGE_KEYS.meetingScheduledStart);
        persistence.remove(STORAGE_KEYS.meetingScheduledEnd);
        persistence.remove(STORAGE_KEYS.meetingActualEnd);
        persistence.remove(STORAGE_KEYS.weeklyMeetingSchedules);
        
        this.meetingParts = DEFAULT_PARTS;
        this.isEditMode = false;
        this.resetTimers();
        this.meetingScheduledStart = null;
        this.meetingScheduledEnd = null;
        this.meetingActualEnd = null;
        this.meetingIsRunning = false;
        this.weeklyMeetingSchedules = JSON.parse(JSON.stringify(DEFAULT_WEEKLY_MEETING_SCHEDULES));
        if (this.meetingInterval) {
            clearInterval(this.meetingInterval);
            this.meetingInterval = null;
        }
        
        this.updateEditModeUi();
    },

    _getPlannedMeetingDurationMs(startTs = this.meetingScheduledStart, endTs = this.meetingScheduledEnd) {
        const scheduledDurationMs = meetingScheduleModel.getDurationMs(startTs, endTs);
        if (scheduledDurationMs && scheduledDurationMs > 0) {
            return scheduledDurationMs;
        }

        const plannedSeconds = this.meetingParts.reduce((sum, part) => sum + Math.max(0, part.duration || 0), 0);
        return plannedSeconds > 0 ? plannedSeconds * 1000 : null;
    },

    // Schedule a meeting with start/end timestamps (milliseconds)
    scheduleMeeting(startTs, endTs, repeat = true) {
        this.meetingScheduledStart = startTs;
        this.meetingScheduledEnd = endTs;
        this.meetingActualEnd = null;
        this.meetingIsRunning = false;
        // Configure repeating behavior
        this.meetingRepeatsWeekly = !!repeat;
        if (repeat) {
            this.recurringBaseStart = startTs;
            this.recurringDurationMs = meetingScheduleModel.getDurationMs(startTs, endTs);
            this.meetingOverride = null;
        } else {
            this.recurringBaseStart = this.recurringBaseStart || null;
            // keep existing recurringDuration if present
            this.recurringDurationMs = this.recurringDurationMs || meetingScheduleModel.getDurationMs(startTs, endTs);
            this.meetingOverride = null;
        }

        if (!this.startMeetingIfDue()) {
            this.saveState();
        }
        this._setupMeetingInterval();
        render.globalTimerDisplay();
        if (typeof programCockpit !== 'undefined') {
            programCockpit.renderAll();
        }
    },

    scheduleNextWeeklyMeeting(afterTs = Date.now()) {
        const schedules = this.weeklyMeetingSchedules || DEFAULT_WEEKLY_MEETING_SCHEDULES;
        const candidates = Object.values(schedules)
            .map((schedule) => meetingScheduleModel.getNextWeeklyWindow(schedule.day, schedule.start, schedule.end, afterTs))
            .filter(Boolean)
            .sort((a, b) => a.startTs - b.startTs);

        const nextMeeting = candidates[0] || null;
        if (!nextMeeting) return null;

        this.scheduleMeeting(nextMeeting.startTs, nextMeeting.endTs, true);
        return nextMeeting;
    },

    // Schedule a one-time change while keeping recurring pattern intact
    scheduleOneTimeChange(startTs, endTs) {
        this.meetingOverride = { start: startTs, end: endTs };
        this.meetingScheduledStart = startTs;
        this.meetingScheduledEnd = endTs;
        this.meetingActualEnd = null;
        this.meetingIsRunning = false;

        if (!this.startMeetingIfDue()) {
            this.saveState();
        }
        this._setupMeetingInterval();
        render.globalTimerDisplay();
        if (typeof programCockpit !== 'undefined') {
            programCockpit.renderAll();
        }
    },

    // Internal: ensure meeting interval is running
    _setupMeetingInterval() {
        if (this.meetingInterval) return; // already set

        this.meetingInterval = setInterval(() => {
            const now = Date.now();
            this.startMeetingIfDue(now);
            // Failsafe: if meeting is running and 1.5x scheduled duration has elapsed since scheduled start, auto-end
            if (meetingScheduleModel.shouldAutoEndMeeting(this, now)) {
                notify.show('Meeting automatically ended (failsafe)', 'info');
                this.endMeeting();
                // render will be updated inside endMeeting
            }
            // update display even if not running (to show countdown to start or progress)
            render.globalTimerDisplay();
            // if meeting ended, clear interval
            if (this.meetingActualEnd && !this.meetingIsRunning) {
                clearInterval(this.meetingInterval);
                this.meetingInterval = null;
            }
        }, TIMER_UPDATE_INTERVAL);
    },

    // Called when the meeting officially begins (automatically or manually)
    startMeeting(startTs = this.meetingScheduledStart, forceStartTime = false) {
        const now = startTs || Date.now();
        const shouldResetStart = forceStartTime || !this.meetingScheduledStart || this.meetingActualEnd;
        const plannedDurationMs = this._getPlannedMeetingDurationMs();

        if (shouldResetStart) {
            this.meetingScheduledStart = now;
            this.meetingScheduledEnd = plannedDurationMs ? now + plannedDurationMs : null;
            this.meetingActualEnd = null;
        }

        this.meetingIsRunning = true;
        this._setupMeetingInterval();
        this.saveState();
        render.globalTimerDisplay();
    },

    startMeetingIfDue(now = Date.now()) {
        if (!meetingScheduleModel.shouldStartMeeting(this, now)) {
            return false;
        }
        this.startMeeting();
        return true;
    },

    // User ends the meeting
    endMeeting() {
        if (!this.meetingIsRunning && !this.meetingScheduledStart) return;
        this.meetingIsRunning = false;
        this.meetingActualEnd = Date.now();
        this.saveState();
        render.globalTimerDisplay();
        if (typeof programCockpit !== 'undefined') {
            programCockpit.renderAll();
        }
        // clear interval now since meeting is over
        if (this.meetingInterval) {
            clearInterval(this.meetingInterval);
            this.meetingInterval = null;
        }
        // If weekly schedules are configured, advance to whichever saved meeting comes next.
        if (this.meetingRepeatsWeekly && this.weeklyMeetingSchedules) {
            this.meetingOverride = null;
            this.scheduleNextWeeklyMeeting(Date.now());
        } else if (this.meetingRepeatsWeekly && this.recurringBaseStart) {
            const now = Date.now();
            const nextStart = meetingScheduleModel.getNextRecurringStart(this.recurringBaseStart, now);
            this.meetingScheduledStart = nextStart;
            if (this.recurringDurationMs) {
                this.meetingScheduledEnd = nextStart + this.recurringDurationMs;
            }
            // clear one-time override after it has been used
            this.meetingOverride = null;
            this.saveState();
        }
    },
    
    // Start the timer
    startTimer() {
        if (this.activePart !== null) {
            const now = Date.now();
            if (!this.meetingIsRunning) {
                if (!this.meetingScheduledStart || this.meetingActualEnd || now < this.meetingScheduledStart) {
                    this.startMeeting(now, true);
                } else {
                    this.startMeetingIfDue(now);
                }
            }

            this.isRunning = true;
            
            // Clear any existing interval
            clearInterval(this.timerInterval);
            
            // Store the current timestamp
            this.timerStartTime = Date.now();
            this.lastUpdateTime = this.timerStartTime;
            
            // Initialize elapsed time if not already set
            if (!this.elapsedTimes[this.activePart]) {
                this.elapsedTimes[this.activePart] = 0;
            }
            
            // Initialize update counter
            this._displayUpdateCounter = 0;
            
            this.timerInterval = setInterval(() => {
                if (!this.visibilityPaused) {
                    const now = Date.now();
                    // Calculate elapsed time in milliseconds, then convert to seconds
                    const elapsedMs = now - this.lastUpdateTime;
                    const elapsedSeconds = elapsedMs / 1000;
                    
                    // Always update the timer, not just when a full second has passed
                    if (elapsedMs > 0) {
                        // Add the precise elapsed time (including fractional seconds)
                        this.elapsedTimes[this.activePart] += elapsedSeconds;
                        this.lastUpdateTime = now;
                        
                        // Check if timer has reached the end
                        const currentPart = this.meetingParts[this.activePart];
                        const totalElapsed = this.elapsedTimes[this.activePart];
                        
                        if (totalElapsed >= currentPart.duration && soundManager && soundManager.isSoundEnabled) {
                            soundManager.playTimerEndSound();
                        }
                        
                        // Update display every 3 ticks (300ms) for smooth updates
                        // without excessive rendering
                        this._displayUpdateCounter++;
                        if (this._displayUpdateCounter >= 3) {
                            this._displayUpdateCounter = 0;
                            this.saveState();
                            if (this.editingPartIndex !== null) {
                                render.refreshLiveTimerValues();
                            } else {
                                render.timerDisplay();
                            }
                        }
                    }
                }
            }, TIMER_UPDATE_INTERVAL);
            
            // Add timer-active class to the active part
            const activePartElement = document.querySelector(`.part-card.active`);
            if (activePartElement) {
                activePartElement.classList.add('timer-active');
            }
            
            // Set up visibility change handler if not already set
            if (!this._visibilityChangeHandlerSet) {
                document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
                this._visibilityChangeHandlerSet = true;
            }
        }
    },
    
    // Handle visibility change events
    _handleVisibilityChange() {
        if (!document.hidden && this.meetingScheduledStart) {
            this.startMeetingIfDue();
            this._setupMeetingInterval();
            render.globalTimerDisplay();
        }

        if (this.isRunning) {
            if (document.hidden) {
                // Page is now hidden
                this.visibilityPaused = true;
                this._lastHiddenTime = Date.now();
            } else {
                // Page is now visible again
                if (this.visibilityPaused) {
                    const now = Date.now();
                    const hiddenDuration = now - this._lastHiddenTime;
                    
                    // Add the precise time that passed while the page was hidden (including fractional seconds)
                    const elapsedSeconds = hiddenDuration / 1000;
                    this.elapsedTimes[this.activePart] += elapsedSeconds;
                    
                    // Update timestamps
                    this.lastUpdateTime = now;
                    this.visibilityPaused = false;
                    
                    // Update display
                    this.saveState();
                    if (this.editingPartIndex !== null) {
                        render.refreshLiveTimerValues();
                    } else {
                        render.timerDisplay();
                    }
                }
            }
        }
    },
    
    // Stop the timer
    stopTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timerStartTime = null;
        this.lastUpdateTime = null;
        this.visibilityPaused = false;
        
        // Also stop any active comment
        if (this.activeComment) {
            this.finalizeComment();
        }
        
        // Remove timer-active class from all parts
        document.querySelectorAll('.part-card.timer-active').forEach(element => {
            element.classList.remove('timer-active');
        });
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
    
    // Move to the next part without starting the next timer.
    startNextPart() {
        if (this.activePart < this.meetingParts.length - 1) {
            if (this.isRunning) {
                this.stopTimer();
            }

            this.activePart++;

            // Ensure we have an elapsed time for the new part.
            if (!this.elapsedTimes[this.activePart]) {
                this.elapsedTimes[this.activePart] = 0;
            }

            this.saveState();
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
            partIndex: partIndex,
            startTime: Date.now() // Store the timestamp when comment started
        };
        
        /* //Play comment start sound if enabled
        // if (soundManager && soundManager.isSoundEnabled) {
        //     soundManager.playCommentStartSound();
        } */
        
        clearInterval(this.commentInterval);
        
        this.commentInterval = setInterval(() => {
            const currentElement = document.getElementById(`currentComment-${partIndex}`);
            if (currentElement && this.activeComment) {
                // Calculate comment duration based on elapsed time
                const currentElapsed = this.elapsedTimes[partIndex] || 0;
                const commentDuration = currentElapsed - this.activeComment.startElapsed;
                
                // Round to 1 decimal place for display to show more precise timing
                const displayDuration = Math.round(commentDuration * 10) / 10;
                currentElement.textContent = formatTime(Math.max(0, displayDuration));
                
                // Add visual indication when approaching comment limit
                if (commentDuration >= COMMENT_LIMIT - 30 && commentDuration < COMMENT_LIMIT) {
                    currentElement.classList.add('text-yellow-500');
                    currentElement.classList.remove('text-red-500');
                } else if (commentDuration >= COMMENT_LIMIT) {
                    currentElement.classList.remove('text-yellow-500');
                    currentElement.classList.add('text-red-500');
                } else {
                    currentElement.classList.remove('text-yellow-500', 'text-red-500');
                }
            }
        }, COMMENT_DISPLAY_UPDATE_INTERVAL);
    },
    
    // Finalize the active comment
    finalizeComment() {
        if (!this.activeComment) return;
        
        const partIndex = this.activeComment.partIndex;
        const duration = (this.elapsedTimes[partIndex] || 0) - this.activeComment.startElapsed;
        
        /* // Play comment end sound if enabled
        if (soundManager && soundManager.isSoundEnabled) {
           soundManager.playCommentEndSound();
        } */
        
        // Only add comment if duration is at least 1 second
        if (duration >= 1) {
            const finalDuration = Math.min(duration, COMMENT_LIMIT);
            const now = Date.now();
            
            this.comments.push({
                duration: finalDuration,
                timestamp: now,
                partName: this.meetingParts[partIndex].name,
                partIndex: partIndex,
                id: now.toString() + Math.random().toString(36).substr(2, 9) // Unique ID
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
        // (positive `seconds` will make the comment longer, negative will shorten it)
        let newStartElapsed = this.activeComment.startElapsed - seconds;

        // Never allow the start elapsed to go below zero or ahead of the current part time
        // which would make the duration negative. This clause is the core fix for the bug.
        newStartElapsed = Math.max(0, Math.min(newStartElapsed, currentPartTime));

        // Ensure we don't make the comment longer than COMMENT_LIMIT
        const potentialDuration = currentPartTime - newStartElapsed;
        if (potentialDuration <= COMMENT_LIMIT) {
            this.activeComment.startElapsed = newStartElapsed;
        } else {
            // If the change would exceed the limit, clamp to the maximum allowed duration
            this.activeComment.startElapsed = currentPartTime - COMMENT_LIMIT;
        }

        // Update display immediately
        const currentElement = document.getElementById(`currentComment-${partIndex}`);
        if (currentElement) {
            const commentDuration = currentPartTime - this.activeComment.startElapsed;
            currentElement.textContent = formatTime(Math.max(0, commentDuration));
        }
    },
    
    // Generate a meeting report
    generateReport() {
        const report = {
            date: new Date().toLocaleDateString(),
            totalDuration: 0,
            parts: [],
            comments: {
                total: this.comments.length,
                average: 0,
                byPart: {}
            }
        };
        
        // Calculate total meeting duration and part information
        this.meetingParts.forEach((part, index) => {
            const elapsed = this.elapsedTimes[index] || 0;
            report.totalDuration += elapsed;
            
            // Get comments for this part
            const partComments = this.comments.filter(comment => comment.partIndex === index);
            
            report.parts.push({
                name: part.name,
                speaker: part.speaker,
                plannedDuration: part.duration,
                actualDuration: elapsed,
                variance: elapsed - part.duration,
                comments: partComments.length,
                commentsDuration: partComments.reduce((sum, comment) => sum + comment.duration, 0)
            });
            
            // Add to comments by part
            if (partComments.length > 0) {
                report.comments.byPart[part.name] = {
                    count: partComments.length,
                    total: partComments.reduce((sum, comment) => sum + comment.duration, 0),
                    average: Math.round(partComments.reduce((sum, comment) => sum + comment.duration, 0) / partComments.length)
                };
            }
        });
        
        // Calculate average comment duration
        if (this.comments.length > 0) {
            report.comments.average = Math.round(
                this.comments.reduce((sum, comment) => sum + comment.duration, 0) / this.comments.length
            );
        }
        
        return report;
    },
    
    updateEditModeUi() {
        const editModeToggle = DOM.elements.editModeToggle;
        if (editModeToggle) {
            editModeToggle.setAttribute('aria-pressed', this.isEditMode ? 'true' : 'false');
            editModeToggle.setAttribute('aria-label', this.isEditMode ? 'Disable edit mode' : 'Enable edit mode');
            editModeToggle.title = this.isEditMode ? 'Disable edit mode' : 'Enable edit mode';
        }

        const editModeControls = DOM.elements.editModeControls;
        if (editModeControls) {
            editModeControls.classList.toggle('hidden', !this.isEditMode);
        }

        const editModeInstructions = DOM.elements.editModeInstructions;
        if (editModeInstructions) {
            editModeInstructions.classList.toggle('hidden', !this.isEditMode);
        }
    },
    // Toggle edit mode
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        // Save edit mode state to localStorage
        persistence.setString(STORAGE_KEYS.isEditMode, this.isEditMode);
        
        this.updateEditModeUi();
        
// Re-render the timer display with edit controls
        render.timerDisplay();
        
        return true;
    },

    // Start editing a part
    editPart(index) {
        if (index < 0 || index >= this.meetingParts.length) return;
        this.editingPartIndex = index;
        const part = this.meetingParts[index];
        this.inlineEditDraft = {
            index: index,
            name: part.name || '',
            speaker: part.speaker || '',
            durationValue: String(Math.max(1, Math.floor(part.duration / 60))),
            enableComments: !!part.enableComments
        };
        render.timerDisplay();
        render.focusInlinePartEditor(index);
    },

    // Keep unsaved inline editor values in state so re-renders do not clear user input.
    syncInlineEditDraft(index) {
        if (index < 0 || index >= this.meetingParts.length || this.editingPartIndex !== index) return;

        const nameInput = document.getElementById(`editPartName-inline-${index}`);
        const speakerInput = document.getElementById(`editPartSpeaker-inline-${index}`);
        const durationInput = document.getElementById(`editPartDuration-inline-${index}`);
        const commentsCheckbox = document.getElementById(`editPartComments-inline-${index}`);

        if (!this.inlineEditDraft || this.inlineEditDraft.index !== index) {
            const part = this.meetingParts[index];
            this.inlineEditDraft = {
                index: index,
                name: part.name || '',
                speaker: part.speaker || '',
                durationValue: String(Math.max(1, Math.floor(part.duration / 60))),
                enableComments: !!part.enableComments
            };
        }

        if (nameInput) {
            this.inlineEditDraft.name = nameInput.value;
        }
        if (speakerInput) {
            this.inlineEditDraft.speaker = speakerInput.value;
        }
        if (durationInput) {
            this.inlineEditDraft.durationValue = durationInput.value;
        }
        if (commentsCheckbox) {
            this.inlineEditDraft.enableComments = commentsCheckbox.checked;
        }
    },

    // Save inline part edits from the active card
    saveInlinePartEdits(index) {
        if (index < 0 || index >= this.meetingParts.length || this.editingPartIndex !== index) return;

        this.syncInlineEditDraft(index);

        const nameInput = document.getElementById(`editPartName-inline-${index}`);
        const speakerInput = document.getElementById(`editPartSpeaker-inline-${index}`);
        const durationInput = document.getElementById(`editPartDuration-inline-${index}`);
        const commentsCheckbox = document.getElementById(`editPartComments-inline-${index}`);

        const draft = this.inlineEditDraft && this.inlineEditDraft.index === index ? this.inlineEditDraft : null;

        const name = (nameInput ? nameInput.value : (draft ? draft.name : '')).trim();
        const speaker = (speakerInput ? speakerInput.value : (draft ? draft.speaker : '')).trim();
        const durationValue = durationInput ? durationInput.value : (draft ? draft.durationValue : '');
        const durationMinutes = parseInt(durationValue, 10);
        const enableComments = commentsCheckbox ? commentsCheckbox.checked : !!(draft && draft.enableComments);

        if (!name) {
            notify.show('Please enter a part name', 'error');
            if (nameInput) {
                nameInput.focus();
            }
            return;
        }

        if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) {
            notify.show('Enter a duration from 1 to 180 minutes', 'error');
            if (durationInput) {
                durationInput.focus();
                durationInput.select();
            }
            return;
        }

        this.meetingParts[index] = {
            name: name,
            speaker: speaker,
            duration: durationMinutes * 60,
            enableComments: enableComments
        };

        persistence.setJson(STORAGE_KEYS.meetingTemplate, this.meetingParts);
        this.editingPartIndex = null;
        this.inlineEditDraft = null;
        render.timerDisplay();
    },

    // Save part edits
    savePartEdits() {
        if (this.editingPartIndex === null) return;
        
        const nameInput = document.getElementById('editPartName');
        const speakerInput = document.getElementById('editPartSpeaker');
        const durationInput = document.getElementById('editPartDuration');
        const commentsCheckbox = document.getElementById('editPartComments');
        
        if (!nameInput || !durationInput) return;
        
        const name = nameInput.value.trim();
        const speaker = speakerInput ? speakerInput.value.trim() : '';
        const durationMinutes = parseInt(durationInput.value) || 1;
        const enableComments = commentsCheckbox ? commentsCheckbox.checked : false;
        
        if (name) {
            this.meetingParts[this.editingPartIndex] = {
                name: name,
                speaker: speaker,
                duration: durationMinutes * 60,
                enableComments: enableComments
            };
            
            // Save to localStorage
            persistence.setJson(STORAGE_KEYS.meetingTemplate, this.meetingParts);
            
            // Re-render
            render.timerDisplay();
            
            // Close the modal
            DOM._hideModal(DOM.elements.partEditorModal);
            
this.editingPartIndex = null;
        } else {
            notify.show('Please enter a part name', 'error');
        }
    },

    // Cancel part edits
    cancelPartEdits() {
        this.editingPartIndex = null;
        this.inlineEditDraft = null;

        // Close the modal if it is open (legacy path)
        DOM._hideModal(DOM.elements.partEditorModal);

render.timerDisplay();
    },

    // Add a new part at a specific position
    addPartAt(index) {
        if (!this.isEditMode && this.editingPartIndex === null) return;
        if (this.isRunning) {
            notify.show('Stop the timer before adding a part', 'warning');
            return;
        }
        
        const newPart = {
            name: 'New Part',
            duration: 5 * 60,
            speaker: '',
            enableComments: false
        };
        const insertIndex = Math.max(0, Math.min(index, this.meetingParts.length));
        const oldElapsedTimes = { ...this.elapsedTimes };
        
        this.meetingParts.splice(insertIndex, 0, newPart);

        const reindexedElapsedTimes = {};
        Object.keys(oldElapsedTimes).forEach((key) => {
            const oldIndex = parseInt(key, 10);
            if (Number.isNaN(oldIndex)) return;
            const newIndex = oldIndex >= insertIndex ? oldIndex + 1 : oldIndex;
            reindexedElapsedTimes[newIndex] = oldElapsedTimes[oldIndex];
        });
        this.elapsedTimes = reindexedElapsedTimes;

        this.comments = this.comments.map((comment) => {
            if (comment.partIndex >= insertIndex) {
                return { ...comment, partIndex: comment.partIndex + 1 };
            }
            return comment;
        });

        if (this.activePart >= insertIndex) {
            this.activePart++;
        }
        
        // Save to localStorage
        persistence.setJson(STORAGE_KEYS.meetingTemplate, this.meetingParts);
        this.saveState();
        
        // Re-render
        render.timerDisplay();
        
        // Edit the new part
        this.editPart(insertIndex);
    },

    // Add a new part at the end
    addPart() {
        this.addPartAt(this.meetingParts.length);
    },

    // Remove a part
    removePart(index) {
        if (index < 0 || index >= this.meetingParts.length) return;
        if (this.isRunning) {
            notify.show('Stop the timer before removing a part', 'warning');
            return;
        }
        if (this.meetingParts.length <= 1) {
            notify.show('At least one part is required', 'warning');
            return;
        }
        
        // Show confirmation dialog
        DOM.showConfirmation(
            'Remove Part',
            `Are you sure you want to remove "${this.meetingParts[index].name}"?`,
            () => {
                const oldElapsedTimes = { ...this.elapsedTimes };
                this.meetingParts.splice(index, 1);

                // Reindex elapsed times to follow shifted part indexes.
                const reindexedElapsedTimes = {};
                Object.keys(oldElapsedTimes).forEach((key) => {
                    const oldIndex = parseInt(key, 10);
                    if (Number.isNaN(oldIndex) || oldIndex === index) return;
                    const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
                    reindexedElapsedTimes[newIndex] = oldElapsedTimes[oldIndex];
                });
                this.elapsedTimes = reindexedElapsedTimes;

                // Drop comments for removed part and shift later indexes.
                this.comments = this.comments
                    .filter(comment => comment.partIndex !== index)
                    .map((comment) => {
                        if (comment.partIndex > index) {
                            return { ...comment, partIndex: comment.partIndex - 1 };
                        }
                        return comment;
                    });
                
                // Adjust active part if needed
                if (this.activePart > index) {
                    this.activePart--;
                } else if (this.activePart >= this.meetingParts.length) {
                    this.activePart = Math.max(0, this.meetingParts.length - 1);
                }

                if (this.editingPartIndex === index) {
                    this.editingPartIndex = null;
                    this.inlineEditDraft = null;
                } else if (this.editingPartIndex !== null && this.editingPartIndex > index) {
                    this.editingPartIndex--;
                    if (this.inlineEditDraft) {
                        this.inlineEditDraft.index = this.editingPartIndex;
                    }
                }
                
                // Save to localStorage
                persistence.setJson(STORAGE_KEYS.meetingTemplate, this.meetingParts);
                this.saveState();
                
                // Re-render
                render.timerDisplay();
            }
        );
    },

    // Start dragging a part
    startDrag(index) {
        if (!this.isEditMode || this.isRunning || index < 0 || index >= this.meetingParts.length) return;
        
        this.draggedPartIndex = index;
    },

    // End dragging a part
    endDrag() {
        this.draggedPartIndex = null;
    },

    // Move a part to a new position
    movePart(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.meetingParts.length ||
            toIndex < 0 || toIndex >= this.meetingParts.length ||
            fromIndex === toIndex) return;
        if (this.isRunning) {
            notify.show('Stop the timer before reordering parts', 'warning');
            return;
        }
        
        // Get the part to move
        const part = this.meetingParts[fromIndex];
        const oldElapsedTimes = { ...this.elapsedTimes };
        
        // Remove from current position
        this.meetingParts.splice(fromIndex, 1);
        
        // Insert at new position
        this.meetingParts.splice(toIndex, 0, part);

        // Reindex elapsed times to match the new order.
        const reindexedElapsedTimes = {};
        Object.keys(oldElapsedTimes).forEach((key) => {
            const oldIndex = parseInt(key, 10);
            if (Number.isNaN(oldIndex)) return;

            let newIndex = oldIndex;
            if (oldIndex === fromIndex) {
                newIndex = toIndex;
            } else if (fromIndex < toIndex && oldIndex > fromIndex && oldIndex <= toIndex) {
                newIndex = oldIndex - 1;
            } else if (fromIndex > toIndex && oldIndex >= toIndex && oldIndex < fromIndex) {
                newIndex = oldIndex + 1;
            }
            reindexedElapsedTimes[newIndex] = oldElapsedTimes[oldIndex];
        });
        this.elapsedTimes = reindexedElapsedTimes;

        // Keep comment part indexes aligned to the moved parts.
        this.comments = this.comments.map((comment) => {
            let newPartIndex = comment.partIndex;
            if (comment.partIndex === fromIndex) {
                newPartIndex = toIndex;
            } else if (fromIndex < toIndex && comment.partIndex > fromIndex && comment.partIndex <= toIndex) {
                newPartIndex = comment.partIndex - 1;
            } else if (fromIndex > toIndex && comment.partIndex >= toIndex && comment.partIndex < fromIndex) {
                newPartIndex = comment.partIndex + 1;
            }
            return { ...comment, partIndex: newPartIndex };
        });
        
        // Adjust active part if needed
        if (this.activePart === fromIndex) {
            this.activePart = toIndex;
        } else if (this.activePart > fromIndex && this.activePart <= toIndex) {
            this.activePart--;
        } else if (this.activePart < fromIndex && this.activePart >= toIndex) {
            this.activePart++;
        }

        // Keep inline editor attached to the same logical part after move.
        if (this.editingPartIndex === fromIndex) {
            this.editingPartIndex = toIndex;
            if (this.inlineEditDraft) {
                this.inlineEditDraft.index = toIndex;
            }
        } else if (this.editingPartIndex !== null) {
            if (fromIndex < toIndex && this.editingPartIndex > fromIndex && this.editingPartIndex <= toIndex) {
                this.editingPartIndex--;
                if (this.inlineEditDraft) {
                    this.inlineEditDraft.index = this.editingPartIndex;
                }
            } else if (fromIndex > toIndex && this.editingPartIndex >= toIndex && this.editingPartIndex < fromIndex) {
                this.editingPartIndex++;
                if (this.inlineEditDraft) {
                    this.inlineEditDraft.index = this.editingPartIndex;
                }
            }
        }
        
        // Save to localStorage
        persistence.setJson(STORAGE_KEYS.meetingTemplate, this.meetingParts);
        this.saveState();
        
        // Re-render
        render.timerDisplay();
    }
};

//----------------------------------------------------------------------------------------------
// TEMPLATE MANAGEMENT
//----------------------------------------------------------------------------------------------
const templateManager = {
    // Default categories
    defaultCategories: ['Midweek Meeting', 'Weekend Meeting', 'Special Event'],
    
    // Current template being previewed
    currentPreviewTemplate: null,
    
    // Templates to import
    importTemplates: [],
    
    // Initialize template manager
    init() {
        // Migrate old templates to new format if needed
        this.migrateTemplates();
        
        // Initialize categories
        this.initCategories();
    },
    
    // Migrate old templates to new format
    migrateTemplates() {
        try {
            const oldTemplatesObj = persistence.getJson(STORAGE_KEYS.savedTemplates, null);
            if (oldTemplatesObj) {
                
                // Check if we need to migrate (old format is an object with template names as keys)
                if (oldTemplatesObj && typeof oldTemplatesObj === 'object' && !oldTemplatesObj.templates) {
                    console.log('Migrating templates to new format...');
                    
                    // Create new templates object
                    const newTemplates = {
                        templates: {},
                        categories: this.defaultCategories
                    };
                    
                    // Convert old templates to new format
                    Object.keys(oldTemplatesObj).forEach(name => {
                        const templateId = 'template-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                        newTemplates.templates[templateId] = {
                            name: name,
                            parts: oldTemplatesObj[name],
                            metadata: {
                                description: '',
                                categories: [],
                                created: new Date().toISOString(),
                                modified: new Date().toISOString(),
                                version: 1
                            }
                        };
                    });
                    
                    // Save new templates
                    this.saveTemplates(newTemplates);
                    console.log('Templates migrated successfully');
                }
            }
        } catch (error) {
            console.error('Error migrating templates:', error);
        }
    },
    
    // Initialize categories
    initCategories() {
        try {
            const templates = this.getTemplates();
            
            // If no categories exist, add default categories
            if (!templates.categories || !Array.isArray(templates.categories)) {
                templates.categories = this.defaultCategories;
                this.saveTemplates(templates);
            }
            
            // Populate category dropdowns
            this.populateCategoryDropdowns();
        } catch (error) {
            console.error('Error initializing categories:', error);
        }
    },
    
    // Populate category dropdowns
    populateCategoryDropdowns() {
        try {
            const templates = this.getTemplates();
            const categories = templates.categories || [];
            
            // Populate template category select
            const templateCategorySelect = DOM.elements.templateCategory;
            if (templateCategorySelect) {
                // Clear existing options except the first one
                while (templateCategorySelect.options.length > 1) {
                    templateCategorySelect.remove(1);
                }
                
                // Add categories
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    templateCategorySelect.appendChild(option);
                });
            }
            
            // Populate category filter select
            const categoryFilterSelect = DOM.elements.templateCategoryFilter;
            if (categoryFilterSelect) {
                // Clear existing options except the first one
                while (categoryFilterSelect.options.length > 1) {
                    categoryFilterSelect.remove(1);
                }
                
                // Add categories
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilterSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error populating category dropdowns:', error);
        }
    },
    
    // Get all saved templates
    getTemplates() {
        try {
            const templates = persistence.getJson(STORAGE_KEYS.savedTemplates, null);
            if (templates) return templates;
            
            // Return empty templates object if none exist
            return {
                templates: {},
                categories: this.defaultCategories
            };
        } catch (error) {
            console.error('Error loading templates:', error);
            return {
                templates: {},
                categories: this.defaultCategories
            };
        }
    },

    saveTemplates(templates) {
        persistence.setJson(STORAGE_KEYS.savedTemplates, templates);
    },
    
    // Generate a unique template ID
    generateTemplateId() {
        return 'template-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },
    
    // Save current template with a name, description, and category
    saveTemplate(name, description = '', category = '') {
        try {
            const templates = this.getTemplates();
            const templateId = this.generateTemplateId();
            
            // Create template object
            templates.templates[templateId] = {
                name: name,
                parts: JSON.parse(JSON.stringify(state.meetingParts)), // Deep copy
                metadata: {
                    description: description,
                    categories: category ? [category] : [],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    version: 1
                }
            };
            
            // Save templates
            this.saveTemplates(templates);
            
            notify.show(`Template "${name}" saved successfully`, 'success');
        } catch (error) {
            console.error('Error saving template:', error);
            notify.show('Failed to save template', 'error');
        }
    },
    
    // Add a new category
    addCategory(name) {
        try {
            const templates = this.getTemplates();
            const categories = templates.categories || [];
            
            // Check if category already exists
            if (categories.includes(name)) {
                notify.show(`Category "${name}" already exists`, 'warning');
                return;
            }
            
            // Add category
            categories.push(name);
            templates.categories = categories;
            this.saveTemplates(templates);
            
            // Populate category dropdowns
            this.populateCategoryDropdowns();
            
            // Set the new category as selected
            const templateCategorySelect = DOM.elements.templateCategory;
            if (templateCategorySelect) {
                templateCategorySelect.value = name;
            }
            
            notify.show(`Category "${name}" added successfully`, 'success');
        } catch (error) {
            console.error('Error adding category:', error);
            notify.show('Failed to add category', 'error');
        }
    },
    
    // Populate templates list
    populateTemplatesList() {
        try {
            const templatesList = DOM.elements.templatesList;
            if (!templatesList) return;
            
            // Clear templates list
            templatesList.innerHTML = '';
            
            // Get templates
            const templates = this.getTemplates();
            const templateObjects = templates.templates || {};
            
            // Get search, filter, and sort values
            const searchValue = DOM.elements.templateSearch ? DOM.elements.templateSearch.value.toLowerCase() : '';
            const categoryFilter = DOM.elements.templateCategoryFilter ? DOM.elements.templateCategoryFilter.value : '';
            const sortBy = DOM.elements.templateSort ? DOM.elements.templateSort.value : 'name';
            
            // Filter and sort templates
            const filteredTemplates = Object.entries(templateObjects)
                .filter(([id, template]) => {
                    // Search filter
                    if (searchValue && !template.name.toLowerCase().includes(searchValue)) {
                        return false;
                    }
                    
                    // Category filter
                    if (categoryFilter && !template.metadata.categories.includes(categoryFilter)) {
                        return false;
                    }
                    
                    return true;
                })
                .sort(([idA, a], [idB, b]) => {
                    // Sort by name
                    if (sortBy === 'name') {
                        return a.name.localeCompare(b.name);
                    }
                    
                    // Sort by created date
                    if (sortBy === 'created') {
                        return new Date(b.metadata.created) - new Date(a.metadata.created);
                    }
                    
                    // Sort by modified date
                    if (sortBy === 'modified') {
                        return new Date(b.metadata.modified) - new Date(a.metadata.modified);
                    }
                    
                    return 0;
                });
            
            // Add templates to list
            if (filteredTemplates.length === 0) {
                templatesList.innerHTML = '<div class="text-center text-gray-500 py-4">No templates found</div>';
                return;
            }
            
            filteredTemplates.forEach(([id, template]) => {
                const templateElement = document.createElement('div');
                templateElement.className = 'bg-white p-4 rounded shadow';
                
                // Format dates
                const created = new Date(template.metadata.created).toLocaleDateString();
                const modified = new Date(template.metadata.modified).toLocaleDateString();
                
                // Calculate total duration
                const totalDuration = template.parts.reduce((sum, part) => sum + part.duration, 0);
                
                templateElement.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold">${template.name}</h4>
                            <div class="text-sm text-gray-600">
                                ${template.parts.length} parts, ${formatTime(totalDuration)}
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="preview-template-btn px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600" data-template-id="${id}">
                                Preview
                            </button>
                            <button class="load-template-btn px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600" data-template-id="${id}">
                                Load
                            </button>
                            <button class="delete-template-btn px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600" data-template-id="${id}">
                                Delete
                            </button>
                        </div>
                    </div>
                    ${template.metadata.description ? `<p class="text-sm mt-2">${template.metadata.description}</p>` : ''}
                    <div class="flex flex-wrap gap-1 mt-2">
                        ${template.metadata.categories.map(category => `
                            <span class="bg-gray-100 text-xs px-2 py-1 rounded">${category}</span>
                        `).join('')}
                        <span class="bg-gray-100 text-xs px-2 py-1 rounded">Created: ${created}</span>
                        <span class="bg-gray-100 text-xs px-2 py-1 rounded">Modified: ${modified}</span>
                    </div>
                `;
                
                // Add event listeners
                const previewBtn = templateElement.querySelector('.preview-template-btn');
                const loadBtn = templateElement.querySelector('.load-template-btn');
                const deleteBtn = templateElement.querySelector('.delete-template-btn');
                
                if (previewBtn) {
                    previewBtn.addEventListener('click', () => this.previewTemplate(id));
                }
                
                if (loadBtn) {
                    loadBtn.addEventListener('click', () => this.loadTemplate(id));
                }
                
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteTemplate(id));
                }
                
                templatesList.appendChild(templateElement);
            });
        } catch (error) {
            console.error('Error populating templates list:', error);
            notify.show('Failed to load templates', 'error');
        }
    },
    
    // Preview template
    previewTemplate(templateId) {
        try {
            const templates = this.getTemplates();
            const template = templates.templates[templateId];
            
            if (!template) {
                notify.show('Template not found', 'error');
                return;
            }
            
            // Set current preview template
            this.currentPreviewTemplate = templateId;
            
            // Set preview modal content
            DOM.elements.previewTitle.textContent = template.name;
            DOM.elements.previewDescription.textContent = template.metadata.description || 'No description';
            
            // Set category
            const category = template.metadata.categories.length > 0 ? template.metadata.categories[0] : 'None';
            DOM.elements.previewCategory.textContent = `Category: ${category}`;
            
            // Set dates
            const created = new Date(template.metadata.created).toLocaleDateString();
            const modified = new Date(template.metadata.modified).toLocaleDateString();
            DOM.elements.previewCreated.textContent = `Created: ${created}`;
            DOM.elements.previewModified.textContent = `Modified: ${modified}`;
            
            // Set parts
            const previewParts = DOM.elements.previewParts;
            previewParts.innerHTML = '';
            
            template.parts.forEach((part, index) => {
                const partElement = document.createElement('div');
                partElement.className = 'bg-white p-2 rounded shadow mb-2';
                partElement.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div class="font-medium">${part.name}</div>
                        <div class="text-sm text-gray-600">${formatTime(part.duration)}</div>
                    </div>
                    <div class="flex justify-between items-center text-sm text-gray-600">
                        <div>${part.speaker || 'No speaker'}</div>
                        <div>Comments: ${part.enableComments ? 'Yes' : 'No'}</div>
                    </div>
                `;
                previewParts.appendChild(partElement);
            });
            
            // Set total parts and duration
            const totalDuration = template.parts.reduce((sum, part) => sum + part.duration, 0);
            DOM.elements.previewTotalParts.textContent = template.parts.length;
            DOM.elements.previewTotalDuration.textContent = formatTime(totalDuration);
            
            // Set load button event listener
            const loadBtn = DOM.elements.loadPreviewedTemplate;
            if (loadBtn) {
                // Remove existing event listeners
                const newLoadBtn = loadBtn.cloneNode(true);
                loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
                DOM.elements.loadPreviewedTemplate = newLoadBtn;
                
                // Add new event listener
                newLoadBtn.addEventListener('click', () => {
                    this.loadTemplate(templateId);
                    DOM._hideModal(DOM.elements.previewModal);
                });
            }
            
            // Set export button event listener
            const exportBtn = DOM.elements.exportPreviewedTemplate;
            if (exportBtn) {
                // Remove existing event listeners
                const newExportBtn = exportBtn.cloneNode(true);
                exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
                DOM.elements.exportPreviewedTemplate = newExportBtn;
                
                // Add new event listener
                newExportBtn.addEventListener('click', () => {
                    this.exportTemplate(templateId);
                });
            }
            
            // Show preview modal
            DOM._showModal(DOM.elements.previewModal);
        } catch (error) {
            console.error('Error previewing template:', error);
            notify.show('Failed to preview template', 'error');
        }
    },
    
    // Load template
    loadTemplate(templateId) {
        try {
            const templates = this.getTemplates();
            const template = templates.templates[templateId];
            
            if (!template) {
                notify.show('Template not found', 'error');
                return;
            }
            
            // Confirm if there are unsaved changes
            if (state.isRunning) {
                DOM.showConfirmation(
                    'Load Template',
                    'Loading a new template will stop the current timer and reset all timing data. Are you sure you want to continue?',
                    () => {
                        this._loadTemplate(template);
                    }
                );
            } else {
                this._loadTemplate(template);
            }
        } catch (error) {
            console.error('Error loading template:', error);
            notify.show('Failed to load template', 'error');
        }
    },
    
    // Internal load template
    _loadTemplate(template) {
        // Stop timer if running
        if (state.isRunning) {
            state.stopTimer();
        }
        
        // Set meeting parts
        state.meetingParts = JSON.parse(JSON.stringify(template.parts)); // Deep copy
        
        // Reset timers
        state.resetTimers();
        
        // Render template
        render.templateEditor();
        render.timerDisplay();
        
        // Hide template modal
        DOM._hideModal(DOM.elements.templateModal);
        
        notify.show(`Template "${template.name}" loaded successfully`, 'success');
    },
    
    // Delete template
    deleteTemplate(templateId) {
        try {
            const templates = this.getTemplates();
            const template = templates.templates[templateId];
            
            if (!template) {
                notify.show('Template not found', 'error');
                return;
            }
            
            // Confirm deletion
            DOM.showConfirmation(
                'Delete Template',
                `Are you sure you want to delete the template "${template.name}"?`,
                () => {
                    // Delete template
                    delete templates.templates[templateId];
                    
                    // Save templates
                    this.saveTemplates(templates);
                    
                    // Repopulate templates list
                    this.populateTemplatesList();
                    
                    notify.show(`Template "${template.name}" deleted successfully`, 'success');
                }
            );
        } catch (error) {
            console.error('Error deleting template:', error);
            notify.show('Failed to delete template', 'error');
        }
    },
    
    // Export template
    exportTemplate(templateId) {
        try {
            const templates = this.getTemplates();
            const template = templates.templates[templateId];
            
            if (!template) {
                notify.show('Template not found', 'error');
                return;
            }
            
            // Create export object
            const exportObj = {
                name: template.name,
                parts: template.parts,
                metadata: template.metadata
            };
            
            // Convert to JSON
            const json = JSON.stringify(exportObj, null, 2);
            
            // Create download link
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${template.name.replace(/\s+/g, '_')}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            notify.show(`Template "${template.name}" exported successfully`, 'success');
        } catch (error) {
            console.error('Error exporting template:', error);
            notify.show('Failed to export template', 'error');
        }
    },
    
    // Export all templates
    exportAllTemplates() {
        try {
            const templates = this.getTemplates();
            
            // Create export object
            const exportObj = {
                templates: templates.templates,
                categories: templates.categories
            };
            
            // Convert to JSON
            const json = JSON.stringify(exportObj, null, 2);
            
            // Create download link
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'meeting_templates.json');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            notify.show('All templates exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting all templates:', error);
            notify.show('Failed to export templates', 'error');
        }
    },
    
    // Handle import file
    handleImportFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Check if it's a single template or multiple templates
                if (data.templates) {
                    // Multiple templates
                    this.importTemplates = data;
                    this.showImportPreview();
                } else {
                    // Single template
                    this.importTemplates = {
                        templates: {
                            [this.generateTemplateId()]: data
                        },
                        categories: []
                    };
                    this.showImportPreview();
                }
            } catch (error) {
                console.error('Error parsing import file:', error);
                notify.show('Failed to parse import file', 'error');
            }
        };
        reader.readAsText(file);
    },
    
    // Show import preview
    showImportPreview() {
        try {
            const importPreview = DOM.elements.importPreview;
            const importList = DOM.elements.importList;
            const confirmImport = DOM.elements.confirmImport;
            
            if (!importPreview || !importList || !confirmImport) return;
            
            // Clear import list
            importList.innerHTML = '';
            
            // Get templates
            const templates = this.importTemplates.templates || {};
            
            // Add templates to list
            Object.values(templates).forEach(template => {
                const li = document.createElement('li');
                li.textContent = template.name;
                importList.appendChild(li);
            });
            
            // Show import preview
            importPreview.classList.remove('hidden');
            
            // Enable confirm import button
            confirmImport.disabled = false;
        } catch (error) {
            console.error('Error showing import preview:', error);
            notify.show('Failed to show import preview', 'error');
        }
    },
    
    // Import templates
    importTemplates() {
        try {
            const templates = this.getTemplates();
            
            // Get import templates
            const importTemplates = this.importTemplates.templates || {};
            const importCategories = this.importTemplates.categories || [];
            
            // Add import templates to templates
            Object.entries(importTemplates).forEach(([_, template]) => {
                const templateId = this.generateTemplateId();
                templates.templates[templateId] = template;
            });
            
            // Add import categories to categories
            importCategories.forEach(category => {
                if (!templates.categories.includes(category)) {
                    templates.categories.push(category);
                }
            });
            
            // Save templates
            this.saveTemplates(templates);
            
            // Populate category dropdowns
            this.populateCategoryDropdowns();
            
            notify.show('Templates imported successfully', 'success');
        } catch (error) {
            console.error('Error importing templates:', error);
            notify.show('Failed to import templates', 'error');
        }
    }
};

//----------------------------------------------------------------------------------------------
// INITIALIZATION
//----------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM cache
    DOM.init();
    
    // Initialize state
    state.init();
    
    // Populate scheduler inputs based on previously saved times
    DOM.updateMeetingForm();
    
    // Initialize template manager
    templateManager.init();
    
    // Initialize rendering
    render.init();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Only handle shortcuts when not in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Space: Start/stop timer
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            state.toggleTimer();
        }
        
        // N: Next part
        if (e.key === 'n' || e.key === 'N') {
            state.startNextPart();
        }
        
        // C: Start/stop comment
        if ((e.key === 'c' || e.key === 'C') && 
            state.isRunning && 
            state.meetingParts[state.activePart].enableComments) {
            state.toggleComment(state.activePart);
        }
        
        // +: Add 5 seconds
        if (e.key === '+' || e.key === '=') {
            if (state.activeComment) {
                state.adjustCommentTimer(5);
            } else {
                state.adjustTimer(state.activePart, 5);
            }
        }
        
        // -: Subtract 5 seconds
        if (e.key === '-' || e.key === '_') {
            if (state.activeComment) {
                state.adjustCommentTimer(-5);
            } else {
                state.adjustTimer(state.activePart, -5);
            }
        }
        
        // R: Reset active timer
        if (e.key === 'r' || e.key === 'R') {
            state.resetTimer(state.activePart);
        }
        // E: End global meeting timer (if running or scheduled)
        if (e.key === 'e' || e.key === 'E') {
            state.endMeeting();
        }
        
    });
});

// Simple notification system
const notify = {
    show(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        let container = document.getElementById('toastNotifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastNotifications';
            container.className = 'toast-notifications';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.textContent = message;
        container.appendChild(toast);

        window.setTimeout(() => {
            toast.classList.add('toast-hiding');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3500);
    }
};
