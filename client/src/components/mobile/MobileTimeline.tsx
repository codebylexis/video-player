import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data structure matching main app
interface TimelineEvent {
  id: string;
  timestamp: number;
  label: string;
  type: "phase" | "action" | "alert";
  details?: string;
}

const MOCK_EVENTS: TimelineEvent[] = [
  { id: "1", timestamp: 0, label: "Pre-Op Phase Started", type: "phase" },
  { id: "2", timestamp: 45, label: "Patient Positioned", type: "action", details: "Supine" },
  { id: "3", timestamp: 120, label: "Anesthesia Induction", type: "action" },
  { id: "4", timestamp: 300, label: "Intra-Op Phase Started", type: "phase" },
  { id: "5", timestamp: 315, label: "Incision Made", type: "action", details: "Midline" },
  { id: "6", timestamp: 450, label: "High Blood Pressure Alert", type: "alert", details: "160/95" },
  { id: "7", timestamp: 600, label: "Hemostasis Achieved", type: "action" },
  { id: "8", timestamp: 900, label: "Closure Started", type: "action" },
  { id: "9", timestamp: 1200, label: "Post-Op Phase Started", type: "phase" },
];

interface MobileTimelineProps {
  onSeek: (time: number) => void;
}

export function MobileTimeline({ onSeek }: MobileTimelineProps) {
  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = (seconds % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "phase": return <Clock className="h-4 w-4 text-blue-500" />;
      case "alert": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <ScrollArea className="h-full pr-4">
      <div className="relative border-l-2 border-border ml-4 space-y-6 py-2">
        {MOCK_EVENTS.map((event) => (
          <div 
            key={event.id}
            className="relative pl-6 cursor-pointer group"
            onClick={() => onSeek(event.timestamp)}
          >
            {/* Timeline Dot */}
            <div className={cn(
              "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center",
              event.type === "phase" ? "bg-blue-500" : 
              event.type === "alert" ? "bg-red-500" : "bg-emerald-500"
            )} />
            
            {/* Content Card */}
            <div className="bg-card border border-border/50 rounded-lg p-3 shadow-sm active:scale-95 transition-transform">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{event.label}</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {formatTime(event.timestamp)}
                </Badge>
              </div>
              
              {event.details && (
                <p className="text-xs text-muted-foreground mt-1">
                  {event.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
