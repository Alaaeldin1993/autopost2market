import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, Users, FileText, Calendar, 
  Settings, LogOut, Sparkles, TrendingUp, Clock
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const statsQuery = trpc.stats.dashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/groups", label: "Groups", icon: Users },
    { href: "/dashboard/posts", label: "Posts", icon: FileText },
    { href: "/dashboard/schedule", label: "Schedule", icon: Calendar },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AutoPost2Market</span>
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
              <span className="text-sm font-semibold text-primary">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your account.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsQuery.data?.totalGroups || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active Facebook groups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsQuery.data?.totalPosts || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created posts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Posts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsQuery.data?.completedPosts || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully posted
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <Link href="/dashboard/groups">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Users className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Add Facebook Group</div>
                    <div className="text-sm text-muted-foreground">Connect a new group to post to</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/posts">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <FileText className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Create New Post</div>
                    <div className="text-sm text-muted-foreground">Write and schedule a post</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/schedule">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Calendar className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">View Schedule</div>
                    <div className="text-sm text-muted-foreground">See your upcoming posts</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Settings className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Settings</div>
                    <div className="text-sm text-muted-foreground">Configure your preferences</div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Status: <span className="text-primary capitalize">{user?.subscriptionStatus || "trial"}</span>
                  </p>
                  {user?.subscriptionExpiresAt && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Expires: {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "lifetime" && (
                  <Button>
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
