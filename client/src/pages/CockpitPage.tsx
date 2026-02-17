import { useState, useEffect, useRef } from "react";
import { ManualEventLogger, LoggedEvent } from "@/components/ManualEventLogger";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function CockpitPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [loggedEvents, setLoggedEvents] = useState<LoggedEvent[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Initialize BroadcastChannel for cross-window communication
    const channel = new BroadcastChannel("surgical_cockpit_sync");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "SYNC_STATE") {
        setCurrentTime(payload.currentTime);
        setLoggedEvents(payload.loggedEvents);
        setAnnotations(payload.annotations);
      } else if (type === "TIME_UPDATE") {
        setCurrentTime(payload);
      }
    };

    // Request initial state
    channel.postMessage({ type: "REQUEST_STATE" });

    return () => {
      channel.close();
    };
  }, []);

  const handleLogEvent = (event: LoggedEvent) => {
    // Optimistic update
    setLoggedEvents(prev => [...prev, event]);
    // Send to main window
    channelRef.current?.postMessage({ type: "LOG_EVENT", payload: event });
  };

  const handleAddNote = (note: string) => {
    const newNote = {
      id: Date.now().toString(),
      text: note,
      timestamp: currentTime,
      author: "Dr. Strange", // Mock user
      type: "note"
    };
    setAnnotations(prev => [...prev, newNote]);
    channelRef.current?.postMessage({ type: "ADD_NOTE", payload: newNote });
  };

  const handleUpdateEvent = (index: number, updatedEvent: LoggedEvent) => {
    const newEvents = [...loggedEvents];
    newEvents[index] = updatedEvent;
    setLoggedEvents(newEvents);
    channelRef.current?.postMessage({ type: "UPDATE_EVENT", payload: { index, event: updatedEvent } });
  };

  const handleUpdateNote = (index: number, text: string) => {
    const newAnnotations = [...annotations];
    newAnnotations[index] = { ...newAnnotations[index], text };
    setAnnotations(newAnnotations);
    channelRef.current?.postMessage({ type: "UPDATE_NOTE", payload: { index, text } });
  };

  return (
    <div className="h-screen w-screen bg-background p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"/>
          Surgical Cockpit (Detached)
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground font-mono">
            SYNC ACTIVE • {new Date().toLocaleTimeString()}
          </div>
          {toggleTheme && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden border rounded-lg shadow-2xl bg-card">
        <ManualEventLogger
          currentTime={currentTime}
          onLogEvent={handleLogEvent}
          loggedEvents={loggedEvents}
          annotations={annotations}
          onCaptureSnapshot={() => channelRef.current?.postMessage({ type: "CAPTURE_SNAPSHOT" })}
          onDictation={() => channelRef.current?.postMessage({ type: "START_DICTATION" })}
          isListening={false} // Sync listening state if needed
          onSeek={(time: number) => channelRef.current?.postMessage({ type: "SEEK", payload: time })}
          onAddNote={handleAddNote}
          onUpdateEvent={handleUpdateEvent}
          onUpdateNote={handleUpdateNote}
        />
      </div>
    </div>
  );
}
