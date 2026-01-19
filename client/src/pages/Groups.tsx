import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Groups() {
  const { isAuthenticated, loading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    groupId: "",
    groupName: "",
    groupUrl: "",
  });

  const groupsQuery = trpc.groups.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.groups.create.useMutation({
    onSuccess: () => {
      toast.success("Group added successfully!");
      setIsAddDialogOpen(false);
      setFormData({ groupId: "", groupName: "", groupUrl: "" });
      groupsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add group");
    },
  });

  const updateMutation = trpc.groups.update.useMutation({
    onSuccess: () => {
      toast.success("Group updated successfully!");
      setEditingGroup(null);
      setFormData({ groupId: "", groupName: "", groupUrl: "" });
      groupsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update group");
    },
  });

  const deleteMutation = trpc.groups.delete.useMutation({
    onSuccess: () => {
      toast.success("Group deleted successfully!");
      groupsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete group");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.groupId || !formData.groupName || !formData.groupUrl) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingGroup) {
      updateMutation.mutate({
        id: editingGroup.id,
        groupName: formData.groupName,
        groupUrl: formData.groupUrl,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (group: any) => {
    setEditingGroup(group);
    setFormData({
      groupId: group.groupId,
      groupName: group.groupName,
      groupUrl: group.groupUrl,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this group?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingGroup(null);
    setFormData({ groupId: "", groupName: "", groupUrl: "" });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Facebook Groups</h1>
          <p className="text-muted-foreground">
            Manage your Facebook groups for automated posting
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      {groupsQuery.isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      ) : groupsQuery.data && groupsQuery.data.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupsQuery.data.map((group) => (
            <Card key={group.id} className={group.isActive === 0 ? "opacity-50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="flex-1">{group.groupName}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="break-all">
                  ID: {group.groupId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={group.groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Group
                </a>
                <p className="text-xs text-muted-foreground mt-2">
                  Added {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first Facebook group to start posting automatically
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Group Dialog */}
      <Dialog open={isAddDialogOpen || !!editingGroup} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Group" : "Add Facebook Group"}</DialogTitle>
            <DialogDescription>
              {editingGroup 
                ? "Update the group information below"
                : "Enter the details of the Facebook group you want to add"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupId">Group ID</Label>
                <Input
                  id="groupId"
                  placeholder="e.g., 123456789"
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  disabled={!!editingGroup}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Find this in the group URL after "groups/"
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Digital Marketing Tips"
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupUrl">Group URL</Label>
                <Input
                  id="groupUrl"
                  placeholder="https://facebook.com/groups/..."
                  value={formData.groupUrl}
                  onChange={(e) => setFormData({ ...formData, groupUrl: e.target.value })}
                  required
                />
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
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingGroup ? "Update" : "Add Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
