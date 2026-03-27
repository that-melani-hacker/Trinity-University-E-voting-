import * as React from "react";
import { useParams, Link } from "wouter";
import { useGetElection, useUpdateElection, useCreatePosition, useCreateCandidate } from "@workspace/api-client-react";
import { getAuthOptions } from "@/lib/utils";
import { AppLayout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Spinner, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/core";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, UserPlus, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminElectionDetail() {
  const { id } = useParams<{ id: string }>();
  const electionId = parseInt(id, 10);
  const authOpts = getAuthOptions();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: election, isLoading } = useGetElection(electionId, authOpts);
  const updateMutation = useUpdateElection(authOpts);
  const createPosMutation = useCreatePosition(authOpts);
  const createCandMutation = useCreateCandidate(authOpts);

  const [posForm, setPosForm] = React.useState({ open: false, title: "", description: "" });
  const [candForm, setCandForm] = React.useState({ open: false, positionId: 0, fullName: "", biography: "" });

  if (isLoading) return <AppLayout><div className="flex justify-center p-12"><Spinner /></div></AppLayout>;
  if (!election) return <AppLayout><div className="text-center p-12">Not found</div></AppLayout>;

  const handleStatusChange = (newStatus: "draft" | "active" | "ended" | "published") => {
    updateMutation.mutate(
      { id: electionId, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `Election is now ${newStatus}.` });
          queryClient.invalidateQueries({ queryKey: [`/api/elections/${electionId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/elections`] });
        }
      }
    );
  };

  const handleCreatePosition = (e: React.FormEvent) => {
    e.preventDefault();
    createPosMutation.mutate(
      { electionId, data: { title: posForm.title, description: posForm.description } },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Position added." });
          queryClient.invalidateQueries({ queryKey: [`/api/elections/${electionId}`] });
          setPosForm({ open: false, title: "", description: "" });
        }
      }
    );
  };

  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    createCandMutation.mutate(
      { positionId: candForm.positionId, data: { fullName: candForm.fullName, biography: candForm.biography } },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Candidate added." });
          queryClient.invalidateQueries({ queryKey: [`/api/elections/${electionId}`] });
          setCandForm({ open: false, positionId: 0, fullName: "", biography: "" });
        }
      }
    );
  };

  return (
    <AppLayout allowedRoles={['election_admin', 'system_admin']}>
      <Link href="/admin/elections" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Elections
      </Link>

      <Card className="mb-8 border-t-4 border-t-primary">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={election.status === 'active' ? 'success' : 'secondary'}>{election.status.toUpperCase()}</Badge>
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">{election.title}</h1>
              <p className="text-muted-foreground">{election.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 items-start bg-secondary/50 p-4 rounded-xl">
              <span className="text-sm font-semibold text-foreground w-full mb-1">Change Status:</span>
              <Button size="sm" variant={election.status === 'draft' ? 'default' : 'outline'} onClick={() => handleStatusChange('draft')} disabled={election.status === 'draft'}>Draft</Button>
              <Button size="sm" variant={election.status === 'active' ? 'success' : 'outline'} onClick={() => handleStatusChange('active')} disabled={election.status === 'active'}>Active</Button>
              <Button size="sm" variant={election.status === 'ended' ? 'warning' : 'outline'} onClick={() => handleStatusChange('ended')} disabled={election.status === 'ended'}>Ended</Button>
              <Button size="sm" variant={election.status === 'published' ? 'accent' : 'outline'} onClick={() => handleStatusChange('published')} disabled={election.status === 'published'}>Published</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Positions & Candidates</h2>
        <Button variant="secondary" onClick={() => setPosForm({ ...posForm, open: true })}>
          <Plus className="w-4 h-4 mr-2" /> Add Position
        </Button>
      </div>

      <div className="space-y-6">
        {election.positions.map(pos => (
          <Card key={pos.id} className="border border-border/50 shadow-sm">
            <CardHeader className="bg-secondary/30 flex flex-row items-center justify-between border-b border-border/50 py-4">
              <div>
                <CardTitle className="text-xl text-primary">{pos.title}</CardTitle>
                {pos.description && <p className="text-sm text-muted-foreground mt-1">{pos.description}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => setCandForm({ open: true, positionId: pos.id, fullName: "", biography: "" })}>
                <UserPlus className="w-4 h-4 mr-2" /> Add Candidate
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {pos.candidates.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> No candidates added yet.
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {pos.candidates.map(cand => (
                    <li key={cand.id} className="p-4 px-6 flex justify-between items-center hover:bg-secondary/10 transition-colors">
                      <div>
                        <p className="font-bold text-foreground">{cand.fullName}</p>
                        {cand.biography && <p className="text-sm text-muted-foreground mt-1">{cand.biography}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
        {election.positions.length === 0 && (
          <div className="text-center p-12 bg-secondary/20 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">No positions created yet. Click "Add Position" to get started.</p>
          </div>
        )}
      </div>

      {/* Position Dialog */}
      <Dialog open={posForm.open} onOpenChange={(v) => setPosForm({ ...posForm, open: v })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Position</DialogTitle></DialogHeader>
          <form onSubmit={handleCreatePosition} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Position Title</Label>
              <Input placeholder="e.g. President" required value={posForm.title} onChange={e => setPosForm({ ...posForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input value={posForm.description} onChange={e => setPosForm({ ...posForm, description: e.target.value })} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setPosForm({ ...posForm, open: false })}>Cancel</Button>
              <Button type="submit" variant="accent" isLoading={createPosMutation.isPending}>Save Position</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Candidate Dialog */}
      <Dialog open={candForm.open} onOpenChange={(v) => setCandForm({ ...candForm, open: v })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateCandidate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Candidate Full Name</Label>
              <Input required value={candForm.fullName} onChange={e => setCandForm({ ...candForm, fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Biography/Manifesto (Optional)</Label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-xl border-2 border-input bg-transparent px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 focus-visible:border-accent"
                value={candForm.biography} onChange={e => setCandForm({ ...candForm, biography: e.target.value })} 
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setCandForm({ ...candForm, open: false })}>Cancel</Button>
              <Button type="submit" variant="accent" isLoading={createCandMutation.isPending}>Add Candidate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
