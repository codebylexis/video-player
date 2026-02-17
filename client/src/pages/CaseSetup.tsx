import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useLocation } from "wouter";
import { FileText, Upload, ArrowRight, Plus, Trash2, Video, X } from "lucide-react";
import { toast } from "sonner";

interface VideoSlot {
  file: File | null;
  label: string;
  position: number;
}

export default function CaseSetup() {
  const [, setLocation] = useLocation();
  const [notes, setNotes] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [file, setFile] = useState<File | null>(null);
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([
    { file: null, label: "Position 1 (Top-Left)", position: 0 },
    { file: null, label: "Position 2 (Top-Right)", position: 1 },
    { file: null, label: "Position 3 (Bottom-Left)", position: 2 },
    { file: null, label: "Position 4 (Bottom-Right)", position: 3 }
  ]);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const handleAddQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.success("Research paper attached");
    }
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(slotIndex);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
  };

  const handleDropOnSlot = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);

    if (e.dataTransfer.files) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("video/")) {
        const newSlots = [...videoSlots];
        newSlots[slotIndex].file = droppedFile;
        setVideoSlots(newSlots);
        toast.success(`Video dropped in ${newSlots[slotIndex].label}`);
      } else {
        toast.error(`${droppedFile.name} is not a video file`);
      }
    }
  };

  const handleSlotInputChange = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("video/")) {
        const newSlots = [...videoSlots];
        newSlots[slotIndex].file = file;
        setVideoSlots(newSlots);
        toast.success(`Video added to ${newSlots[slotIndex].label}`);
      } else {
        toast.error(`${file.name} is not a video file`);
      }
    }
  };

  const removeVideoFromSlot = (slotIndex: number) => {
    const newSlots = [...videoSlots];
    newSlots[slotIndex].file = null;
    setVideoSlots(newSlots);
    toast.success("Video removed");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const uploadedVideos = videoSlots.filter(slot => slot.file !== null);
    if (uploadedVideos.length === 0) {
      toast.error("Please upload at least one video");
      return;
    }
    
    // Store actual file objects in window object for access in Home.tsx
    const uploadedFileArray: (File | null)[] = new Array(4).fill(null);
    videoSlots.forEach(slot => {
      if (slot.file) {
        uploadedFileArray[slot.position] = slot.file;
      }
    });
    (window as any).uploadedVideoFiles = uploadedFileArray;
    (window as any).videoSlotMapping = videoSlots.map(slot => ({
      position: slot.position,
      fileName: slot.file ? slot.file.name : null
    }));

    // Store video data with position information
    localStorage.setItem("caseSetup", JSON.stringify({
      notes,
      questions: questions.filter(q => q.trim() !== ""),
      fileName: file ? file.name : null,
      videoSlots: videoSlots.map(slot => ({
        position: slot.position,
        fileName: slot.file ? slot.file.name : null,
        fileSize: slot.file ? slot.file.size : null,
        label: slot.label
      }))
    }));
    
    toast.success("Case initialized with " + uploadedVideos.length + " video(s)");
    setLocation("/analysis");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">New Case Setup</h1>
          <p className="text-muted-foreground">
            Configure preliminary data and arrange your surgical video feeds before starting analysis.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Preliminary Documentation</CardTitle>
              <CardDescription>
                Record initial observations and attach relevant research materials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notes">Preliminary Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Enter patient history, pre-op conditions, or specific areas of interest..." 
                  className="min-h-[120px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Research Questions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={i} className="flex gap-2">
                      <Input 
                        placeholder={`Research Question ${i + 1}`}
                        value={q}
                        onChange={(e) => handleQuestionChange(i, e.target.value)}
                      />
                      {questions.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveQuestion(i)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Surgical Video Feeds (2x2 Grid)</Label>
                  <p className="text-sm text-muted-foreground mt-1">Drag and drop videos into the positions below. Each position will maintain its placement in the analysis view.</p>
                </div>
                
                {/* 2x2 Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                  {videoSlots.map((slot) => (
                    <div
                      key={slot.position}
                      onDragOver={(e) => handleDragOver(e, slot.position)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDropOnSlot(e, slot.position)}
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[200px] ${
                        dragOverSlot === slot.position
                          ? "border-primary bg-primary/10"
                          : slot.file
                          ? "border-primary/50 bg-primary/5"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        accept="video/*"
                        onChange={(e) => handleSlotInputChange(e, slot.position)}
                      />
                      
                      {slot.file ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <Video className="h-6 w-6 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{slot.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(slot.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeVideoFromSlot(slot.position)}
                            className="mt-2"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Video className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">{slot.label}</p>
                          <p className="text-xs text-muted-foreground">Click or drag video here</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                  <p className="text-sm font-medium">
                    Videos uploaded: {videoSlots.filter(s => s.file !== null).length} of 4
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Research Paper / Protocol</Label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex items-center text-primary font-medium">
                      <FileText className="h-8 w-8 mr-3" />
                      {file.name}
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF, DOCX up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/analysis")}
              >
                Skip (Dev)
              </Button>
              <Button type="submit" size="lg" className="gap-2">
                Start Analysis <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
