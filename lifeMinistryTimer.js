/**
 * Life and Ministry Timer
 * Version 2.0.0
 * 
 * A comprehensive timer application for managing meeting parts,
 * tracking comments, and maintaining meeting templates.
 */

'use strict';

//----------------------------------------------------------------------------------------------
// UTILITY FUNCTIONS
//----------------------------------------------------------------------------------------------
// Format a timestamp as local datetime string for datetime-local input
function formatLocalDateTime(timestamp) {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
}

//----------------------------------------------------------------------------------------------
// DOM CACHE - Centralized access to DOM elements
//----------------------------------------------------------------------------------------------
const DOM = { // eslint-disable-line no-unused-vars
    elements: {},
    
    init() {
        // Timer section elements
        this.elements.partsTemplate = document.getElementById('partsTemplate'); // Meeting parts template
        this.elements.partsDisplay = document.getElementById('partsDisplay'); // Meeting parts display
        
        // Comment section elements
        this.elements.commentHistory = document.getElementById('commentHistory'); // Comment history display
        this.elements.globalCommentCount = document.getElementById('globalCommentCount'); // Global comment count
        this.elements.globalAverageDuration = document.getElementById('globalAverageDuration'); // Global average comment duration
        
        // Template management elements
        this.elements.saveTemplateBtn = document.getElementById('saveTemplateBtn'); // Save template button
        this.elements.loadTemplateBtn = document.getElementById('loadTemplateBtn'); // Load template button
        
        // Template modal elements
        this.elements.templateModal = document.getElementById('templateModal'); // Template management modal
        this.elements.templatesList = document.getElementById('templatesList'); // List of saved templates
        this.elements.templateName = document.getElementById('templateName'); // Input for template name
        this.elements.templateDescription = document.getElementById('templateDescription'); // Input for template description
        this.elements.templateCategory = document.getElementById('templateCategory'); // Select for template category
        this.elements.templateSearch = document.getElementById('templateSearch'); // Input for template search
        this.elements.templateCategoryFilter = document.getElementById('templateCategoryFilter'); // Select for category filter
        this.elements.templateSort = document.getElementById('templateSort'); // Select for template sort
        this.elements.closeTemplateModal = document.getElementById('closeTemplateModal'); // Close template modal button
        this.elements.saveNewTemplate = document.getElementById('saveNewTemplate'); // Save new template button
        this.elements.importTemplateBtn = document.getElementById('importTemplateBtn'); // Import template button
        this.elements.exportAllTemplatesBtn = document.getElementById('exportAllTemplatesBtn'); // Export all templates button
        this.elements.addCategoryBtn = document.getElementById('addCategoryBtn'); // Add category button
        
        // Category modal elements
        this.elements.categoryModal = document.getElementById('categoryModal'); // Category modal
        this.elements.newCategoryName = document.getElementById('newCategoryName'); // Input for new category name
        this.elements.closeCategoryModal = document.getElementById('closeCategoryModal'); // Close category modal button
        this.elements.saveNewCategory = document.getElementById('saveNewCategory'); // Save new category button
        
        // Preview modal elements
        this.elements.previewModal = document.getElementById('previewModal'); // Preview modal
        this.elements.previewTitle = document.getElementById('previewTitle'); // Preview title
        this.elements.previewDescription = document.getElementById('previewDescription'); // Preview description
        this.elements.previewCategory = document.getElementById('previewCategory'); // Preview category
        this.elements.previewCreated = document.getElementById('previewCreated'); // Preview created date
        this.elements.previewModified = document.getElementById('previewModified'); // Preview modified date
        this.elements.previewParts = document.getElementById('previewParts'); // Preview parts
        this.elements.previewTotalParts = document.getElementById('previewTotalParts'); // Preview total parts
        this.elements.previewTotalDuration = document.getElementById('previewTotalDuration'); // Preview total duration
        this.elements.closePreviewModal = document.getElementById('closePreviewModal'); // Close preview modal button
        this.elements.loadPreviewedTemplate = document.getElementById('loadPreviewedTemplate'); // Load previewed template button
        this.elements.exportPreviewedTemplate = document.getElementById('exportPreviewedTemplate'); // Export previewed template button
        
        // Import modal elements
        this.elements.importModal = document.getElementById('importModal'); // Import modal
        this.elements.importFile = document.getElementById('importFile'); // Import file input
        this.elements.importPreview = document.getElementById('importPreview'); // Import preview
        this.elements.importList = document.getElementById('importList'); // Import list
        this.elements.closeImportModal = document.getElementById('closeImportModal'); // Close import modal button
        this.elements.confirmImport = document.getElementById('confirmImport'); // Confirm import button
        
        // Meeting scheduler elements
        this.elements.meetingStartInput = document.getElementById('meetingStartInput'); // Meeting start time input
        this.elements.meetingEndInput = document.getElementById('meetingEndInput'); // Meeting end time input
        this.elements.scheduleMeetingBtn = document.getElementById('scheduleMeetingBtn'); // Schedule button
        this.elements.meetingRepeatCheckbox = document.getElementById('meetingRepeatCheckbox'); // Repeat weekly checkbox
        this.elements.endMeetingBtn = document.getElementById('endMeetingBtn'); // End meeting button
        this.elements.globalTimerContainer = document.getElementById('globalTimerContainer'); // Container for global timer bar
        
        // Confirmation modal elements
        this.elements.confirmationModal = document.getElementById('confirmationModal'); // Confirmation modal
        this.elements.confirmationTitle = document.getElementById('confirmationTitle'); // Confirmation title
        this.elements.confirmationMessage = document.getElementById('confirmationMessage'); // Confirmation message
        this.elements.cancelConfirmation = document.getElementById('cancelConfirmation'); // Cancel confirmation button
        this.elements.confirmAction = document.getElementById('confirmAction'); // Confirm action button
        
        // Shortcuts modal elements
        this.elements.shortcutsModal = document.getElementById('shortcutsModal'); // Shortcuts modal
        this.elements.closeShortcutsModal = document.getElementById('closeShortcutsModal'); // Close shortcuts modal button
        
        // Edit mode elements
        this.elements.editModeToggle = document.getElementById('editModeToggle'); // Edit mode toggle
        this.elements.editModeControls = document.getElementById('editModeControls'); // Edit mode controls
        this.elements.editModeInstructions = document.getElementById('editModeInstructions'); // Edit mode instructions
        this.elements.addPartBtn = document.getElementById('addPartBtn'); // Add part button
        
        // Part editor modal elements
        this.elements.partEditorModal = document.getElementById('partEditorModal'); // Part editor modal
        this.elements.editPartName = document.getElementById('editPartName'); // Edit part name input
        this.elements.editPartSpeaker = document.getElementById('editPartSpeaker'); // Edit part speaker input
        this.elements.editPartDuration = document.getElementById('editPartDuration'); // Edit part duration input
        this.elements.editPartComments = document.getElementById('editPartComments'); // Edit part comments checkbox
        this.elements.closePartEditorModal = document.getElementById('closePartEditorModal'); // Close part editor modal button
        this.elements.savePartEdits = document.getElementById('savePartEdits'); // Save part edits button
        
        // Add event listeners to buttons
        this._setupEventListeners(); // eslint-disable-line no-underscore-dangle
        
        // Log warning for missing critical elements
        this._checkForMissingElements(); // eslint-disable-line no-underscore-dangle
    },

    // Populate scheduler inputs from state
    updateMeetingForm() {
        if (this.elements.meetingStartInput && state.meetingScheduledStart) {
            this.elements.meetingStartInput.value = formatLocalDateTime(state.meetingScheduledStart);
        }
        if (this.elements.meetingEndInput && state.meetingScheduledEnd) {
            this.elements.meetingEndInput.value = formatLocalDateTime(state.meetingScheduledEnd);
        }
        // update repeat checkbox and refresh timer bar on form update
        if (this.elements.meetingRepeatCheckbox) {
            this.elements.meetingRepeatCheckbox.checked = !!state.meetingRepeatsWeekly;
        }
        render.globalTimerDisplay();
    },

    
    /*
    // Old function. It was replaced with a new one that added the delegated event listeners for #partsDisplay and #commentHistory
    _setupEventListeners() {
        // Template management buttons
        if (this.elements.saveTemplateBtn) { // Save template button
            this.elements.saveTemplateBtn.addEventListener('click', () => {
                this.elements.templateName.value = ''; // Clear the template name input
                this.elements.templateDescription.value = ''; // Clear the template description input
                this.elements.templateCategory.value = ''; // Clear the template category select
                this._showModal(this.elements.templateModal); // Show the template modal
            });
        }
        
        if (this.elements.loadTemplateBtn) { // Load template button
            this.elements.loadTemplateBtn.addEventListener('click', () => {
                templateManager.populateTemplatesList(); // Populate the templates list
                this._showModal(this.elements.templateModal); // Show the template modal
            });
        }
        
        // Template modal buttons
        if (this.elements.closeTemplateModal) { // Close template modal button
            this.elements.closeTemplateModal.addEventListener('click', () => {
                this._hideModal(this.elements.templateModal); // Hide the template modal
            });
        }
        
        if (this.elements.saveNewTemplate) { // Save new template button
            this.elements.saveNewTemplate.addEventListener('click', () => {
                const name = this.elements.templateName.value.trim(); // Get the template name
                if (name) { // If name is not empty
                    const description = this.elements.templateDescription.value.trim(); // Get the template description
                    const category = this.elements.templateCategory.value.trim(); // Get the template category
                    templateManager.saveTemplate(name, description, category); // Save the template
                    this._hideModal(this.elements.templateModal); // Hide the template modal
                } else { // If name is empty
                    notify.show('Please enter a template name', 'error'); // Show an error notification
                }
            });
        }
        
        if (this.elements.importTemplateBtn) { // Import template button
            this.elements.importTemplateBtn.addEventListener('click', () => {
                this._hideModal(this.elements.templateModal); // Hide the template modal
                this.elements.importFile.value = ''; // Clear the import file input
                this.elements.importPreview.classList.add('hidden'); // Hide the import preview
                this.elements.confirmImport.disabled = true; // Disable the confirm import button
                this._showModal(this.elements.importModal); // Show the import modal
            });
        }
        
        if (this.elements.exportAllTemplatesBtn) { // Export all templates button
            this.elements.exportAllTemplatesBtn.addEventListener('click', () => {
                templateManager.exportAllTemplates(); // Export all templates
            });
        }
        
        if (this.elements.addCategoryBtn) { // Add category button
            this.elements.addCategoryBtn.addEventListener('click', () => {
                this.elements.newCategoryName.value = ''; // Clear the new category name input
                this._showModal(this.elements.categoryModal); // Show the category modal
            });
        }
        
        // Template search and filter
        if (this.elements.templateSearch) { // Template search input
            this.elements.templateSearch.addEventListener('input', () => {
                templateManager.populateTemplatesList(); // Populate the templates list
            });
        }
        
        if (this.elements.templateCategoryFilter) { // Template category filter select
            this.elements.templateCategoryFilter.addEventListener('change', () => {
                templateManager.populateTemplatesList(); // Populate the templates list
            });
        }
        
        if (this.elements.templateSort) { // Template sort select
            this.elements.templateSort.addEventListener('change', () => {
                templateManager.populateTemplatesList(); // Populate the templates list
            });
        }
        
        // Category modal buttons
        if (this.elements.closeCategoryModal) { // Close category modal button
            this.elements.closeCategoryModal.addEventListener('click', () => {
                this._hideModal(this.elements.categoryModal); // Hide the category modal
            });
        }
        
        if (this.elements.saveNewCategory) { // Save new category button
            this.elements.saveNewCategory.addEventListener('click', () => {
                const name = this.elements.newCategoryName.value.trim(); // Get the new category name
                if (name) { // If name is not empty
                    templateManager.addCategory(name); // Add the category
                    this._hideModal(this.elements.categoryModal); // Hide the category modal
                } else { // If name is empty
                    notify.show('Please enter a category name', 'error'); // Show an error notification
                }
            });
        }
        
        // Preview modal buttons
        if (this.elements.closePreviewModal) { // Close preview modal button
            this.elements.closePreviewModal.addEventListener('click', () => {
                this._hideModal(this.elements.previewModal); // Hide the preview modal
            });
        }
        
        // Import modal buttons
        if (this.elements.importFile) { // Import file input
            this.elements.importFile.addEventListener('change', (e) => {
                templateManager.handleImportFile(e.target.files[0]); // Handle the import file
            });
        }
        
        if (this.elements.closeImportModal) { // Close import modal button
            this.elements.closeImportModal.addEventListener('click', () => {
                this._hideModal(this.elements.importModal); // Hide the import modal
            });
        }
        
        if (this.elements.confirmImport) { // Confirm import button
            this.elements.confirmImport.addEventListener('click', () => {
                templateManager.importTemplates(); // Import the templates
                this._hideModal(this.elements.importModal); // Hide the import modal
            });
        }
        
        // Confirmation modal buttons
        if (this.elements.cancelConfirmation) { // Cancel confirmation button
            this.elements.cancelConfirmation.addEventListener('click', () => { // Add event listener
                this._hideModal(this.elements.confirmationModal); // Hide the confirmation modal
            });
        }
        
        // Shortcuts modal buttons
        if (this.elements.closeShortcutsModal) { // Close shortcuts modal button
            this.elements.closeShortcutsModal.addEventListener('click', () => {
                this._hideModal(this.elements.shortcutsModal); // Hide the shortcuts modal
            });
        }
        
        // Edit mode toggle
        if (this.elements.editModeToggle) { // Edit mode toggle
            this.elements.editModeToggle.addEventListener('change', () => {
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
        
        // Add part button
        const addPartBtn = document.getElementById('addPartBtn');
        if (addPartBtn) {
            addPartBtn.addEventListener('click', () => {
                if (state.isEditMode) {
                    // Use the new addPart method when in edit mode
                    state.addPart();
                } else {
                    // Legacy behavior for backward compatibility
                    state.meetingParts.push({
                        name: 'New Part',
                        duration: 5*60,
                        speaker: '',
                        enableComments: false
                    });
                    
                    // Render the template editor
                    render.templateEditor();
                    render.timerDisplay();
                }
            });
        }
        
    },
    */
    
    _setupEventListeners() {
        // --- Existing Listeners for Modals, Templates, etc. (Keep These) ---

        // Template management buttons
        if (this.elements.saveTemplateBtn) { // Save template button
            this.elements.saveTemplateBtn.addEventListener('click', () => {
                this.elements.templateName.value = ''; // Clear the template name input
                this.elements.templateDescription.value = ''; // Clear the template description input
                this.elements.templateCategory.value = ''; // Clear the template category select
                this._showModal(this.elements.templateModal); // Show the template modal
            });
        }

        if (this.elements.loadTemplateBtn) { // Load template button
            this.elements.loadTemplateBtn.addEventListener('click', () => {
                templateManager.populateTemplatesList(); // Populate the templates list
                this._showModal(this.elements.templateModal); // Show the template modal
            });
        }

        // Template modal buttons
        if (this.elements.closeTemplateModal) { // Close template modal button
            this.elements.closeTemplateModal.addEventListener('click', () => {
                this._hideModal(this.elements.templateModal); // Hide the template modal
            });
        }

        if (this.elements.saveNewTemplate) { // Save new template button
            this.elements.saveNewTemplate.addEventListener('click', () => {
                const name = this.elements.templateName.value.trim(); // Get the template name
                if (name) { // If name is not empty
                    const description = this.elements.templateDescription.value.trim(); // Get the template description
                    const category = this.elements.templateCategory.value.trim(); // Get the template category
                    templateManager.saveTemplate(name, description, category); // Save the template
                    this._hideModal(this.elements.templateModal); // Hide the template modal
                } else { // If name is empty
                    notify.show('Please enter a template name', 'error'); // Show an error notification
                }
            });
        }

        if (this.elements.importTemplateBtn) { // Import template button
            this.elements.importTemplateBtn.addEventListener('click', () => {
                this._hideModal(this.elements.templateModal); // Hide the template modal
                this.elements.importFile.value = ''; // Clear the import file input
                this.elements.importPreview.classList.add('hidden'); // Hide the import preview
                this.elements.confirmImport.disabled = true; // Disable the confirm import button
                this._showModal(this.elements.importModal); // Show the import modal
            });
        }

        if (this.elements.exportAllTemplatesBtn) { // Export all templates button
            this.elements.exportAllTemplatesBtn.addEventListener('click', () => {
                templateManager.exportAllTemplates(); // Export all templates
            });
        }

        if (this.elements.addCategoryBtn) { // Add category button
            this.elements.addCategoryBtn.addEventListener('click', () => {
                this.elements.newCategoryName.value = ''; // Clear the new category name input
                this._showModal(this.elements.categoryModal); // Show the category modal
            });
        }

        // Template search and filter
        if (this.elements.templateSearch) { // Template search input
            this.elements.templateSearch.addEventListener('input', () => {
                templateManager.populateTemplatesList(); // Populate the templates list
            });
        }

        if (this.elements.templateCategoryFilter) { // Template category filter select
            this.elements.templateCategoryFilter.addEventListener('change', () => {
                templateManager.populateTemplatesList(); // Populate the templates list
            });
        }

        if (this.elements.templateSort) { // Template sort select
            this.elements.templateSort.addEventListener('change', () => {
                templateManager.populateTemplatesList(); // Populate the templates list
            });
        }

        // Category modal buttons
        if (this.elements.closeCategoryModal) { // Close category modal button
            this.elements.closeCategoryModal.addEventListener('click', () => {
                this._hideModal(this.elements.categoryModal); // Hide the category modal
            });
        }

        if (this.elements.saveNewCategory) { // Save new category button
            this.elements.saveNewCategory.addEventListener('click', () => {
                const name = this.elements.newCategoryName.value.trim(); // Get the new category name
                if (name) { // If name is not empty
                    templateManager.addCategory(name); // Add the category
                    this._hideModal(this.elements.categoryModal); // Hide the category modal
                } else { // If name is empty
                    notify.show('Please enter a category name', 'error'); // Show an error notification
                }
            });
        }

        // Preview modal buttons
        if (this.elements.closePreviewModal) { // Close preview modal button
            this.elements.closePreviewModal.addEventListener('click', () => {
                this._hideModal(this.elements.previewModal); // Hide the preview modal
            });
        }

        // Import modal buttons
        if (this.elements.importFile) { // Import file input
            this.elements.importFile.addEventListener('change', (e) => {
                templateManager.handleImportFile(e.target.files[0]); // Handle the import file
            });
        }

        if (this.elements.closeImportModal) { // Close import modal button
            this.elements.closeImportModal.addEventListener('click', () => {
                this._hideModal(this.elements.importModal); // Hide the import modal
            });
        }

        if (this.elements.confirmImport) { // Confirm import button
            this.elements.confirmImport.addEventListener('click', () => {
                templateManager.importTemplates(); // Import the templates
                this._hideModal(this.elements.importModal); // Hide the import modal
            });
        }

        // Confirmation modal buttons
        if (this.elements.cancelConfirmation) { // Cancel confirmation button
            this.elements.cancelConfirmation.addEventListener('click', () => { // Add event listener
                this._hideModal(this.elements.confirmationModal); // Hide the confirmation modal
            });
        }

        // Shortcuts modal buttons
        if (this.elements.closeShortcutsModal) { // Close shortcuts modal button
            this.elements.closeShortcutsModal.addEventListener('click', () => {
                this._hideModal(this.elements.shortcutsModal); // Hide the shortcuts modal
            });
        }

        // --- NEW: Add Delegated Listener for Part Cards ---
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
                         if (state.isEditMode && partIndex !== -1) {
                             state.addPartAt(partIndex);
                         }
                         break;
                    case 'add-part-after':
                         if (state.isEditMode && partIndex !== -1) {
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
                if (event.button !== 0) return;
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

        // --- NEW: Add Delegated Listener for Comment History ---
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

        // Scheduler buttons: Schedule and End Meeting
        if (this.elements.scheduleMeetingBtn) {
            this.elements.scheduleMeetingBtn.addEventListener('click', () => {
                const startVal = this.elements.meetingStartInput ? this.elements.meetingStartInput.value : '';
                const endVal = this.elements.meetingEndInput ? this.elements.meetingEndInput.value : '';
                if (!startVal || !endVal) {
                    notify.show('Please provide both start and end date/time', 'error');
                    return;
                }
                const startTs = new Date(startVal).getTime();
                const endTs = new Date(endVal).getTime();
                if (isNaN(startTs) || isNaN(endTs) || endTs <= startTs) {
                    notify.show('Invalid start/end times', 'error');
                    return;
                }

                const repeatChecked = this.elements.meetingRepeatCheckbox ? this.elements.meetingRepeatCheckbox.checked : true;

                // If currently repeating and the user changes the time, ask whether to apply to recurring schedule
                if (state.meetingRepeatsWeekly && state.recurringBaseStart && repeatChecked && state.recurringBaseStart !== startTs) {
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


        // --- Remaining Original Listeners (Keep These) ---

        // Edit mode toggle
        if (this.elements.editModeToggle) { // Edit mode toggle
            this.elements.editModeToggle.addEventListener('change', () => {
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
        const addPartBtn = document.getElementById('addPartBtn');
        if (addPartBtn) {
            addPartBtn.addEventListener('click', () => {
                if (state.isEditMode) {
                    // Use the new addPart method when in edit mode
                    state.addPart(); // This adds to the end
                }
                // Removed legacy behavior as it's probably not needed now
            });
        }

        // Meeting scheduler listeners
        if (this.elements.scheduleMeetingBtn) {
            this.elements.scheduleMeetingBtn.addEventListener('click', () => {
                const startInput = this.elements.meetingStartInput;
                const endInput = this.elements.meetingEndInput;
                if (!startInput || !endInput) return;
                const startVal = startInput.value;
                const endVal = endInput.value;
                if (!startVal || !endVal) {
                    notify.show('Please enter both start and end times', 'error');
                    return;
                }
                const startTs = new Date(startVal).getTime();
                const endTs = new Date(endVal).getTime();
                if (isNaN(startTs) || isNaN(endTs) || endTs <= startTs) {
                    notify.show('Invalid meeting times – end must be after start', 'error');
                    return;
                }
                state.scheduleMeeting(startTs, endTs);
                render.globalTimerDisplay();
            });
        }

        if (this.elements.endMeetingBtn) {
            this.elements.endMeetingBtn.addEventListener('click', () => {
                state.endMeeting();
            });
        }

    }, // End of _setupEventListeners

    
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
    
    // Initialize application state
    init() {
        this.loadState();
        
        // Initialize edit mode toggle appearance
        const editModeToggle = document.getElementById('editModeToggle');
        if (editModeToggle) {
            editModeToggle.checked = this.isEditMode;
            
            // Update the toggle appearance
            const toggleBackground = editModeToggle.nextElementSibling;
            if (toggleBackground && this.isEditMode) {
                toggleBackground.classList.add('bg-blue-600');
                toggleBackground.classList.remove('bg-gray-200', 'dark:bg-gray-700');
            }
        }
        
        // Set up visibility change handler
        document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
        this._visibilityChangeHandlerSet = true;
        
        // If a meeting is scheduled, ensure global timer interval is running
        if (this.meetingScheduledStart) {
            this._setupMeetingInterval();
            // render initial meeting bar so UI reflects saved schedule
            render.globalTimerDisplay();
        }
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
            
            // Load meeting schedule
            const savedStart = localStorage.getItem('meetingScheduledStart');
            this.meetingScheduledStart = savedStart ? parseInt(savedStart, 10) : null;
            const savedEnd = localStorage.getItem('meetingScheduledEnd');
            this.meetingScheduledEnd = savedEnd ? parseInt(savedEnd, 10) : null;
            const savedActual = localStorage.getItem('meetingActualEnd');
            this.meetingActualEnd = savedActual ? parseInt(savedActual, 10) : null;
            const savedRepeats = localStorage.getItem('meetingRepeatsWeekly');
            this.meetingRepeatsWeekly = savedRepeats !== null ? (savedRepeats === 'true') : true;
            const savedRecurring = localStorage.getItem('recurringBaseStart');
            this.recurringBaseStart = savedRecurring ? parseInt(savedRecurring, 10) : null;
            const savedRecDur = localStorage.getItem('recurringDurationMs');
            this.recurringDurationMs = savedRecDur ? parseInt(savedRecDur, 10) : null;
            const savedOverride = localStorage.getItem('meetingOverride');
            this.meetingOverride = savedOverride ? JSON.parse(savedOverride) : null;
            // meetingIsRunning will be determined later in init
            
            // Legacy edit-mode toggle is no longer user-facing; always default to card-level editing.
            this.isEditMode = false;
            localStorage.removeItem('isEditMode');
            
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
            localStorage.setItem('elapsedTimes', JSON.stringify(this.elapsedTimes));
            localStorage.setItem('activePart', this.activePart.toString());
            localStorage.setItem('meetingComments', JSON.stringify(this.comments));
            // persist meeting schedule information
            if (this.meetingScheduledStart) {
                localStorage.setItem('meetingScheduledStart', this.meetingScheduledStart.toString());
            } else {
                localStorage.removeItem('meetingScheduledStart');
            }
            if (this.meetingScheduledEnd) {
                localStorage.setItem('meetingScheduledEnd', this.meetingScheduledEnd.toString());
            } else {
                localStorage.removeItem('meetingScheduledEnd');
            }
            if (this.meetingActualEnd) {
                localStorage.setItem('meetingActualEnd', this.meetingActualEnd.toString());
            } else {
                localStorage.removeItem('meetingActualEnd');
            }
            localStorage.setItem('meetingRepeatsWeekly', this.meetingRepeatsWeekly ? 'true' : 'false');
            if (this.recurringBaseStart) {
                localStorage.setItem('recurringBaseStart', this.recurringBaseStart.toString());
            } else {
                localStorage.removeItem('recurringBaseStart');
            }
            if (this.recurringDurationMs) {
                localStorage.setItem('recurringDurationMs', this.recurringDurationMs.toString());
            } else {
                localStorage.removeItem('recurringDurationMs');
            }
            if (this.meetingOverride) {
                localStorage.setItem('meetingOverride', JSON.stringify(this.meetingOverride));
            } else {
                localStorage.removeItem('meetingOverride');
            }
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
        localStorage.removeItem('meetingTemplate');
        localStorage.removeItem('elapsedTimes');
        localStorage.removeItem('activePart');
        localStorage.removeItem('meetingComments');
        localStorage.removeItem('isEditMode');
        localStorage.removeItem('meetingScheduledStart');
        localStorage.removeItem('meetingScheduledEnd');
        localStorage.removeItem('meetingActualEnd');
        
        this.meetingParts = DEFAULT_PARTS;
        this.isEditMode = false;
        this.resetTimers();
        this.meetingScheduledStart = null;
        this.meetingScheduledEnd = null;
        this.meetingActualEnd = null;
        this.meetingIsRunning = false;
        if (this.meetingInterval) {
            clearInterval(this.meetingInterval);
            this.meetingInterval = null;
        }
        
        // Update UI for edit mode
        const editModeToggle = document.getElementById('editModeToggle');
        if (editModeToggle) {
            editModeToggle.checked = false;
            
            // Update the toggle appearance
            const toggleBackground = editModeToggle.nextElementSibling;
            if (toggleBackground) {
                toggleBackground.classList.remove('bg-blue-600');
                toggleBackground.classList.add('bg-gray-200');
                // Add dark mode class if in dark mode
                if (document.documentElement.getAttribute('data-theme') === 'dark') {
                    toggleBackground.classList.add('dark:bg-gray-700');
                }
            }
        }
        
        const editModeControls = document.getElementById('editModeControls');
        if (editModeControls) {
            editModeControls.classList.add('hidden');
        }
        
        const editModeInstructions = document.getElementById('editModeInstructions');
        if (editModeInstructions) {
            editModeInstructions.classList.add('hidden');
        }
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
            this.recurringDurationMs = endTs ? (endTs - startTs) : null;
            this.meetingOverride = null;
        } else {
            this.recurringBaseStart = this.recurringBaseStart || null;
            // keep existing recurringDuration if present
            this.recurringDurationMs = this.recurringDurationMs || (endTs ? (endTs - startTs) : null);
            this.meetingOverride = null;
        }
        this.saveState();
        this._setupMeetingInterval();
        render.globalTimerDisplay();
    },

    // Schedule a one-time change while keeping recurring pattern intact
    scheduleOneTimeChange(startTs, endTs) {
        this.meetingOverride = { start: startTs, end: endTs };
        this.meetingScheduledStart = startTs;
        this.meetingScheduledEnd = endTs;
        this.saveState();
        this._setupMeetingInterval();
        render.globalTimerDisplay();
    },

    // Internal: ensure meeting interval is running
    _setupMeetingInterval() {
        if (this.meetingInterval) return; // already set

        this.meetingInterval = setInterval(() => {
            const now = Date.now();
            // auto-start if scheduled and time has arrived
            if (this.meetingScheduledStart && !this.meetingIsRunning && !this.meetingActualEnd && now >= this.meetingScheduledStart) {
                this.startMeeting();
            }
            // Failsafe: if meeting is running and 1.5x scheduled duration has elapsed since scheduled start, auto-end
            if (this.meetingIsRunning && this.meetingScheduledStart && (this.meetingScheduledEnd || this.recurringDurationMs) && !this.meetingActualEnd) {
                const totalMs = (this.meetingScheduledEnd && this.meetingScheduledStart) ? (this.meetingScheduledEnd - this.meetingScheduledStart) : (this.recurringDurationMs || 0);
                if (totalMs > 0) {
                    const cutoff = this.meetingScheduledStart + Math.floor(totalMs * 1.5);
                    if (now >= cutoff) {
                        notify.show('Meeting automatically ended (failsafe)', 'info');
                        this.endMeeting();
                        // render will be updated inside endMeeting
                    }
                }
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
    startMeeting() {
        if (!this.meetingScheduledStart) return;
        this.meetingIsRunning = true;
        // when meeting starts we don't need separate interval—the _setupMeetingInterval covers updates
        // play a notification if desired
        this.saveState();
    },

    // User ends the meeting
    endMeeting() {
        if (!this.meetingIsRunning && !this.meetingScheduledStart) return;
        this.meetingIsRunning = false;
        this.meetingActualEnd = Date.now();
        this.saveState();
        render.globalTimerDisplay();
        // clear interval now since meeting is over
        if (this.meetingInterval) {
            clearInterval(this.meetingInterval);
            this.meetingInterval = null;
        }
        // If repeating weekly, advance to next occurrence after this meeting
        if (this.meetingRepeatsWeekly && this.recurringBaseStart) {
            // Helper: compute next recurring start after now based on recurringBaseStart
            const getNextRecurringStart = (base, afterTs) => {
                const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
                let next = base;
                while (next <= afterTs) {
                    next += WEEK_MS;
                }
                return next;
            };

            const now = Date.now();
            const nextStart = getNextRecurringStart(this.recurringBaseStart, now);
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
                            render.timerDisplay();
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
                    render.timerDisplay();
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
    
    // Toggle edit mode
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        
        // Save edit mode state to localStorage
        localStorage.setItem('isEditMode', this.isEditMode.toString());
        
        // Update UI for edit mode
        const editModeToggle = document.getElementById('editModeToggle');
        if (editModeToggle) {
            editModeToggle.checked = this.isEditMode;
            
            // Update the toggle appearance
            const toggleBackground = editModeToggle.nextElementSibling;
            if (toggleBackground) {
                if (this.isEditMode) {
                    toggleBackground.classList.add('bg-blue-600');
                    toggleBackground.classList.remove('bg-gray-200', 'dark:bg-gray-700');
                } else {
                    toggleBackground.classList.remove('bg-blue-600');
                    toggleBackground.classList.add('bg-gray-200');
                    // Add dark mode class if in dark mode
                    if (document.documentElement.getAttribute('data-theme') === 'dark') {
                        toggleBackground.classList.add('dark:bg-gray-700');
                    }
                }
            }
        }
        
        const editModeControls = document.getElementById('editModeControls');
        if (editModeControls) {
            if (this.isEditMode) {
                editModeControls.classList.remove('hidden');
            } else {
                editModeControls.classList.add('hidden');
            }
        }
        
        const editModeInstructions = document.getElementById('editModeInstructions');
        if (editModeInstructions) {
            if (this.isEditMode) {
                editModeInstructions.classList.remove('hidden');
            } else {
                editModeInstructions.classList.add('hidden');
            }
        }
        
        // Re-render the timer display with edit controls
        render.timerDisplay();
        
        return true;
    },

    // Start editing a part
    editPart(index) {
        if (index < 0 || index >= this.meetingParts.length) return;
        this.editingPartIndex = index;
        render.timerDisplay();
    },

    // Save inline part edits from the active card
    saveInlinePartEdits(index) {
        if (index < 0 || index >= this.meetingParts.length || this.editingPartIndex !== index) return;

        const nameInput = document.getElementById(`editPartName-inline-${index}`);
        const speakerInput = document.getElementById(`editPartSpeaker-inline-${index}`);
        const durationInput = document.getElementById(`editPartDuration-inline-${index}`);
        const commentsCheckbox = document.getElementById(`editPartComments-inline-${index}`);

        if (!nameInput || !durationInput) return;

        const name = nameInput.value.trim();
        const speaker = speakerInput ? speakerInput.value.trim() : '';
        const durationMinutes = Math.max(1, parseInt(durationInput.value, 10) || 1);
        const enableComments = commentsCheckbox ? commentsCheckbox.checked : false;

        if (!name) {
            notify.show('Please enter a part name', 'error');
            return;
        }

        this.meetingParts[index] = {
            name: name,
            speaker: speaker,
            duration: durationMinutes * 60,
            enableComments: enableComments
        };

        localStorage.setItem('meetingTemplate', JSON.stringify(this.meetingParts));
        this.editingPartIndex = null;
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
            localStorage.setItem('meetingTemplate', JSON.stringify(this.meetingParts));
            
            // Re-render
            render.timerDisplay();
            
            // Close the modal
            const modal = document.getElementById('partEditorModal');
            if (modal) {
                modal.classList.add('hidden');
            }
            
            this.editingPartIndex = null;
        } else {
            notify.show('Please enter a part name', 'error');
        }
    },

    // Cancel part edits
    cancelPartEdits() {
        this.editingPartIndex = null;

        // Close the modal if it is open (legacy path)
        const modal = document.getElementById('partEditorModal');
        if (modal) {
            modal.classList.add('hidden');
        }

        render.timerDisplay();
    },

    // Add a new part at a specific position
    addPartAt(index) {
        if (!this.isEditMode) return;
        
        const newPart = {
            name: 'New Part',
            duration: 5 * 60,
            speaker: '',
            enableComments: false
        };
        
        // Insert at the specified index
        this.meetingParts.splice(index, 0, newPart);
        
        // Save to localStorage
        localStorage.setItem('meetingTemplate', JSON.stringify(this.meetingParts));
        
        // Re-render
        render.timerDisplay();
        
        // Edit the new part
        this.editPart(index);
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
                } else if (this.editingPartIndex !== null && this.editingPartIndex > index) {
                    this.editingPartIndex--;
                }
                
                // Save to localStorage
                localStorage.setItem('meetingTemplate', JSON.stringify(this.meetingParts));
                this.saveState();
                
                // Re-render
                render.timerDisplay();
            }
        );
    },

    // Start dragging a part
    startDrag(index) {
        if (this.isRunning || index < 0 || index >= this.meetingParts.length) return;
        
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
        } else if (this.editingPartIndex !== null) {
            if (fromIndex < toIndex && this.editingPartIndex > fromIndex && this.editingPartIndex <= toIndex) {
                this.editingPartIndex--;
            } else if (fromIndex > toIndex && this.editingPartIndex >= toIndex && this.editingPartIndex < fromIndex) {
                this.editingPartIndex++;
            }
        }
        
        // Save to localStorage
        localStorage.setItem('meetingTemplate', JSON.stringify(this.meetingParts));
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
            const oldTemplates = localStorage.getItem('savedTemplates');
            if (oldTemplates) {
                const oldTemplatesObj = JSON.parse(oldTemplates);
                
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
                    localStorage.setItem('savedTemplates', JSON.stringify(newTemplates));
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
                localStorage.setItem('savedTemplates', JSON.stringify(templates));
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
            const templates = localStorage.getItem('savedTemplates');
            if (templates) {
                return JSON.parse(templates);
            }
            
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
            localStorage.setItem('savedTemplates', JSON.stringify(templates));
            
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
            localStorage.setItem('savedTemplates', JSON.stringify(templates));
            
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
                    localStorage.setItem('savedTemplates', JSON.stringify(templates));
                    
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
            localStorage.setItem('savedTemplates', JSON.stringify(templates));
            
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
        // In a real app, this would show a toast notification
    }
};
