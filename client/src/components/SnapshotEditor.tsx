import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Type, Square, ArrowRight, Eraser, Save, X, EyeOff, Flame, Scan } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnapshotEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
}

type Tool = "text" | "box" | "arrow" | "blur" | "heatmap" | "detect" | null;

export function SnapshotEditor({ open, onOpenChange, imageUrl, onSave }: SnapshotEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const [color, setColor] = useState("#ef4444"); // Default red
  const [textInput, setTextInput] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  
  // Load image onto canvas
  useEffect(() => {
    if (open && canvasRef.current && imageUrl) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      
      img.onload = () => {
        // Resize canvas to match image aspect ratio, max width 800
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      };
      
      img.onerror = (e) => {
        console.error("Failed to load image for snapshot editor", e);
        // Fallback: Try to load via proxy or display error on canvas
        if (ctx) {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#ef4444";
          ctx.font = "14px sans-serif";
          ctx.fillText("Failed to load image. Cross-origin issue?", 20, 50);
        }
      };
    }
  }, [open, imageUrl]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setIsDrawing(true);

    if (activeTool === "text") {
      // For text, we just place it immediately on click for simplicity in this version
      // In a full version, we might drag to define a box
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !activeTool || activeTool === "text") return;
    
    // In a real implementation, we would clear and redraw the "preview" shape here
    // For this simple version, we'll just wait for mouse up to draw
    // Or we could use a secondary "overlay" canvas for preview
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !activeTool) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.fillStyle = color;

    if (activeTool === "box") {
      ctx.strokeRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
    } else if (activeTool === "detect") {
      // Object Detection Box (Dashed with Label)
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#00ff00"; // Green for detection
      ctx.strokeRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
      ctx.setLineDash([]);
      
      // Simulate Label Prompt
      const label = prompt("Enter object label (e.g., Scalpel, Forceps):", "Surgical Instrument");
      if (label) {
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(startPos.x, startPos.y - 20, ctx.measureText(label).width + 10, 20);
        ctx.fillStyle = "#000000";
        ctx.font = "12px sans-serif";
        ctx.fillText(label, startPos.x + 5, startPos.y - 5);
      }
    } else if (activeTool === "heatmap") {
      // Heatmap Blob
      const radius = Math.sqrt(Math.pow(endX - startPos.x, 2) + Math.pow(endY - startPos.y, 2));
      const gradient = ctx.createRadialGradient(startPos.x, startPos.y, 0, startPos.x, startPos.y, radius);
      gradient.addColorStop(0, "rgba(255, 0, 0, 0.5)");
      gradient.addColorStop(0.5, "rgba(255, 255, 0, 0.3)");
      gradient.addColorStop(1, "rgba(255, 255, 0, 0)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else if (activeTool === "arrow") {
      // Draw arrow line
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Draw arrow head
      const angle = Math.atan2(endY - startPos.y, endX - startPos.x);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 10 * Math.cos(angle - Math.PI / 6), endY - 10 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - 10 * Math.cos(angle + Math.PI / 6), endY - 10 * Math.sin(angle + Math.PI / 6));
      ctx.lineTo(endX, endY);
      ctx.fill();
    } else if (activeTool === "blur") {
      // Simple blur effect: pixelate or fill with semi-transparent box
      // Real blur is hard on canvas without filters, so we'll use a "Redacted" block
      ctx.fillStyle = "#000000";
      ctx.fillRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.fillText("PHI REDACTED", startPos.x + 5, startPos.y + 15);
    }

    setIsDrawing(false);
    setStartPos(null);
  };

  const handleAddText = () => {
    if (!canvasRef.current || !textInput) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = color;
    ctx.font = "bold 20px sans-serif";
    // Place text in center for now, or we could add click-to-place logic
    ctx.fillText(textInput, 50, 50);
    setTextInput("");
    setActiveTool(null);
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSave(dataUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Snapshot</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-2 w-32 shrink-0">
            <Label>Tools</Label>
            <Button 
              variant={activeTool === "box" ? "default" : "outline"} 
              size="sm" 
              className="justify-start" 
              onClick={() => setActiveTool("box")}
            >
              <Square className="mr-2 h-4 w-4" /> Box
            </Button>
            <Button 
              variant={activeTool === "arrow" ? "default" : "outline"} 
              size="sm" 
              className="justify-start" 
              onClick={() => setActiveTool("arrow")}
            >
              <ArrowRight className="mr-2 h-4 w-4" /> Arrow
            </Button>
            <Button 
              variant={activeTool === "text" ? "default" : "outline"} 
              size="sm" 
              className="justify-start" 
              onClick={() => setActiveTool("text")}
            >
              <Type className="mr-2 h-4 w-4" /> Text
            </Button>
            <Button 
              variant={activeTool === "blur" ? "default" : "outline"} 
              size="sm" 
              className="justify-start text-red-400 border-red-400/20 hover:bg-red-400/10" 
              onClick={() => setActiveTool("blur")}
            >
              <EyeOff className="mr-2 h-4 w-4" /> Redact PHI
            </Button>
            
            <div className="my-2 border-t border-border" />
            <Label>AI Tools</Label>
            <Button 
              variant={activeTool === "heatmap" ? "default" : "outline"} 
              size="sm" 
              className="justify-start text-orange-400 border-orange-400/20 hover:bg-orange-400/10" 
              onClick={() => setActiveTool("heatmap")}
            >
              <Flame className="mr-2 h-4 w-4" /> Heatmap
            </Button>
            <Button 
              variant={activeTool === "detect" ? "default" : "outline"} 
              size="sm" 
              className="justify-start text-green-400 border-green-400/20 hover:bg-green-400/10" 
              onClick={() => setActiveTool("detect")}
            >
              <Scan className="mr-2 h-4 w-4" /> Object Detect
            </Button>

            <div className="my-2 border-t border-border" />
            
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#ffffff", "#000000"].map((c) => (
                <button
                  key={c}
                  className={cn(
                    "w-6 h-6 rounded-full border border-border",
                    color === c && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>

            {activeTool === "text" && (
              <div className="mt-2 space-y-2">
                <Input 
                  value={textInput} 
                  onChange={(e) => setTextInput(e.target.value)} 
                  placeholder="Enter text..." 
                  className="h-8 text-xs"
                />
                <Button size="sm" className="w-full" onClick={handleAddText}>Add Text</Button>
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-slate-950 rounded border border-border flex items-center justify-center overflow-hidden min-h-[400px]">
            <canvas 
              ref={canvasRef}
              className="cursor-crosshair max-w-full max-h-[60vh]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
