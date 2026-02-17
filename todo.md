# Surgical Analysis Suite Refactoring Tasks

- [ ] **Design System Overhaul**
    - [ ] Update `index.html` to use professional medical fonts (Inter/Roboto).
    - [ ] Update `index.css` to "Clinical Professional" theme (Dark mode, #3cd29c accent).
    - [ ] Remove cyberpunk effects (scanlines, glitches).

- [ ] **Video Player Core**
    - [ ] Refactor `VideoPlayer.tsx` to support multi-view (grid layout).
    - [ ] Implement synchronized playback for multiple feeds.
    - [ ] Add view switching controls (Single, Split, Quad).

- [ ] **Surgical Features**
    - [ ] Create `Timeline` component with event markers and instrument tracking visualization.
    - [ ] Create `NotesPanel` component for timestamped annotations.
    - [ ] Create `DashboardLayout` to organize Video, Timeline, and Notes.

- [ ] **Integration**
    - [ ] Update `Home.tsx` to use the new Dashboard layout.
    - [ ] Verify keyboard shortcuts work with new layout.

- [ ] **Bug Fixes**
    - [ ] Fix `TypeError: ref2?.seekTo is not a function` in `SurgicalPlayer.tsx`.

- [ ] **User Help Resources**
    - [ ] Create `ShortcutsDialog` component.
    - [ ] Add keyboard icon trigger to `Home.tsx` header.
    - [ ] Ensure 'M' key mute shortcut is implemented in `SurgicalPlayer.tsx`.

- [ ] **Bug Fixes**
    - [ ] Fix `TypeError: playerRefs.current[activeView]?.getCurrentTime is not a function` in `SurgicalPlayer.tsx`.
    - [ ] Fix `Unknown event handler property onDuration` warning in `SurgicalPlayer.tsx`.

- [ ] **Bug Fixes**
    - [ ] Fix `Unknown event handler property onDuration` warning in `SurgicalPlayer.tsx`.

- [ ] **Procedure Timeline**
    - [ ] Create `ProcedureTimeline` component.
    - [ ] Integrate `ProcedureTimeline` into `SurgicalPlayer.tsx`.
    - [ ] Ensure timeline bars are clickable and sync with video playback.

- [ ] **Instrument Usage Timeline**
    - [ ] Update `ProcedureTimeline` to support instrument tracks.
    - [ ] Add mock instrument usage data to `SurgicalPlayer.tsx`.
    - [ ] Render instrument usage bars below phase bars.

- [ ] **Instrument Visibility Toggles**
    - [ ] Add state for visible instruments in `SurgicalPlayer.tsx`.
    - [ ] Create filter UI (popover with checkboxes).
    - [ ] Filter `MOCK_INSTRUMENTS` based on visibility state.

- [ ] **Object Detection & Heatmapping**
    - [ ] Create `ObjectOverlay` component for bounding boxes.
    - [ ] Create `HeatmapOverlay` component for spatial activity.
    - [ ] Integrate overlays into `SurgicalPlayer`.
    - [ ] Add toggle controls for these visualizations.
- [ ] **Efficiency Metrics & Report**
    - [ ] Calculate total usage time per instrument.
    - [ ] Calculate phase durations.
    - [ ] Update `ReportGenerator` to include these metrics in the PDF.
- [ ] **Manual Event Logging**
    - [ ] Add UI to manually add/edit instrument usage events with start/end times.

- [ ] **Top Menu Bar & Bug Fixes**
    - [ ] Fix `TypeError: activePlayer.getInternalPlayer is not a function` in `SurgicalPlayer.tsx`.
    - [ ] Implement Top Menu Bar (File, Edit, View, About, Help).
    - [ ] Add "Instructions for Use" content to Help menu.
    - [ ] Add export options to File menu.

- [ ] **AI Overlays Testing**
    - [ ] Add placeholder images/visuals for Object Detection overlay.
    - [ ] Add placeholder images/visuals for Heatmap overlay.
    - [ ] Ensure overlays persist/update correctly when switching views.

- [ ] **Timeline Enhancements**
    - [ ] Lift `MOCK_PHASES` and `MOCK_INSTRUMENTS` to `Home.tsx` state.
    - [ ] Update `ProcedureTimeline` to accept editable data and `onUpdate` callbacks.
    - [ ] Implement drag-to-move logic for timeline bars.
    - [ ] Implement drag-to-resize handles for timeline bars.
    - [ ] Ensure timeline updates reflect in `SurgicalPlayer` and other views.

- [ ] **Undo/Redo System**
    - [ ] Create `useHistory` hook for state management.
    - [ ] Wrap `phases`, `customInstruments`, `loggedEvents`, and `annotations` in history state.
    - [ ] Add global keyboard listeners for Ctrl+Z / Ctrl+Y.
    - [ ] Add Undo/Redo buttons to Top Menu Bar.

- [ ] **Report Expansion**
    - [ ] Update `generateReport` to accept and render full 100+ data points.
    - [ ] Add "AI Analysis" section to report.
    - [ ] Include Object Detection statistics in report.
    - [ ] Include Heatmap summary in report.

- [ ] **Authentication & Workflow**
    - [ ] Create `LoginPage`, `RegisterPage`, `ForgotPasswordPage`.
    - [ ] Implement `CaseSetupPage` for notes, research questions, and file upload.
    - [ ] Update `App.tsx` with routing (wouter).

- [ ] **Video Player Enhancements**
    - [ ] Update video sources to represent Heart Surgery views (Room, Echo, Field, Table).
    - [ ] Implement View Selector for Split Layout.
    - [ ] Fix Fullscreen functionality.
    - [ ] Add "Still Photo" overlay in player.

- [ ] **Layout & Styling**
    - [ ] Make sidebars collapsible/resizable.
    - [ ] Update color theme to Medical Standards (Teal/Slate).
    - [ ] Add "Results" section to Report.

- [ ] **Research Engine**
  - [ ] Generate 20+ dynamic research questions
  - [ ] Generate data-driven answers
  - [ ] Integrate into Report Generator
- [ ] **Advanced Reporting**
  - [ ] Move Data Log to Appendix
  - [ ] Add CSV Export
  - [ ] Add Heatmap Export
- [ ] **Timeline 2.0**
  - [ ] Zoom controls
  - [ ] Segment highlighting
  - [ ] Expandable tracks
- [ ] **Visual Insights**
  - [ ] Efficiency Curves
  - [ ] Usage Density

- [ ] **Preferences & Customization**
    - [ ] Create PreferencesContext
    - [ ] Implement PreferencesDialog (Theme, Log View, Instruments)
    - [ ] Integrate with TopMenuBar
- [ ] **Event Log Enhancements**
    - [ ] Implement Pop-out window for logs
    - [ ] Add Audit Trail (Beginning Log)
    - [ ] Enhance Export (Excel/CSV with charts)
- [ ] **Research Q&A**
    - [ ] Add interactivity (jump to time)
    - [ ] Embed charts in Q&A cards
- [ ] **Procedure Management**
    - [ ] Edit Procedure Details modal
    - [ ] Persist metadata

- [ ] **UI/UX Enhancements**
    - [ ] Collapsible panels with icon-only mode
    - [ ] Window dropdown menu for panel visibility
    - [ ] Layout presets (Timeline, Insights, Annotations, Logging)
    - [ ] Tooltips for all interactive buttons
    - [ ] Gear icon -> Settings entry point
    - [ ] "DS" indicator -> User Profile dropdown
- [ ] **Timeline & Logging**
    - [ ] Color coordination for phases/instruments
    - [ ] Phase filters for timeline
    - [ ] Double-click to seek (already implemented, verify)
    - [ ] Group repeated instrument usage in log
    - [ ] Rename "Category" to "Phase" in logger
    - [ ] Add "Complication" type
    - [ ] Track instrument passes & handlers
    - [ ] Instrument usage % display
- [ ] **Annotations & Snapshots**
    - [ ] Editable annotations
    - [ ] Snapshot editor (Text, Box, Arrow, Draw, Blur)
    - [ ] PHI redaction (Blur)
- [ ] **Insights**
    - [ ] Trends view
    - [ ] 10+ new insights
    - [ ] Inefficiency highlighting
    - [ ] Insight filtering
    - [ ] Summary section
    - [ ] Hover text contrast fix
- [ ] **Export**
    - [ ] Include notes/insights in report
    - [ ] Export snapshots to folder (Zip)
    - [ ] PHI compliance checks
- [ ] **Other**
    - [ ] Dictation support
    - [ ] Spellcheck enabled
    - [ ] Live streaming UI placeholder
    - [ ] Expanded Preferences


---

## CURRENT PRIORITY: Video Management Features Implementation

### Video Upload & Management
- [ ] Enhance Preliminary Notes page with drag-and-drop video upload
- [ ] Implement video file validation (format, size, duration)
- [ ] Add video naming/labeling system (Surgical Site, Echo, Instrument Table, Room View)
- [ ] Store video metadata (filename, duration, upload date)
- [ ] Implement video pre-loading before entering main interface
- [ ] Add progress indicator during video loading

### Synchronized Playback Controls
- [ ] Implement Play/Pause control affecting all 4 videos
- [ ] Implement Seek/Timeline scrubbing for all videos
- [ ] Implement Rewind functionality
- [ ] Implement Fast-forward functionality
- [ ] Add playback speed adjustment (0.5x, 1x, 1.5x, 2x)
- [ ] Add frame-by-frame navigation
- [ ] Display current time and total duration
- [ ] Sync playback state across all video feeds

### Video Layout Options
- [x] Implement Single view (one large video)
- [x] Implement Split view (two videos side-by-side)
- [x] Implement Quad view (all 4 videos in 2x2 grid)
- [x] Add layout switching buttons
- [x] Ensure layout switching doesn't interrupt playback
- [x] Maintain consistent video player size across layouts
- [x] Add feed selection dropdowns to each video player
- [x] Reposition video player controls above timeline controls

### Interactive Timeline
- [x] Create timeline visualization showing procedure duration
- [x] Implement double-click to jump to timestamp
- [x] Add visual markers for logged events
- [x] Add color-coded event indicators
- [x] Implement timeline scrubbing
- [x] Display event labels on timeline hover
