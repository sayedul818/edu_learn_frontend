import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    siteName: "ExamPro",
    siteTagline: "Smart Exam Preparation Platform",
    contactEmail: "admin@exampro.com",
    maxExamDuration: 180,
    defaultNegativeMarking: false,
    negativeMarkValue: 0.25,
    maintenanceMode: false,
    allowRegistration: true,
  });

  const handleSave = () => {
    toast({ title: "Settings saved ✅" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Configure system-wide settings</p>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Site Name</Label>
            <Input className="mt-1" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input className="mt-1" value={settings.siteTagline} onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })} />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input className="mt-1" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Exam Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Max Exam Duration (minutes)</Label>
            <Input type="number" className="mt-1" value={settings.maxExamDuration} onChange={(e) => setSettings({ ...settings, maxExamDuration: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={settings.defaultNegativeMarking} onChange={(e) => setSettings({ ...settings, defaultNegativeMarking: e.target.checked })} />
            <Label>Default Negative Marking</Label>
          </div>
          {settings.defaultNegativeMarking && (
            <div>
              <Label>Default Penalty Value</Label>
              <Input type="number" step="0.25" className="mt-1" value={settings.negativeMarkValue} onChange={(e) => setSettings({ ...settings, negativeMarkValue: Number(e.target.value) })} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>System</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Disable access for all users</p>
            </div>
            <button onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.maintenanceMode ? "bg-destructive" : "bg-muted"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform ${settings.maintenanceMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Allow Registration</p>
              <p className="text-xs text-muted-foreground">Allow new users to sign up</p>
            </div>
            <button onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.allowRegistration ? "bg-success" : "bg-muted"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform ${settings.allowRegistration ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleSave}>
        <Save className="h-4 w-4 mr-2" /> Save Settings
      </Button>
    </div>
  );
};

export default AdminSettings;
