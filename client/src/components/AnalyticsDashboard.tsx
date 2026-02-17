import { useMemo, useState } from "react";
import { SurgicalPhase, InstrumentUsage } from "./ProcedureTimeline";
import { LoggedEvent } from "./ManualEventLogger";
import { generateResearchQA } from "@/lib/research-engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { AlertTriangle, Clock, Activity, CheckCircle, Filter, TrendingUp, Users, AlertOctagon, PlayCircle, FileText, Camera, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnalyticsDashboardProps {
  phases: SurgicalPhase[];
  instruments: InstrumentUsage[];
  events: LoggedEvent[];
  annotations?: any[];
  snapshots?: string[];
  onSeek?: (time: number) => void;
}

export function AnalyticsDashboard({ phases, instruments, events, annotations = [], snapshots = [], onSeek }: AnalyticsDashboardProps) {
  const qaList = useMemo(() => generateResearchQA(phases, instruments, events), [phases, instruments, events]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const uniqueCategories = useMemo(() => Array.from(new Set(qaList.map(qa => qa.category))), [qaList]);
  const filteredQA = useMemo(() => {
    let filtered = qaList;
    // Requirement: Get rid of efficiency trends within the research Q&A
    filtered = filtered.filter(qa => qa.category !== "Efficiency");
    
    if (selectedCategories.length === 0) return filtered;
    return filtered.filter(qa => selectedCategories.includes(qa.category));
  }, [qaList, selectedCategories]);

  const totalDuration = phases.reduce((acc, p) => acc + (p.endTime - p.startTime), 0);
  const criticalEvents = events.filter(e => e.type === "critical");
  const complications = events.filter(e => e.type === "complication"); // Assuming "complication" type exists or we filter by label
  
  // Data for Tag Analytics
  const tagData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.notes && e.notes.includes("#")) {
        const tags = e.notes.split(" ").filter(w => w.startsWith("#"));
        tags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: name === "#critical" ? "#ef4444" : 
            name === "#teaching" ? "#3b82f6" : 
            name === "#complication" ? "#f97316" : 
            name === "#technique" ? "#10b981" : "#94a3b8"
    })).sort((a, b) => b.value - a.value);
  }, [events]);

  // Data for Pie Chart (Phase Distribution)
  const phaseData = phases.map(p => ({
    name: p.label,
    value: p.endTime - p.startTime,
    color: p.color
  }));

  // Data for Bar Chart (Instrument Usage)
  const instrumentData = useMemo(() => {
    const durationData: Record<string, number> = {};
    const passData: Record<string, number> = {};
    
    instruments.forEach(i => {
      durationData[i.label] = (durationData[i.label] || 0) + (i.endTime - i.startTime);
      passData[i.label] = (passData[i.label] || 0) + 1;
    });
    
    return Object.entries(durationData).map(([name, value]) => ({ 
      name, 
      value,
      passes: passData[name] || 0,
      percentage: totalDuration > 0 ? (value / totalDuration) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [instruments, totalDuration]);

  // Mock Efficiency Curve Data
  const efficiencyData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      time: i * (totalDuration / 20),
      efficiency: 80 + Math.random() * 20 - (i > 15 ? 10 : 0) // Dip at end
    }));
  }, [totalDuration]);

  // New Insights Data
  const motionData = [
    { time: "00:00", velocity: 10, tremors: 2 },
    { time: "00:15", velocity: 45, tremors: 5 },
    { time: "00:30", velocity: 30, tremors: 3 },
    { time: "00:45", velocity: 60, tremors: 8 },
    { time: "01:00", velocity: 20, tremors: 1 },
  ];

  const errorData = [
    { type: "Tissue Trauma", count: 2 },
    { type: "Incorrect Plane", count: 1 },
    { type: "Collision", count: 4 },
  ];

  const standardizationData = [
    { subject: "Sequence", A: 90, fullMark: 100 },
    { subject: "Timing", A: 75, fullMark: 100 },
    { subject: "Motion", A: 85, fullMark: 100 },
    { subject: "Tools", A: 95, fullMark: 100 },
    { subject: "Safety", A: 80, fullMark: 100 },
  ];

  return (
    <div className="space-y-6 p-4 bg-background/50 rounded-lg border border-border h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-primary">Surgical Intelligence Insights</h2>
        <div className="text-sm text-muted-foreground">
          AI-Powered Analysis
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-shrink-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procedure Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalDuration / 60)}m {Math.floor(totalDuration % 60)}s</div>
            <p className="text-xs text-muted-foreground">+2% from average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalEvents.length}</div>
            <p className="text-xs text-muted-foreground">Critical triggers logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instrument Changes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instruments.length}</div>
            <p className="text-xs text-muted-foreground">Activations recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflow Efficiency</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Based on idle time analysis</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visuals" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0">
          <TabsTrigger value="visuals">Visual Analytics</TabsTrigger>
          <TabsTrigger value="narrative">Surgical Narrative</TabsTrigger>
          <TabsTrigger value="qa">Research Q&A ({filteredQA.length})</TabsTrigger>
          <TabsTrigger value="complications" className="text-destructive">Complications ({complications.length})</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="visuals" className="space-y-4 p-1">
            {/* Efficiency Trend Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-500" />
                  Procedural Efficiency Trend
                </CardTitle>
                <CardDescription>Real-time efficiency analysis based on instrument transition times and idle periods</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={efficiencyData}>
                    <defs>
                      <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3cd29c" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3cd29c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[60, 100]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Efficiency Score"]}
                      labelFormatter={(label) => `Time: ${Math.floor(label / 60)}m`}
                    />
                    <Area type="monotone" dataKey="efficiency" stroke="#3cd29c" fillOpacity={1} fill="url(#colorEfficiency)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Motion Analysis */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Motion & Velocity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={motionData}>
                        <XAxis dataKey="time" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }} />
                        <Line type="monotone" dataKey="velocity" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="tremors" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Standardization Radar */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Standardization Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={standardizationData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tag Analytics */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Tag Distribution
                </CardTitle>
                <CardDescription>Frequency of tagged events and notes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tagData} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {tagData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Phase Duration Distribution</CardTitle>
                  <CardDescription>Time allocation per surgical phase</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={phaseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {phaseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${Math.floor(value / 60)}m ${Math.floor(value % 60)}s`}
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Instrument Analytics</CardTitle>
                  <CardDescription>Usage duration, percentage, and pass frequency</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={instrumentData} layout="vertical" margin={{ left: 40 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94a3b8' }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === "value") return [`${Math.floor(value / 60)}m ${Math.floor(value % 60)}s (${props.payload.percentage.toFixed(1)}%)`, "Duration"];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="value" fill="#3cd29c" radius={[0, 4, 4, 0]} name="Duration" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Instrument Passes Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Instrument Passes & Interactions
                </CardTitle>
                <CardDescription>Detailed breakdown of instrument hand-offs and usage frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {instrumentData.map((inst, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/20 rounded-md hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {inst.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{inst.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Used for {Math.floor(inst.value / 60)}m {Math.floor(inst.value % 60)}s ({inst.percentage.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-lg">{inst.passes}</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Passes</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">Dr. Strange</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Primary User</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="narrative" className="space-y-6 p-1">
            {phases.map((phase, phaseIndex) => {
              // Filter content for this phase
              const phaseEvents = events.filter(e => e.startTime >= phase.startTime && e.startTime <= phase.endTime);
              const phaseNotes = annotations.filter(a => {
                // Convert "MM:SS" to seconds for comparison
                const [mm, ss] = a.time.split(':').map(Number);
                const timeInSeconds = mm * 60 + ss;
                return timeInSeconds >= phase.startTime && timeInSeconds <= phase.endTime;
              });
              
              // Mock logic for snapshots since they are just strings currently
              // In a real app, snapshots would have timestamps. 
              // We'll just distribute them for demo purposes if they don't have metadata
              const phaseSnapshots = snapshots.slice(phaseIndex * 2, (phaseIndex + 1) * 2);

              if (phaseEvents.length === 0 && phaseNotes.length === 0 && phaseSnapshots.length === 0) return null;

              return (
                <Card key={phaseIndex} className="border-l-4" style={{ borderLeftColor: phase.color }}>
                  <CardHeader className="bg-secondary/10 pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" style={{ color: phase.color }} />
                        {phase.label} Phase
                      </span>
                      <span className="text-sm font-normal text-muted-foreground font-mono">
                        {Math.floor(phase.startTime / 60)}m - {Math.floor(phase.endTime / 60)}m
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    
                    {/* Events Timeline */}
                    {phaseEvents.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Activity className="h-4 w-4" /> Key Events
                        </h4>
                        <div className="relative border-l border-border ml-2 pl-4 space-y-4">
                          {phaseEvents.map((event, i) => (
                            <div key={i} className="relative group">
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border border-background" />
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-sm group-hover:text-primary transition-colors cursor-pointer" onClick={() => onSeek && onSeek(event.startTime)}>
                                    {event.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {event.staffRole && <span className="mr-2 text-primary/80">{event.staffRole}</span>}
                                    {event.anatomicalLocation && <span className="italic">{event.anatomicalLocation}</span>}
                                  </div>
                                </div>
                                <div className="text-xs font-mono text-muted-foreground">
                                  {Math.floor(event.startTime / 60)}:{Math.floor(event.startTime % 60).toString().padStart(2, '0')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Section */}
                    {phaseNotes.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Surgeon Notes
                        </h4>
                        <div className="grid gap-3">
                          {phaseNotes.map((note, i) => (
                            <div key={i} className="bg-secondary/20 p-3 rounded-md border border-border/50">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-primary">{note.author}</span>
                                <span className="text-xs font-mono text-muted-foreground">{note.time}</span>
                              </div>
                              <p className="text-sm text-foreground/90">{note.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Snapshots Gallery */}
                    {phaseSnapshots.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Camera className="h-4 w-4" /> Captured Visuals
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {phaseSnapshots.map((src, i) => (
                            <div key={i} className="relative aspect-video rounded-md overflow-hidden border border-border group">
                              <img src={src} alt={`Snapshot ${i}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Button variant="secondary" size="sm" className="h-8 text-xs">View Full</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="qa" className="space-y-4 p-1">
            <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-lg border border-border">
              <div>
                <h3 className="font-semibold text-primary">Executive Summary</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Analysis identified {filteredQA.length} key insights across {uniqueCategories.length} categories. 
                  Highest efficiency observed during {phases.find(p => p.label === "Intra-Op")?.label || "Intra-Op"} phase.
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Insights
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniqueCategories.map(category => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                        }
                      }}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedCategories.length === 0}
                    onCheckedChange={() => setSelectedCategories([])}
                  >
                    Show All
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid gap-4">
              {filteredQA.map((qa, index) => (
                <Card key={index} className="group hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded-full w-fit">
                        {qa.category}
                      </div>
                      {qa.metrics.length > 0 && (
                        <div className="flex gap-2">
                          {qa.metrics.map((m, i) => (
                            <div key={i} className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                              {m.label}: <span className="text-foreground font-mono">{m.value}{m.unit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base mt-2 flex items-start gap-2">
                      <PlayCircle 
                        className="w-4 h-4 mt-1 text-primary cursor-pointer hover:scale-110 transition-transform" 
                        onClick={() => onSeek && qa.timestamp && onSeek(qa.timestamp)}
                      />
                      {qa.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                      {qa.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="complications" className="space-y-4 p-1">
            <div className="grid gap-4">
              {/* Major Complications Section */}
              <Card className="border-destructive/50 bg-destructive/10">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertOctagon className="h-5 w-5" />
                    Major Complications
                  </CardTitle>
                  <CardDescription>Critical events requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {complications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No major complications recorded.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {complications.map((comp, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-background/50 rounded-lg border border-destructive/20">
                          <div className="p-2 bg-destructive/20 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <h4 className="font-bold text-destructive">{comp.label}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{comp.notes || "No additional notes recorded."}</p>
                            <div className="mt-2 text-xs font-mono bg-black/20 px-2 py-1 rounded w-fit">
                              Timestamp: {Math.floor(comp.startTime / 60)}m {Math.floor(comp.startTime % 60)}s
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Error Frequency Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Error & Near-Miss Frequency</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={errorData}>
                      <XAxis dataKey="type" tick={{fontSize: 10}} />
                      <YAxis allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }} />
                      <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
