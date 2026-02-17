import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_CASES, SurgicalCase } from "@/lib/mock-cases";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Clock, Activity, AlertTriangle, CheckCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CaseComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CaseComparisonDialog({ open, onOpenChange }: CaseComparisonDialogProps) {
  const [caseAId, setCaseAId] = useState<string>(MOCK_CASES[0].id);
  const [caseBId, setCaseBId] = useState<string>(MOCK_CASES[1].id);
  const [uploadedCase, setUploadedCase] = useState<SurgicalCase | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          // Basic validation
          if (json.id && json.phases && json.instruments) {
            setUploadedCase(json);
            setCaseBId(json.id); // Auto-select uploaded case as Case B
          } else {
            alert("Invalid case file format");
          }
        } catch (err) {
          alert("Error parsing JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  const availableCases = uploadedCase ? [...MOCK_CASES, uploadedCase] : MOCK_CASES;

  const caseA = availableCases.find((c) => c.id === caseAId) || availableCases[0];
  const caseB = availableCases.find((c) => c.id === caseBId) || availableCases[1];

  // Prepare Phase Data
  const phaseData = [
    {
      name: "Pre-Op",
      [caseA.id]: caseA.phases.find((p) => p.label === "Pre-Op")?.endTime || 0,
      [caseB.id]: caseB.phases.find((p) => p.label === "Pre-Op")?.endTime || 0,
    },
    {
      name: "Intra-Op",
      [caseA.id]:
        (caseA.phases.find((p) => p.label === "Intra-Op")?.endTime || 0) -
        (caseA.phases.find((p) => p.label === "Intra-Op")?.startTime || 0),
      [caseB.id]:
        (caseB.phases.find((p) => p.label === "Intra-Op")?.endTime || 0) -
        (caseB.phases.find((p) => p.label === "Intra-Op")?.startTime || 0),
    },
    {
      name: "Post-Op",
      [caseA.id]:
        (caseA.phases.find((p) => p.label === "Post-Op")?.endTime || 0) -
        (caseA.phases.find((p) => p.label === "Post-Op")?.startTime || 0),
      [caseB.id]:
        (caseB.phases.find((p) => p.label === "Post-Op")?.endTime || 0) -
        (caseB.phases.find((p) => p.label === "Post-Op")?.startTime || 0),
    },
  ];

  // Prepare Instrument Data
  const allInstruments = Array.from(
    new Set([...caseA.instruments, ...caseB.instruments].map((i) => i.label))
  );

  const instrumentData = allInstruments.map((inst) => {
    const usageA = caseA.instruments
      .filter((i) => i.label === inst)
      .reduce((acc, curr) => acc + (curr.endTime - curr.startTime), 0);
    const usageB = caseB.instruments
      .filter((i) => i.label === inst)
      .reduce((acc, curr) => acc + (curr.endTime - curr.startTime), 0);
    return {
      name: inst,
      [caseA.id]: usageA,
      [caseB.id]: usageB,
    };
  });

  // Prepare Radar Data (Efficiency Metrics)
  const radarData = [
    {
      subject: "Duration",
      A: 100 - (caseA.phases[2].endTime / 7200) * 100, // Normalized score (lower is better)
      B: 100 - (caseB.phases[2].endTime / 7200) * 100,
      fullMark: 100,
    },
    {
      subject: "Inst. Switches",
      A: 100 - (caseA.instruments.length / 50) * 100,
      B: 100 - (caseB.instruments.length / 50) * 100,
      fullMark: 100,
    },
    {
      subject: "Complications",
      A: 100 - (caseA.events.filter((e) => e.type === "complication").length * 20),
      B: 100 - (caseB.events.filter((e) => e.type === "complication").length * 20),
      fullMark: 100,
    },
    {
      subject: "Phase Var.",
      A: 80, // Mock metric
      B: 65,
      fullMark: 100,
    },
    {
      subject: "Team Flow",
      A: 90, // Mock metric
      B: 75,
      fullMark: 100,
    },
  ];

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b border-border/40">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Case Comparison Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10">
          {/* Case Selection */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Case A (Baseline)</label>
              <Select value={caseAId} onValueChange={setCaseAId}>
                <SelectTrigger className="h-12 text-lg font-semibold border-primary/20 bg-primary/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CASES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} - {c.details.surgeon} ({c.details.date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-blue-500 opacity-80" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Duration</p>
                      <p className="text-xl font-bold">{formatDuration(caseA.phases[2].endTime)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-500 opacity-80" />
                    <div>
                      <p className="text-xs text-muted-foreground">Complications</p>
                      <p className="text-xl font-bold">
                        {caseA.events.filter((e) => e.type === "complication").length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Case B (Comparison)</label>
              <div className="flex gap-2">
                <Select value={caseBId} onValueChange={setCaseBId}>
                  <SelectTrigger className="h-12 text-lg font-semibold border-purple-500/20 bg-purple-500/5 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id} - {c.details.surgeon} ({c.details.date}) {c === uploadedCase ? "(Uploaded)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    id="upload-case" 
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline" 
                    className="h-12 w-12" 
                    onClick={() => document.getElementById('upload-case')?.click()}
                    title="Upload Case JSON"
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-purple-500 opacity-80" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Duration</p>
                      <p className="text-xl font-bold">{formatDuration(caseB.phases[2].endTime)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-500 opacity-80" />
                    <div>
                      <p className="text-xs text-muted-foreground">Complications</p>
                      <p className="text-xl font-bold">
                        {caseB.events.filter((e) => e.type === "complication").length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <Tabs defaultValue="phases" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="phases">Phase Analysis</TabsTrigger>
              <TabsTrigger value="instruments">Instrument Efficiency</TabsTrigger>
              <TabsTrigger value="score">Performance Score</TabsTrigger>
            </TabsList>

            <TabsContent value="phases" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Phase Duration Comparison (Seconds)</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                      <Legend />
                      <Bar dataKey={caseA.id} name={`Case A (${caseA.id})`} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={caseB.id} name={`Case B (${caseB.id})`} fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instruments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Instrument Usage Time (Seconds)</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={instrumentData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                      <Legend />
                      <Bar dataKey={caseA.id} name={`Case A (${caseA.id})`} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey={caseB.id} name={`Case B (${caseB.id})`} fill="#a855f7" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="score" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Radar</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid opacity={0.2} />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name={`Case A (${caseA.id})`}
                          dataKey="A"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name={`Case B (${caseB.id})`}
                          dataKey="B"
                          stroke="#a855f7"
                          fill="#a855f7"
                          fillOpacity={0.3}
                        />
                        <Legend />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Key Differences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-500">Case A Advantage</p>
                        <p className="text-sm text-muted-foreground">
                          {caseA.phases[2].endTime < caseB.phases[2].endTime 
                            ? "Faster total procedure time." 
                            : "More stable phase transitions."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-purple-500">Case B Advantage</p>
                        <p className="text-sm text-muted-foreground">
                          {caseB.events.filter(e => e.type === "complication").length < caseA.events.filter(e => e.type === "complication").length
                            ? "Fewer complications recorded."
                            : "Higher instrument efficiency."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
