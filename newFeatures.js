/**
 * Life and Ministry Timer - New Features
 * Version 2.1.0
 * 
 * Additional features for the Life and Ministry Timer application
 */

'use strict';

//----------------------------------------------------------------------------------------------
// THEME MANAGEMENT
//----------------------------------------------------------------------------------------------
const themeManager = {
    // Initialize theme manager
    init() {
        // Load theme preference from localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // Check for system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.setTheme('dark');
            } else {
                this.setTheme('light');
            }
        }
        
        // Update theme toggle button
        this.updateThemeToggle();
    },
    
    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    },
    
    // Toggle theme
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.updateThemeToggle();
    },
    
    // Update theme toggle button
    updateThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const sunIcon = themeToggle.querySelector('.sun-icon');
        const moonIcon = themeToggle.querySelector('.moon-icon');
        
        if (currentTheme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }
};

//----------------------------------------------------------------------------------------------
// SOUND MANAGEMENT
//----------------------------------------------------------------------------------------------
const soundManager = {
    isSoundEnabled: false, // Sound enabled/disabled flag (default: false)

    
    // Initialize sound manager
    init() {
        // Load sound preference from localStorage
        const savedSoundPreference = localStorage.getItem('soundEnabled');
        if (savedSoundPreference !== null) {
            this.isSoundEnabled = savedSoundPreference === 'true'; // Set the flag based on saved preference

        }
        
        // Update sound toggle button
        this.updateSoundToggle();
    },
    
    // Toggle sound on/off
    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        localStorage.setItem('soundEnabled', this.isSoundEnabled.toString());
        this.updateSoundToggle();
    },
    
    // Update sound toggle button
    updateSoundToggle() {
        const soundToggle = document.getElementById('soundToggle');
        if (!soundToggle) return;
        
        const soundOnIcon = soundToggle.querySelector('.sound-on-icon');
        const soundOffIcon = soundToggle.querySelector('.sound-off-icon');
        
        if (this.isSoundEnabled) {
            soundOnIcon.classList.remove('hidden');
            soundOffIcon.classList.add('hidden');
        } else {
            soundOnIcon.classList.add('hidden');
            soundOffIcon.classList.remove('hidden');
        }
    },
    
    // Play timer end sound
    playTimerEndSound() {
        if (!this.isSoundEnabled) return;
        
        const sound = document.getElementById('timerEndSound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.error('Error playing timer end sound:', error));
        }
    },
    
    /* // Play comment start sound
    playCommentStartSound() {
        if (!this.isSoundEnabled) return;
        
        const sound = document.getElementById('commentStartSound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.error('Error playing comment start sound:', error));
        }
    },
    
    // Play comment end sound
    playCommentEndSound() {
        if (!this.isSoundEnabled) return;
        
        const sound = document.getElementById('commentEndSound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.error('Error playing comment end sound:', error));
        }
    }*/
};

