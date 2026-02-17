import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Clock, Play, Square, Table as TableIcon, Eye, Filter, Layers, ExternalLink, Users, Camera, Mic, FileText, Send, Edit2, Check, X, Search, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface LoggedEvent {
  label: string;
  type: string;
  startTime: number;
  endTime: number;
  category: string;
  notes?: string;
  staffRole?: string;
  anatomicalLocation?: string;
  actionOutcome?: string;
}

interface ManualEventLoggerProps {
  currentTime: number;
  onLogEvent: (event: LoggedEvent) => void;
  className?: string;
  loggedEvents?: LoggedEvent[];
  annotations?: any[];
  onCaptureSnapshot?: () => void;
  onDictation?: () => void;
  isListening?: boolean;
  onSeek?: (time: number) => void;
  onAddNote?: (text: string) => void;
  onUpdateEvent?: (index: number, event: LoggedEvent) => void;
  onUpdateNote?: (index: number, text: string) => void;
}

function condenseEvents(events: LoggedEvent[]) {
  if (events.length === 0) return [];
  
  const sorted = [...events].sort((a, b) => a.startTime - b.startTime);
  const condensed: any[] = [];
  
  let currentGroup: any = null;
  
  sorted.forEach((event) => {
    if (!currentGroup) {
      currentGroup = {
        ...event,
        lastEndTime: event.endTime,
        totalDuration: event.endTime - event.startTime,
        count: 1
      };
    } else {
      // Check if same label/type and within 10 minutes (600s)
      const isSame = event.label === currentGroup.label && event.type === currentGroup.type;
      const isClose = event.startTime - currentGroup.lastEndTime <= 600;
      
      if (isSame && isClose) {
        currentGroup.lastEndTime = event.endTime;
        currentGroup.totalDuration += (event.endTime - event.startTime);
        currentGroup.count++;
      } else {
        condensed.push(currentGroup);
        currentGroup = {
          ...event,
          lastEndTime: event.endTime,
          totalDuration: event.endTime - event.startTime,
          count: 1
        };
      }
    }
  });
  
  if (currentGroup) {
    condensed.push(currentGroup);
  }
  
  return condensed;
}

