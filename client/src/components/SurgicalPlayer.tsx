import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronDown,
  FastForward,
  Filter,
  Grid2x2,
  Layout,
  Maximize,
  Minimize,
  Pause,
  Play,
  Rewind,
  Square,
  Volume2,
  VolumeX,
  Camera,
  Image as ImageIcon,
  Monitor
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// Voice control removed
// import { useVoiceControl } from "@/hooks/useVoiceControl";
// import { Mic, MicOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
// @ts-ignore
import ReactPlayer from "react-player";
import screenfull from "screenfull";
// import { ObjectOverlay } from "./ObjectOverlay";
import { HeatmapOverlay } from "./HeatmapOverlay";
import { ProcedureTimeline, SurgicalPhase, InstrumentUsage, MOCK_PHASES, MOCK_INSTRUMENTS } from "./ProcedureTimeline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface SurgicalPlayerProps {
  urls: string[];
  className?: string;
  onTimeUpdate?: (time: number) => void;
  customInstruments?: InstrumentUsage[];
  phases?: SurgicalPhase[];
  onPhasesChange?: (phases: SurgicalPhase[]) => void;
  onInstrumentsChange?: (instruments: InstrumentUsage[]) => void;
  layout?: "single" | "split" | "quad";
  onLayoutChange?: (layout: "single" | "split" | "quad") => void;
  onSnapshot?: () => void;
}

export interface SurgicalPlayerRef {
  captureSnapshot: () => string | null;
  seekTo: (fraction: number) => void;
}

const VIEW_LABELS = ["Room View", "Echo Monitor", "Surgical Field", "Instrument Table"];
const FEED_OPTIONS = [
  { id: 0, label: "Room View", icon: Monitor },
  { id: 1, label: "Echo Monitor", icon: Activity },
  { id: 2, label: "Surgical Field", icon: Camera },
  { id: 3, label: "Instrument Table", icon: ImageIcon }
];

