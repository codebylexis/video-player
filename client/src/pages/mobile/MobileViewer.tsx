import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, Activity, Video, FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { MobilePlayer } from "@/components/mobile/MobilePlayer";
import { MobileTimeline } from "@/components/mobile/MobileTimeline";

// Mock URLs for demo
const DEMO_URLS = [
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_1MB.mp4"
];

export default function MobileViewer() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("video");
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [seekTime, setSeekTime] = useState(0);

  const handleSeek = (time: number) => {
    setSeekTime(time);
    setActiveTab("video");
    toast.success(`Jumped to ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`);
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("mobile_session_token");
    if (!token) {
      setLocation("/mobile/login");
    }

    // Auto-logout timer (15 minutes)
    const timeout = setTimeout(() => {
      handleLogout();
      toast.error("Session Expired", { description: "You have been logged out for security." });
    }, 15 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("mobile_session_token");
    setLocation("/mobile/login");
    toast.info("Logged out securely");
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-sm">Case #2024-001</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 ${isPrivacyMode ? 'text-emerald-500' : 'text-muted-foreground'}`}
            onClick={() => {
              setIsPrivacyMode(!isPrivacyMode);
              toast.info(isPrivacyMode ? "Privacy Mode Disabled" : "Privacy Mode Enabled");
            }}
          >
            <ShieldAlert className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <TabsContent value="video" className="h-full m-0 p-0 data-[state=active]:flex flex-col bg-black justify-center relative">
              <div className={isPrivacyMode ? "blur-md transition-all duration-500" : "transition-all duration-500"}>
                <MobilePlayer urls={DEMO_URLS} initialTime={seekTime} />
              </div>
              
              {isPrivacyMode && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg border border-emerald-500/50 text-center">
                    <ShieldAlert className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                    <p className="font-semibold text-emerald-500">Privacy Mode Active</p>
                    <p className="text-xs text-muted-foreground">Tap shield icon to reveal PHI</p>
                  </div>
                </div>
              )}

              <div className="p-4 text-center text-muted-foreground text-sm">
                <p>Swipe or tap top indicators to switch camera views</p>
              </div>
            </TabsContent>
            
            <TabsContent value="data" className="h-full m-0 p-4 overflow-auto">
              <div className="space-y-4 h-full flex flex-col">
                <h2 className="text-lg font-semibold shrink-0">Surgical Timeline</h2>
                <div className="flex-1 overflow-hidden">
                  <MobileTimeline onSeek={handleSeek} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="h-full m-0 p-4 overflow-auto">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Case Reports</h2>
                {/* Reports Placeholder */}
                <div className="border rounded-lg p-4 bg-card">
                  <FileText className="h-8 w-8 mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Read-only reports will appear here</p>
                </div>
              </div>
            </TabsContent>
          </div>

          {/* Bottom Navigation */}
          <TabsList className="grid w-full grid-cols-3 h-16 rounded-none border-t bg-background p-0">
            <TabsTrigger 
              value="video" 
              className="flex flex-col gap-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground h-full"
            >
              <Video className="h-5 w-5" />
              <span className="text-xs">Player</span>
            </TabsTrigger>
            <TabsTrigger 
              value="data" 
              className="flex flex-col gap-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground h-full"
            >
              <Activity className="h-5 w-5" />
              <span className="text-xs">Timeline</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex flex-col gap-1 rounded-none data-[state=active]:bg-accent data-[state=active]:text-accent-foreground h-full"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Reports</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
