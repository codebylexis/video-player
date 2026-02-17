import { SurgicalPlayer, SurgicalPlayerRef } from "@/components/SurgicalPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { generateReport } from "@/lib/report-generator";
import { cn } from "@/lib/utils";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { TopMenuBar } from "@/components/TopMenuBar";
import { Camera, Clock, FileText, Hash, Mic, Plus, Settings, Share2, Keyboard, Undo, Redo, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Video, BarChart2, User, LogOut, CreditCard, Users, ExternalLink } from "lucide-react";
import { MOCK_PHASES, MOCK_INSTRUMENTS, SurgicalPhase, InstrumentUsage } from "@/components/ProcedureTimeline";
import { ManualEventLogger, LoggedEvent } from "@/components/ManualEventLogger";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useHistory } from "@/hooks/useHistory";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePreferences } from "@/contexts/PreferencesContext";
import { ProcedureDetailsDialog, CaseDetails } from "@/components/ProcedureDetailsDialog";
import { PreferencesDialog } from "@/components/PreferencesDialog";
import { SnapshotEditor } from "@/components/SnapshotEditor";
import { CaseComparisonDialog } from "@/components/CaseComparisonDialog";
import { NoteEditorDialog } from "@/components/NoteEditorDialog";

interface Annotation {
  time: string;
  author: string;
  text: string;
  snapshotUrl?: string;
}

interface ProjectState {
  phases: SurgicalPhase[];
  instruments: InstrumentUsage[];
  events: LoggedEvent[];
  annotations: Annotation[];
  snapshots: string[];
  caseDetails: CaseDetails;
}

