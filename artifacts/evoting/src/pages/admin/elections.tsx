import * as React from "react";
import { Link } from "wouter";
import { useListElections, useCreateElection, useUpdateElection } from "@workspace/api-client-react";
import { getAuthOptions, formatDate } from "@/lib/utils";
import { AppLayout } from "@/components/Layout";
import { Card, CardContent, Button, Badge, Spinner, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/core";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings2, BarChart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function StatusBadge({ status }: { status: string }) {
  switch(status) {
    case 'draft': return <Badge variant="secondary">DRAFT</Badge>;
    case 'active': return <Badge variant="success">ACTIVE</Badge>;
    case 'ended': return <Badge variant="warning">ENDED</Badge>;
    case 'published': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">PUBLISHED</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

export default function AdminElections() {
  const authOpts = getAuthOptions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: elections, isLoading } = useListElections(undefined, authOpts);
  const createMutation = useCreateElection(authOpts);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({ title: "", description: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Election created successfully." });
          queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
          setIsCreateOpen(false);
          setFormData({ title: "", description: "" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
      }
    );
  };

  return (
    <AppLayout allowedRoles={['election_admin', 'system_admin']}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Elections</h1>
          <p className="text-muted-foreground mt-2">Create and manage university elections.</p>
        </div>
        <Button variant="accent" onClick={() => setIsCreateOpen(true)} className="rounded-full shadow-lg shadow-accent/30">
          <Plus className="w-5 h-5 mr-2" /> New Election
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Election</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Election Title</Label>
              <Input placeholder="e.g. SRC General Elections 2024" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Brief description of the election..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" variant="accent" isLoading={createMutation.isPending}>Create Election</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? <div className="flex justify-center p-12"><Spinner /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections?.map(election => (
            <Card key={election.id} className="flex flex-col overflow-hidden hover:shadow-xl hover:border-border transition-all">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <StatusBadge status={election.status} />
                  <span className="text-xs text-muted-foreground">{formatDate(election.createdAt)}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{election.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-1">{election.description}</p>
                <div className="flex gap-2 mt-auto border-t border-border/50 pt-4">
                  <Link href={`/admin/elections/${election.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-xs h-9">
                      <Settings2 className="w-4 h-4 mr-2" /> Manage
                    </Button>
                  </Link>
                  {['ended', 'published'].includes(election.status) && (
                    <Link href={`/admin/elections/${election.id}/results`} className="flex-1">
                      <Button variant="secondary" className="w-full text-xs h-9 text-primary">
                        <BarChart className="w-4 h-4 mr-2" /> Results
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
