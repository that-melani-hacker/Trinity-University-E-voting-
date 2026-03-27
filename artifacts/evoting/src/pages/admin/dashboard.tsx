import * as React from "react";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { getAuthOptions } from "@/lib/utils";
import { AppLayout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, Spinner } from "@/components/ui/core";
import { Users, Vote, CheckSquare, Activity } from "lucide-react";

export default function AdminDashboard() {
  const authOpts = getAuthOptions();
  const { data: stats, isLoading } = useGetDashboardStats(authOpts);

  if (isLoading) return <AppLayout><div className="flex justify-center p-12"><Spinner /></div></AppLayout>;

  const statCards = [
    { label: "Total Students", value: stats?.totalStudents || 0, icon: <Users className="w-6 h-6 text-blue-500" />, bg: "bg-blue-500/10" },
    { label: "Total Elections", value: stats?.totalElections || 0, icon: <Vote className="w-6 h-6 text-purple-500" />, bg: "bg-purple-500/10" },
    { label: "Active Elections", value: stats?.activeElections || 0, icon: <Activity className="w-6 h-6 text-green-500" />, bg: "bg-green-500/10" },
    { label: "Total Votes Cast", value: stats?.totalVotes || 0, icon: <CheckSquare className="w-6 h-6 text-orange-500" />, bg: "bg-orange-500/10" },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-2 text-lg">System-wide metrics and status at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-0 shadow-lg shadow-black/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Dashboard could have more charts if there was an endpoint for timeline, but we rely on standard stats */}
      <Card className="border-0 shadow-lg shadow-black/5 bg-primary text-primary-foreground overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px]" />
         <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold font-display mb-2">Welcome to the Admin Portal</h2>
              <p className="text-primary-foreground/80 max-w-lg">Manage elections, register candidates, and oversee the voting process with full transparency. Use the sidebar to navigate to specific modules.</p>
            </div>
         </CardContent>
      </Card>
    </AppLayout>
  );
}
