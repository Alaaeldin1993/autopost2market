import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, Users, Package, DollarSign, Settings as SettingsIcon, 
  LogOut, Shield, Search, Edit, Trash2, Gift, Crown
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [accessFormData, setAccessFormData] = useState({
    accessType: "trial" as "trial" | "lifetime" | "custom",
    days: 7,
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const data = localStorage.getItem("adminData");
    
    if (!token || !data) {
      setLocation("/admin/login");
      return;
    }
    
    setAdminToken(token);
    setAdminData(JSON.parse(data));
  }, [setLocation]);

  const utils = trpc.useUtils();

  const dashboardQuery = trpc.admin.dashboard.useQuery(undefined, {
    enabled: !!adminToken,
  });

  const usersQuery = trpc.admin.users.list.useQuery(
    { search: searchTerm },
    {
      enabled: !!adminToken,
    }
  );

  const giveAccessMutation = trpc.admin.users.giveAccess.useMutation({
    onSuccess: () => {
      toast.success("Access granted successfully!");
      setIsAccessDialogOpen(false);
      setSelectedUser(null);
      usersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to grant access");
    },
  });

  const updateUserMutation = trpc.admin.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully!");
      usersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const deleteUserMutation = trpc.admin.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully!");
      usersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  if (!adminToken || !adminData) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setLocation("/admin/login");
  };

  const handleSuspendUser = (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    updateUserMutation.mutate({
      id: userId,
      subscriptionStatus: newStatus,
    });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate({ id: userId });
    }
  };

  const handleGiveAccess = () => {
    if (!selectedUser) return;

    giveAccessMutation.mutate({
      userId: selectedUser.id,
      accessType: accessFormData.accessType,
      days: accessFormData.accessType !== "lifetime" ? accessFormData.days : undefined,
    });
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/packages", label: "Packages", icon: Package },
    { href: "/admin/payments", label: "Payments", icon: DollarSign },
    { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{adminData.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{adminData.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, packages, and system settings
            </p>
          </div>

          {/* Stats Cards */}
          {dashboardQuery.data && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardQuery.data.stats?.totalUsers || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardQuery.data.stats?.activeSubscriptions || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardQuery.data.stats?.totalRevenue || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardQuery.data.stats?.monthlyRevenue || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all users</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-9 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersQuery.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                </div>
              ) : usersQuery.data && usersQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {usersQuery.data.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name || "No name"}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.subscriptionStatus === "active" 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : user.subscriptionStatus === "lifetime"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : user.subscriptionStatus === "suspended"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                          }`}>
                            {user.subscriptionStatus}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsAccessDialogOpen(true);
                          }}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Give Access
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspendUser(user.id, user.subscriptionStatus)}
                        >
                          {user.subscriptionStatus === "suspended" ? "Activate" : "Suspend"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Give Access Dialog */}
      <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give Access to User</DialogTitle>
            <DialogDescription>
              Grant special access to {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Access Type</Label>
              <Select
                value={accessFormData.accessType}
                onValueChange={(value: any) => setAccessFormData({ ...accessFormData, accessType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial Access</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                  <SelectItem value="lifetime">Lifetime Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {accessFormData.accessType !== "lifetime" && (
              <div className="space-y-2">
                <Label>Number of Days</Label>
                <Input
                  type="number"
                  min="1"
                  value={accessFormData.days}
                  onChange={(e) => setAccessFormData({ ...accessFormData, days: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGiveAccess} disabled={giveAccessMutation.isPending}>
              {giveAccessMutation.isPending ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
