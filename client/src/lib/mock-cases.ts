import { LoggedEvent } from "@/components/ManualEventLogger";
import { SurgicalPhase, InstrumentUsage } from "@/components/ProcedureTimeline";
import { CaseDetails } from "@/components/ProcedureDetailsDialog";

export interface SurgicalCase {
  id: string;
  details: CaseDetails;
  phases: SurgicalPhase[];
  instruments: InstrumentUsage[];
  events: LoggedEvent[];
}

const generateMockCase = (id: string, surgeon: string, difficulty: "Standard" | "Complex" | "Efficient"): SurgicalCase => {
  const baseTime = difficulty === "Efficient" ? 2400 : difficulty === "Standard" ? 3600 : 5400;
  const variance = Math.floor(Math.random() * 600) - 300;
  const totalDuration = baseTime + variance;

  // Generate Phases
  const phases: SurgicalPhase[] = [
    { id: "p1", label: "Pre-Op", startTime: 0, endTime: totalDuration * 0.15, color: "#3b82f6" },
    { id: "p2", label: "Intra-Op", startTime: totalDuration * 0.15, endTime: totalDuration * 0.85, color: "#ef4444" },
    { id: "p3", label: "Post-Op", startTime: totalDuration * 0.85, endTime: totalDuration, color: "#10b981" }
  ];

  // Generate Instruments
  const instruments: InstrumentUsage[] = [];
  const instrumentList = ["Scalpel", "Forceps", "Suction", "Clip Applier", "Stapler"];
  const usageCount = difficulty === "Complex" ? 40 : 20;
  
  for (let i = 0; i < usageCount; i++) {
    const start = Math.floor(Math.random() * (totalDuration * 0.7)) + (totalDuration * 0.15);
    const duration = Math.floor(Math.random() * 120) + 30;
    instruments.push({
      id: `inst-${i}`,
      label: instrumentList[Math.floor(Math.random() * instrumentList.length)],
      startTime: start,
      endTime: Math.min(start + duration, totalDuration),
      color: "#f59e0b",
      trackIndex: i % 3
    });
  }

  // Generate Events
  const events: LoggedEvent[] = [];
  const eventCount = difficulty === "Complex" ? 15 : 8;
  
  for (let i = 0; i < eventCount; i++) {
    const start = Math.floor(Math.random() * totalDuration);
    events.push({
      label: i % 5 === 0 ? "Critical Step" : "Routine Action",
      type: i % 10 === 0 && difficulty === "Complex" ? "complication" : "milestone",
      startTime: start,
      endTime: start + 10,
      category: start < phases[1].startTime ? "pre-op" : start > phases[2].startTime ? "post-op" : "intra-op"
    });
  }

  return {
    id,
    details: {
      id,
      surgeon,
      procedure: "Laparoscopic Cholecystectomy",
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
      notes: `${difficulty} case complexity.`
    },
    phases,
    instruments,
    events
  };
};

export const MOCK_CASES: SurgicalCase[] = [
  generateMockCase("CASE-001", "Dr. Strange", "Standard"),
  generateMockCase("CASE-002", "Dr. House", "Complex"),
  generateMockCase("CASE-003", "Dr. Grey", "Efficient"),
  generateMockCase("CASE-004", "Dr. Shepherd", "Standard"),
];
