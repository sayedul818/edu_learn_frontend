import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { authAPI, classesAPI, groupsAPI } from "@/services/api";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import {
  Camera,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  Sparkles,
  User,
} from "lucide-react";

type NotificationPrefs = {
  examReminders: boolean;
  resultAlerts: boolean;
  leaderboardUpdates: boolean;
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  class: string;
  group: string;
  avatar: string;
};

type PreferencesForm = {
  language: string;
  theme: "light" | "dark" | "system";
  notifications: NotificationPrefs;
};

const defaultNotifications: NotificationPrefs = {
  examReminders: true,
  resultAlerts: true,
  leaderboardUpdates: true,
};

const StudentProfile = () => {
  const navigate = useNavigate();
  const { user, setUserData } = useAuth();
  const { set: setTheme } = useTheme();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    class: "",
    group: "",
    avatar: "",
  });

  const [preferences, setPreferences] = useState<PreferencesForm>({
    language: "en",
    theme: "system",
    notifications: defaultNotifications,
  });

  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "student") {
      navigate("/dashboard");
      return;
    }

    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [profileRes, classesRes, groupsRes] = await Promise.all([
          authAPI.getProfile(),
          classesAPI.getAll(),
          groupsAPI.getAll(),
        ]);

        const currentUser = profileRes?.data || profileRes;

        setProfile({
          name: currentUser?.name || "",
          email: currentUser?.email || "",
          phone: currentUser?.phone || "",
          class: currentUser?.class || "",
          group: currentUser?.group || "",
          avatar: currentUser?.avatar || "",
        });

        setPreferences({
          language: currentUser?.preferences?.language || "en",
          theme: currentUser?.preferences?.theme || "system",
          notifications: {
            examReminders: currentUser?.preferences?.notifications?.examReminders !== false,
            resultAlerts: currentUser?.preferences?.notifications?.resultAlerts !== false,
            leaderboardUpdates:
              currentUser?.preferences?.notifications?.leaderboardUpdates !== false,
          },
        });

        setClasses(classesRes?.data || []);
        setGroups(groupsRes?.data || []);
      } catch (error) {
        toast({
          title: "Failed to load profile",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [navigate, toast, user]);

  const availableGroups = useMemo(() => {
    if (!profile.class) return groups;
    return groups.filter((item) => {
      const classId = item?.classId?._id || item?.classId;
      return String(classId || "") === String(profile.class);
    });
  }, [groups, profile.class]);

  useEffect(() => {
    if (!profile.class) return;
    const selectedGroupExists = availableGroups.some(
      (item) => String(item?._id || item?.id) === String(profile.group)
    );
    if (!selectedGroupExists) {
      setProfile((prev) => ({ ...prev, group: "" }));
    }
  }, [availableGroups, profile.class, profile.group]);

  const applyThemePreference = (themeChoice: "light" | "dark" | "system") => {
    if (themeChoice === "system") {
      const systemTheme =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      setTheme(systemTheme);
      return;
    }
    setTheme(themeChoice);
  };

  const handleProfileSave = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      toast({
        title: "Missing required fields",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        class: profile.class,
        group: profile.group,
        avatar: profile.avatar,
      });

      const updatedUser = res?.data || res;
      if (updatedUser) {
        setUserData(updatedUser);
      }

      toast({
        title: "Profile updated",
        description: "Your profile changes were saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Profile update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePreferencesSave = async () => {
    setSavingPreferences(true);
    try {
      await authAPI.updatePreferences(preferences);
      applyThemePreference(preferences.theme);

      setUserData({
        ...(user as any),
        preferences,
      });

      toast({
        title: "Preferences saved",
        description: "Your learning preferences were updated.",
      });
    } catch (error) {
      toast({
        title: "Failed to save preferences",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing password fields",
        description: "Please fill all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Weak password",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Confirm password must match the new password.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        description: "Your account password was changed successfully.",
      });
    } catch (error) {
      toast({
        title: "Password update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (file?: File | null) => {
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setProfile((prev) => ({ ...prev, avatar: imageUrl }));

      const res = await authAPI.updateProfile({ avatar: imageUrl });
      const updatedUser = res?.data || res;
      if (updatedUser) {
        setUserData(updatedUser);
      }

      toast({
        title: "Avatar uploaded",
        description: "Your avatar is now updated across the app.",
      });
    } catch (error) {
      toast({
        title: "Avatar upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const initials = (profile.name || user?.name || "ST")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-300 dark:border-cyan-500/20 bg-slate-100 dark:bg-slate-900 p-5 shadow-xl overflow-hidden relative">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 dark:from-cyan-500/10 via-transparent to-purple-500/5 dark:to-purple-500/10 pointer-events-none" />
        
        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-400 dark:border-cyan-500/30 bg-slate-200/50 dark:bg-cyan-500/10 px-4 py-2 mb-3">
            <Sparkles className="h-4 w-4 text-slate-600 dark:text-cyan-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-cyan-300">Student Profile</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Manage Your Profile</h1>
          
          {/* Description */}
          <p className="text-slate-700 dark:text-slate-300 text-sm">Update your academic and account settings with live backend sync.</p>
        </div>
      </div>

      <Tabs defaultValue="public-profile" className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-xl border border-border/70 bg-card/70 p-1.5">
          <TabsTrigger value="public-profile" className="rounded-lg px-4 py-2 text-sm">
            Public Profile
          </TabsTrigger>
          <TabsTrigger value="learning-preferences" className="rounded-lg px-4 py-2 text-sm">
            Learning Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg px-4 py-2 text-sm">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public-profile">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-lg">Public Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                <Avatar className="h-20 w-20 border border-border">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback>{initials || "ST"}</AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Profile photo</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" /> Upload Avatar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="pl-9"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="pl-9"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      className="pl-9"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select
                    value={profile.class || "none"}
                    onValueChange={(value) =>
                      setProfile((prev) => ({ ...prev, class: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No class</SelectItem>
                      {classes.map((item) => (
                        <SelectItem key={String(item?._id || item?.id)} value={String(item?._id || item?.id)}>
                          {item?.name || "Unnamed class"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Group</Label>
                  <Select
                    value={profile.group || "none"}
                    onValueChange={(value) =>
                      setProfile((prev) => ({ ...prev, group: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group</SelectItem>
                      {availableGroups.map((item) => (
                        <SelectItem key={String(item?._id || item?.id)} value={String(item?._id || item?.id)}>
                          {item?.name || "Unnamed group"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleProfileSave} disabled={savingProfile || uploadingAvatar}>
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving profile...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning-preferences">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-lg">Learning Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">Bangla</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Theme preference</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value: "light" | "dark" | "system") =>
                      setPreferences((prev) => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium">Exam reminders</p>
                    <p className="text-xs text-muted-foreground">Get reminders before scheduled exams.</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.examReminders}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, examReminders: checked },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium">Result alerts</p>
                    <p className="text-xs text-muted-foreground">Notify when new results are published.</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.resultAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, resultAlerts: checked },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium">Leaderboard updates</p>
                    <p className="text-xs text-muted-foreground">Get weekly rank movement updates.</p>
                  </div>
                  <Switch
                    checked={preferences.notifications.leaderboardUpdates}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, leaderboardUpdates: checked },
                      }))
                    }
                  />
                </div>
              </div>

              <Button onClick={handlePreferencesSave} disabled={savingPreferences}>
                {savingPreferences ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving preferences...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-lg">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                Keep your account secure by using a strong password with at least 6 characters.
              </p>

              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="pl-9"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button onClick={handlePasswordChange} disabled={savingPassword}>
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProfile;