export function ManualEventLogger({ 
  currentTime, 
  onLogEvent, 
  className, 
  loggedEvents = [],
  annotations = [],
  onCaptureSnapshot,
  onDictation,
  isListening = false,
  onSeek,
  onAddNote,
  onUpdateEvent,
  onUpdateNote
}: ManualEventLoggerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [eventLabel, setEventLabel] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [eventType, setEventType] = useState("instrument");
  const [phaseCategory, setPhaseCategory] = useState("intra-op");
  const [staffRole, setStaffRole] = useState("Surgeon");
  const [anatomicalLocation, setAnatomicalLocation] = useState("");
  const [actionOutcome, setActionOutcome] = useState("Successful");
  const [showCondensed, setShowCondensed] = useState(() => {
    return localStorage.getItem("sas_pref_condensed") === "true";
  });
  const [touchMode, setTouchMode] = useState(() => {
    return localStorage.getItem("sas_pref_touch") === "true";
  });
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("sas_pref_condensed", String(showCondensed));
  }, [showCondensed]);

  useEffect(() => {
    localStorage.setItem("sas_pref_touch", String(touchMode));
  }, [touchMode]);
  const [showMacroDialog, setShowMacroDialog] = useState(false);
  const [macros, setMacros] = useState<{ name: string; events: string[] }[]>([
    { name: "Hernia Repair", events: ["Incision", "Dissection", "Mesh Placement", "Closure"] },
    { name: "Appendectomy", events: ["Port Placement", "Appendix Identification", "Stapling", "Retrieval"] }
  ]);
  const [teamMacros, setTeamMacros] = useState<{ name: string; events: string[] }[]>([
    { name: "Standard Cholecystectomy", events: ["Port Entry", "Cystic Duct Clip", "Cystic Artery Clip", "Gallbladder Removal"] },
    { name: "Trauma Laparotomy", events: ["Midline Incision", "Packing", "Exploration", "Damage Control"] }
  ]);
  const [newMacroName, setNewMacroName] = useState("");
  const [newMacroEvents, setNewMacroEvents] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");

  // Command Mode: Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRunMacro = (macro: { name: string; events: string[] }) => {
    macro.events.forEach((eventLabel, index) => {
      // Simulate logging events with a small time offset
      const event: LoggedEvent = {
        label: eventLabel,
        type: "milestone",
        startTime: currentTime + index * 5, // 5 seconds apart
        endTime: currentTime + index * 5 + 5,
        category: phaseCategory,
        staffRole,
        anatomicalLocation,
        actionOutcome: "Successful"
      };
      onLogEvent(event);
    });
  };

  const handleCreateMacro = () => {
    if (newMacroName && newMacroEvents) {
      const events = newMacroEvents.split(",").map(e => e.trim());
      setMacros([...macros, { name: newMacroName, events }]);
      setNewMacroName("");
      setNewMacroEvents("");
      setShowMacroDialog(false);
    }
  };

  // Tagging System
  const AVAILABLE_TAGS = [
    { label: "Critical", value: "#critical", color: "text-red-400 bg-red-950/30 border-red-900/50" },
    { label: "Teaching", value: "#teaching", color: "text-blue-400 bg-blue-950/30 border-blue-900/50" },
    { label: "Complication", value: "#complication", color: "text-orange-400 bg-orange-950/30 border-orange-900/50" },
    { label: "Technique", value: "#technique", color: "text-emerald-400 bg-emerald-950/30 border-emerald-900/50" }
  ];

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Context-Aware Suggestions
  const getNextStepSuggestions = () => {
    if (loggedEvents.length === 0) return [];
    const lastEvent = loggedEvents[loggedEvents.length - 1];
    
    const NEXT_STEPS: Record<string, string[]> = {
      "Incision Start": ["Retractor Placement", "Cautery Use", "Suction"],
      "Retractor Placement": ["Dissection / Exposure", "Tissue Handling"],
      "Dissection / Exposure": ["Hemostasis Achieved", "Instrument Pass"],
      "Hemostasis Achieved": ["Irrigation", "Suture Placement"],
      "Instrument Pass": ["Device Use", "Tissue Handling"],
      "Device Use": ["Instrument Pass", "Hemostasis Achieved"]
    };

    return NEXT_STEPS[lastEvent.label] || [];
  };

  const nextSteps = getNextStepSuggestions();

  // Combine events and annotations for the timeline
  const timelineItems = [
    ...loggedEvents.map((e, i) => ({ ...e, itemType: 'event', timestamp: e.startTime, originalIndex: i, id: `event-${i}` })),
    ...annotations.map((a, i) => {
      const [mm, ss] = a.time.split(':').map(Number);
      return { ...a, itemType: 'note', timestamp: mm * 60 + ss, label: "Surgeon Note", originalIndex: i, id: `note-${i}` };
    })
  ].sort((a, b) => b.timestamp - a.timestamp); // Newest first

  // Phase-specific event suggestions
  const SUGGESTED_EVENTS: Record<string, string[]> = {
    "pre-op": [
      "Instrument Preparation", "Patient Arrival", "Pre-op Checklist Completed", 
      "Consent Verified", "Vitals Baseline Taken", "Site Marked", 
      "Anesthesia Assessment", "IV Access Established", "Antibiotic Prophylaxis Administered", 
      "Sterile Field Prepped", "Timeout Initiated"
    ],
    "intra-op": [
      "Incision Start", "First Instrument Passed", "Device Use", 
      "Dissection / Exposure", "Tissue Handling", "Hemostasis Achieved", 
      "Instrument Pass", "Device Implantation / Intervention", "Intra-op Complication Logged", 
      "Specimen Retrieved", "Wound Closure Started", "Final Count Performed", 
      "Drapes Removed", "Incision Closure Completed"
    ],
    "post-op": [
      "Surgical Dressing Applied", "Patient Transferred to Gurney", 
      "PACU Arrival", "Post-op Orders Issued", "Surgical Reports Finalized"
    ]
  };

  const handleStart = () => {
    setStartTime(currentTime);
    setIsRecording(true);
  };

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<LoggedEvent | null>(null);

  // Validation Logic
  const validateSurgicalLogic = (newEvent: string, history: LoggedEvent[]): string | null => {
    const historyLabels = history.map(e => e.label);
    
    // Rule 1: Cannot close before incision
    if (newEvent.includes("Closure") && !historyLabels.some(l => l.includes("Incision"))) {
      return "You are attempting to log 'Closure' but no 'Incision' event has been recorded.";
    }

    // Rule 2: Cannot remove specimen before identification
    if (newEvent.includes("Removal") && !historyLabels.some(l => l.includes("Identification") || l.includes("Dissection"))) {
      return "Specimen removal logged without prior identification or dissection.";
    }

    // Rule 3: Post-Op phase events in Intra-Op
    if (phaseCategory === "intra-op" && (newEvent.includes("Recovery") || newEvent.includes("Discharge"))) {
      return "Post-operative events should not be logged during the Intra-Op phase.";
    }

    return null;
  };

  const handleStop = () => {
    if (startTime !== null) {
      const label = eventLabel || "Unnamed Event";
      
      // Surgical Guardrails (Logic Validation)
      const validationError = validateSurgicalLogic(label, loggedEvents);
      if (validationError) {
        const confirmOverride = window.confirm(`⚠️ Surgical Logic Warning:\n\n${validationError}\n\nDo you want to log this anyway?`);
        if (!confirmOverride) return;
      }

      setPendingEvent({
        label: label,
        type: eventType,
        startTime: startTime,
        endTime: currentTime,
        category: phaseCategory,
        staffRole,
        anatomicalLocation,
        actionOutcome,
        notes: activeTags.length > 0 ? activeTags.join(" ") : undefined
      });
      setShowConfirmDialog(true);
      setIsRecording(false);
    }
  };

  const confirmLog = () => {
    if (pendingEvent) {
      onLogEvent(pendingEvent);
      setPendingEvent(null);
      setStartTime(null);
      setEventLabel("");
      setShowConfirmDialog(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-medium uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-3 w-3" />
          Manual Event Logger
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button 
            variant={touchMode ? "secondary" : "ghost"}
            size="icon" 
            className="h-6 w-6" 
            title="Toggle Touch Mode"
            onClick={() => setTouchMode(!touchMode)}
          >
            <Users className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            title="Pop-out Cockpit"
            onClick={() => window.open('/cockpit', 'SurgicalCockpit', 'width=1200,height=800,menubar=no,toolbar=no')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          
          <Dialog open={showMacroDialog} onOpenChange={setShowMacroDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Macros">
                <Layers className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Custom Macros</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    My Macros
                    <span className="text-[10px] text-muted-foreground font-normal">Personal</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {macros.map((macro, idx) => (
                      <div key={idx} className="relative group">
                        <Button variant="outline" className="w-full justify-start text-xs" onClick={() => { handleRunMacro(macro); setShowMacroDialog(false); }}>
                          {macro.name}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                          title="Share to Team"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!teamMacros.find(m => m.name === macro.name)) {
                              setTeamMacros([...teamMacros, macro]);
                            }
                          }}
                        >
                          <Users className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label className="flex items-center justify-between">
                    Team Library
                    <span className="text-[10px] text-muted-foreground font-normal">Shared with everyone</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {teamMacros.map((macro, idx) => (
                      <Button key={idx} variant="secondary" className="w-full justify-start text-xs" onClick={() => { handleRunMacro(macro); setShowMacroDialog(false); }}>
                        <Users className="h-3 w-3 mr-2 opacity-50" />
                        {macro.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <Label>Create New Macro</Label>
                  <Input 
                    placeholder="Macro Name (e.g., Cholecystectomy)" 
                    value={newMacroName}
                    onChange={(e) => setNewMacroName(e.target.value)}
                  />
                  <Input 
                    placeholder="Events (comma separated, e.g., Incision, Clip, Cut)" 
                    value={newMacroEvents}
                    onChange={(e) => setNewMacroEvents(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleCreateMacro}>Create Macro</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        
        </div>
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Event Log</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Label</Label>
                  <Input 
                    value={pendingEvent?.label || ""} 
                    onChange={(e) => setPendingEvent(prev => prev ? ({ ...prev, label: e.target.value }) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={pendingEvent?.type || "instrument"} 
                    onValueChange={(val) => setPendingEvent(prev => prev ? ({ ...prev, type: val }) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instrument">Instrument</SelectItem>
                      <SelectItem value="phase">Phase</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="complication">Complication</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Data Points Review */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Staff Role</Label>
                  <Input 
                    value={pendingEvent?.staffRole || ""} 
                    onChange={(e) => setPendingEvent(prev => prev ? ({ ...prev, staffRole: e.target.value }) : null)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <Input 
                    value={pendingEvent?.anatomicalLocation || ""} 
                    onChange={(e) => setPendingEvent(prev => prev ? ({ ...prev, anatomicalLocation: e.target.value }) : null)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Outcome</Label>
                  <Select 
                    value={pendingEvent?.actionOutcome || "Successful"} 
                    onValueChange={(val) => setPendingEvent(prev => prev ? ({ ...prev, actionOutcome: val }) : null)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Successful">Successful</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                      <SelectItem value="Aborted">Aborted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground border p-2 rounded">
                <span>Start: {formatTime(pendingEvent?.startTime || 0)}</span>
                <span>End: {formatTime(pendingEvent?.endTime || 0)}</span>
                <span>Duration: {formatTime((pendingEvent?.endTime || 0) - (pendingEvent?.startTime || 0))}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
              <Button onClick={confirmLog}>Save Event</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Inspect Data">
              <TableIcon className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between pr-8">
              <DialogTitle>Procedure Data Log</DialogTitle>
              <Button 
                variant={showCondensed ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => setShowCondensed(!showCondensed)}
                className="h-7 text-xs gap-2"
              >
                <Layers className="h-3 w-3" />
                {showCondensed ? "Show All Events" : "Condense Events"}
              </Button>
            </DialogHeader>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time Range</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Duration</TableHead>
                    {showCondensed && <TableHead>Count</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loggedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No events logged yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (showCondensed ? condenseEvents(loggedEvents) : loggedEvents).map((event: any, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {showCondensed && event.count > 1 
                            ? `${formatTime(event.startTime)} - ${formatTime(event.lastEndTime)}`
                            : formatTime(event.startTime)
                          }
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>{event.label}</div>
                          {event.actionOutcome && event.actionOutcome !== "Successful" && (
                            <div className="text-[10px] text-red-400">{event.actionOutcome}</div>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                            event.type === "complication" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            event.type === "instrument" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            event.type === "phase" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          )}>
                            {event.type}
                          </span>
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{event.category}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {event.staffRole && <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.staffRole}</div>}
                          {event.anatomicalLocation && <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> {event.anatomicalLocation}</div>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {showCondensed && event.count > 1 
                            ? formatTime(event.totalDuration)
                            : formatTime(event.endTime - event.startTime)
                          }
                        </TableCell>
                        {showCondensed && (
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {event.count > 1 ? `x${event.count}` : "-"}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {/* 1. Phase Selection (First Priority) */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-primary">1. Select Phase</Label>
          <Select value={phaseCategory} onValueChange={setPhaseCategory} disabled={isRecording}>
            <SelectTrigger className={cn(
              "border-primary/20 bg-primary/5",
              touchMode ? "h-12 text-base" : "h-8 text-xs"
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre-op">Pre-Op Phase</SelectItem>
              <SelectItem value="intra-op">Intra-Op Phase</SelectItem>
              <SelectItem value="post-op">Post-Op Phase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. Event Name (Driven by Phase) */}
        <div className="space-y-1">
          <Label className="text-xs">2. Event Name</Label>
          
          {/* Context-Aware Suggestions */}
          {nextSteps.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="text-[10px] text-muted-foreground w-full">Suggested Next Steps:</span>
              {nextSteps.map(step => (
                <Button
                  key={step}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 border-teal-900/50 text-teal-400 hover:bg-teal-950/30"
                  onClick={() => setEventLabel(step)}
                >
                  {step}
                </Button>
              ))}
            </div>
          )}

          <div className="relative">
            <Input 
              value={eventLabel}
              onChange={(e) => setEventLabel(e.target.value)}
              placeholder="Select or type event..."
              className={cn(
                touchMode ? "h-12 text-base" : "h-8 text-xs"
              )}
              disabled={isRecording}
              list="event-suggestions"
            />
            <datalist id="event-suggestions">
              {(SUGGESTED_EVENTS[phaseCategory] || []).map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>

          {/* Tagging System */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                    activeTags.includes(tag.value) 
                      ? tag.color 
                      : "border-border text-muted-foreground hover:border-slate-600"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Type & Staff Role */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">3. Type</Label>
            <Select value={eventType} onValueChange={setEventType} disabled={isRecording}>
              <SelectTrigger className={cn(
                touchMode ? "h-12 text-base" : "h-8 text-xs"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instrument">Instrument</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="complication">Complication</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs">Staff Role</Label>
            <Select value={staffRole} onValueChange={setStaffRole} disabled={isRecording}>
              <SelectTrigger className={cn(
                touchMode ? "h-12 text-base" : "h-8 text-xs"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Surgeon">Surgeon</SelectItem>
                <SelectItem value="Assistant">Assistant</SelectItem>
                <SelectItem value="Nurse">Nurse</SelectItem>
                <SelectItem value="Anesthesiologist">Anesthesiologist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 4. Advanced Data Points (Collapsible or Always Visible) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Anatomical Location</Label>
            <Input 
              value={anatomicalLocation}
              onChange={(e) => setAnatomicalLocation(e.target.value)}
              placeholder="e.g. RUQ, Gallbladder"
              className="h-8 text-xs"
              disabled={isRecording}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Outcome</Label>
            <Select value={actionOutcome} onValueChange={setActionOutcome} disabled={isRecording}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Successful">Successful</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Aborted">Aborted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          {!isRecording ? (
            <Button 
              className="w-full h-8 text-xs gap-2 bg-primary hover:bg-primary/90" 
              onClick={handleStart}
              disabled={!eventLabel}
            >
              <Play className="h-3 w-3" />
              Start Logging
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono bg-secondary/20 p-2 rounded border border-border">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px] uppercase">Start Time</span>
                  <span>{formatTime(startTime || 0)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground text-[10px] uppercase">Duration</span>
                  <span className="text-teal-400 animate-pulse">{formatTime(currentTime - (startTime || 0))}</span>
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="w-full h-8 text-xs gap-2" 
                onClick={handleStop}
              >
                <Square className="h-3 w-3 fill-current" />
                Stop Recording
              </Button>
            </div>
          )}

          {/* Integrated Tools: Snapshot & Dictation */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs gap-2 border-slate-700 text-slate-300 hover:bg-slate-800" 
              onClick={onCaptureSnapshot}
            >
              <Camera className="h-3.5 w-3.5" /> Snapshot
            </Button>
            <Button 
              variant={isListening ? "destructive" : "outline"} 
              size="sm" 
              className={cn(
                "h-8 text-xs gap-2 border-slate-700 text-slate-300 hover:bg-slate-800",
                isListening && "animate-pulse bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/30"
              )}
              onClick={onDictation}
            >
              <Mic className={cn("h-3.5 w-3.5", isListening && "fill-current")} /> 
              {isListening ? "Listening..." : "Dictate"}
            </Button>
          </div>

          {/* Live Timeline Feed */}
          <div className="pt-2 border-t border-border mt-2">
            <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Live Feed</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {timelineItems.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4 italic">
                  No events or notes logged yet.
                </div>
              ) : (
                timelineItems.map((item, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "text-xs p-2 rounded border cursor-pointer transition-colors hover:bg-accent group relative",
                      item.itemType === 'note' ? "bg-blue-950/20 border-blue-900/30" : "bg-secondary/10 border-border/50",
                      // Highlight current item based on time
                      Math.abs(currentTime - item.timestamp) < 5 && "ring-1 ring-primary"
                    )}
                    onClick={() => {
                      if (editingItemId !== item.id) {
                        onSeek && onSeek(item.timestamp);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn("font-medium", item.itemType === 'note' ? "text-blue-400" : "text-foreground")}>
                        {item.itemType === 'note' ? <FileText className="inline w-3 h-3 mr-1"/> : null}
                        {item.label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    {/* Visual Duration Bar (Mini-Gantt) */}
                    {item.itemType === 'event' && (
                      <div className="w-full h-1 bg-slate-800/50 rounded-full mb-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full opacity-70",
                            item.label.includes("Incision") ? "bg-red-500" :
                            item.label.includes("Suture") ? "bg-blue-500" :
                            item.label.includes("Clip") ? "bg-yellow-500" :
                            "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(100, Math.max(5, Math.random() * 40))}%` }} // Mock duration for visual demo
                        />
                      </div>
                    )}
                    
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                        <Input 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-6 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (item.itemType === 'note' && onUpdateNote) {
                                onUpdateNote(item.originalIndex, editValue);
                              } else if (item.itemType === 'event' && onUpdateEvent) {
                                onUpdateEvent(item.originalIndex, { ...item, label: editValue });
                              }
                              setEditingItemId(null);
                            } else if (e.key === 'Escape') {
                              setEditingItemId(null);
                            }
                          }}
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-green-500 hover:text-green-400"
                          onClick={() => {
                            if (item.itemType === 'note' && onUpdateNote) {
                              onUpdateNote(item.originalIndex, editValue);
                            } else if (item.itemType === 'event' && onUpdateEvent) {
                              onUpdateEvent(item.originalIndex, { ...item, label: editValue });
                            }
                            setEditingItemId(null);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-red-500 hover:text-red-400"
                          onClick={() => setEditingItemId(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        {item.itemType === 'note' && (
                          <p className="text-muted-foreground line-clamp-2">{item.text}</p>
                        )}
                    {item.itemType === 'event' && (
                      <div className="flex flex-col gap-1 mt-1">
                        {item.staffRole && (
                          <div className="text-[10px] text-muted-foreground flex gap-2">
                            <span>{item.staffRole}</span>
                            {item.actionOutcome && (
                              <span className={cn(
                                item.actionOutcome === 'Successful' ? "text-green-500" : "text-red-500"
                              )}>
                                {item.actionOutcome}
                              </span>
                            )}
                          </div>
                        )}
                        {item.notes && item.notes.includes("#") && (
                          <div className="flex flex-wrap gap-1">
                            {item.notes.split(" ").filter((w: string) => w.startsWith("#")).map((tag: string, idx: number) => {
                              const tagConfig = AVAILABLE_TAGS.find(t => t.value === tag);
                              return (
                                <span 
                                  key={idx}
                                  className={cn(
                                    "text-[9px] px-1.5 rounded-full border",
                                    tagConfig ? tagConfig.color : "text-slate-400 border-slate-800"
                                  )}
                                >
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItemId(item.id);
                            setEditValue(item.itemType === 'note' ? item.text : item.label);
                          }}
                        >
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Note Input */}
          <div className="pt-2 border-t border-border mt-2 flex gap-2">
            <Input 
              placeholder="Add a quick note... (Try 'Tag Critical' to auto-tag)" 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && noteInput.trim() && onAddNote) {
                  // Voice-Activated Tagging Logic (Simulated via Text)
                  let finalText = noteInput;
                  const lowerText = noteInput.toLowerCase();
                  
                  if (lowerText.includes("tag critical")) {
                    finalText = finalText.replace(/tag critical/i, "").trim() + " #critical";
                  } else if (lowerText.includes("tag teaching")) {
                    finalText = finalText.replace(/tag teaching/i, "").trim() + " #teaching";
                  } else if (lowerText.includes("tag complication")) {
                    finalText = finalText.replace(/tag complication/i, "").trim() + " #complication";
                  }

                  // Predictive Tagging Logic (Context-Aware)
                  const PREDICTIVE_KEYWORDS: Record<string, string> = {
                    "bleeding": "#complication",
                    "hemorrhage": "#complication",
                    "injury": "#complication",
                    "suture": "#technique",
                    "anastomosis": "#technique",
                    "clip": "#technique",
                    "demonstrate": "#teaching",
                    "explain": "#teaching",
                    "student": "#teaching",
                    "resident": "#teaching"
                  };

                  Object.entries(PREDICTIVE_KEYWORDS).forEach(([keyword, tag]) => {
                    if (lowerText.includes(keyword) && !finalText.includes(tag)) {
                      finalText += ` ${tag}`;
                    }
                  });

                  onAddNote(finalText);
                  setNoteInput("");
                }
              }}
              className="h-8 text-xs"
            />
            <Button 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => {
                if (noteInput.trim() && onAddNote) {
                  // Voice-Activated Tagging Logic (Simulated via Text)
                  let finalText = noteInput;
                  const lowerText = noteInput.toLowerCase();
                  
                  if (lowerText.includes("tag critical")) {
                    finalText = finalText.replace(/tag critical/i, "").trim() + " #critical";
                  } else if (lowerText.includes("tag teaching")) {
                    finalText = finalText.replace(/tag teaching/i, "").trim() + " #teaching";
                  } else if (lowerText.includes("tag complication")) {
                    finalText = finalText.replace(/tag complication/i, "").trim() + " #complication";
                  }

                  // Predictive Tagging Logic (Context-Aware)
                  const PREDICTIVE_KEYWORDS: Record<string, string> = {
                    "bleeding": "#complication",
                    "hemorrhage": "#complication",
                    "injury": "#complication",
                    "suture": "#technique",
                    "anastomosis": "#technique",
                    "clip": "#technique",
                    "demonstrate": "#teaching",
                    "explain": "#teaching",
                    "student": "#teaching",
                    "resident": "#teaching"
                  };

                  Object.entries(PREDICTIVE_KEYWORDS).forEach(([keyword, tag]) => {
                    if (lowerText.includes(keyword) && !finalText.includes(tag)) {
                      finalText += ` ${tag}`;
                    }
                  });

                  onAddNote(finalText);
                  setNoteInput("");
                }
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Command Palette Overlay */}
      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
              placeholder="Type a command or search events..."
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">Suggestions</div>
            {SUGGESTED_EVENTS[phaseCategory as keyof typeof SUGGESTED_EVENTS]
              .filter(e => e.toLowerCase().includes(commandSearch.toLowerCase()))
              .map((event, i) => (
                <div
                  key={i}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => {
                    setEventLabel(event);
                    setShowCommandPalette(false);
                    setCommandSearch("");
                    // Auto-focus the main event input or just log it? 
                    // For speed, let's just populate the label so they can hit Enter to confirm details
                  }}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Log: {event}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Event</span>
                </div>
              ))}
            
            <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 mt-2">Commands</div>
            {[
              { label: "Take Snapshot", icon: Camera, action: () => onCaptureSnapshot && onCaptureSnapshot() },
              { label: "Add Note", icon: FileText, action: () => { /* Focus note input */ } },
              { label: "Start Dictation", icon: Mic, action: () => onDictation && onDictation() }
            ].filter(c => c.label.toLowerCase().includes(commandSearch.toLowerCase())).map((cmd, i) => (
              <div
                key={i}
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => {
                  cmd.action();
                  setShowCommandPalette(false);
                  setCommandSearch("");
                }}
              >
                <cmd.icon className="mr-2 h-4 w-4" />
                <span>{cmd.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">Action</span>
              </div>
            ))}
          </div>
          <div className="border-t bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground flex justify-between">
            <span>Use arrows to navigate</span>
            <span>Press Esc to close</span>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
