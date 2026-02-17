import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface InstrumentDefinition {
  id: string;
  label: string;
  color: string;
  category: "cutting" | "grasping" | "suction" | "suturing" | "other";
}

interface PreferencesState {
  theme: "light" | "dark" | "system";
  logViewMode: "docked" | "popout";
  customInstruments: InstrumentDefinition[];
  timelineDensity: "compact" | "comfortable";
  layoutPreset: "standard" | "review" | "audit";
  visiblePanels: {
    left: boolean;
    right: boolean;
    bottom: boolean;
  };
}

interface PreferencesContextType extends PreferencesState {
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLogViewMode: (mode: "docked" | "popout") => void;
  addInstrument: (instrument: InstrumentDefinition) => void;
  removeInstrument: (id: string) => void;
  updateInstrument: (id: string, updates: Partial<InstrumentDefinition>) => void;
  setTimelineDensity: (density: "compact" | "comfortable") => void;
  setLayoutPreset: (preset: "standard" | "review" | "audit") => void;
  togglePanel: (panel: "left" | "right" | "bottom", visible?: boolean) => void;
}

const defaultInstruments: InstrumentDefinition[] = [
  { id: "inst-1", label: "Scalpel", color: "#ef4444", category: "cutting" },
  { id: "inst-2", label: "Bipolar Forceps", color: "#3b82f6", category: "grasping" },
  { id: "inst-3", label: "Suction", color: "#06b6d4", category: "suction" },
  { id: "inst-4", label: "Needle Driver", color: "#8b5cf6", category: "suturing" },
];

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [logViewMode, setLogViewMode] = useState<"docked" | "popout">("docked");
  const [customInstruments, setCustomInstruments] = useState<InstrumentDefinition[]>(defaultInstruments);
  const [timelineDensity, setTimelineDensity] = useState<"compact" | "comfortable">("comfortable");
  const [layoutPreset, setLayoutPreset] = useState<"standard" | "review" | "audit">("standard");
  const [visiblePanels, setVisiblePanels] = useState({ left: true, right: true, bottom: true });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sas-preferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTheme(parsed.theme || "dark");
        setLogViewMode(parsed.logViewMode || "docked");
        setCustomInstruments(parsed.customInstruments || defaultInstruments);
        setTimelineDensity(parsed.timelineDensity || "comfortable");
        setLayoutPreset(parsed.layoutPreset || "standard");
        setVisiblePanels(parsed.visiblePanels || { left: true, right: true, bottom: true });
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("sas-preferences", JSON.stringify({
      theme,
      logViewMode,
      customInstruments,
      timelineDensity,
      layoutPreset,
      visiblePanels
    }));
    
    // Apply theme
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, logViewMode, customInstruments, timelineDensity]);

  const addInstrument = (instrument: InstrumentDefinition) => {
    setCustomInstruments(prev => [...prev, instrument]);
  };

  const removeInstrument = (id: string) => {
    setCustomInstruments(prev => prev.filter(i => i.id !== id));
  };

  const updateInstrument = (id: string, updates: Partial<InstrumentDefinition>) => {
    setCustomInstruments(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const togglePanel = (panel: "left" | "right" | "bottom", visible?: boolean) => {
    setVisiblePanels(prev => ({
      ...prev,
      [panel]: visible !== undefined ? visible : !prev[panel]
    }));
  };

  return (
    <PreferencesContext.Provider value={{
      theme,
      logViewMode,
      customInstruments,
      timelineDensity,
      layoutPreset,
      visiblePanels,
      setTheme,
      setLogViewMode,
      addInstrument,
      removeInstrument,
      updateInstrument,
      setTimelineDensity,
      setLayoutPreset,
      togglePanel
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
