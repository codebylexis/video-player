import { ManualEventLogger } from "@/components/ManualEventLogger";
import { Button } from "@/components/ui/button";
import { Maximize, Minimize } from "lucide-react";
import { useState } from "react";

export default function EventLogPopout() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Mock props for standalone mode
  const handleLogEvent = (event: any) => {
    console.log("Logged event in popout:", event);
    // In a real app, this would sync via WebSocket or LocalStorage
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-card">
        <h1 className="font-bold text-lg">Event Log - Standalone View</h1>
        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        <ManualEventLogger 
          currentTime={0} // This would need to sync with the main window
          onLogEvent={handleLogEvent}
          className="h-full border-none shadow-none"
        />
      </div>
    </div>
  );
}
