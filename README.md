# Meeting Timer Web App
I am not a coder but am not too bad at using AI to code. I've got a working branch. [main] but I want to refactor the code to make it easier to maintain and modify. This is a work in progress and will take me quite a bit of time to complete as I only work on this in my spare time which is limited.


## Overview

The Meeting Timer Web App is designed to help organize and manage meetings efficiently. It provides tools to create timed sections within a meeting, track elapsed time, record comments, and maintain a history of comments with their durations.

## Features

- **Template Management**: Create, edit, reorder, and remove parts of the meeting template.
- **Timer Control**: Start, stop, and navigate between different parts of the meeting.
- **Comment Recording**: Toggle comment recording for specific meeting sections to track insights or feedback.
- **Performance Monitoring**: Logs performance metrics to identify slow-rendering operations.

## Installation

To get started with this project locally:

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/meeting-timer-web-app.git](https://github.com/bytesnotbits/LifeandMinistryTimer)
Navigate into the project directory:
cd meeting-timer-web-app
Open index.html in your favorite web browser to view and use the app.
Usage
Creating a Template: Use the "Add Part" button to add new sections to your meeting template. Customize each part with names, durations, speakers, and comment options.
Managing Parts: You can move parts up or down using arrow buttons, remove them with the '×' button, and edit their details directly in the interface.
Running Timers: Use the "Start/Stop" button to begin timing a section. Switch between sections only when the timer is stopped.
Recording Comments: Enable comments for specific parts and start recording when needed. Short comments (less than 5 seconds) are not recorded.
Local Storage
The app uses local storage to save meeting templates, elapsed times, and comment history across sessions.

Performance Monitoring
Performance metrics are logged in the console to identify slow-rendering components.

Contributing
Contributions are welcome! Please follow these steps:

Fork the repository.
Create a new branch (git checkout -b feature/your-feature-name).
Make your changes and commit them (git commit -m 'Add some feature').
Push to the branch (git push origin feature/your-feature-name).
Open a Pull Request.
License
This project is licensed under the MIT License
