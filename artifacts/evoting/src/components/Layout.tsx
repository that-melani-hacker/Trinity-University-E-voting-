import * as React from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetMe } from "@workspace/api-client-react";
import { cn, getAuthOptions, clearAuthToken } from "@/lib/utils";
import { LogOut, LayoutDashboard, Vote, Users, ShieldAlert, CheckSquare } from "lucide-react";
import { Button } from "./ui/core";
import { Spinner } from "./ui/core";

export function AuthGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe(getAuthOptions());

  React.useEffect(() => {
    if (!isLoading && (error || !user)) {
      clearAuthToken();
      setLocation("/login");
    }
  }, [isLoading, error, user, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return null;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        <Button className="mt-6" onClick={() => setLocation(user.role === 'student' ? '/dashboard' : '/admin/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetMe(getAuthOptions());
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    clearAuthToken();
    setLocation("/");
  };

  const navItems = user?.role === 'student' 
    ? [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      ]
    : [
        { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Elections", href: "/admin/elections", icon: <Vote className="w-5 h-5" /> },
        ...(user?.role === 'system_admin' ? [
          { label: "Students", href: "/admin/students", icon: <Users className="w-5 h-5" /> },
          { label: "Audit Logs", href: "/admin/audit-logs", icon: <ShieldAlert className="w-5 h-5" /> },
        ] : [])
      ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-card border-r border-border/50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 md:p-8 flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo-mark.png`} alt="Trinity Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="font-display font-bold text-lg leading-tight text-primary">Trinity</h1>
            <p className="text-xs font-medium text-accent">E-Voting System</p>
          </div>
        </div>
        
        <div className="px-6 pb-6 border-b border-border/50">
          <div className="bg-secondary rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1 font-semibold">{user?.role.replace('_', ' ')}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              location.startsWith(item.href) && item.href !== '/' 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
