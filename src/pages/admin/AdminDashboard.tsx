import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminStats, recentUsers, mockLeaderboard } from "@/data/mockData";
import { Users, FileText, ClipboardList, DollarSign, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

const userGrowth = [
  { month: "Sep", users: 450 },
  { month: "Oct", users: 620 },
  { month: "Nov", users: 780 },
  { month: "Dec", users: 920 },
  { month: "Jan", users: 1100 },
  { month: "Feb", users: 1247 },
];

const revenueData = [
  { month: "Sep", revenue: 85000 },
  { month: "Oct", revenue: 120000 },
  { month: "Nov", revenue: 155000 },
  { month: "Dec", revenue: 180000 },
  { month: "Jan", revenue: 215000 },
  { month: "Feb", revenue: 245000 },
];

const AdminDashboard = () => {
  const stats = [
    { label: "Total Students", value: adminStats.totalStudents.toLocaleString(), icon: <Users className="h-5 w-5" />, color: "text-primary", growth: "+12.5%" },
    { label: "Total Teachers", value: adminStats.totalTeachers, icon: <Users className="h-5 w-5" />, color: "text-accent", growth: "+3" },
    { label: "Questions", value: adminStats.totalQuestions.toLocaleString(), icon: <FileText className="h-5 w-5" />, color: "text-warning", growth: "+230" },
    { label: "Revenue (৳)", value: `${(adminStats.revenue / 1000).toFixed(0)}K`, icon: <DollarSign className="h-5 w-5" />, color: "text-success", growth: "+18%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
                  <p className="text-xs text-success mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {s.growth}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${s.color}`}>{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">User Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Revenue (৳)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: "hsl(var(--success))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Users</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold ${u.role === "teacher" ? "bg-accent" : "bg-primary"}`}>
                      {u?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
                    <p className="text-xs text-muted-foreground mt-1">{u.joinedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Platform Health</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-bold text-success">{adminStats.platformUptime}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full"><div className="h-2 bg-success rounded-full" style={{ width: `${adminStats.platformUptime}%` }} /></div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="text-sm font-bold">{adminStats.activeUsers} / {adminStats.totalStudents + adminStats.totalTeachers}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full"><div className="h-2 bg-primary rounded-full" style={{ width: `${(adminStats.activeUsers / (adminStats.totalStudents + adminStats.totalTeachers)) * 100}%` }} /></div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Growth</span>
                <span className="text-sm font-bold text-success">+{adminStats.monthlyGrowth}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full"><div className="h-2 bg-accent rounded-full" style={{ width: `${adminStats.monthlyGrowth * 5}%` }} /></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
