import * as React from "react";
import { useGetAuditLogs } from "@workspace/api-client-react";
import { getAuthOptions, formatDate } from "@/lib/utils";
import { AppLayout } from "@/components/Layout";
import { Card, CardContent, Spinner, Badge } from "@/components/ui/core";
import { Activity } from "lucide-react";

export default function AdminAuditLogs() {
  const authOpts = getAuthOptions();
  const { data: logs, isLoading } = useGetAuditLogs(authOpts);

  if (isLoading) return <AppLayout><div className="flex justify-center p-12"><Spinner /></div></AppLayout>;

  return (
    <AppLayout allowedRoles={['system_admin']}>
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">System Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Immutable record of all critical system actions.</p>
        </div>
      </div>

      <Card className="shadow-lg shadow-black/5 border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-primary text-primary-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">User ID / Role</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs?.map(log => (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground font-mono">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-accent/30 text-accent font-mono text-[10px] uppercase">{log.action}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <span className="font-bold text-foreground">User {log.userId || 'System'}</span>
                        <span className="block text-muted-foreground">{log.userRole || 'auto'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{log.ipAddress || 'unknown'}</td>
                    <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate" title={log.details}>{log.details || '-'}</td>
                  </tr>
                ))}
                {!logs?.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No audit logs generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
