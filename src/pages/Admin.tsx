import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Trash2, KeyRound, RefreshCw, AlertTriangle, Mail } from "lucide-react";
import { toast } from "sonner";
import { releaseNotes } from "@/data/releaseNotes";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

const Admin = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-users", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: null,
      });
      if (res.error) throw res.error;
      setUsers(res.data.users || []);
    } catch (err: any) {
      toast.error("Failed to load users: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-users?action=delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { user_id: userId },
      });
      if (res.error) throw res.error;
      toast.success("User deleted");
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err: any) {
      toast.error("Delete failed: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (email: string, userId: string) => {
    setActionLoading(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-users?action=reset-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { email },
      });
      if (res.error) throw res.error;
      toast.success("Password reset email sent to " + email);
    } catch (err: any) {
      toast.error("Reset failed: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-foreground" />
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-foreground">
            User Management
          </h1>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground border border-vanta-border hover:border-foreground/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <p className="font-mono text-[11px] text-vanta-text-low tracking-wide">
        {users.length} registered {users.length === 1 ? "user" : "users"}
      </p>

      {/* User list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-vanta-bg-elevated/50 animate-pulse border border-vanta-border" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="font-mono text-[12px] text-vanta-text-muted py-10 text-center">
          No users found.
        </p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="border border-vanta-border bg-background/60 backdrop-blur-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 transition-colors hover:border-foreground/20"
            >
              {/* User info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-mono text-[13px] text-foreground truncate">
                  {user.email}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted">
                    Joined {formatDate(user.created_at)}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-vanta-text-muted">
                    Last login {formatDate(user.last_sign_in_at)}
                  </span>
                </div>
                {!user.email_confirmed_at && (
                  <span className="inline-block font-mono text-[9px] uppercase tracking-[0.15em] text-amber-500">
                    Unconfirmed
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {deleteConfirm === user.id ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Confirm?
                    </span>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={actionLoading === user.id}
                      className="px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === user.id ? "..." : "Delete"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-vanta-text-low hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleResetPassword(user.email!, user.id)}
                      disabled={actionLoading === user.id}
                      title="Send password reset email"
                      className="flex items-center gap-1 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-vanta-text-low hover:text-foreground border border-vanta-border hover:border-foreground/30 transition-colors disabled:opacity-50"
                    >
                      <KeyRound className="h-3 w-3" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      disabled={actionLoading === user.id}
                      title="Delete user"
                      className="flex items-center gap-1 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-vanta-text-low hover:text-destructive border border-vanta-border hover:border-destructive/50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
