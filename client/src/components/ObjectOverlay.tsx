import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  color: string;
}

interface ObjectOverlayProps {
  currentTime: number;
  isVisible: boolean;
  className?: string;
  width?: number;
  height?: number;
}

// Mock detection data keyed by timestamp (seconds)
// In a real app, this would be a large dataset from the backend
const MOCK_DETECTIONS: Record<number, DetectedObject[]> = {
  // Initial detections (0-60s)
  0: [{ id: "d0", label: "Patient", confidence: 0.99, x: 20, y: 20, width: 60, height: 60, color: "#3b82f6" }],
  1: [{ id: "d0", label: "Patient", confidence: 0.99, x: 20, y: 20, width: 60, height: 60, color: "#3b82f6" }],
  2: [{ id: "d0", label: "Patient", confidence: 0.99, x: 20, y: 20, width: 60, height: 60, color: "#3b82f6" }],
  
  // Mocking some detections around 120s (Incision)
  120: [{ id: "d1", label: "Scalpel", confidence: 0.98, x: 45, y: 40, width: 10, height: 15, color: "#a855f7" }],
  121: [{ id: "d1", label: "Scalpel", confidence: 0.97, x: 46, y: 41, width: 10, height: 15, color: "#a855f7" }],
  122: [{ id: "d1", label: "Scalpel", confidence: 0.98, x: 47, y: 42, width: 10, height: 15, color: "#a855f7" }],
  123: [{ id: "d1", label: "Scalpel", confidence: 0.96, x: 48, y: 43, width: 10, height: 15, color: "#a855f7" }],
  124: [{ id: "d1", label: "Scalpel", confidence: 0.99, x: 49, y: 44, width: 10, height: 15, color: "#a855f7" }],
  
  // Mocking some detections around 300s (Dissection)
  300: [{ id: "d2", label: "Bipolar", confidence: 0.95, x: 30, y: 50, width: 12, height: 8, color: "#ec4899" }],
  301: [{ id: "d2", label: "Bipolar", confidence: 0.94, x: 31, y: 51, width: 12, height: 8, color: "#ec4899" }],
  302: [{ id: "d2", label: "Bipolar", confidence: 0.96, x: 32, y: 52, width: 12, height: 8, color: "#ec4899" }],
};

export function ObjectOverlay({ currentTime, isVisible, className, width, height }: ObjectOverlayProps) {
  const [objects, setObjects] = useState<DetectedObject[]>([]);

  useEffect(() => {
    if (!isVisible) {
      setObjects([]);
      return;
    }

    // Simple lookup for mock data - in real app would interpolate or find nearest frame
    const timeInt = Math.floor(currentTime);
    const detected = MOCK_DETECTIONS[timeInt] || [];
    
    // Simulate some movement if no exact match for demo purposes
    if (detected.length === 0 && timeInt >= 0 && timeInt < 60) {
       // Simulate patient/prep movement
       setObjects([{ 
         id: "d0", 
         label: "Patient Area", 
         confidence: 0.99, 
         x: 20, 
         y: 20, 
         width: 60, 
         height: 60, 
         color: "#3b82f6" 
       }, {
         id: "d_hand",
         label: "Surgeon Hand",
         confidence: 0.85 + (Math.random() * 0.1),
         x: 30 + Math.sin(timeInt * 0.5) * 20,
         y: 40 + Math.cos(timeInt * 0.5) * 10,
         width: 15,
         height: 15,
         color: "#22c55e"
       }]);
    } else if (detected.length === 0 && timeInt > 120 && timeInt < 180) {
       // Simulate scalpel movement
       const offset = (timeInt - 120) % 20;
       setObjects([{ 
         id: "d1", 
         label: "Scalpel", 
         confidence: 0.90 + (Math.random() * 0.09), 
         x: 45 + offset, 
         y: 40 + (Math.sin(offset) * 5), 
         width: 10, 
         height: 15, 
         color: "#a855f7" 
       }]);
    } else if (detected.length === 0 && timeInt > 300 && timeInt < 600) {
        // Simulate bipolar movement
       const offset = (timeInt - 300) % 30;
       setObjects([{ 
         id: "d2", 
         label: "Bipolar", 
         confidence: 0.90 + (Math.random() * 0.09), 
         x: 30 + offset, 
         y: 50 + (Math.cos(offset) * 5), 
         width: 12, 
         height: 8, 
         color: "#ec4899" 
       }]);
    } else {
       setObjects(detected);
    }

  }, [currentTime, isVisible]);

  if (!isVisible || objects.length === 0) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {objects.map((obj) => (
        <div
          key={obj.id}
          className="absolute border-2 transition-all duration-100 ease-linear"
          style={{
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            width: `${obj.width}%`,
            height: `${obj.height}%`,
            borderColor: obj.color,
            boxShadow: `0 0 8px ${obj.color}80`,
          }}
        >
          <div 
            className="absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-bold text-white rounded shadow-sm whitespace-nowrap flex items-center gap-1"
            style={{ backgroundColor: obj.color }}
          >
            <span>{obj.label}</span>
            <span className="opacity-80 text-[9px]">{Math.round(obj.confidence * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
