(function () {
    const SHARE_SOCKET_PATH = '/share';
    const SHARE_STORAGE_KEY = 'ministryTimerShareSession';
    const BROADCAST_INTERVAL_MS = 1000;

    const params = new URLSearchParams(window.location.search);
    const shareView = params.get('view') === 'share';
    const shareMeetingId = params.get('id');

    const share = {
        socket: null,
        session: null,
        statusElement: null,
        broadcastTimer: null,
        pendingBroadcast: false,

        init() {
            if (shareView && shareMeetingId) {
                this.initViewer(shareMeetingId);
                return;
            }

            this.injectHostControls();
            this.restoreHostSession();
            this.patchStateBroadcasts();
        },

        injectHostControls() {
            const toolbar = document.querySelector('.app-toolbar');
            if (!toolbar) return;

            const button = document.createElement('button');
            button.id = 'shareMeetingBtn';
            button.className = 'share-meeting-btn';
            button.type = 'button';
            button.setAttribute('aria-label', 'Create share link');
            button.title = 'Create share link';
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <path d="M8.59 13.51 15.42 17.49"></path>
                    <path d="M15.41 6.51 8.59 10.49"></path>
                </svg>
            `;
            button.addEventListener('click', () => this.createShare());
            toolbar.insertBefore(button, toolbar.firstChild);

            const status = document.createElement('span');
            status.id = 'shareMeetingStatus';
            status.className = 'share-meeting-status';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            toolbar.appendChild(status);
            this.statusElement = status;
        },

        restoreHostSession() {
            const raw = localStorage.getItem(SHARE_STORAGE_KEY);
            if (!raw) return;

            try {
                const session = JSON.parse(raw);
                if (session && session.meetingId && session.hostToken) {
                    this.session = session;
                    this.connectHost();
                }
            } catch {
                localStorage.removeItem(SHARE_STORAGE_KEY);
            }
        },

        async createShare() {
            try {
                this.setStatus('Creating share link...');
                const response = await fetch('/api/share', { method: 'POST' });
                if (!response.ok) {
                    throw new Error(`Share request failed: ${response.status}`);
                }

                this.session = await response.json();
                localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(this.session));
                await this.copyShareLink(this.session.viewerUrl);
                this.connectHost();
                this.setStatus('Share link copied');
            } catch (error) {
                console.error('Unable to create share link:', error);
                this.setStatus('Share unavailable');
                if (typeof notify !== 'undefined') {
                    notify.show('Unable to create share link. Is the VPS server running?', 'error');
                }
            }
        },

        async copyShareLink(url) {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
            }
            if (typeof notify !== 'undefined') {
                notify.show(`Share link: ${url}`, 'success');
            }
        },

        connectHost() {
            if (!this.session || this.socket?.readyState === WebSocket.OPEN) return;

            this.socket = new WebSocket(this.socketUrl());
            this.socket.addEventListener('open', () => {
                this.socket.send(JSON.stringify({
                    type: 'host:join',
                    meetingId: this.session.meetingId,
                    hostToken: this.session.hostToken
                }));
                this.startBroadcasting();
            });
            this.socket.addEventListener('message', (event) => this.handleHostMessage(event));
            this.socket.addEventListener('close', () => {
                this.stopBroadcasting();
                window.setTimeout(() => this.connectHost(), 3000);
            });
        },

        handleHostMessage(event) {
            const message = JSON.parse(event.data);
            if (message.type === 'host:ready') {
                this.setStatus(`Sharing live (${message.viewers} viewers)`);
                this.broadcastNow();
            } else if (message.type === 'error') {
                this.setStatus(message.message || 'Share error');
            }
        },

        patchStateBroadcasts() {
            if (typeof state === 'undefined' || state.__sharePatched) return;

            const originalSaveState = state.saveState.bind(state);
            state.saveState = (...args) => {
                const result = originalSaveState(...args);
                this.scheduleBroadcast();
                return result;
            };
            state.__sharePatched = true;
        },

        startBroadcasting() {
            this.stopBroadcasting();
            this.broadcastTimer = window.setInterval(() => this.broadcastNow(), BROADCAST_INTERVAL_MS);
            this.broadcastNow();
        },

        stopBroadcasting() {
            if (this.broadcastTimer) {
                window.clearInterval(this.broadcastTimer);
                this.broadcastTimer = null;
            }
        },

        scheduleBroadcast() {
            if (!this.session || this.pendingBroadcast) return;

            this.pendingBroadcast = true;
            window.setTimeout(() => {
                this.pendingBroadcast = false;
                this.broadcastNow();
            }, 150);
        },

        broadcastNow() {
            if (!this.session || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;
            if (typeof state === 'undefined' || typeof state.getShareSnapshot !== 'function') return;

            this.socket.send(JSON.stringify({
                type: 'host:snapshot',
                snapshot: state.getShareSnapshot()
            }));
        },

        initViewer(meetingId) {
            document.documentElement.dataset.shareView = 'viewer';
            document.body.classList.add('share-viewer-mode');

            if (typeof state !== 'undefined') {
                state.isViewerMode = true;
            }

            this.socket = new WebSocket(this.socketUrl());
            this.socket.addEventListener('open', () => {
                this.socket.send(JSON.stringify({
                    type: 'viewer:join',
                    meetingId
                }));
            });
            this.socket.addEventListener('message', (event) => this.handleViewerMessage(event));
            this.socket.addEventListener('close', () => this.showViewerStatus('Share link disconnected'));
        },

        handleViewerMessage(event) {
            const message = JSON.parse(event.data);
            if ((message.type === 'viewer:ready' || message.type === 'snapshot') && message.snapshot) {
                this.applySnapshot(message.snapshot);
            } else if (message.type === 'error') {
                this.showViewerStatus(message.message || 'Share link unavailable');
            }
        },

        applySnapshot(snapshot) {
            if (typeof state === 'undefined' || typeof state.applyShareSnapshot !== 'function') return;

            state.applyShareSnapshot(snapshot);
            if (typeof render !== 'undefined') {
                render.timerDisplay();
                render.globalTimerDisplay();
                render.comments();
            }
            this.showViewerStatus('Live');
        },

        showViewerStatus(message) {
            let badge = document.getElementById('shareViewerStatus');
            if (!badge) {
                badge = document.createElement('div');
                badge.id = 'shareViewerStatus';
                badge.className = 'share-viewer-status';
                badge.setAttribute('role', 'status');
                document.body.appendChild(badge);
            }
            badge.textContent = message;
        },

        socketUrl() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            return `${protocol}//${window.location.host}${SHARE_SOCKET_PATH}`;
        },

        setStatus(message) {
            if (this.statusElement) {
                this.statusElement.textContent = message;
            }
        }
    };

    window.realtimeShare = share;

    document.addEventListener('DOMContentLoaded', () => {
        share.init();
    });
})();
