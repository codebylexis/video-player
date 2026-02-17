import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

export default function MobileLogin() {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock validation - in production this would verify against a backend
    setTimeout(() => {
      if (accessCode.length === 6) {
        localStorage.setItem("mobile_session_token", "valid_token");
        toast.success("Access Granted", {
          description: "Entering secure mobile viewer mode."
        });
        setLocation("/mobile/viewer");
      } else {
        toast.error("Invalid Access Code", {
          description: "Please check the code and try again."
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Surgical Analysis Suite</h1>
          <p className="text-sm text-muted-foreground">Secure Mobile Viewer</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Enter Access Code</CardTitle>
            <CardDescription>
              Please enter the 6-digit security code provided by the desktop application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="000-000"
                    className="pl-9 text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || accessCode.length !== 6}
              >
                {isLoading ? "Verifying..." : "View Case Data"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>HIPAA Compliant Viewer • 256-bit Encryption</p>
          <p className="mt-1">Session auto-expires in 15 minutes</p>
        </div>
      </div>
    </div>
  );
}
