import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { 
  FileText, 
  Settings, 
  HelpCircle, 
  Info, 
  Download, 
  Upload, 
  Layout, 
  Monitor, 
  Grid, 
  Maximize,
  Save,
  FolderOpen,
  LogOut,
  Undo,
  Redo,
  Keyboard,
  Activity
} from "lucide-react";
import { useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";


interface TopMenuBarProps {
  onExportReport: () => void;
  onShowShortcuts: () => void;
  onLayoutChange: (layout: "single" | "split" | "quad") => void;
  currentLayout: "single" | "split" | "quad";
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onShowPreferences: () => void;
  onCompareCases: () => void;
}

export function TopMenuBar({ 
  onExportReport, 
  onShowShortcuts, 
  onLayoutChange,
  currentLayout,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onShowPreferences,
  onCompareCases
}: TopMenuBarProps) {
  const { visiblePanels, togglePanel } = usePreferences();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="border-b border-border bg-background px-2 py-1 sticky top-0 z-50 flex items-center">
      <div className="mr-4 pl-2">
        <img src="/images/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
      </div>
      <Menubar className="border-none bg-transparent h-8 flex-1">
        <MenubarMenu>
          <MenubarTrigger className="text-xs font-medium">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Case... <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled>
              <Save className="mr-2 h-4 w-4" />
              Save Analysis <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>
                <Download className="mr-2 h-4 w-4" />
                Export
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={onExportReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  PDF Report
                </MenubarItem>
                <MenubarItem disabled>
                  Data (CSV)
                </MenubarItem>
                <MenubarItem disabled>
                  Heatmap Image
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem disabled>
              <LogOut className="mr-2 h-4 w-4" />
              Exit Session
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onCompareCases}>
              <Activity className="mr-2 h-4 w-4" />
              Compare Cases...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-xs font-medium">Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled={!canUndo} onClick={onUndo}>
              <Undo className="mr-2 h-4 w-4" />
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled={!canRedo} onClick={onRedo}>
              <Redo className="mr-2 h-4 w-4" />
              Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onShowPreferences}>
              <Settings className="mr-2 h-4 w-4" />
              Preferences...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-xs font-medium">View</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>
                <Layout className="mr-2 h-4 w-4" />
                Layout
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={() => onLayoutChange("single")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  Single View
                  {currentLayout === "single" && <span className="ml-auto text-xs">✓</span>}
                </MenubarItem>
                <MenubarItem onClick={() => onLayoutChange("split")}>
                  <Layout className="mr-2 h-4 w-4" />
                  Split View
                  {currentLayout === "split" && <span className="ml-auto text-xs">✓</span>}
                </MenubarItem>
                <MenubarItem onClick={() => onLayoutChange("quad")}>
                  <Grid className="mr-2 h-4 w-4" />
                  Quad View
                  {currentLayout === "quad" && <span className="ml-auto text-xs">✓</span>}
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem disabled>
              <Maximize className="mr-2 h-4 w-4" />
              Toggle Fullscreen <MenubarShortcut>F</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => togglePanel("left")}>
              <span className="w-4 mr-2 flex justify-center">{visiblePanels.left && <Check className="h-3 w-3" />}</span>
              Event Log Panel
            </MenubarItem>
            <MenubarItem onClick={() => togglePanel("right")}>
              <span className="w-4 mr-2 flex justify-center">{visiblePanels.right && <Check className="h-3 w-3" />}</span>
              Notes Panel
            </MenubarItem>
            <MenubarItem onClick={() => togglePanel("bottom")}>
              <span className="w-4 mr-2 flex justify-center">{visiblePanels.bottom && <Check className="h-3 w-3" />}</span>
              Timeline Panel
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-xs font-medium">About Company</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled>
              <Info className="mr-2 h-4 w-4" />
              About Surgical Analysis Suite
            </MenubarItem>
            <MenubarItem disabled>
              Check for Updates...
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled>
              License Information
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-xs font-medium">Settings</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onShowPreferences}>
              <Settings className="mr-2 h-4 w-4" />
              Preferences...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-xs font-medium">Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onShowShortcuts}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Instructions for Use
            </MenubarItem>
            <MenubarItem onClick={onShowShortcuts}>
              <Keyboard className="mr-2 h-4 w-4" />
              Keyboard Shortcuts <MenubarShortcut>?</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled>
              Contact Support
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      
      {toggleTheme && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-2"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
