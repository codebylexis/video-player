import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface HeatmapOverlayProps {
  currentTime: number;
  isVisible: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export function HeatmapOverlay({ currentTime, isVisible, className, width, height }: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mock heatmap generation based on time
    // In a real app, this would render actual spatial data
    
    const timeInt = Math.floor(currentTime);
    
    // Generate some random "hot spots" that move slowly over time
    const generateHotspot = (xBase: number, yBase: number, t: number) => {
      const x = xBase + Math.sin(t * 0.1) * 50;
      const y = yBase + Math.cos(t * 0.1) * 30;
      const radius = 60 + Math.sin(t * 0.2) * 20;
      const intensity = 0.6 + Math.sin(t * 0.05) * 0.2;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
      gradient.addColorStop(0.4, `rgba(255, 165, 0, ${intensity * 0.6})`);
      gradient.addColorStop(1, "rgba(255, 255, 0, 0)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    // Set canvas size to match display size (mocking 1920x1080 aspect ratio)
    canvas.width = 800;
    canvas.height = 450;

    // Draw hotspots
    if (timeInt > 0) {
        generateHotspot(400, 225, timeInt); // Center
        generateHotspot(300, 300, timeInt + 20); // Left-ish
        generateHotspot(500, 200, timeInt + 40); // Right-ish
    }

  }, [currentTime, isVisible]);

  if (!isVisible) return null;

  return (
    <canvas 
      ref={canvasRef}
      className={cn("absolute inset-0 pointer-events-none w-full h-full opacity-60 mix-blend-screen", className)}
    />
  );
}
