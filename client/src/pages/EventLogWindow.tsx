import { useEffect, useState } from "react";
import { ManualEventLogger, LoggedEvent } from "@/components/ManualEventLogger";
import { usePreferences } from "@/contexts/PreferencesContext";

export default function EventLogWindow() {
  const [events, setEvents] = useState<LoggedEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const { theme } = usePreferences();

  useEffect(() => {
    // Sync theme
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme === "system" ? "dark" : theme);

    const channel = new BroadcastChannel("sas_event_log");
    
    channel.onmessage = (msg) => {
      if (msg.data.type === "SYNC_EVENTS") {
        setEvents(msg.data.events);
      } else if (msg.data.type === "SYNC_TIME") {
        setCurrentTime(msg.data.time);
      }
    };

    // Request initial state
    channel.postMessage({ type: "REQUEST_SYNC" });

    return () => channel.close();
  }, [theme]);

  const handleLogEvent = (event: any) => {
    const channel = new BroadcastChannel("sas_event_log");
    channel.postMessage({ type: "ADD_EVENT", event });
    channel.close();
  };

  return (
    <div className="h-screen w-screen bg-background p-4 overflow-hidden flex flex-col">
      <h1 className="text-lg font-semibold mb-4 text-foreground">Procedure Event Log</h1>
      <div className="flex-1 overflow-hidden border rounded-md">
        <ManualEventLogger
          currentTime={currentTime}
          onLogEvent={handleLogEvent}
          loggedEvents={events}
          className="h-full border-0"
        />
      </div>
    </div>
  );
}
