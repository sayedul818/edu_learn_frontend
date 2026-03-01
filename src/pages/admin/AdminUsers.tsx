import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recentUsers } from "@/data/mockData";
import { usersAPI } from "@/services/api";
import { Search, UserPlus, Ban, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";

const moreUsers = [
  ...recentUsers,
  { id: "s13", name: "Habib Khan", email: "habib@mail.com", role: "student" as const, joinedAt: "2026-02-10", status: "active" as const },
  { id: "t3", name: "Ms. Shirin", email: "shirin@mail.com", role: "teacher" as const, joinedAt: "2026-02-09", status: "active" as const },
  { id: "s14", name: "Ruma Akter", email: "ruma@mail.com", role: "student" as const, joinedAt: "2026-02-08", status: "inactive" as const },
];

type UserEntry = { id: string; name: string; email: string; role: "student" | "teacher"; joinedAt: string; status: "active" | "inactive" };

const AdminUsers = () => {
  const { toast } = useToast();
  
  // AddUserForm component (inline) - simple form to create user
  const AddUserForm = ({ onCreate, onCancel }: { onCreate: (f: any) => void; onCancel: () => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student'|'teacher'|'admin'>('student');
    const [className, setClassName] = useState('');
    const [group, setGroup] = useState('');
    const [phone, setPhone] = useState('');
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            await onCreate({ name, email, password, role, class: className, group, phone });
          } catch (err: any) {
            console.error('Create form submit error', err);
            toast({ title: 'Failed to create user', description: err?.message });
          }
        }}
        className="space-y-3"
      >
        <div>
          <label className="text-sm">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full rounded-lg border border-input px-3 py-2">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Class</label>
          <Input value={className} onChange={(e) => setClassName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Group</label>
          <Input value={group} onChange={(e) => setGroup(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={async () => {
            try {
              await onCreate({ name, email, password, role, class: className, group, phone });
            } catch (err: any) {
              console.error('Create click error', err);
              toast({ title: 'Failed to create user', description: err?.message });
            }
          }}>Create</Button>
        </div>
      </form>
    );
  };
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserEntry[]>(moreUsers);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeUser, setActiveUser] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const resp = await usersAPI.list({ page });
        // usersAPI returns { data: [...], total, page, limit }
        const list = Array.isArray(resp?.data) ? resp.data : [];
        const mapped = list.map((u: any) => ({ id: u._id, name: u.name, email: u.email, role: u.role, joinedAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0,10) : '', status: u.status || 'active' }));
        setUsers(mapped);
      } catch (err: any) {
        console.debug('Users fetch failed, using mock data', err?.message || err);
        toast({ title: 'Unable to load users; showing sample data' });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page]);

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  
  const openEdit = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setActiveUser(user);
    setShowEdit(true);
  };

  const submitEdit = async (values: any) => {
    try {
      const id = activeUser?.id;
      if (!id) return;
      await usersAPI.update(id, values);
      setUsers(users.map((u) => u.id === id ? { ...u, ...values } : u));
      toast({ title: 'User updated' });
      setShowEdit(false);
      setActiveUser(null);
    } catch (err: any) {
      console.error('Update failed', err?.message || err);
      toast({ title: 'Failed to update user', description: err?.message });
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return;
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await usersAPI.changeStatus(id, newStatus);
      setUsers(users.map((u) => u.id === id ? { ...u, status: newStatus } : u));
      toast({ title: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
    } catch (err: any) {
      console.error('Failed to change status', err?.message || err);
      toast({ title: 'Failed to update status', description: err?.message });
    }
  };

  const handleCreate = async (data: any) => {
    try {
      const created = await usersAPI.create(data);
      const u = created;
      setUsers((s) => [{ id: u._id, name: u.name, email: u.email, role: u.role, joinedAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0,10) : '', status: u.status || 'active' }, ...s]);
      toast({ title: 'User created' });
      setShowCreate(false);
    } catch (err: any) {
      console.error('Create user failed', err?.message || err);
      toast({ title: 'Failed to create user', description: err?.message });
    }
  };

  const openRole = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setActiveUser(user);
    setShowRole(true);
  };

  const submitRole = async (role: string) => {
    try {
      const id = activeUser?.id;
      if (!id) return;
      await usersAPI.changeRole(id, role);
      setUsers(users.map((u) => u.id === id ? { ...u, role } : u));
      toast({ title: 'Role changed' });
      setShowRole(false);
      setActiveUser(null);
    } catch (err: any) {
      console.error('Change role failed', err?.message || err);
      toast({ title: 'Failed to change role', description: err?.message });
    }
  };

  const openReset = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setActiveUser(user);
    setShowReset(true);
  };

  const submitReset = async (password: string) => {
    try {
      const id = activeUser?.id;
      if (!id) return;
      await usersAPI.resetPassword(id, password);
      toast({ title: 'Password reset' });
      setShowReset(false);
      setActiveUser(null);
    } catch (err: any) {
      console.error('Reset failed', err?.message || err);
      toast({ title: 'Failed to reset password', description: err?.message });
    }
  };

  const openDelete = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setActiveUser(user);
    setShowDelete(true);
  };

  const submitDelete = async () => {
    try {
      const id = activeUser?.id;
      if (!id) return;
      await usersAPI.delete(id);
      setUsers(users.filter((u) => u.id !== id));
      toast({ title: 'User deleted' });
      setShowDelete(false);
      setActiveUser(null);
    } catch (err: any) {
      console.error('Delete failed', err?.message || err);
      toast({ title: 'Failed to delete user', description: err?.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">{users.length} total users</p>
        </div>
        <div>
          <Button type="button" onClick={() => setShowCreate(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Create User
          </Button>
        </div>
      </div>

      <Card>
          <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>
          </div>
        </CardContent>
      </Card>
      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(v) => setShowCreate(v)}>
        <DialogContent className="w-[90vw] max-w-[640px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Fill basic details to create a new user.</DialogDescription>
          </DialogHeader>
          <AddUserForm onCreate={handleCreate} onCancel={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={(v) => setShowEdit(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details.</DialogDescription>
          </DialogHeader>
          {activeUser && (
            <form onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.target as HTMLFormElement); await submitEdit({ name: String(f.get('name') || ''), email: String(f.get('email') || ''), class: String(f.get('class') || ''), group: String(f.get('group') || ''), phone: String(f.get('phone') || '') }); }} className="space-y-3">
              <div>
                <label className="text-sm">Name</label>
                <Input name="name" defaultValue={activeUser.name} />
              </div>
              <div>
                <label className="text-sm">Email</label>
                <Input name="email" defaultValue={activeUser.email} />
              </div>
              <div>
                <label className="text-sm">Class</label>
                <Input name="class" defaultValue={activeUser.class || ''} />
              </div>
              <div>
                <label className="text-sm">Group</label>
                <Input name="group" defaultValue={activeUser.group || ''} />
              </div>
              <div>
                <label className="text-sm">Phone</label>
                <Input name="phone" defaultValue={activeUser.phone || ''} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowEdit(false); setActiveUser(null); }}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={showRole} onOpenChange={(v) => setShowRole(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>Assign a new role to the user.</DialogDescription>
          </DialogHeader>
          {activeUser && (
            <form onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.target as HTMLFormElement); await submitRole(String(f.get('role'))); }} className="space-y-3">
              <div>
                <label className="text-sm">Role</label>
                <select name="role" defaultValue={activeUser.role} className="w-full rounded-lg border border-input px-3 py-2">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowRole(false); setActiveUser(null); }}>Cancel</Button>
                <Button type="submit">Change</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showReset} onOpenChange={(v) => setShowReset(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for the user.</DialogDescription>
          </DialogHeader>
          {activeUser && (
            <form onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.target as HTMLFormElement); await submitReset(String(f.get('password'))); }} className="space-y-3">
              <div>
                <label className="text-sm">New password</label>
                <Input name="password" type="password" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowReset(false); setActiveUser(null); }}>Cancel</Button>
                <Button type="submit">Reset</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDelete} onOpenChange={(v) => setShowDelete(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>This action permanently deletes the user.</DialogDescription>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete <strong>{activeUser?.name}</strong>?</div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setShowDelete(false); setActiveUser(null); }}>Cancel</Button>
            <Button onClick={submitDelete} className="bg-destructive text-destructive-foreground">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
          <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-6" colSpan={5}>
                      <BeautifulLoader message="Loading users..." compact />
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, idx) => (
                  <tr key={u.id ?? u.email ?? idx} className="border-b border-border/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold ${u?.role === "teacher" ? "bg-accent" : "bg-primary"}`}>{(u?.name?.charAt(0)) || (u?.email?.charAt(0)) || '?'}</div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize">{u.role}</td>
                    <td className="py-3 px-4 text-muted-foreground">{u.joinedAt}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{u.status}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => toggleStatus(u.id)} title={u.status === "active" ? "Deactivate" : "Activate"}>
                          {u.status === "active" ? <Ban className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(u.id)} title="Edit user">Edit</Button>
                        <Button size="icon" variant="ghost" onClick={() => openRole(u.id)} title="Change role">Role</Button>
                        <Button size="icon" variant="ghost" onClick={() => openReset(u.id)} title="Reset password">Pw</Button>
                        <Button size="icon" variant="ghost" onClick={() => openDelete(u.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
