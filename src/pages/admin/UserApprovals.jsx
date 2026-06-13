import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Shield, Check, X, Clock, Users, Crown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";

const ADMIN_EMAIL = "buzzory.it@gmail.com";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

export default function UserApprovals() {
  const queryClient = useQueryClient();
  const [actionDialog, setActionDialog] = useState(null); // { user, type: 'approve'|'reject' }
  const [adminMessage, setAdminMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
  
      if (error) throw error;
  
      return data || [];
    },
  });

  const pendingUsers = users.filter((u) => u.status === "pending" && u.email !== ADMIN_EMAIL);
  const processedUsers = users.filter((u) => u.status !== "pending" && u.email !== ADMIN_EMAIL);

  const handleApprove = async () => {
    setSending(true);
    const targetUser = actionDialog.user;
    const approvedRole = targetUser.role || "employee";

    // Update user
    await supabase
      .from("profiles")
      .update({
        status: "approved",
        admin_message: adminMessage || ""
      })
      .eq("id", targetUser.id);

    // Send approval email
    const customMsg = adminMessage?.trim()
      ? `<p style="color:#374151;font-size:14px;background:#fff7ed;border-left:4px solid #f97316;padding:12px;border-radius:4px;margin:16px 0;"><strong>Message from Administrator:</strong><br/>${adminMessage}</p>`
      : "";

    const emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #f97316; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Welcome to the Buzzory Family! 🎉</h1>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 28px; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px;">Hi <strong>${targetUser.full_name || targetUser.email}</strong>,</p>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
      Great news! Your access request for Buzzory CRM has been <strong style="color: #16a34a;">approved</strong>. 
      You can now log in with your credentials.
    </p>
    ${customMsg}
    <p style="color: #374151; font-size: 14px;">Your role: <strong>${approvedRole === "board_member" ? "Board Member" : "Employee"}</strong></p>
    <a href="${window.location.origin}/login" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;margin-top:16px;">Login to Buzzory CRM</a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Welcome aboard — Team Buzzory</p>
  </div>
</div>`.trim();

    // await base44.integrations.Core.SendEmail({
    //   to: targetUser.email,
    //   from_name: "Buzzory CRM",
    //   subject: "Your Buzzory CRM access has been approved!",
    //   body: emailBody,
    // });

    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    setSending(false);
    setActionDialog(null);
    setAdminMessage("");
  };

  const handleReject = async () => {
    setSending(true);
    const targetUser = actionDialog.user;

    await supabase
        .from("profiles")
        .update({
          status: "rejected",
          admin_message: adminMessage || ""
        })
        .eq("id", targetUser.id);

    if (adminMessage?.trim()) {
      const emailBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1e293b; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Buzzory CRM — Access Request Update</h1>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 28px; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px;">Hi <strong>${targetUser.full_name || targetUser.email}</strong>,</p>
    <p style="color: #374151; font-size: 14px; line-height: 1.6;">We have reviewed your access request for Buzzory CRM.</p>
    <p style="color: #374151; font-size: 14px; background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; margin: 16px 0;">
      <strong>Message from Administrator:</strong><br/>${adminMessage}
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Team Buzzory</p>
  </div>
</div>`.trim();

    //   await base44.integrations.Core.SendEmail({
    //     to: targetUser.email,
    //     from_name: "Buzzory CRM",
    //     subject: "Update on your Buzzory CRM access request",
    //     body: emailBody,
    //   });
    // }

    queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    setSending(false);
    setActionDialog(null);
    setAdminMessage("");
  };

  return (
    <div>
      <PageHeader icon={Shield} title="User Approvals" subtitle="Review and manage access requests" />

      {/* Pending */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-yellow-500" />
          <h2 className="text-sm font-semibold text-gray-700">Pending Requests ({pendingUsers.length})</h2>
        </div>
        {pendingUsers.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No pending requests</Card>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map((u) => (
              <Card key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${u.role === "board_member" ? "bg-purple-100" : "bg-blue-100"}`}>
                  {u.role === "board_member" ? <Crown className="w-4 h-4 text-purple-600" /> : <Users className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{u.full_name || "—"}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge className="text-[10px] bg-gray-100 text-gray-600 border-0">
                      {u.role === "board_member" ? "Board Member" : "Employee"}
                    </Badge>
                    <Badge className="text-[10px] bg-gray-100 text-gray-600 border-0">
                      via {u.sign_in_method === "google" ? "Google" : "Email"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white gap-1 text-xs"
                    onClick={() => { setActionDialog({ user: u, type: "approve" }); setAdminMessage(""); }}>
                    <Check className="w-3 h-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 gap-1 text-xs"
                    onClick={() => { setActionDialog({ user: u, type: "reject" }); setAdminMessage(""); }}>
                    <X className="w-3 h-3" /> Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Processed */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Check className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Processed Users ({processedUsers.length})</h2>
        </div>
        <div className="space-y-2">
          {processedUsers.map((u) => (
            <Card key={u.id} className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                {u.full_name?.[0] || u.email?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{u.full_name || u.email}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              <Badge className={`text-[10px] border-0 ${statusColors[u.status] || "bg-gray-100 text-gray-600"}`}>
                {u.status}
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Approve / Reject Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setAdminMessage(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={actionDialog?.type === "approve" ? "text-green-700" : "text-red-600"}>
              {actionDialog?.type === "approve" ? "Approve Access Request" : "Reject Access Request"}
            </DialogTitle>
          </DialogHeader>
          {actionDialog && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">{actionDialog.user.full_name || "—"}</p>
                <p className="text-gray-500 text-xs">{actionDialog.user.email}</p>
                <p className="text-gray-500 text-xs capitalize">
                  Requested: {actionDialog.user.role === "board_member" ? "Board Member" : "Employee"}
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold">
                  Message to user{" "}
                  <span className="text-gray-400 font-normal">
                    {actionDialog.type === "approve" ? "(optional — leave blank for default welcome message)" : "(optional)"}
                  </span>
                </Label>
                <Textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder={actionDialog.type === "approve"
                    ? "e.g. Welcome! Please review the onboarding guide before your first login."
                    : "e.g. Please double check your name and re-register with your correct details."}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setActionDialog(null); setAdminMessage(""); }}>
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${actionDialog.type === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white`}
                  onClick={actionDialog.type === "approve" ? handleApprove : handleReject}
                  disabled={sending}
                >
                  {sending ? "Processing..." : actionDialog.type === "approve" ? "Approve & Notify" : "Reject & Notify"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
}