export const SurgicalPlayer = forwardRef<SurgicalPlayerRef, SurgicalPlayerProps>((props, ref) => {
  const { 
    urls, 
    className, 
    onTimeUpdate, 
    customInstruments, 
    phases: customPhases, 
    onPhasesChange, 
    onInstrumentsChange, 
    layout: controlledLayout, 
    onLayoutChange, 
    onSnapshot 
  } = props;
  // Refs for multiple players
  const playerRefs = useRef<(any | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalLayout, setInternalLayout] = useState<"single" | "split" | "quad" | "tri">("single");
  const layout = controlledLayout || internalLayout;

  const handleLayoutChange = (newLayout: "single" | "split" | "quad" | "tri") => {
    if (onLayoutChange) {
      // @ts-ignore
      onLayoutChange(newLayout);
    } else {
      setInternalLayout(newLayout);
    }
  };
  const [activeView, setActiveView] = useState(0);
  const [splitViews, setSplitViews] = useState<[number, number]>([0, 1]); // Default to Room and Echo
  const [triViews, setTriViews] = useState<[number, number, number]>([0, 1, 2]); // Top-Left, Top-Right, Bottom
  const [swapSource, setSwapSource] = useState<number | null>(null);
  
  // Track which feed is displayed in each position
  const [feedMapping, setFeedMapping] = useState<number[]>([0, 1, 2, 3]); // Default: feed 0-3 in positions 0-3
  const [swappingPositions, setSwappingPositions] = useState<Set<number>>(new Set());

  // Voice Control Integration - REMOVED
  // const { isListening, toggleListening, isSupported } = useVoiceControl({
  //   commands: [
  //     {
  //       command: "play",
  //       action: () => setPlaying(true),
  //       description: "Start playback"
  //     },
  //     {
  //       command: "pause",
  //       action: () => setPlaying(false),
  //       description: "Pause playback"
  //     },
  //     {
  //       command: "stop",
  //       action: () => setPlaying(false),
  //       description: "Stop playback"
  //     },
  //     {
  //       command: "rewind",
  //       action: () => skip(-10),
  //       description: "Rewind 10 seconds"
  //     },
  //     {
  //       command: "fast forward",
  //       action: () => skip(10),
  //       description: "Fast forward 10 seconds"
  //     },
  //     {
  //       command: "mute",
  //       action: () => setMuted(true),
  //       description: "Mute audio"
  //     },
  //     {
  //       command: "unmute",
  //       action: () => setMuted(false),
  //       description: "Unmute audio"
  //     },
  //     {
  //       command: "snapshot",
  //       action: () => onSnapshot && onSnapshot(),
  //       description: "Take a snapshot"
  //     }
  //   ],
  //   enabled: false // Start disabled by default
  // });
  // Voice control hook disabled

  const handleViewClick = (index: number) => {
    if (swapSource === null) {
      setActiveView(index);
    } else {
      // Swap logic
      if (layout === "tri") {
        const newTriViews = [...triViews] as [number, number, number];
        const sourceIndex = triViews.indexOf(swapSource);
        const targetIndex = triViews.indexOf(index);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          newTriViews[sourceIndex] = index;
          newTriViews[targetIndex] = swapSource;
          setTriViews(newTriViews);
        }
      } else if (layout === "split") {
        const newSplitViews = [...splitViews] as [number, number];
        const sourceIndex = splitViews.indexOf(swapSource);
        const targetIndex = splitViews.indexOf(index);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          newSplitViews[sourceIndex] = index;
          newSplitViews[targetIndex] = swapSource;
          setSplitViews(newSplitViews);
        }
      }
      setSwapSource(null);
    }
  };
  
  // Handle feed selection change for a specific position
  const handleFeedChange = (position: number, feedId: number) => {
    const newMapping = [...feedMapping];
    
    // Check if this feed is already displayed in another position
    const existingPosition = newMapping.findIndex((feed, idx) => feed === feedId && idx !== position);
    
    if (existingPosition !== -1) {
      // Swap: move the old feed from the other position to this position
      newMapping[existingPosition] = newMapping[position];
    }
    
    // Set the new feed in the current position
    newMapping[position] = feedId;
    setFeedMapping(newMapping);
  }

  const initiateSwap = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSwapSource(index);
  };

  const triggerSwapAnimation = (pos1: number, pos2: number) => {
    setSwappingPositions(new Set([pos1, pos2]));
    setTimeout(() => setSwappingPositions(new Set()), 600);
  };
  
  // Advanced visualization state
  const [showObjectDetection, setShowObjectDetection] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showStillPhoto, setShowStillPhoto] = useState(false);
  
  // Simulate playback for images
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playing) {
      interval = setInterval(() => {
        setPlayed(prev => {
          const next = prev + 0.001; // Simulate progress
          if (next >= 1) return 0;
          if (onTimeUpdate) onTimeUpdate(next * (duration || 7200)); // Mock 2 hour duration for images
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [playing, duration, onTimeUpdate]);

  // Instrument visibility state
  const instrumentsToRender = customInstruments || MOCK_INSTRUMENTS;
  const phasesToRender = customPhases || MOCK_PHASES;
  const uniqueInstrumentLabels = Array.from(new Set(instrumentsToRender.map(i => i.label)));
  const [visibleInstruments, setVisibleInstruments] = useState<string[]>(uniqueInstrumentLabels);

  // Update visible instruments when custom instruments change
  useEffect(() => {
    setVisibleInstruments(prev => {
      const newLabels = instrumentsToRender.map(i => i.label).filter(l => !prev.includes(l));
      return [...prev, ...newLabels];
    });
  }, [instrumentsToRender.length]);

  const toggleInstrumentVisibility = (label: string) => {
    setVisibleInstruments(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const filteredInstruments = instrumentsToRender.filter(i => visibleInstruments.includes(i.label));

  // Format time
  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    const ms = Math.floor((seconds % 1) * 100).toString().padStart(2, "0");
    return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss}:${ms}`;
  };

  // Handlers
  const togglePlay = () => setPlaying(!playing);
  
  const toggleFullscreen = () => {
    if (screenfull.isEnabled && containerRef.current) {
      screenfull.toggle(containerRef.current);
    }
  };

  useEffect(() => {
    if (screenfull.isEnabled) {
      const handleChange = () => {
        setIsFullscreen(screenfull.isFullscreen);
      };
      screenfull.on("change", handleChange);
      return () => screenfull.off("change", handleChange);
    }
  }, []);

  const handleProgress = (state: { played: number }) => {
    setPlayed(state.played);
    if (onTimeUpdate) {
      onTimeUpdate(state.played * (duration || 1));
    }
  };

  const handleSeek = (value: number[]) => {
    setPlayed(value[0]);
    playerRefs.current.forEach(ref => {
      if (ref && typeof ref.seekTo === 'function') {
        ref.seekTo(value[0]);
      }
    });
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setMuted(value[0] === 0);
  };

  const skip = (seconds: number) => {
    const activePlayer = playerRefs.current[activeView];
    if (activePlayer && typeof activePlayer.getCurrentTime === 'function') {
      const currentTime = activePlayer.getCurrentTime();
      const newTime = currentTime + seconds;
      playerRefs.current.forEach(ref => {
        if (ref && typeof ref.seekTo === 'function') {
          ref.seekTo(newTime);
        }
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k": e.preventDefault(); togglePlay(); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "arrowleft": e.preventDefault(); skip(-1); break;
        case "arrowright": e.preventDefault(); skip(1); break;
        case "j": e.preventDefault(); skip(-5); break;
        case "l": e.preventDefault(); skip(5); break;
        case "m": e.preventDefault(); setMuted(prev => !prev); break;
        case "s": e.preventDefault(); if (onSnapshot) onSnapshot(); break;
        case "o": e.preventDefault(); setShowObjectDetection(prev => !prev); break;
        case "h": e.preventDefault(); setShowHeatmap(prev => !prev); break;
        case "1": e.preventDefault(); if (e.shiftKey) handleLayoutChange("single"); else setActiveView(0); break;
        case "2": e.preventDefault(); if (e.shiftKey) handleLayoutChange("split"); else setActiveView(1); break;
        case "3": e.preventDefault(); if (e.shiftKey) handleLayoutChange("tri"); else setActiveView(2); break;
        case "4": e.preventDefault(); if (e.shiftKey) handleLayoutChange("quad"); else setActiveView(3); break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playing, activeView]);

  // Expose snapshot and seek methods
  useImperativeHandle(ref, () => ({
    captureSnapshot: () => {
      const url = urls[activeView];
      if (url.match(/\.(jpeg|jpg|gif|png)$/)) {
        // Handle image snapshot
        const img = new Image();
        img.src = url;
        const canvas = document.createElement("canvas");
        canvas.width = 1920; // Default HD
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png");
      }

      const activePlayer = playerRefs.current[activeView];
      if (!activePlayer || typeof activePlayer.getInternalPlayer !== 'function') return null;
      const videoElement = activePlayer.getInternalPlayer() as HTMLVideoElement;
      if (!videoElement) return null;

      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    },
    seekTo: (fraction: number) => {
      setPlayed(fraction);
      playerRefs.current.forEach(ref => {
        if (ref && typeof ref.seekTo === 'function') {
          ref.seekTo(fraction);
        }
      });
    }
  }));

  const handleDuration = (d: number) => {
    setDuration(d);
  };

  return (
    <div className={cn("flex flex-col h-full bg-background max-w-[1920px] max-h-[1080px]", className)}>
      {/* Video Grid */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-black overflow-hidden max-w-[1920px] max-h-[calc(1080px-80px)]"
      >
        <div className={cn(
          "grid w-full h-full transition-all duration-300 gap-0", // Added gap-0 for tight grid
          layout === "single" && "grid-cols-1 grid-rows-1",
          layout === "split" && "grid-cols-2 grid-rows-1",
          layout === "quad" && "grid-cols-2 grid-rows-2",
          layout === "tri" && "grid-cols-2 grid-rows-2"
        )}>
          {urls.map((url, index) => {
            // Determine visibility and position
            let isVisible = false;
            let gridClass = "";
            
            if (layout === "quad") {
              isVisible = true;
              gridClass = "col-span-1 row-span-1";
            } else if (layout === "single") {
              isVisible = index === activeView;
              gridClass = "col-span-1 row-span-1";
            } else if (layout === "split") {
              isVisible = splitViews.includes(index);
              gridClass = "col-span-1 row-span-1";
            } else if (layout === "tri") {
              const triIndex = triViews.indexOf(index);
              isVisible = triIndex !== -1;
              if (triIndex === 0) gridClass = "col-span-1 row-span-1"; // Top Left
              if (triIndex === 1) gridClass = "col-span-1 row-span-1"; // Top Right
              if (triIndex === 2) gridClass = "col-span-2 row-span-1"; // Bottom Full
            }

            if (!isVisible) return null;

            return (
              <div 
                key={index} 
                className={cn(
                  "relative bg-black group", // Removed border for tight grid
                  gridClass,
                  swapSource === index && "ring-2 ring-yellow-500 z-50",
                  swappingPositions.has(index) && "swap-animation"
                )}
                onClick={() => handleViewClick(index)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  initiateSwap(e, index);
                }}
              >
                {/* Feed Selection Dropdown */}
                <div className="absolute top-2 left-2 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2 bg-black/60 hover:bg-black/80 text-white text-[11px] font-mono gap-1 border border-white/20"
                      >
                        <span>{FEED_OPTIONS[feedMapping[index]]?.label || `CAM ${index + 1}`}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {FEED_OPTIONS.map((option) => {
                        const isUsedElsewhere = feedMapping.some((feed, idx) => feed === option.id && idx !== index);
                        return (
                          <DropdownMenuItem
                            key={option.id}
                            onClick={() => {
                              if (isUsedElsewhere) return;
                              const newMapping = [...feedMapping];
                              const currentFeed = newMapping[index];
                              const existingPosition = newMapping.findIndex((feed, idx) => feed === option.id && idx !== index);
                              if (existingPosition !== -1) {
                                newMapping[existingPosition] = currentFeed;
                                triggerSwapAnimation(index, existingPosition);
                              }
                              newMapping[index] = option.id;
                              setFeedMapping(newMapping);
                            }}
                            disabled={isUsedElsewhere}
                            className={cn("cursor-pointer", isUsedElsewhere && "opacity-50 cursor-not-allowed")}
                          >
                            <option.icon className="h-4 w-4 mr-2" />
                            {option.label}
                            {isUsedElsewhere && <span className="ml-2 text-xs">(in use)</span>}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                


                {/* Selection Indicator */}
                {activeView === index && (
                  <div className="absolute inset-0 border-2 border-primary pointer-events-none z-20 opacity-50" />
                )}



                {/* Image or Video Render */}
                {url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                  <img 
                    src={url} 
                    alt={`View ${index + 1}`} 
                    className={cn("w-full h-full object-cover transition-opacity duration-300", swappingPositions.has(index) && "opacity-50")} 
                  />
                ) : (
                  <ReactPlayer
                    {...({
                      url: url,
                      width: "100%",
                      height: "100%",
                      playing: playing,
                      muted: muted || index !== activeView,
                      volume: volume,
                      onProgress: index === activeView ? (state: any) => handleProgress(state) : undefined,
                      onDuration: index === activeView ? handleDuration : undefined,
                      style: { pointerEvents: "none", objectFit: "cover" }
                    } as any)}
                  />
                )}

                {/* Object Detection Overlay */}
                {/* {showObjectDetection && (
                  <ObjectDetectionOverlay 
                    currentTime={played * (duration || 1)} 
                    width={containerRef.current?.clientWidth || 800} 
                    height={containerRef.current?.clientHeight || 600} 
                    isVisible={true}
                  />
                )} */}

                {/* Heatmap Overlay */}
                {showHeatmap && (
                  <HeatmapOverlay 
                    currentTime={played * (duration || 1)} 
                    width={containerRef.current?.clientWidth || 800} 
                    height={containerRef.current?.clientHeight || 600} 
                    isVisible={true}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-card border-t border-border p-2 flex flex-col gap-2">
        {/* Playback Controls */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => skip(-5)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Rewind className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={togglePlay} className="h-10 w-10 rounded-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
              {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(5)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <FastForward className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 ml-2 group relative">
              <Button variant="ghost" size="icon" onClick={() => setMuted(!muted)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 ease-out">
                <Slider
                  value={[muted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-mono text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
              {formatTime(played * (duration || 1))} / {formatTime(duration || 1)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Visible Instruments</Label>
                {uniqueInstrumentLabels.map(label => (
                  <DropdownMenuCheckboxItem
                    key={label}
                    checked={visibleInstruments.includes(label)}
                    onCheckedChange={() => toggleInstrumentVisibility(label)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-4 w-px bg-border mx-1" />

            <div className="flex bg-secondary/30 rounded-lg p-0.5">
              <Button 
                variant={layout === "single" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => handleLayoutChange("single")}
                title="Single View (1)"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button 
                variant={layout === "split" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => handleLayoutChange("split")}
                title="Split View (2)"
              >
                <Layout className="h-4 w-4 rotate-90" />
              </Button>
              <Button 
                variant={layout === "tri" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => handleLayoutChange("tri")}
                title="Tri View (3)"
              >
                <Layout className="h-4 w-4" />
              </Button>
              <Button 
                variant={layout === "quad" ? "secondary" : "ghost"} 
                size="icon" 
                className="h-7 w-7" 
                onClick={() => handleLayoutChange("quad")}
                title="Quad View (4)"
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
            </div>

                      <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          
          {/* Voice Control Button Removed */}
          </div>
        </div>
        
        {/* Timeline */}
        <div className="px-2">
          <ProcedureTimeline 
            phases={phasesToRender}
            instruments={filteredInstruments}
            totalDuration={duration || 2100}
            currentTime={played * (duration || 2100)}
            onSeek={(time) => handleSeek([time / (duration || 1)])}
            onPhasesChange={onPhasesChange}
            onInstrumentsChange={onInstrumentsChange}
          />
        </div>
      </div>
    </div>
  );
});

SurgicalPlayer.displayName = "SurgicalPlayer";
