import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Posts() {
  const { isAuthenticated, loading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    content: "",
    spintaxContent: "",
    scheduledAt: "",
    scheduleType: "once" as "once" | "daily" | "weekly" | "custom",
    delayBetweenPosts: 60,
  });

  const postsQuery = trpc.posts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const groupsQuery = trpc.groups.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success("Post created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
      postsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create post");
    },
  });

  const updateMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success("Post updated successfully!");
      setEditingPost(null);
      resetForm();
      postsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update post");
    },
  });

  const deleteMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted successfully!");
      postsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete post");
    },
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

  const resetForm = () => {
    setFormData({
      content: "",
      spintaxContent: "",
      scheduledAt: "",
      scheduleType: "once",
      delayBetweenPosts: 60,
    });
    setSelectedGroups([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content) {
      toast.error("Please enter post content");
      return;
    }

    if (selectedGroups.length === 0) {
      toast.error("Please select at least one group");
      return;
    }

    const postData = {
      content: formData.content,
      spintaxContent: formData.spintaxContent || undefined,
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined,
      groupsToPost: JSON.stringify(selectedGroups),
      delayBetweenPosts: formData.delayBetweenPosts,
      scheduleType: formData.scheduleType,
    };

    if (editingPost) {
      updateMutation.mutate({
        id: editingPost.id,
        ...postData,
      });
    } else {
      createMutation.mutate(postData);
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      content: post.content,
      spintaxContent: post.spintaxContent || "",
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
      scheduleType: post.scheduleType || "once",
      delayBetweenPosts: post.delayBetweenPosts || 60,
    });
    try {
      const groups = JSON.parse(post.groupsToPost || "[]");
      setSelectedGroups(groups);
    } catch {
      setSelectedGroups([]);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingPost(null);
    resetForm();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "posting":
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "failed":
        return "text-destructive";
      case "posting":
        return "text-blue-500";
      case "scheduled":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Posts</h1>
          <p className="text-muted-foreground">
            Create and manage your scheduled posts
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {postsQuery.isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      ) : postsQuery.data && postsQuery.data.length > 0 ? (
        <div className="space-y-4">
          {postsQuery.data.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(post.status)}
                      <span className={`text-sm font-medium capitalize ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                      {post.scheduleType && post.scheduleType !== "once" && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {post.scheduleType}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg mb-2">
                      {post.content.substring(0, 100)}
                      {post.content.length > 100 && "..."}
                    </CardTitle>
                    <CardDescription>
                      {post.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Scheduled for {new Date(post.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Created {new Date(post.createdAt).toLocaleDateString()}</p>
                  {post.spintaxContent && (
                    <p className="mt-1">✨ Using spintax variations</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first post to start automating your Facebook marketing
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Post Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingPost} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
            <DialogDescription>
              {editingPost 
                ? "Update your post content and settings"
                : "Create a new post to schedule for your Facebook groups"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="content">Post Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your post content here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spintaxContent">Spintax Content (Optional)</Label>
                <Textarea
                  id="spintaxContent"
                  placeholder="e.g., {Hello|Hi|Hey} {world|everyone}!"
                  value={formData.spintaxContent}
                  onChange={(e) => setFormData({ ...formData, spintaxContent: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Use spintax to create content variations. Example: Hello world becomes Hi everyone
                </p>
              </div>

              <div className="space-y-2">
                <Label>Select Groups to Post *</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                  {groupsQuery.data && groupsQuery.data.length > 0 ? (
                    groupsQuery.data.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGroups([...selectedGroups, group.id]);
                            } else {
                              setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`group-${group.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {group.groupName}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No groups available. Add groups first.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduleType">Schedule Type</Label>
                  <Select
                    value={formData.scheduleType}
                    onValueChange={(value: any) => setFormData({ ...formData, scheduleType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One Time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delayBetweenPosts">Delay Between Posts (seconds)</Label>
                  <Input
                    id="delayBetweenPosts"
                    type="number"
                    min="30"
                    max="300"
                    value={formData.delayBetweenPosts}
                    onChange={(e) => setFormData({ ...formData, delayBetweenPosts: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Schedule Date & Time (Optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to save as draft
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? "Saving..." 
                  : editingPost ? "Update Post" : "Create Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
