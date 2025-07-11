// Note Management Class
class NoteManager {
    constructor() {
        this.notes = [];
        this.currentNoteId = null; // Track which note is currently open
        this.arrowsVisible = false; // Track if arrow controls are visible
        this.encryptionKey = "saurav"; // Default encryption key
        this.isEncrypted = true; // Enable encryption by default
        this.showMoreActions = false; // Track if more actions are shown
        this.deletedNotes = []; // Stack to store deleted notes for undo
        this.maxUndoStack = 5; // Maximum number of notes to keep in undo stack
        this.undoTimeout = null; // Timeout for auto-hiding undo button
        this.loadNotes();
        this.initializeEventListeners();
        this.renderNotes();
        this.updateStats();
        this.initializeMobileFeatures();
        this.initializeModalEvents();
        this.initializeEncryptionEvents();
        
        // Check if encryption is required on startup
        this.checkEncryptionStatus();
    }

    // Initialize mobile-specific features
    initializeMobileFeatures() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Handle mobile keyboard events
        this.handleMobileKeyboard();
        
        // Optimize for mobile performance
        this.optimizeForMobile();
    }

    // Handle mobile keyboard behavior
    handleMobileKeyboard() {
        const contentInput = document.getElementById('noteContent');
        const titleInput = document.getElementById('noteTitle');
        
        // Auto-resize textarea on mobile
        contentInput.addEventListener('input', () => {
            contentInput.style.height = 'auto';
            contentInput.style.height = Math.min(contentInput.scrollHeight, 200) + 'px';
        });

        // Handle mobile keyboard events
        contentInput.addEventListener('focus', () => {
            // Scroll to input on mobile
            setTimeout(() => {
                contentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });

        // Save on mobile keyboard "Done" button
        contentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                const title = document.getElementById('noteTitle').value;
                const content = document.getElementById('noteContent').value;
                
                if (this.addNote(title, content)) {
                    this.clearInputs();
                    // Hide keyboard on mobile
                    contentInput.blur();
                }
            }
        });
    }

    // Optimize for mobile performance
    optimizeForMobile() {
        // Debounce search for better mobile performance
        let searchTimeout;
        const searchInput = document.getElementById('searchInput');
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchNotes(e.target.value);
            }, 300);
        });

        // Use passive event listeners for better scroll performance
        document.addEventListener('scroll', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
    }

    // Initialize modal event listeners
    initializeModalEvents() {
        // Close main modal
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeNoteModal();
            });
        }

        // Close sub-note modal
        const closeSubNoteModal = document.getElementById('closeSubNoteModal');
        if (closeSubNoteModal) {
            closeSubNoteModal.addEventListener('click', () => {
                this.closeSubNoteModal();
            });
        }

        // Add sub-note button
        const addSubNoteBtn = document.getElementById('addSubNoteBtn');
        if (addSubNoteBtn) {
            addSubNoteBtn.addEventListener('click', () => {
                this.showSubNoteModal();
            });
        }

        // Toggle arrows button
        const toggleArrowsBtn = document.getElementById('toggleArrowsBtn');
        if (toggleArrowsBtn) {
            toggleArrowsBtn.addEventListener('click', () => {
                this.toggleArrowControls();
            });
        }

        // Save sub-note button
        const saveSubNoteBtn = document.getElementById('saveSubNoteBtn');
        if (saveSubNoteBtn) {
            saveSubNoteBtn.addEventListener('click', () => {
                this.saveSubNote();
            });
        }

        // Cancel sub-note button
        const cancelSubNoteBtn = document.getElementById('cancelSubNoteBtn');
        if (cancelSubNoteBtn) {
            cancelSubNoteBtn.addEventListener('click', () => {
                this.closeSubNoteModal();
            });
        }

        // Close modals when clicking outside
        const noteModal = document.getElementById('noteModal');
        if (noteModal) {
            noteModal.addEventListener('click', (e) => {
                if (e.target.id === 'noteModal') {
                    this.closeNoteModal();
                }
            });
            // Prevent modal from closing when clicking inside modal-content
            const modalContent = noteModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        }

        const subNoteModal = document.getElementById('subNoteModal');
        if (subNoteModal) {
            subNoteModal.addEventListener('click', (e) => {
                if (e.target.id === 'subNoteModal') {
                    this.closeSubNoteModal();
                }
            });
        }

        // Set up sub-notes event listener
        this.setupSubNotesEventListeners();

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('subNoteModal')?.classList.contains('show')) {
                    this.closeSubNoteModal();
                } else if (document.getElementById('noteModal')?.classList.contains('show')) {
                    this.closeNoteModal();
                }
            }
        });

        // More button for sub-notes
        const moreSubNoteBtn = document.getElementById('moreSubNoteBtn');
        if (moreSubNoteBtn) {
            moreSubNoteBtn.addEventListener('click', () => {
                this.showMoreActions = !this.showMoreActions;
                this.renderSubNotes();
                // Update button text
                moreSubNoteBtn.textContent = this.showMoreActions ? 'Hide More' : '⋯ More';
            });
        }
    }

    // Initialize encryption event listeners
    initializeEncryptionEvents() {
        // Key button click - commented out since button is hidden
        // document.getElementById('keyBtn').addEventListener('click', () => {
        //     this.showKeyModal();
        // });

        // Close key modal
        const closeKeyModal = document.getElementById('closeKeyModal');
        if (closeKeyModal) {
            closeKeyModal.addEventListener('click', () => {
                this.closeKeyModal();
            });
        }

        // Set key button
        const setKeyBtn = document.getElementById('setKeyBtn');
        if (setKeyBtn) {
            setKeyBtn.addEventListener('click', () => {
                this.setEncryptionKey();
            });
        }

        // Enter key button
        const enterKeyBtn = document.getElementById('enterKeyBtn');
        if (enterKeyBtn) {
            enterKeyBtn.addEventListener('click', () => {
                this.enterEncryptionKey();
            });
        }

        // Clear all data button
        const clearKeyBtn = document.getElementById('clearKeyBtn');
        if (clearKeyBtn) {
            clearKeyBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }

        // Disable encryption button
        const disableEncryptionBtn = document.getElementById('disableEncryptionBtn');
        if (disableEncryptionBtn) {
            disableEncryptionBtn.addEventListener('click', () => {
                this.disableEncryption();
            });
        }

        // Show/hide key checkbox
        const showKey = document.getElementById('showKey');
        if (showKey) {
            showKey.addEventListener('change', (e) => {
                const keyInput = document.getElementById('encryptionKey');
                if (keyInput) {
                    keyInput.type = e.target.checked ? 'text' : 'password';
                }
            });
        }

        // Close key modal when clicking outside
        const keyModal = document.getElementById('keyModal');
        if (keyModal) {
            keyModal.addEventListener('click', (e) => {
                if (e.target.id === 'keyModal') {
                    this.closeKeyModal();
                }
            });
        }

        // Handle Enter key in encryption input
        const encryptionKey = document.getElementById('encryptionKey');
        if (encryptionKey) {
            encryptionKey.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (this.isEncrypted) {
                        this.enterEncryptionKey();
                    } else {
                        this.setEncryptionKey();
                    }
                }
            });
        }
    }

    // Set up event listeners for sub-notes (called only once)
    setupSubNotesEventListeners() {
        const subNotesList = document.getElementById('subNotesList');
        
        // Use event delegation for sub-note actions
        subNotesList.addEventListener('click', (e) => {
            const target = e.target.closest('.sub-note-action-btn, .arrow-btn');
            if (!target) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const subNoteItem = target.closest('.sub-note-item');
            const subNoteId = parseInt(subNoteItem.dataset.id);
            const subNote = this.notes.find(n => n.id === this.currentNoteId)?.subNotes.find(sn => sn.id === subNoteId);
            
            if (!subNote) return;
            
            // Handle arrow button clicks
            if (target.classList.contains('up-arrow')) {
                const index = Array.from(subNoteItem.parentNode.children).indexOf(subNoteItem);
                if (index > 0) {
                    this.reorderSubNotes(index, index - 1);
                }
                return;
            }
            
            if (target.classList.contains('down-arrow')) {
                const index = Array.from(subNoteItem.parentNode.children).indexOf(subNoteItem);
                const totalSubNotes = this.notes.find(n => n.id === this.currentNoteId)?.subNotes.length || 0;
                if (index < totalSubNotes - 1) {
                    this.reorderSubNotes(index, index + 1);
                }
                return;
            }
            
            // Handle different button actions
            if (target.classList.contains('copy-btn')) {
                this.copySubNote(subNote.content);
            } else if (target.classList.contains('edit-btn')) {
                this.showSubNoteEditModal(subNoteId, subNote.content);
            } else if (target.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this sub-note?')) {
                    this.deleteSubNote(subNoteId);
                }
            }
        });
    }

    // Load notes from localStorage
    loadNotes() {
        try {
            // Try to load from new storage key first, then fallback to old key
            let savedNotes = localStorage.getItem('notes');
            if (!savedNotes) {
                savedNotes = localStorage.getItem('webNotes'); // Fallback to old key
            }
            
            const savedKey = localStorage.getItem('encryptionKey');
            const savedIsEncrypted = localStorage.getItem('isEncrypted');
            
            if (savedNotes) {
                this.notes = JSON.parse(savedNotes);
                
                // Initialize sub-notes array for existing notes if not present
                this.notes.forEach(note => {
                    if (!note.subNotes) {
                        note.subNotes = [];
                    }
                });
                
                // Check if data is encrypted
                if (savedIsEncrypted === 'true' && savedKey) {
                    this.isEncrypted = true;
                    this.encryptionKey = savedKey;
                    this.updateKeyButton();
                    
                    // Try to decrypt on load
                    if (!this.decryptAllNotes(savedKey)) {
                        // If decryption fails, show key modal
                        setTimeout(() => {
                            this.showKeyModal();
                        }, 500);
                    }
                } else {
                    // If no encryption was previously set, enable default encryption
                    this.isEncrypted = true;
                    this.encryptionKey = "saurav";
                    this.updateKeyButton();
                    
                    // Encrypt existing notes with default key
                    this.encryptAllNotes();
                    this.saveNotes();
                }
            } else {
                this.notes = [];
                // For new installations, encryption is enabled by default
                this.isEncrypted = true;
                this.encryptionKey = "saurav";
                this.updateKeyButton();
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
            // Ensure encryption is enabled even on error
            this.isEncrypted = true;
            this.encryptionKey = "saurav";
            this.updateKeyButton();
        }
    }

    // Save notes to localStorage
    saveNotes() {
        try {
            // Encrypt before saving if encryption is active
            if (this.isEncrypted && this.encryptionKey) {
                this.encryptAllNotes();
            }
            
            localStorage.setItem('notes', JSON.stringify(this.notes));
            localStorage.setItem('encryptionKey', this.encryptionKey || '');
            localStorage.setItem('isEncrypted', this.isEncrypted.toString());
            
            // Decrypt after saving to keep data readable in memory
            if (this.isEncrypted && this.encryptionKey) {
                this.decryptAllNotes(this.encryptionKey);
            }
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }

    // Add a new note
    addNote(title, content) {
        if (!content.trim()) {
            this.showToast('Please enter some content for your note', 'error');
            return false;
        }

        const note = {
            id: Date.now(),
            title: title.trim() || 'Untitled Note',
            content: content.trim(),
            date: new Date().toLocaleString(),
            timestamp: Date.now(),
            subNotes: []
        };

        this.notes.unshift(note); // Add to beginning of array
        this.saveNotes();
        this.renderNotes();
        this.updateStats();
        this.showToast('Note saved successfully!', 'success');
        return true;
    }

    // Add a sub-note to the current note
    addSubNote(title, content) {
        if (!content.trim()) {
            return false;
        }

        const subNote = {
            id: Date.now(),
            title: title.trim() || 'Untitled Sub-Note',
            content: content.trim(),
            date: new Date().toLocaleString(),
            timestamp: Date.now()
        };

        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (note) {
            note.subNotes.push(subNote); // Add to end of array (bottom)
            this.saveNotes();
            this.renderSubNotes();
            return true;
        }
        return false;
    }

    // Delete a note
    deleteNote(id) {
        const noteToDelete = this.notes.find(note => note.id === id);
        if (noteToDelete) {
            // Store the deleted note in undo stack
            this.deletedNotes.unshift({
                note: noteToDelete,
                timestamp: Date.now()
            });
            
            // Keep only the last maxUndoStack items
            if (this.deletedNotes.length > this.maxUndoStack) {
                this.deletedNotes = this.deletedNotes.slice(0, this.maxUndoStack);
            }
            
            // Remove the note from the main notes array
            this.notes = this.notes.filter(note => note.id !== id);
            this.saveNotes();
            this.renderNotes();
            this.updateStats();
            
            // Show undo button
            this.showUndoButton();
        }
    }

    // Delete a sub-note
    deleteSubNote(subNoteId) {
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (note) {
            note.subNotes = note.subNotes.filter(subNote => subNote.id !== subNoteId);
            this.saveNotes();
            this.renderSubNotes();
        }
    }

    // Copy sub-note to clipboard
    copySubNote(content) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(content).then(() => {
                // Note copied successfully (no toast)
            }).catch(() => {
                this.fallbackCopySubNote(content);
            });
        } else {
            this.fallbackCopySubNote(content);
        }
    }

    // Fallback copy method for sub-notes
    fallbackCopySubNote(content) {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            // Copy failed
        }
        
        document.body.removeChild(textArea);
    }

    // Show note modal
    showNoteModal(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.currentNoteId = noteId;
        
        // Update modal content
        document.getElementById('modalNoteTitle').textContent = note.title;
        document.getElementById('modalNoteContent').textContent = note.content;
        document.getElementById('modalNoteDate').textContent = note.date;
        
        // Show modal
        document.getElementById('noteModal').classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Render sub-notes
        this.renderSubNotes();
    }

    // Close note modal
    closeNoteModal() {
        document.getElementById('noteModal').classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
        this.currentNoteId = null;
    }

    // Show sub-note modal
    showSubNoteModal() {
        document.getElementById('subNoteModal').classList.add('show');
        document.getElementById('subNoteContent').focus();
    }

    // Close sub-note modal
    closeSubNoteModal() {
        document.getElementById('subNoteModal').classList.remove('show');
        document.getElementById('subNoteContent').value = '';
        document.getElementById('subNoteModal').removeAttribute('data-edit-mode');
        document.getElementById('subNoteModal').removeAttribute('data-edit-id');
        
        // Reset modal header text
        document.querySelector('#subNoteModal .modal-header h3').textContent = 'Add Sub-Note';
        document.getElementById('saveSubNoteBtn').textContent = '💾 Save Sub-Note';
    }

    // Show sub-note edit modal
    showSubNoteEditModal(subNoteId, currentContent) {
        document.getElementById('subNoteContent').value = currentContent;
        document.getElementById('subNoteModal').classList.add('show');
        document.getElementById('subNoteModal').setAttribute('data-edit-mode', 'true');
        document.getElementById('subNoteModal').setAttribute('data-edit-id', subNoteId);
        
        // Update modal header text
        document.querySelector('#subNoteModal .modal-header h3').textContent = 'Edit Sub-Note';
        document.getElementById('saveSubNoteBtn').textContent = '💾 Update Sub-Note';
        
        document.getElementById('subNoteContent').focus();
    }

    // Save sub-note (handles both new and edit)
    saveSubNote() {
        const content = document.getElementById('subNoteContent').value;
        const modal = document.getElementById('subNoteModal');
        const isEditMode = modal.getAttribute('data-edit-mode') === 'true';
        
        if (isEditMode) {
            const subNoteId = parseInt(modal.getAttribute('data-edit-id'));
            if (this.editSubNote(subNoteId, content)) {
                this.closeSubNoteModal();
            }
        } else {
            // Save the entire content as the sub-note content
            // Use a default title and save all text as content
            const title = 'Untitled Sub-Note';
            const actualContent = content.trim();
            
            if (actualContent) {
                if (this.addSubNote(title, actualContent)) {
                    this.closeSubNoteModal();
                }
            } else {
                this.showToast('Please enter some content for your sub-note', 'error');
            }
        }
    }

    // Render sub-notes in the modal
    renderSubNotes() {
        const subNotesList = document.getElementById('subNotesList');
        const note = this.notes.find(n => n.id === this.currentNoteId);
        const subNotesSection = document.querySelector('.sub-notes-section');
        if (subNotesSection) {
            if (this.showMoreActions) {
                subNotesSection.classList.add('show-more-actions');
            } else {
                subNotesSection.classList.remove('show-more-actions');
            }
        }
        
        if (!note || !note.subNotes || note.subNotes.length === 0) {
            subNotesList.innerHTML = '<div class="no-sub-notes">No sub-notes yet. Add your first sub-note!</div>';
            return;
        }

        // Check if arrows should be visible
        const arrowsVisible = this.arrowsVisible || false;

        subNotesList.innerHTML = note.subNotes.map((subNote, index) => `
            <div class="sub-note-item" data-id="${subNote.id}">
                ${arrowsVisible ? `
                    <div class="sub-note-arrows">
                        <button class="arrow-btn up-arrow" ${index === 0 ? 'disabled' : ''} title="Move up">
                            <span>↑</span>
                        </button>
                        <button class="arrow-btn down-arrow" ${index === note.subNotes.length - 1 ? 'disabled' : ''} title="Move down">
                            <span>↓</span>
                        </button>
                    </div>
                ` : ''}
                <div class="sub-note-content">
                    <div class="sub-note-text">${this.escapeHtml(subNote.content)}</div>
                </div>
                <div class="sub-note-actions">
                    <button class="sub-note-action-btn edit-btn" title="Edit">
                        <span>✏️</span>
                    </button>
                    <button class="sub-note-action-btn copy-btn" title="Copy">
                        <span>📋</span>
                    </button>
                    <button class="sub-note-action-btn delete-btn" title="Delete">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for arrow buttons if visible
        // (No longer needed, handled by event delegation)
    }

    // Search notes
    searchNotes(query) {
        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );
        this.renderNotes(filteredNotes);
    }

    // Render notes to DOM with mobile optimizations
    renderNotes(notesToRender = this.notes) {
        const notesList = document.getElementById('notesList');
        
        if (notesToRender.length === 0) {
            notesList.innerHTML = `
                <div class="empty-state">
                    <h3>📝 No notes yet</h3>
                    <p>Create your first note above to get started!</p>
                </div>
            `;
            return;
        }

        notesList.innerHTML = notesToRender.map(note => `
            <div class="note-item clickable" data-id="${note.id}">
                <div class="note-header">
                    <div>
                        <div class="note-title">${this.escapeHtml(note.title)}</div>
                        <div class="note-date">${note.date}</div>
                        ${note.subNotes && note.subNotes.length > 0 ? `<div class="note-sub-count">📝 ${note.subNotes.length} sub-note${note.subNotes.length > 1 ? 's' : ''}</div>` : ''}
                    </div>
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                <div class="note-actions">
                    <button class="action-btn copy-btn" data-action="copy" data-content="${this.escapeHtml(note.content)}">
                        📋 Copy
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" data-id="${note.id}">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update statistics
    updateStats() {
        const totalNotes = this.notes.length;

        document.getElementById('totalNotes').textContent = totalNotes;
    }

    // Clear input fields
    clearInputs() {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteTitle').focus();
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        
        // Clear any existing timeout
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }
        
        // Hide current toast if visible
        toast.classList.remove('show');
        
        // Wait a bit before showing new toast to prevent overlap
        setTimeout(() => {
            toast.textContent = message;
            toast.className = `toast ${type}`;
            toast.classList.add('show');

            this.toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }, 100);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Floating Action Button
        const fab = document.getElementById('fab');
        if (fab) {
            fab.addEventListener('click', () => {
                this.toggleNoteInput();
            });
        }

        // Save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const title = document.getElementById('noteTitle').value;
                const content = document.getElementById('noteContent').value;
                
                if (this.addNote(title, content)) {
                    this.clearInputs();
                    this.hideNoteInput();
                }
            });
        }

        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearInputs();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideNoteInput();
            });
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchNotes(e.target.value);
            });
        }

        // Enter key to save note
        const noteContent = document.getElementById('noteContent');
        if (noteContent) {
            noteContent.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    const title = document.getElementById('noteTitle').value;
                    const content = document.getElementById('noteContent').value;
                    
                    if (this.addNote(title, content)) {
                        this.clearInputs();
                        this.hideNoteInput();
                        // Hide keyboard on mobile
                        document.getElementById('noteContent').blur();
                    }
                }
            });

            // Auto-save draft
            let draftTimeout;
            noteContent.addEventListener('input', () => {
                clearTimeout(draftTimeout);
                draftTimeout = setTimeout(() => {
                    const title = document.getElementById('noteTitle').value;
                    const content = document.getElementById('noteContent').value;
                    if (content.trim()) {
                        localStorage.setItem('draft', JSON.stringify({ title, content }));
                    }
                }, 1000);
            });
        }

        // Load draft on page load
        this.loadDraft();

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showImportExportModal('export');
            });
        }

        // Import/Export modal event listeners
        this.initializeImportExportEvents();

        // Undo button
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undoDelete();
            });
        }

        // Set up single event listener for notes list
        this.setupNotesEventListeners();
    }

    // Set up event listeners for notes (called only once)
    setupNotesEventListeners() {
        const notesList = document.getElementById('notesList');
        
        // Single event listener for all note interactions (works for both desktop and mobile)
        notesList.addEventListener('click', (e) => {
            // Handle action buttons
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const action = actionBtn.dataset.action;
                const noteItem = actionBtn.closest('.note-item');
                const noteId = parseInt(noteItem.dataset.id);
                
                if (action === 'copy') {
                    const content = actionBtn.dataset.content;
                    this.copyNote(content);
                } else if (action === 'delete') {
                    if (confirm('Are you sure you want to delete this note?')) {
                        this.deleteNote(noteId);
                    }
                }
                return;
            }

            // Handle note item clicks (for opening modal)
            const noteItem = e.target.closest('.note-item');
            if (noteItem && !e.target.closest('.action-btn')) {
                const noteId = parseInt(noteItem.dataset.id);
                this.showNoteModal(noteId);
            }
        });
    }

    // Initialize import/export modal event listeners
    initializeImportExportEvents() {
        // Close modal button
        const closeBtn = document.getElementById('closeImportExportModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeImportExportModal();
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchImportExportTab(tab);
            });
        });

        // Export all notes button
        const exportAllBtn = document.getElementById('exportAllBtn');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => {
                this.exportAllNotes();
            });
        }

        // File selection for import
        const selectFileBtn = document.getElementById('selectFileBtn');
        const importFile = document.getElementById('importFile');
        if (selectFileBtn && importFile) {
            selectFileBtn.addEventListener('click', () => {
                importFile.click();
            });
            
            importFile.addEventListener('change', (e) => {
                this.handleFileSelection(e);
            });
        }

        // Import button
        const importBtn = document.getElementById('importBtnModal');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.handleImport();
            });
        }

        // Reset import button
        const resetImportBtn = document.getElementById('resetImportBtn');
        if (resetImportBtn) {
            resetImportBtn.addEventListener('click', () => {
                this.resetImportForm();
            });
        }

        // Import strategy checkboxes
        const mergeNotes = document.getElementById('mergeNotes');
        const overwriteNotes = document.getElementById('overwriteNotes');
        if (mergeNotes && overwriteNotes) {
            mergeNotes.addEventListener('change', () => {
                if (mergeNotes.checked) {
                    overwriteNotes.checked = false;
                }
            });
            
            overwriteNotes.addEventListener('change', () => {
                if (overwriteNotes.checked) {
                    mergeNotes.checked = false;
                }
            });
        }
    }

    // Toggle note input section visibility
    toggleNoteInput() {
        const noteInputSection = document.getElementById('noteInputSection');
        const fab = document.getElementById('fab');
        
        if (noteInputSection.style.display === 'none') {
            this.showNoteInput();
        } else {
            this.hideNoteInput();
        }
    }

    // Show note input section
    showNoteInput() {
        const noteInputSection = document.getElementById('noteInputSection');
        const fab = document.getElementById('fab');
        
        noteInputSection.style.display = 'block';
        // Trigger animation after display change
        setTimeout(() => {
            noteInputSection.classList.add('show');
            fab.classList.add('active');
        }, 10);
        
        // Focus on title input
        setTimeout(() => {
            document.getElementById('noteTitle').focus();
        }, 350);
    }

    // Hide note input section
    hideNoteInput() {
        const noteInputSection = document.getElementById('noteInputSection');
        const fab = document.getElementById('fab');
        
        noteInputSection.classList.remove('show');
        fab.classList.remove('active');
        
        // Hide after animation completes
        setTimeout(() => {
            noteInputSection.style.display = 'none';
        }, 300);
        
        // Clear inputs when hiding
        this.clearInputs();
    }

    // Load draft from localStorage
    loadDraft() {
        const draft = localStorage.getItem('draft');
        if (draft) {
            try {
                const { title, content } = JSON.parse(draft);
                document.getElementById('noteTitle').value = title || '';
                document.getElementById('noteContent').value = content || '';
            } catch (e) {
                localStorage.removeItem('draft');
            }
        }
    }

    // Export notes as JSON
    exportNotes() {
        const dataStr = JSON.stringify(this.notes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `notes_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.showToast('Notes exported successfully!', 'success');
    }

    // Show import/export modal
    showImportExportModal(tab = 'export') {
        const modal = document.getElementById('importExportModal');
        modal.classList.add('show');
        
        // Switch to specified tab
        this.switchImportExportTab(tab);
        
        // Update export stats
        this.updateExportStats();
        
        // Add event listeners for modal interactions
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                this.closeImportExportModal();
            }
        };
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.closeImportExportModal();
            }
        };
        
        modal.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);
        
        // Store cleanup function
        this.importExportCleanup = () => {
            modal.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }

    // Close import/export modal
    closeImportExportModal() {
        const modal = document.getElementById('importExportModal');
        modal.classList.remove('show');
        
        // Clean up event listeners
        if (this.importExportCleanup) {
            this.importExportCleanup();
            this.importExportCleanup = null;
        }
        
        // Reset import form
        this.resetImportForm();
    }

    // Switch between import/export tabs
    switchImportExportTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}Tab`).classList.add('active');
    }

    // Update export statistics
    updateExportStats() {
        const totalNotes = this.notes.length;
        const totalSubNotes = this.notes.reduce((sum, note) => sum + (note.subNotes ? note.subNotes.length : 0), 0);
        
        document.getElementById('exportTotalNotes').textContent = totalNotes;
        document.getElementById('exportTotalSubNotes').textContent = totalSubNotes;
    }

    // Export all notes
    exportAllNotes() {
        try {
            const dataStr = JSON.stringify(this.notes, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `notes_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            this.showToast('Notes exported successfully!', 'success');
            this.closeImportExportModal();
        } catch (error) {
            this.showToast('Error exporting notes', 'error');
        }
    }

    // Handle file selection for import
    handleFileSelection(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('selectedFileName').textContent = file.name;
            document.getElementById('importBtnModal').disabled = false;
        } else {
            document.getElementById('selectedFileName').textContent = 'No file selected';
            document.getElementById('importBtnModal').disabled = true;
        }
    }

    // Reset import form
    resetImportForm() {
        document.getElementById('importFile').value = '';
        document.getElementById('selectedFileName').textContent = 'No file selected';
        document.getElementById('importBtnModal').disabled = true;
        document.getElementById('mergeNotes').checked = true;
        document.getElementById('overwriteNotes').checked = false;
    }

    // Handle import from modal
    handleImport() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('Please select a file to import', 'error');
            return;
        }
        
        const mergeNotes = document.getElementById('mergeNotes').checked;
        const overwriteNotes = document.getElementById('overwriteNotes').checked;
        
        if (!mergeNotes && !overwriteNotes) {
            this.showToast('Please select an import strategy', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedNotes = JSON.parse(e.target.result);
                if (!Array.isArray(importedNotes)) {
                    throw new Error('Invalid file format');
                }
                
                if (overwriteNotes) {
                    this.notes = importedNotes;
                } else {
                    this.notes = [...this.notes, ...importedNotes];
                }
                
                this.saveNotes();
                this.renderNotes();
                this.updateStats();
                this.showToast(`${importedNotes.length} notes imported successfully!`, 'success');
                this.closeImportExportModal();
            } catch (error) {
                this.showToast('Error importing notes. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Import notes from JSON
    importNotes(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedNotes = JSON.parse(e.target.result);
                if (Array.isArray(importedNotes)) {
                    this.notes = [...this.notes, ...importedNotes];
                    this.saveNotes();
                    this.renderNotes();
                    this.updateStats();
                    this.showToast(`${importedNotes.length} notes imported successfully!`, 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showToast('Error importing notes. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Copy note to clipboard with mobile support
    copyNote(content) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(content).then(() => {
                // Note copied successfully (no toast)
            }).catch(() => {
                this.fallbackCopy(content);
            });
        } else {
            this.fallbackCopy(content);
        }
    }

    // Fallback copy method for older browsers and mobile
    fallbackCopy(content) {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            // Note copied successfully (no toast)
        } catch (err) {
            // Copy failed (no toast)
        }
        
        document.body.removeChild(textArea);
    }

    // Reorder sub-notes in data
    reorderSubNotes(fromIndex, toIndex) {
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;

        const subNotes = [...note.subNotes];
        const [movedItem] = subNotes.splice(fromIndex, 1);
        subNotes.splice(toIndex, 0, movedItem);
        
        note.subNotes = subNotes;
        this.saveNotes();
        this.renderSubNotes();
    }

    // Toggle arrow controls visibility
    toggleArrowControls() {
        this.arrowsVisible = !this.arrowsVisible;
        this.renderSubNotes();
        
        // Update the toggle button text
        const toggleBtn = document.getElementById('toggleArrowsBtn');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.arrowsVisible ? 
                '<span>🔽</span> Hide Arrows' : 
                '<span>🔼</span> Show Arrows';
        }
        
        // Show feedback
        this.showToast(
            this.arrowsVisible ? 'Arrow controls enabled' : 'Arrow controls hidden', 
            'info'
        );
    }

    // Edit a sub-note
    editSubNote(subNoteId, newContent) {
        if (!newContent.trim()) {
            return false;
        }

        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (note) {
            const subNote = note.subNotes.find(sn => sn.id === subNoteId);
            if (subNote) {
                subNote.content = newContent.trim();
                subNote.date = new Date().toLocaleString(); // Update timestamp
                this.saveNotes();
                this.renderSubNotes();
                return true;
            }
        }
        return false;
    }

    // Encryption Methods
    showKeyModal() {
        const keyModal = document.getElementById('keyModal');
        const keyInput = document.getElementById('encryptionKey');
        const keyStatus = document.getElementById('keyStatus');
        const keyBtn = document.getElementById('keyBtn');
        const setKeyBtn = document.getElementById('setKeyBtn');
        const enterKeyBtn = document.getElementById('enterKeyBtn');
        const disableEncryptionBtn = document.getElementById('disableEncryptionBtn');
        
        // Clear input
        keyInput.value = '';
        keyInput.type = 'password';
        document.getElementById('showKey').checked = false;
        
        // Update status and button appearance
        if (this.isEncrypted) {
            keyStatus.innerHTML = '<p>🔐 Data is encrypted. Enter your key to access notes.</p>';
            keyStatus.className = 'key-status encrypted';
            keyBtn.classList.add('active');
            
            // Show/hide buttons based on whether key is set
            if (this.encryptionKey) {
                setKeyBtn.style.display = 'none';
                enterKeyBtn.style.display = 'inline-flex';
                disableEncryptionBtn.style.display = 'inline-flex';
            } else {
                setKeyBtn.style.display = 'inline-flex';
                enterKeyBtn.style.display = 'none';
                disableEncryptionBtn.style.display = 'none';
            }
        } else {
            keyStatus.innerHTML = '<p>🔑 Set an encryption key to secure your notes</p>';
            keyStatus.className = 'key-status';
            keyBtn.classList.remove('active');
            
            setKeyBtn.style.display = 'inline-flex';
            enterKeyBtn.style.display = 'none';
            disableEncryptionBtn.style.display = 'none';
        }
        
        keyModal.classList.add('show');
        keyInput.focus();
    }

    closeKeyModal() {
        const keyModal = document.getElementById('keyModal');
        keyModal.classList.remove('show');
    }

    setEncryptionKey() {
        const keyInput = document.getElementById('encryptionKey');
        const key = keyInput.value.trim();
        
        if (!key) {
            this.showToast('Please enter a key', 'error');
            return;
        }
        
        if (key.length < 4) {
            this.showToast('Key must be at least 4 characters long', 'error');
            return;
        }
        
        try {
            // Encrypt existing data
            this.encryptionKey = key;
            this.isEncrypted = true;
            
            // Encrypt all notes
            this.encryptAllNotes();
            
            // Save encrypted data
            this.saveNotes();
            
            // Update UI
            this.updateKeyButton();
            this.closeKeyModal();
            this.showToast('🔐 Data encrypted successfully!', 'success');
            
        } catch (error) {
            this.showToast('Failed to encrypt data', 'error');
            console.error('Encryption error:', error);
        }
    }

    enterEncryptionKey() {
        const keyInput = document.getElementById('encryptionKey');
        const key = keyInput.value.trim();
        
        if (!key) {
            this.showToast('Please enter your key', 'error');
            return;
        }
        
        try {
            // Try to decrypt data
            const decrypted = this.decryptAllNotes(key);
            
            if (decrypted) {
                this.encryptionKey = key;
                this.isEncrypted = true;
                this.updateKeyButton();
                this.closeKeyModal();
                this.renderNotes();
                this.updateStats();
                this.showToast('🔓 Data decrypted successfully!', 'success');
            } else {
                this.showToast('❌ Invalid key', 'error');
            }
            
        } catch (error) {
            this.showToast('Failed to decrypt data', 'error');
            console.error('Decryption error:', error);
        }
    }

    clearAllData() {
        if (confirm('⚠️ This will permanently delete ALL notes and data. Are you sure?')) {
            this.notes = [];
            this.encryptionKey = null;
            this.isEncrypted = false;
            localStorage.removeItem('notes');
            localStorage.removeItem('encryptionKey');
            localStorage.removeItem('isEncrypted');
            
            this.updateKeyButton();
            this.closeKeyModal();
            this.renderNotes();
            this.updateStats();
            this.showToast('🗑️ All data cleared', 'info');
        }
    }

    disableEncryption() {
        if (confirm('🔓 This will disable encryption and make your notes unencrypted. Are you sure?')) {
            this.encryptionKey = null;
            this.isEncrypted = false;
            
            // Clear encryption-related localStorage
            localStorage.removeItem('encryptionKey');
            localStorage.removeItem('isEncrypted');
            
            // Save current notes as unencrypted
            this.saveNotes();
            
            // Update UI
            this.updateKeyButton();
            this.closeKeyModal();
            this.renderNotes();
            this.updateStats();
            this.showToast('🔓 Encryption disabled successfully!', 'success');
        }
    }

    updateKeyButton() {
        const keyBtn = document.getElementById('keyBtn');
        if (this.isEncrypted) {
            keyBtn.classList.add('active');
            keyBtn.title = 'Encryption Active - Click to manage key';
        } else {
            keyBtn.classList.remove('active');
            keyBtn.title = 'Set/Enter Encryption Key';
        }
    }

    // Unicode-safe Base64 encode/decode helpers
    b64EncodeUnicode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    }
    b64DecodeUnicode(str) {
        return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    encryptText(text, key) {
        if (!text || !key) return text;
        try {
            // Simple XOR encryption (for demonstration - in production use proper crypto)
            let encrypted = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                encrypted += String.fromCharCode(charCode);
            }
            return this.b64EncodeUnicode(encrypted); // Unicode-safe Base64 encode
        } catch (e) {
            console.error('Encryption error:', e);
            return text;
        }
    }

    decryptText(encryptedText, key) {
        if (!encryptedText || !key) return encryptedText;
        try {
            const decoded = this.b64DecodeUnicode(encryptedText); // Unicode-safe Base64 decode
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                decrypted += String.fromCharCode(charCode);
            }
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return '[Decryption failed: corrupted or too large]';
        }
    }

    encryptAllNotes() {
        if (!this.encryptionKey) return;
        
        this.notes.forEach(note => {
            if (note.title) {
                note.title = this.encryptText(note.title, this.encryptionKey);
            }
            if (note.content) {
                note.content = this.encryptText(note.content, this.encryptionKey);
            }
            if (note.subNotes) {
                note.subNotes.forEach(subNote => {
                    if (subNote.title) {
                        subNote.title = this.encryptText(subNote.title, this.encryptionKey);
                    }
                    if (subNote.content) {
                        subNote.content = this.encryptText(subNote.content, this.encryptionKey);
                    }
                });
            }
        });
    }

    decryptAllNotes(key) {
        if (!key) return false;
        
        const decryptedNotes = [];
        let isValidKey = true;
        
        for (const note of this.notes) {
            try {
                const decryptedNote = { ...note };
                
                if (note.title) {
                    const decryptedTitle = this.decryptText(note.title, key);
                    if (decryptedTitle === null) {
                        isValidKey = false;
                        break;
                    }
                    decryptedNote.title = decryptedTitle;
                }
                
                if (note.content) {
                    const decryptedContent = this.decryptText(note.content, key);
                    if (decryptedContent === null) {
                        isValidKey = false;
                        break;
                    }
                    decryptedNote.content = decryptedContent;
                }
                
                if (note.subNotes) {
                    decryptedNote.subNotes = [];
                    for (const subNote of note.subNotes) {
                        const decryptedSubNote = { ...subNote };
                        
                        if (subNote.title) {
                            const decryptedTitle = this.decryptText(subNote.title, key);
                            if (decryptedTitle === null) {
                                isValidKey = false;
                                break;
                            }
                            decryptedSubNote.title = decryptedTitle;
                        }
                        
                        if (subNote.content) {
                            const decryptedContent = this.decryptText(subNote.content, key);
                            if (decryptedContent === null) {
                                isValidKey = false;
                                break;
                            }
                            decryptedSubNote.content = decryptedContent;
                        }
                        
                        decryptedNote.subNotes.push(decryptedSubNote);
                    }
                }
                
                decryptedNotes.push(decryptedNote);
                
            } catch (error) {
                isValidKey = false;
                break;
            }
        }
        
        if (isValidKey) {
            this.notes = decryptedNotes;
            return true;
        }
        
        return false;
    }

    // Check encryption status on startup
    checkEncryptionStatus() {
        // Since we have a default encryption key, we don't need to show the key modal
        // Encryption is enabled by default with the key "saurav"
        this.updateKeyButton();
    }

    // Show undo button
    showUndoButton() {
        const undoContainer = document.getElementById('undoContainer');
        const undoBtn = document.getElementById('undoBtn');
        
        if (undoContainer && undoBtn) {
            undoContainer.style.display = 'flex';
            
            // Clear any existing timeout
            if (this.undoTimeout) {
                clearTimeout(this.undoTimeout);
            }
            
            // Auto-hide after 10 seconds
            this.undoTimeout = setTimeout(() => {
                this.hideUndoButton();
            }, 10000);
        }
    }

    // Hide undo button
    hideUndoButton() {
        const undoContainer = document.getElementById('undoContainer');
        if (undoContainer) {
            undoContainer.style.display = 'none';
        }
        
        if (this.undoTimeout) {
            clearTimeout(this.undoTimeout);
            this.undoTimeout = null;
        }
    }

    // Undo the last deletion
    undoDelete() {
        if (this.deletedNotes.length > 0) {
            const deletedNoteData = this.deletedNotes.shift();
            const restoredNote = deletedNoteData.note;
            
            // Add the note back to the beginning of the array
            this.notes.unshift(restoredNote);
            this.saveNotes();
            this.renderNotes();
            this.updateStats();
            
            // Hide the undo button
            this.hideUndoButton();
            
            // Show success message
            this.showToast(`Note restored successfully!`, 'success');
        }
    }
}

// Initialize the application
let noteManager;

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful');
            })
            .catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    noteManager = new NoteManager();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const title = document.getElementById('noteTitle').value;
            const content = document.getElementById('noteContent').value;
            
            if (noteManager.addNote(title, content)) {
                noteManager.clearInputs();
                noteManager.hideNoteInput();
            }
        }
        
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }

        // Ctrl/Cmd + N to show new note input
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            noteManager.showNoteInput();
        }

        // Escape to hide note input
        if (e.key === 'Escape') {
            const noteInputSection = document.getElementById('noteInputSection');
            if (noteInputSection.style.display !== 'none') {
                noteManager.hideNoteInput();
            }
        }
    });

    // Handle mobile-specific URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        // Focus on content input for new note action
        setTimeout(() => {
            document.getElementById('noteContent').focus();
        }, 500);
    }

    // Add some sample notes if no notes exist
    if (noteManager.notes.length === 0) {
        const sampleNotes = [
            {
                title: 'Welcome to Web NotePad!',
                content: 'This is your first note. You can create, edit, and manage your notes here. Tap the + button to add new notes!',
                subNotes: [
                    {
                        id: Date.now() + 1,
                        title: 'Getting Started',
                        content: 'Click on any note to open it and add sub-notes inside!',
                        date: new Date().toLocaleString(),
                        timestamp: Date.now() + 1
                    }
                ]
            },
            {
                title: 'Project Ideas',
                content: 'My list of project ideas to work on',
                subNotes: [
                    {
                        id: Date.now() + 2,
                        title: 'Mobile App',
                        content: 'Build a cross-platform mobile app using React Native',
                        date: new Date().toLocaleString(),
                        timestamp: Date.now() + 2
                    },
                    {
                        id: Date.now() + 3,
                        title: 'Web Dashboard',
                        content: 'Create a beautiful admin dashboard with charts and analytics',
                        date: new Date().toLocaleString(),
                        timestamp: Date.now() + 3
                    }
                ]
            }
        ];

        sampleNotes.forEach(note => {
            noteManager.addNote(note.title, note.content);
            // Add sub-notes to the newly created note
            const createdNote = noteManager.notes.find(n => n.title === note.title);
            if (createdNote && note.subNotes) {
                createdNote.subNotes = note.subNotes;
                noteManager.saveNotes();
            }
        });
    }

    // Show install prompt for PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button or notification
        setTimeout(() => {
            if (deferredPrompt) {
              //  noteManager.showToast('Install this app for a better experience!', 'info');
            }
        }, 3000);
    });
});

// Add CSS for toast types
const style = document.createElement('style');
style.textContent = `
    .toast.success {
        background: #28a745;
    }
    .toast.error {
        background: #dc3545;
    }
    .toast.info {
        background: #17a2b8;
    }
`;
document.head.appendChild(style); 