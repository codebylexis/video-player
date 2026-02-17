import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Layers, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SurgicalPhase {
  id: string;
  label: string;
  startTime: number; // seconds
  endTime: number; // seconds
  color: string;
}

export interface InstrumentUsage {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  color: string;
  trackIndex?: number;
}

interface ProcedureTimelineProps {
  phases: SurgicalPhase[];
  instruments?: InstrumentUsage[];
  totalDuration: number; // seconds
  currentTime: number; // seconds
  onSeek: (time: number) => void;
  onPhasesChange?: (phases: SurgicalPhase[]) => void;
  onInstrumentsChange?: (instruments: InstrumentUsage[]) => void;
  className?: string;
}

export function ProcedureTimeline({
  phases,
  instruments = [],
  totalDuration,
  currentTime,
  onSeek,
  onPhasesChange,
  onInstrumentsChange,
  className,
}: ProcedureTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [hiddenPhases, setHiddenPhases] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{
    type: "phase" | "instrument";
    id: string;
    action: "move" | "resize-start" | "resize-end";
    startX: number; // clientX
    originalStartTime: number;
    originalEndTime: number;
  } | null>(null);

  // Calculate positions
  const getPosition = (time: number) => {
    if (totalDuration === 0) return 0;
    return (time / totalDuration) * 100;
  };

  const currentProgress = getPosition(currentTime);

  const handleMouseDown = (
    e: React.MouseEvent, 
    type: "phase" | "instrument", 
    item: SurgicalPhase | InstrumentUsage, 
    action: "move" | "resize-start" | "resize-end"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      type,
      id: item.id,
      action,
      startX: e.clientX,
      originalStartTime: item.startTime,
      originalEndTime: item.endTime,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      // Adjust delta for zoom level
      // The visual width is rect.width. The logical width is rect.width / zoom? 
      // No, rect.width IS the zoomed width.
      const deltaPixels = e.clientX - dragState.startX;
      const deltaPercent = deltaPixels / rect.width;
      const deltaTime = deltaPercent * totalDuration;

      let newStartTime = dragState.originalStartTime;
      let newEndTime = dragState.originalEndTime;

      if (dragState.action === "move") {
        newStartTime += deltaTime;
        newEndTime += deltaTime;
        
        if (newStartTime < 0) {
          newEndTime -= newStartTime;
          newStartTime = 0;
        }
        if (newEndTime > totalDuration) {
          newStartTime -= (newEndTime - totalDuration);
          newEndTime = totalDuration;
        }
      } else if (dragState.action === "resize-start") {
        newStartTime += deltaTime;
        if (newStartTime < 0) newStartTime = 0;
        if (newStartTime > newEndTime - 5) newStartTime = newEndTime - 5;
      } else if (dragState.action === "resize-end") {
        newEndTime += deltaTime;
        if (newEndTime > totalDuration) newEndTime = totalDuration;
        if (newEndTime < newStartTime + 5) newEndTime = newStartTime + 5;
      }

      if (dragState.type === "phase" && onPhasesChange) {
        const newPhases = phases.map(p => 
          p.id === dragState.id ? { ...p, startTime: newStartTime, endTime: newEndTime } : p
        );
        onPhasesChange(newPhases);
      } else if (dragState.type === "instrument" && onInstrumentsChange) {
        const newInstruments = instruments.map(i => 
          i.id === dragState.id ? { ...i, startTime: newStartTime, endTime: newEndTime } : i
        );
        onInstrumentsChange(newInstruments);
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, phases, instruments, totalDuration, onPhasesChange, onInstrumentsChange]);

  const renderBar = (item: SurgicalPhase | InstrumentUsage, type: "phase" | "instrument", index: number = 0) => {
    const left = getPosition(item.startTime);
    const width = getPosition(item.endTime) - left;
    const isActive = currentTime >= item.startTime && currentTime <= item.endTime;
    const isDragging = dragState?.id === item.id;

    // For expanded view, we might offset top
    const topOffset = expanded && type === "instrument" ? index * 24 : 0;

    return (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger>
          <div
            className={cn(
              "absolute rounded-sm transition-all group select-none",
              isActive ? "ring-1 ring-white/50 z-10" : "opacity-80 hover:opacity-100",
              isDragging ? "cursor-grabbing z-50 brightness-110 shadow-lg" : "cursor-pointer"
            )}
            style={{
              left: `${left}%`,
              width: `${width}%`,
              backgroundColor: item.color,
              top: expanded && type === "instrument" ? `${topOffset}px` : "4px",
              bottom: expanded && type === "instrument" ? "auto" : "4px",
              height: expanded && type === "instrument" ? "20px" : "auto"
            }}
            onMouseDown={(e) => handleMouseDown(e, type, item, "move")}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onSeek(item.startTime);
            }}
            title={`${item.label} (${formatTime(item.startTime)} - ${formatTime(item.endTime)})`}
          >
            <div 
              className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize hover:bg-white/20 z-20"
              onMouseDown={(e) => handleMouseDown(e, type, item, "resize-start")}
            />
            <div className="px-2 py-0.5 text-[10px] font-bold text-white truncate w-full h-full flex items-center pointer-events-none">
              {item.label}
            </div>
            <div 
              className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-white/20 z-20"
              onMouseDown={(e) => handleMouseDown(e, type, item, "resize-end")}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>{item.label}</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem>Start: {formatTime(item.startTime)}</ContextMenuItem>
          <ContextMenuItem>End: {formatTime(item.endTime)}</ContextMenuItem>
          <ContextMenuItem>Duration: {formatTime(item.endTime - item.startTime)}</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onSeek(item.startTime)}>Jump to Start</ContextMenuItem>
          <ContextMenuItem onClick={() => onSeek(item.endTime)}>Jump to End</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className={cn("w-full space-y-2 flex flex-col", className)}>
      {/* Controls Header */}
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-card p-2 rounded-md border border-border">
        <div className="flex items-center gap-4">
          <span className="uppercase tracking-wider">Timeline Controls</span>
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4" />
            <Slider 
              value={[zoom]} 
              min={1} 
              max={10} 
              step={0.1} 
              onValueChange={(v) => setZoom(v[0])}
              className="w-32"
            />
            <ZoomIn className="w-4 h-4" />
            <span className="text-xs w-8">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Phases button removed */}
          <>
            {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 gap-2">
                <Filter className="w-3 h-3" />
                Filter Phases
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Visible Phases</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {phases.map(phase => (
                <DropdownMenuCheckboxItem
                  key={phase.id}
                  checked={!hiddenPhases.includes(phase.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setHiddenPhases(prev => prev.filter(id => id !== phase.id));
                    } else {
                      setHiddenPhases(prev => [...prev, phase.id]);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />
                    {phase.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu> */}
          </>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className={cn("h-6 gap-2", expanded && "bg-accent text-accent-foreground")}
          >
            <Layers className="w-3 h-3" />
            {expanded ? "Collapse Tracks" : "Expand Tracks"}
          </Button>
        </div>
      </div>
      
      {/* Scrollable Timeline Area */}
      <div className="w-full overflow-x-auto border border-border/50 rounded-md bg-background/50">
        <div style={{ width: `${zoom * 100}%`, minWidth: "100%" }} className="p-2 space-y-4 relative">
          
          {/* Playhead Indicator (Global) */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
            style={{ left: `${currentProgress}%` }}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
          </div>

          {/* Phases Track */}
          <div className="space-y-1">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider sticky left-0">
              Procedure Phases
            </div>
            <div 
              ref={containerRef} 
              className="relative h-12 bg-secondary/30 rounded-md overflow-hidden border border-border/50 cursor-crosshair"
              onDoubleClick={(e) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = clickX / rect.width;
                const time = percent * totalDuration;
                onSeek(time);
              }}
            >
              {phases
                .filter(p => !hiddenPhases.includes(p.id))
                .map((phase) => renderBar(phase, "phase"))}
            </div>
          </div>

          {/* Instrument Track */}
          {instruments.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider sticky left-0">
                Instrument Usage
              </div>
              <div 
                className={cn(
                  "relative bg-secondary/10 rounded-md overflow-hidden border border-border/30 transition-all duration-300 cursor-crosshair",
                  expanded ? "h-[200px]" : "h-8"
                )}
                onDoubleClick={(e) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percent = clickX / rect.width;
                  const time = percent * totalDuration;
                  onSeek(time);
                }}
              >
                {instruments.map((inst, i) => renderBar(inst, "instrument", i))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export const MOCK_PHASES: SurgicalPhase[] = [
  { id: "p1", label: "Pre-Op", startTime: 0, endTime: 300, color: "#94a3b8" },
  { id: "p2", label: "Intra-Op", startTime: 300, endTime: 1800, color: "#3b82f6" },
  { id: "p3", label: "Post-Op", startTime: 1800, endTime: 2100, color: "#22c55e" },
];

export const MOCK_INSTRUMENTS: InstrumentUsage[] = [
  { id: "i1", label: "Scalpel", startTime: 120, endTime: 180, color: "#a855f7" },
  { id: "i2", label: "Bipolar Forceps", startTime: 300, endTime: 600, color: "#ec4899" },
  { id: "i3", label: "Harmonic Scalpel", startTime: 650, endTime: 850, color: "#8b5cf6" },
  { id: "i4", label: "Stapler", startTime: 1000, endTime: 1100, color: "#14b8a6" },
  { id: "i5", label: "Suction", startTime: 1500, endTime: 1700, color: "#06b6d4" },
  { id: "i6", label: "Suture", startTime: 1800, endTime: 2050, color: "#6366f1" },
];