export default function Home() {
  const playerRef = useRef<SurgicalPlayerRef>(null);
  const [noteText, setNoteText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [layout, setLayout] = useState<"single" | "split" | "quad">("single");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [viewMode, setViewMode] = useState<"analysis" | "insights">("analysis");
  const [videoFeeds, setVideoFeeds] = useState<string[]>([
    "/placeholders/surgical-field.jpg",
    "/placeholders/echo-monitor.jpg",
    "/placeholders/instrument-table.jpg",
    "/placeholders/room-view.png"
  ]);
  
  // Preferences
  const { logViewMode, visiblePanels, togglePanel, layoutPreset, setLayoutPreset } = usePreferences();

  // Sync layout preset with visible panels
  useEffect(() => {
    if (layoutPreset === "review") {
      togglePanel("left", false);
      togglePanel("right", false);
      togglePanel("bottom", true);
    } else if (layoutPreset === "audit") {
      togglePanel("left", true);
      togglePanel("right", false);
      togglePanel("bottom", true);
    } else if (layoutPreset === "standard") {
      togglePanel("left", true);
      togglePanel("right", true);
      togglePanel("bottom", true);
    }
  }, [layoutPreset]);
  const [popoutWindow, setPopoutWindow] = useState<Window | null>(null);
  const [showProcedureDetails, setShowProcedureDetails] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<string | null>(null);
  const [snapshotEditorOpen, setSnapshotEditorOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize History State
  const { state: projectState, set: setProjectState, undo, redo, canUndo, canRedo } = useHistory<ProjectState>({
    phases: MOCK_PHASES,
    instruments: MOCK_INSTRUMENTS,
    events: (() => {
      // Generate realistic 1-hour surgery simulation data
      const events: LoggedEvent[] = [];
      
      // 1. Pre-Op Phase (0-15 mins)
      events.push({ label: "Patient Arrival", type: "milestone", category: "pre-op", startTime: 0, endTime: 0 });
      events.push({ label: "Anesthesia Induction", type: "milestone", category: "pre-op", startTime: 300, endTime: 300 });
      events.push({ label: "Positioning", type: "phase", category: "pre-op", startTime: 600, endTime: 900 });
      events.push({ label: "Timeout", type: "milestone", category: "pre-op", startTime: 900, endTime: 900 });

      // 2. Intra-Op Phase (15-50 mins)
      // Incision
      events.push({ label: "Incision Start", type: "milestone", category: "intra-op", startTime: 960, endTime: 960 });
      events.push({ label: "Scalpel", type: "instrument", category: "intra-op", startTime: 960, endTime: 1020 }); // 1 min
      
      // Trocar Insertion
      events.push({ label: "Trocar Insertion", type: "instrument", category: "intra-op", startTime: 1080, endTime: 1200 }); // 2 mins
      
      // Dissection (Heavy instrument usage)
      for (let t = 1300; t < 2500; t += 150) {
        const duration = 60 + Math.random() * 60;
        events.push({ 
          label: Math.random() > 0.5 ? "Bipolar Forceps" : "Harmonic Scalpel", 
          type: "instrument", 
          category: "intra-op", 
          startTime: t, 
          endTime: t + duration 
        });
        
        // Occasional Suction
        if (Math.random() > 0.7) {
          events.push({ 
            label: "Suction", 
            type: "instrument", 
            category: "intra-op", 
            startTime: t + duration + 10, 
            endTime: t + duration + 40 
          });
        }
      }

      // Critical View (Milestone)
      events.push({ label: "Critical View of Safety", type: "milestone", category: "intra-op", startTime: 2000, endTime: 2000 });

      // Clipping & Cutting
      events.push({ label: "Clip Applier", type: "instrument", category: "intra-op", startTime: 2600, endTime: 2700 });
      events.push({ label: "Scissors", type: "instrument", category: "intra-op", startTime: 2720, endTime: 2780 });

      // Complication Simulation (Bleeding)
      events.push({ label: "Minor Bleeding", type: "complication", category: "intra-op", startTime: 2800, endTime: 2800 });
      events.push({ label: "Suction", type: "instrument", category: "intra-op", startTime: 2805, endTime: 2865 });
      events.push({ label: "Bipolar Forceps", type: "instrument", category: "intra-op", startTime: 2870, endTime: 2930 });
      events.push({ label: "Hemostasis Achieved", type: "milestone", category: "intra-op", startTime: 2940, endTime: 2940 });

      // Extraction
      events.push({ label: "Specimen Bag", type: "instrument", category: "intra-op", startTime: 3000, endTime: 3120 });

      // 3. Post-Op Phase (50-60 mins)
      events.push({ label: "Closure Start", type: "milestone", category: "post-op", startTime: 3200, endTime: 3200 });
      events.push({ label: "Suture", type: "instrument", category: "post-op", startTime: 3210, endTime: 3500 });
      events.push({ label: "Dressing Applied", type: "milestone", category: "post-op", startTime: 3550, endTime: 3550 });
      events.push({ label: "Extubation", type: "milestone", category: "post-op", startTime: 3600, endTime: 3600 });

      return events.sort((a, b) => a.startTime - b.startTime);
    })(),
    annotations: [
      { time: "00:18:30", author: "Dr. Strange", text: "Adhesions noted around the gallbladder neck. Proceeding with caution." },
      { time: "00:22:15", author: "Dr. Strange", text: "Double clipping of the cystic duct confirmed. No leakage observed." }
    ],
    snapshots: [],
    caseDetails: {
      id: "8492-A",
      surgeon: "Dr. S. Strange",
      procedure: "Laparoscopic Cholecystectomy",
      date: new Date().toISOString().split('T')[0],
      notes: ""
    }
  });

  useEffect(() => {
    // Initialize BroadcastChannel for cross-window communication
    const channel = new BroadcastChannel("surgical_cockpit_sync");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "REQUEST_STATE") {
        channel.postMessage({
          type: "SYNC_STATE",
          payload: {
            currentTime: currentTime,
            loggedEvents: projectState.events.filter(e => e.type !== 'instrument'), // Only manual events
            annotations: projectState.annotations
          }
        });
      } else if (type === "LOG_EVENT") {
        handleLogEvent(payload);
      } else if (type === "ADD_NOTE") {
        handleAddNote(payload.text);
      } else if (type === "SEEK") {
        if (playerRef.current) {
          playerRef.current.seekTo(payload);
        }
      } else if (type === "CAPTURE_SNAPSHOT") {
        handleCaptureSnapshot();
      }
    };

    return () => {
      channel.close();
    };
  }, [projectState]);

  // Broadcast time updates
  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: "TIME_UPDATE",
        payload: currentTime
      });
    }
  }, [currentTime]);

  const handleLogEvent = (event: LoggedEvent) => {
    setProjectState(prev => ({
      ...prev,
      events: [...prev.events, event].sort((a, b) => a.startTime - b.startTime)
    }));
    toast.success(`Logged: ${event.label}`);
  };

  // Mock Logs
  const [systemLogs] = useState([
    { time: "00:00:00", event: "Recording Started", type: "info" },
    { time: "00:04:23", event: "Incision Made", type: "action" },
    { time: "00:12:45", event: "Trocar Insertion", type: "action" },
    { time: "00:18:30", event: "Gallbladder Identified", type: "observation" },
    { time: "00:22:15", event: "Cystic Duct Clipped", type: "critical" },
  ]);

  // Load uploaded videos from session storage
  useEffect(() => {{
    const loadUploadedVideos = async () => {{
      try {{
        const caseSetupStr = localStorage.getItem("caseSetup");
        if (caseSetupStr) {{
          const caseSetup = JSON.parse(caseSetupStr);
          if (caseSetup.videoSlots) {{
            // Get video files from window object (passed from CaseSetup)
            const uploadedVideos: string[] = [
              "/placeholders/surgical-field.jpg",
              "/placeholders/echo-monitor.jpg",
              "/placeholders/instrument-table.jpg",
              "/placeholders/room-view.png"
            ];
            
            // Check if there are video files in window.uploadedVideoFiles
            const windowAny = window as any;
            if (windowAny.uploadedVideoFiles && Array.isArray(windowAny.uploadedVideoFiles)) {{
              windowAny.uploadedVideoFiles.forEach((file: File, index: number) => {{
                if (index < 4) {{
                  const objectUrl = URL.createObjectURL(file);
                  uploadedVideos[index] = objectUrl;
                }}
              }});
            }}
            
            setVideoFeeds(uploadedVideos);
          }}
        }}
      }} catch (error) {{
        console.error("Error loading uploaded videos:", error);
      }}
    }};
    
    loadUploadedVideos();
  }}, []);

  // Pop-out Window Logic
  useEffect(() => {
    const channel = new BroadcastChannel("sas_event_log");
    
    channel.onmessage = (msg) => {
      if (msg.data.type === "REQUEST_SYNC") {
        channel.postMessage({ type: "SYNC_EVENTS", events: projectState.events });
      } else if (msg.data.type === "ADD_EVENT") {
        // Handle event from popout
        setProjectState(prev => ({
          ...prev,
          events: [...prev.events, msg.data.event].sort((a, b) => a.startTime - b.startTime)
        }));
        toast.success(`Logged event: ${msg.data.event.label}`);
      }
    };

    // Sync time periodically or on change
    channel.postMessage({ type: "SYNC_TIME", time: currentTime });

    return () => channel.close();
  }, [projectState.events, currentTime, setProjectState]);

  useEffect(() => {
    if (logViewMode === "popout" && !popoutWindow) {
      const win = window.open("/log-window", "EventLog", "width=400,height=600,resizable=yes,scrollbars=yes");
      setPopoutWindow(win);
    } else if (logViewMode === "docked" && popoutWindow) {
      popoutWindow.close();
      setPopoutWindow(null);
    }
  }, [logViewMode, popoutWindow]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) {
            redo();
            toast.info("Redo");
          }
        } else {
          if (canUndo) {
            undo();
            toast.info("Undo");
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) {
          redo();
          toast.info("Redo");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleCaptureSnapshot = () => {
    const snapshot = playerRef.current?.captureSnapshot();
    if (snapshot) {
      // Add snapshot as a new annotation automatically
      const newNote: Annotation = {
        time: formatTime(currentTime),
        author: "Dr. Strange",
        text: "Snapshot captured",
        snapshotUrl: snapshot
      };
      
      setProjectState(prev => ({
        ...prev,
        snapshots: [...prev.snapshots, snapshot],
        annotations: [...prev.annotations, newNote]
      }));
      toast.success("Snapshot captured and added to notes");
    } else {
      toast.error("Failed to capture snapshot");
    }
  };

  const handleDictation = () => {
    if (isListening) {
      setIsListening(false);
      toast.info("Dictation stopped");
    } else {
      setIsListening(true);
      toast.info("Listening... (Simulated)");
      // Simulate dictation result after 3 seconds
      setTimeout(() => {
        setNoteText(prev => prev + (prev ? " " : "") + "Patient vitals are stable. Proceeding with dissection.");
        setIsListening(false);
        toast.success("Dictation captured");
      }, 3000);
    }
  };

  const handleEditSnapshot = (index: number, url: string) => {
    setActiveAnnotationIndex(index);
    setEditingSnapshot(url);
    setSnapshotEditorOpen(true);
  };

  const handleSaveSnapshot = (editedUrl: string) => {
    if (activeAnnotationIndex !== null) {
      setProjectState(prev => {
        const newAnnotations = [...prev.annotations];
        newAnnotations[activeAnnotationIndex] = {
          ...newAnnotations[activeAnnotationIndex],
          snapshotUrl: editedUrl
        };
        return { ...prev, annotations: newAnnotations };
      });
      toast.success("Snapshot updated");
    }
  };

  const handleDoubleClickNote = (index: number, text: string) => {
    setEditingNoteId(index);
    setEditingNoteText(text);
  };

  const handleSaveNote = (newText: string) => {
    if (editingNoteId !== null) {
      setProjectState(prev => {
        const newAnnotations = [...prev.annotations];
        newAnnotations[editingNoteId] = {
          ...newAnnotations[editingNoteId],
          text: newText
        };
        return { ...prev, annotations: newAnnotations };
      });
      toast.success("Note updated");
      setEditingNoteId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const hh = Math.floor(seconds / 3600);
    const mm = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const ss = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const handleAddNote = (text?: string) => {
    const content = text || noteText;
    if (!content.trim()) return;
    
    const newNote = {
      time: formatTime(currentTime),
      author: "Dr. Strange",
      text: content
    };
    
    setProjectState(prev => ({
      ...prev,
      annotations: [...prev.annotations, newNote]
    }));
    setNoteText("");
    toast.success("Note added");
  };

  const handleExportReport = async () => {
    // Retrieve case setup data
    const setupData = localStorage.getItem("caseSetup");
    const setup = setupData ? JSON.parse(setupData) : { notes: "", questions: [], fileName: null };

    toast.promise(
      generateReport({
        caseDetails: projectState.caseDetails,
        phases: projectState.phases,
        instruments: projectState.instruments,
        events: projectState.events,
        annotations: projectState.annotations,
        snapshots: projectState.snapshots,
        insights: undefined // Will be generated automatically
      }),
      {
        loading: "Generating Comprehensive Export Package...",
        success: "Report downloaded successfully",
        error: "Failed to generate report"
      }
    );
  };

  const handleSeekFromInsights = (time: number) => {
    setViewMode("analysis");
    // Wait for render then seek
    setTimeout(() => {
      // Assuming total duration is around 2100s or derived from phases
      const totalDuration = projectState.phases.length > 0 
        ? projectState.phases[projectState.phases.length-1].endTime 
        : 2100;
      
      playerRef.current?.seekTo(time / totalDuration);
      setCurrentTime(time);
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <ProcedureDetailsDialog 
        open={showProcedureDetails} 
        onOpenChange={setShowProcedureDetails} 
        details={projectState.caseDetails} 
        onSave={(details) => setProjectState(prev => ({ ...prev, caseDetails: details }))} 
      />
      <PreferencesDialog 
        open={showPreferences} 
        onOpenChange={setShowPreferences} 
      />
      <CaseComparisonDialog 
        open={showComparison} 
        onOpenChange={setShowComparison} 
      />
      <NoteEditorDialog
        open={editingNoteId !== null}
        onOpenChange={(open) => !open && setEditingNoteId(null)}
        initialText={editingNoteText}
        onSave={handleSaveNote}
      />
      <SnapshotEditor 
        open={snapshotEditorOpen} 
        onOpenChange={setSnapshotEditorOpen}
        imageUrl={editingSnapshot || ""}
        onSave={handleSaveSnapshot}
      />
      <TopMenuBar 
        onExportReport={handleExportReport}
        onShowShortcuts={() => setShowShortcuts(true)}
        onLayoutChange={setLayout}
        currentLayout={layout}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onShowPreferences={() => setShowPreferences(true)}
        onCompareCases={() => setShowComparison(true)}
      />
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight text-teal-400">
            <div className="w-8 h-8 bg-teal-500/20 rounded flex items-center justify-center text-teal-400 font-bold">
              <Video className="h-5 w-5" />
            </div>
            <span>Surgical Analysis Suite</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-slate-700" />
          <Button variant="ghost" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 px-2" onClick={() => setShowProcedureDetails(true)}>
            <span className="font-medium text-slate-200">Case #{projectState.caseDetails.id}</span>
            <span>•</span>
            <span>{projectState.caseDetails.surgeon}</span>
            <span>•</span>
            <span>{projectState.caseDetails.procedure}</span>
          </Button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 mx-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === "analysis" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode("analysis")}
                  className={cn("gap-2 h-8", viewMode === "analysis" && "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30")}
                >
                  <Video className="h-4 w-4" />
                  Analysis
                </Button>
              </TooltipTrigger>
              <TooltipContent>Video Analysis View</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === "insights" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode("insights")}
                  className={cn("gap-2 h-8", viewMode === "insights" && "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30")}
                >
                  <BarChart2 className="h-4 w-4" />
                  Insights
                </Button>
              </TooltipTrigger>
              <TooltipContent>Research Insights & Trends</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center mr-2 border-r border-slate-700 pr-2 gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={undo} 
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="text-slate-400 hover:text-slate-100"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={redo} 
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="text-slate-400 hover:text-slate-100"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300"
            onClick={handleExportReport}
          >
            <Share2 className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="ghost" size="icon" title="Keyboard Shortcuts" onClick={() => setShowShortcuts(true)} className="text-slate-400 hover:text-slate-100">
            <Keyboard className="h-5 w-5" />
          </Button>
          <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
          {/* Settings moved to TopMenuBar */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-4 hover:bg-slate-800 rounded-full">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">DS</div>
                <div className="flex flex-col items-start text-xs hidden md:flex">
                  <span className="font-medium text-slate-200">Dr. Strange</span>
                  <span className="text-slate-400">Surgeon</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem className="focus:bg-slate-800 focus:text-teal-400 cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-slate-800 focus:text-teal-400 cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-slate-800 focus:text-teal-400 cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                <span>Team</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem className="text-red-400 focus:bg-red-950/30 focus:text-red-400 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      {viewMode === "analysis" ? (
        <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          {/* Left Sidebar Removed - Merged into Right Panel */}

          {/* Center: Video Player & Timeline */}
          <ResizablePanel defaultSize={60} className="flex flex-col bg-slate-950">
            <div className="flex-1 relative">
              <SurgicalPlayer 
                ref={playerRef}
                urls={videoFeeds}
                className="h-full w-full"
                onTimeUpdate={setCurrentTime}
                customInstruments={projectState.instruments}
                layout={layout}
                onLayoutChange={setLayout}
                phases={projectState.phases}
                onPhasesChange={(phases) => setProjectState(prev => ({ ...prev, phases }))}
                onInstrumentsChange={(instruments) => setProjectState(prev => ({ ...prev, instruments }))}
              />
            </div>
          </ResizablePanel>

          {/* Right Sidebar: Unified Event Logger */}
          {visiblePanels.right && logViewMode === "docked" && <ResizableHandle className="bg-slate-800" />}
          
          {visiblePanels.right && logViewMode === "docked" && (
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-slate-900 border-l border-slate-800 flex flex-col">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <Clock className="h-4 w-4 text-teal-400" />
                  Event Logger
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    title="Pop-out Window"
                    onClick={() => togglePanel("right", false)} // Simulate pop-out by hiding docked panel
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePanel("right", false)}>
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
              </div>            
              <div className="flex-1 overflow-hidden flex flex-col">
                <ManualEventLogger 
                  currentTime={currentTime}
                  onLogEvent={(event) => {
                    setProjectState(prev => ({
                      ...prev,
                      events: [...prev.events, event].sort((a, b) => a.startTime - b.startTime)
                    }));
                    toast.success(`Logged event: ${event.label}`);
                  }}
                  loggedEvents={projectState.events}
                  annotations={projectState.annotations}
                  className="h-full border-0"
                  onCaptureSnapshot={handleCaptureSnapshot}
                  onDictation={handleDictation}
                  isListening={isListening}
                  onSeek={(time) => {
                    setCurrentTime(time);
                    if (playerRef.current) {
                      playerRef.current.seekTo(time);
                    }
                  }}
                  onAddNote={(text) => {
                    const newNote = {
                      time: formatTime(currentTime),
                      author: "Dr. Strange",
                      text: text
                    };
                    setProjectState(prev => ({
                      ...prev,
                      annotations: [...prev.annotations, newNote]
                    }));
                    toast.success("Note added");
                  }}
                  onUpdateEvent={(index, updatedEvent) => {
                    setProjectState(prev => {
                      const newEvents = [...prev.events];
                      newEvents[index] = updatedEvent;
                      return { ...prev, events: newEvents };
                    });
                    toast.success("Event updated");
                  }}
                  onUpdateNote={(index, newText) => {
                    setProjectState(prev => {
                      const newAnnotations = [...prev.annotations];
                      newAnnotations[index] = {
                        ...newAnnotations[index],
                        text: newText
                      };
                      return { ...prev, annotations: newAnnotations };
                    });
                    toast.success("Note updated");
                  }}
                />
              </div>
            </ResizablePanel>
          )}

          {!visiblePanels.right && (
            <div className="w-10 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-4 gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => togglePanel("right", true)}>
                      <PanelRightOpen className="h-4 w-4 text-slate-400 hover:text-teal-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Open Event Logger</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="writing-vertical-rl text-xs font-medium text-slate-400 tracking-wider uppercase select-none">
                Event Logger
              </div>
            </div>
          )}
        </ResizablePanelGroup>
      ) : (
        <div className="flex-1 overflow-auto p-6 bg-slate-950">
          <AnalyticsDashboard 
            phases={projectState.phases} 
            instruments={projectState.instruments} 
            events={projectState.events} 
            annotations={projectState.annotations}
            snapshots={projectState.snapshots}
            onSeek={handleSeekFromInsights}
          />
        </div>
      )}
    </div>
  );
}