//----------------------------------------------------------------------------------------------
// REPORT MANAGEMENT
//----------------------------------------------------------------------------------------------
const reportManager = {
    // Show report modal
    showReport() {
        const reportModal = document.getElementById('reportModal');
        const reportContent = document.getElementById('reportContent');
        
        if (!reportModal || !reportContent) return;
        
        // Generate report
        const report = state.generateReport();
        
        // Create report HTML
        let reportHTML = `
            <div class="mb-4">
                <h4 class="font-bold mb-2">Meeting Summary</h4>
                <p>Date: ${report.date}</p>
                <p>Total Duration: ${formatTime(report.totalDuration)}</p>
            </div>
            
            <div class="mb-4">
                <h4 class="font-bold mb-2">Parts</h4>
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border px-2 py-1 text-left">Part</th>
                            <th class="border px-2 py-1 text-left">Speaker</th>
                            <th class="border px-2 py-1 text-center">Planned</th>
                            <th class="border px-2 py-1 text-center">Actual</th>
                            <th class="border px-2 py-1 text-center">Variance</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Add parts to report
        report.parts.forEach(part => {
            const variance = part.variance;
            const varianceClass = variance > 0 ? 'text-red-500' : variance < 0 ? 'text-green-500' : '';
            
            reportHTML += `
                <tr>
                    <td class="border px-2 py-1">${part.name}</td>
                    <td class="border px-2 py-1">${part.speaker || '-'}</td>
                    <td class="border px-2 py-1 text-center">${formatTime(part.plannedDuration)}</td>
                    <td class="border px-2 py-1 text-center">${formatTime(part.actualDuration)}</td>
                    <td class="border px-2 py-1 text-center ${varianceClass}">${variance > 0 ? '+' : ''}${formatTime(variance)}</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
            
            <div>
                <h4 class="font-bold mb-2">Comments</h4>
                <p>Total Comments: ${report.comments.total}</p>
                <p>Average Duration: ${formatTime(report.comments.average)}</p>
                
                <div class="mt-2">
                    <h5 class="font-medium">Comments by Part:</h5>
                    <ul class="list-disc pl-5">
        `;
        
        // Add comments by part to report
        Object.keys(report.comments.byPart).forEach(partName => {
            const partComments = report.comments.byPart[partName];
            reportHTML += `
                <li>${partName}: ${partComments.count} comments (avg: ${formatTime(partComments.average)})</li>
            `;
        });
        
        reportHTML += `
                    </ul>
                </div>
            </div>
        `;
        
        // Set report content
        reportContent.innerHTML = reportHTML;
        
        // Show modal
        reportModal.classList.remove('hidden');
    },
    
    // Export report as CSV
    exportReport() {
        // Generate report
        const report = state.generateReport();
        
        // Create CSV content
        let csv = 'Meeting Report\n';
        csv += `Date,${report.date}\n`;
        csv += `Total Duration,${formatTime(report.totalDuration)}\n\n`;
        
        // Add parts to CSV
        csv += 'Part,Speaker,Planned,Actual,Variance\n';
        report.parts.forEach(part => {
            csv += `"${part.name}","${part.speaker || '-'}",${formatTime(part.plannedDuration)},${formatTime(part.actualDuration)},${part.variance > 0 ? '+' : ''}${formatTime(part.variance)}\n`;
        });
        
        // Add comments to CSV
        csv += `\nComments\n`;
        csv += `Total Comments,${report.comments.total}\n`;
        csv += `Average Duration,${formatTime(report.comments.average)}\n\n`;
        
        // Add comments by part to CSV
        csv += 'Part,Count,Average\n';
        Object.keys(report.comments.byPart).forEach(partName => {
            const partComments = report.comments.byPart[partName];
            csv += `"${partName}",${partComments.count},${formatTime(partComments.average)}\n`;
        });
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `meeting_report_${report.date.replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

//----------------------------------------------------------------------------------------------
// KEYBOARD SHORTCUTS
//----------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    themeManager.init();
    
    // Initialize sound manager
    soundManager.init();
    
    // Add sound toggle button event listener
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            soundManager.toggleSound();
        });
    }
    
    // Add theme toggle button event listener
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            themeManager.toggleTheme();
        });
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Only handle shortcuts when not in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // D: Toggle dark mode
        if (e.key === 'd' || e.key === 'D') {
            themeManager.toggleTheme();
        }
        
        // S: Toggle sound
        if (e.key === 's' || e.key === 'S') {
            soundManager.toggleSound();
        }
        
        // ?: Show keyboard shortcuts
        if (e.key === '?') {
            const shortcutsModal = document.getElementById('shortcutsModal');
            if (shortcutsModal) {
                shortcutsModal.classList.remove('hidden');
            }
        }
        
        // Esc: Close modal
        if (e.key === 'Escape') {
            document.querySelectorAll('.fixed:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
    
    // Close shortcuts modal button
    const closeShortcutsModal = document.getElementById('closeShortcutsModal');
    if (closeShortcutsModal) {
        closeShortcutsModal.addEventListener('click', () => {
            const shortcutsModal = document.getElementById('shortcutsModal');
            if (shortcutsModal) {
                shortcutsModal.classList.add('hidden');
            }
        });
    }
    
    // Close report modal button
    const closeReportModal = document.getElementById('closeReportModal');
    if (closeReportModal) {
        closeReportModal.addEventListener('click', () => {
            const reportModal = document.getElementById('reportModal');
            if (reportModal) {
                reportModal.classList.add('hidden');
            }
        });
    }
    
    // Export report button
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            reportManager.exportReport();
        });
    }
});
