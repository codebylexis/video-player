import { useState, useRef, useEffect } from "react";
// @ts-ignore
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import screenfull from "screenfull";
import { cn } from "@/lib/utils";

interface MobilePlayerProps {
  urls: string[];
  onTimeUpdate?: (time: number) => void;
  initialTime?: number;
}

export function MobilePlayer({ urls, onTimeUpdate, initialTime = 0 }: MobilePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [activeView, setActiveView] = useState(0);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initial time
  useEffect(() => {
    if (initialTime > 0 && playerRef.current) {
      playerRef.current.seekTo(initialTime);
    }
  }, [initialTime]);

  const handleProgress = (state: { played: number }) => {
    setPlayed(state.played);
    if (onTimeUpdate) {
      onTimeUpdate(state.played * (duration || 1));
    }
  };

  const toggleFullscreen = () => {
    if (screenfull.isEnabled && containerRef.current) {
      screenfull.toggle(containerRef.current);
    }
  };

  useEffect(() => {
    if (screenfull.isEnabled) {
      const handleChange = () => setIsFullscreen(screenfull.isFullscreen);
      screenfull.on("change", handleChange);
      return () => screenfull.off("change", handleChange);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black group">
      {/* Video Layer */}
      <ReactPlayer
        ref={playerRef}
        {...({
          url: urls[activeView],
          width: "100%",
          height: "100%",
          playing: playing,
          muted: muted,
          onProgress: handleProgress,
          onDuration: setDuration,
          style: { pointerEvents: "none" }
        } as any)}
      />

      {/* Camera Switcher Overlay (Top) */}
      <div className="absolute top-2 left-0 right-0 flex justify-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {urls.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveView(idx)}
            className={cn(
              "h-1 w-8 rounded-full transition-all",
              activeView === idx ? "bg-primary" : "bg-white/30 hover:bg-white/50"
            )}
          />
        ))}
      </div>

      {/* Controls Overlay (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[played]}
            max={1}
            step={0.001}
            onValueChange={(val) => {
              setPlayed(val[0]);
              playerRef.current?.seekTo(val[0]);
            }}
            className="cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setPlaying(!playing)} className="text-white hover:bg-white/20">
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            
            <div className="text-xs font-mono">
              {formatTime(played * (duration || 1))} / {formatTime(duration || 1)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMuted(!muted)} className="text-white hover:bg-white/20">
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Center Play/Pause Touch Area */}
      <div 
        className="absolute inset-0 z-0" 
        onClick={() => setPlaying(!playing)}
      />
    </div>
  );
}
