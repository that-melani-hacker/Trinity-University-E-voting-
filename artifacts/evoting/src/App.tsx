import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Landing from "@/pages/landing";
import { StudentLogin, StudentRegister } from "@/pages/auth/student-auth";
import AdminLogin from "@/pages/auth/admin-login";
import StudentDashboard from "@/pages/student/dashboard";
import VotePage from "@/pages/student/vote";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminElections from "@/pages/admin/elections";
import AdminElectionDetail from "@/pages/admin/election-detail";
import AdminResults from "@/pages/admin/results";
import AdminStudents from "@/pages/admin/students";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import NotFound from "@/pages/not-found";

import { AuthGuard } from "@/components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={StudentLogin} />
      <Route path="/register" component={StudentRegister} />
      <Route path="/admin/login" component={AdminLogin} />

      {/* Student Protected Routes */}
      <Route path="/dashboard">
        <AuthGuard allowedRoles={["student"]}><StudentDashboard /></AuthGuard>
      </Route>
      <Route path="/elections/:id/vote">
        <AuthGuard allowedRoles={["student"]}><VotePage /></AuthGuard>
      </Route>

      {/* Admin Protected Routes */}
      <Route path="/admin/dashboard">
        <AuthGuard allowedRoles={["election_admin", "system_admin"]}><AdminDashboard /></AuthGuard>
      </Route>
      <Route path="/admin/elections">
        <AuthGuard allowedRoles={["election_admin", "system_admin"]}><AdminElections /></AuthGuard>
      </Route>
      <Route path="/admin/elections/:id/results">
        <AuthGuard allowedRoles={["election_admin", "system_admin"]}><AdminResults /></AuthGuard>
      </Route>
      <Route path="/admin/elections/:id">
        <AuthGuard allowedRoles={["election_admin", "system_admin"]}><AdminElectionDetail /></AuthGuard>
      </Route>

      {/* System Admin Only Routes */}
      <Route path="/admin/students">
        <AuthGuard allowedRoles={["system_admin"]}><AdminStudents /></AuthGuard>
      </Route>
      <Route path="/admin/audit-logs">
        <AuthGuard allowedRoles={["system_admin"]}><AdminAuditLogs /></AuthGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
