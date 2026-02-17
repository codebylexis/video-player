import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const shortcutGroups = [
    { 
      category: "Playback Control", 
      items: [
        { key: "Space / K", action: "Play / Pause" },
        { key: "← / →", action: "Seek 1s (Precision)" },
        { key: "J / L", action: "Seek 5s (Fast)" },
        { key: "M", action: "Mute / Unmute" },
      ]
    },
    { 
      category: "View & Layout", 
      items: [
        { key: "F", action: "Toggle Fullscreen" },
        { key: "Double Click", action: "Toggle Fullscreen" },
        { key: "1 - 4", action: "Select Active Camera" },
        { key: "Shift + 1", action: "Single View Layout" },
        { key: "Shift + 2", action: "Split View Layout" },
        { key: "Shift + 4", action: "Quad View Layout" },
      ]
    },
    { 
      category: "Analysis Tools", 
      items: [
        { key: "S", action: "Capture Snapshot" },
        { key: "O", action: "Toggle Object Detection" },
        { key: "H", action: "Toggle Heatmap" },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Help & Resources</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="shortcuts" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shortcuts">Keyboard Shortcuts</TabsTrigger>
              <TabsTrigger value="instructions">Instructions for Use</TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1 p-6 pt-4">
            <TabsContent value="shortcuts" className="mt-0 space-y-6">
              {shortcutGroups.map((group, i) => (
                <div key={i} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                    {group.category}
                  </h4>
                  <div className="grid gap-3">
                    {group.items.map((item, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-sm">{item.action}</span>
                        <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="instructions" className="mt-0 space-y-4 text-sm leading-relaxed">
              <div className="space-y-4">
                <section>
                  <h3 className="font-semibold text-base mb-2">Overview</h3>
                  <p className="text-muted-foreground">
                    The Surgical Analysis Suite is a professional-grade tool designed for the review and analysis of multi-camera surgical procedures. 
                    It allows surgeons and analysts to synchronize video feeds, track instrument usage, and generate detailed reports.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">Video Playback</h3>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>Use the <strong>Layout Controls</strong> (Single, Split, Quad) to adjust the viewing grid.</li>
                    <li>Click on any video feed to make it the <strong>Active View</strong> (indicated by audio focus).</li>
                    <li>Use the <strong>Timeline</strong> at the bottom to scrub through the procedure. Colored bars indicate surgical phases.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">Analysis Features</h3>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li><strong>Snapshots:</strong> Click the Camera icon or press 'S' to capture high-resolution frames.</li>
                    <li><strong>Annotations:</strong> Add timestamped notes in the right sidebar. These are included in the final report.</li>
                    <li><strong>Event Logging:</strong> Use the Manual Event Logger to record instrument usage or critical events in real-time.</li>
                    <li><strong>AI Overlays:</strong> Toggle Object Detection and Heatmaps from the "AI Analysis" menu to visualize surgical activity.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">Reporting</h3>
                  <p className="text-muted-foreground">
                    Click "Export Report" in the top menu to generate a comprehensive PDF containing:
                  </p>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-muted-foreground">
                    <li>Procedure details and surgeon information</li>
                    <li>Timeline of surgical phases</li>
                    <li>Instrument usage statistics and efficiency metrics</li>
                    <li>Captured snapshots and user annotations</li>
                  </ul>
                </section>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
