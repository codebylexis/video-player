import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  FastForward,
  Maximize,
  Minimize,
  Pause,
  Play,
  Rewind,
  Volume2,
  VolumeX
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import ReactPlayer from "react-player";
import screenfull from "screenfull";

interface VideoPlayerProps {
  url: string;
  className?: string;
}

export function VideoPlayer({ url, className }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format time in MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // Handle play/pause toggle
  const togglePlay = () => setPlaying(!playing);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (screenfull.isEnabled && containerRef.current) {
      screenfull.toggle(containerRef.current);
    }
  };

  // Sync fullscreen state
  useEffect(() => {
    if (screenfull.isEnabled) {
      const handleChange = () => {
        setIsFullscreen(screenfull.isFullscreen);
      };
      screenfull.on("change", handleChange);
      return () => screenfull.off("change", handleChange);
    }
  }, []);

  // Handle progress update
  const handleProgress = (state: { played: number }) => {
    setPlayed(state.played);
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    setPlayed(value[0]);
    playerRef.current?.seekTo(value[0]);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setMuted(value[0] === 0);
  };

  // Handle rewind/fast-forward
  const skip = (seconds: number) => {
    const currentTime = playerRef.current?.getCurrentTime();
    if (currentTime !== undefined) {
      playerRef.current?.seekTo(currentTime + seconds);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input is focused
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-5);
          break;
        case "arrowright":
          e.preventDefault();
          skip(5);
          break;
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "m":
          e.preventDefault();
          setMuted(!muted);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playing, muted, isFullscreen]);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  // Create a wrapper component to handle the ref forwarding issue
  const Player = ReactPlayer as any;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative group bg-black overflow-hidden select-none cyber-panel",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
      onDoubleClick={toggleFullscreen}
    >
      {/* CRT Scanline Effect */}
      <div className="scanline pointer-events-none z-10" />

      {/* Video Layer */}
      <Player
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        muted={muted}
        onProgress={handleProgress}
        onDuration={setDuration}
        style={{ position: "absolute", top: 0, left: 0 }}
      />

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 z-20",
          showControls ? "opacity-100" : "opacity-0"
        )}
        onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent double-click propagation
      >
        {/* Progress Bar */}
        <div className="mb-4 flex items-center gap-2 group/slider">
          <Slider
            value={[played]}
            max={1}
            step={0.001}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        {/* Control Panel */}
        <div className="flex items-center justify-between font-mono text-primary">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="cyber-button hover:bg-primary/20 hover:text-primary text-primary/80"
            >
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            {/* Rewind/Fast Forward */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(-10)}
                className="cyber-button hover:bg-primary/20 hover:text-primary text-primary/80"
              >
                <Rewind className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(10)}
                className="cyber-button hover:bg-primary/20 hover:text-primary text-primary/80"
              >
                <FastForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted(!muted)}
                className="cyber-button hover:bg-primary/20 hover:text-primary text-primary/80"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <div className="w-0 overflow-hidden transition-all duration-300 group-hover/volume:w-24">
                <Slider
                  value={[muted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            {/* Timecode */}
            <div className="text-sm tracking-widest opacity-80">
              <span className="text-primary">{formatTime(played * duration)}</span>
              <span className="mx-1 text-muted-foreground">/</span>
              <span className="text-muted-foreground">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="cyber-button hover:bg-primary/20 hover:text-primary text-primary/80"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
