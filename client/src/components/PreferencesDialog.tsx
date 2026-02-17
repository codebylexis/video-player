import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePreferences, InstrumentDefinition } from "@/contexts/PreferencesContext";
import { Plus, Trash2, Moon, Sun, Monitor, Layout, Maximize } from "lucide-react";
import { useState } from "react";

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreferencesDialog({ open, onOpenChange }: PreferencesDialogProps) {
  const { 
    theme, setTheme, 
    logViewMode, setLogViewMode,
    customInstruments, addInstrument, removeInstrument, updateInstrument,
    timelineDensity, setTimelineDensity,
    layoutPreset, setLayoutPreset
  } = usePreferences();

  const [newInstrumentName, setNewInstrumentName] = useState("");
  const [newInstrumentColor, setNewInstrumentColor] = useState("#3b82f6");

  const handleAddInstrument = () => {
    if (!newInstrumentName.trim()) return;
    const newInst: InstrumentDefinition = {
      id: `custom-${Date.now()}`,
      label: newInstrumentName,
      color: newInstrumentColor,
      category: "other"
    };
    addInstrument(newInst);
    setNewInstrumentName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>Customize your workspace and analysis tools.</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="instruments">Instruments</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="general" className="space-y-6 mt-0">
              <div className="space-y-3">
                <Label className="text-base font-medium">Appearance</Label>
                <RadioGroup value={theme} onValueChange={(v) => setTheme(v as any)} className="grid grid-cols-3 gap-4">
                  <div>
                    <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                    <Label
                      htmlFor="theme-light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Sun className="mb-3 h-6 w-6" />
                      Light
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                    <Label
                      htmlFor="theme-dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Moon className="mb-3 h-6 w-6" />
                      Dark
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                    <Label
                      htmlFor="theme-system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Monitor className="mb-3 h-6 w-6" />
                      System
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Event Log Display</Label>
                <RadioGroup value={logViewMode} onValueChange={(v) => setLogViewMode(v as any)} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="docked" id="log-docked" className="peer sr-only" />
                    <Label
                      htmlFor="log-docked"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                    >
                      <Layout className="mb-3 h-6 w-6" />
                      Docked Panel
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="popout" id="log-popout" className="peer sr-only" />
                    <Label
                      htmlFor="log-popout"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                    >
                      <Maximize className="mb-3 h-6 w-6" />
                      Pop-out Window
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="instruments" className="space-y-4 mt-0">
              <div className="flex gap-2 items-end">
                <div className="grid gap-1.5 flex-1">
                  <Label htmlFor="inst-name">New Instrument Name</Label>
                  <Input 
                    id="inst-name" 
                    placeholder="e.g., Harmonic Scalpel" 
                    value={newInstrumentName}
                    onChange={(e) => setNewInstrumentName(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5 w-24">
                  <Label htmlFor="inst-color">Color</Label>
                  <Input 
                    id="inst-color" 
                    type="color" 
                    className="h-10 p-1 cursor-pointer"
                    value={newInstrumentColor}
                    onChange={(e) => setNewInstrumentColor(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddInstrument}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>

              <ScrollArea className="h-[300px] border rounded-md p-4">
                <div className="space-y-2">
                  {customInstruments.map((inst) => (
                    <div key={inst.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: inst.color }} />
                        <span className="font-medium">{inst.label}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeInstrument(inst.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4 mt-0">
              <div className="space-y-3">
                <Label className="text-base font-medium">Timeline Density</Label>
                <RadioGroup value={timelineDensity} onValueChange={(v) => setTimelineDensity(v as any)} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="density-compact" />
                    <Label htmlFor="density-compact">Compact (More rows visible)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comfortable" id="density-comfortable" />
                    <Label htmlFor="density-comfortable">Comfortable (Easier to interact)</Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4 mt-0">
              <div className="space-y-3">
                <Label className="text-base font-medium">Workspace Layout</Label>
                <RadioGroup value={layoutPreset} onValueChange={(v) => setLayoutPreset(v as any)} className="grid grid-cols-1 gap-4">
                  <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="standard" id="layout-standard" className="mt-1" />
                    <div className="grid gap-1">
                      <Label htmlFor="layout-standard" className="font-medium">Standard Analysis</Label>
                      <p className="text-xs text-muted-foreground">Balanced view with timeline, event log, and notes visible.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="review" id="layout-review" className="mt-1" />
                    <div className="grid gap-1">
                      <Label htmlFor="layout-review" className="font-medium">Surgical Review</Label>
                      <p className="text-xs text-muted-foreground">Maximized video player with minimal side panels.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="audit" id="layout-audit" className="mt-1" />
                    <div className="grid gap-1">
                      <Label htmlFor="layout-audit" className="font-medium">Quick Audit</Label>
                      <p className="text-xs text-muted-foreground">Focus on event logging and timeline verification.</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
