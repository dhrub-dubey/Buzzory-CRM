import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function PendingApproval() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          navigate("/login", { replace: true });
          return;
        }

        const { data: profileById, error: idError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        let profile = profileById;

        if (!profile && session.user.email) {
          const { data: profileByEmail, error: emailError } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", session.user.email)
            .maybeSingle();

          if (!emailError) {
            profile = profileByEmail;
          }
        }

        if (!profile) {
          console.error("Error loading profile:", idError);
          setUser({
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.fullName ||
              session.user.email,
            email: session.user.email,
            role: null,
            status: "pending",
            admin_message: "",
          });
          return;
        }

        if (profile.status === "approved") {
          navigate("/", { replace: true });
          return;
        }

        setUser(profile);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-200">Checking approval status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-white">Buzz</span>
          <span className="text-3xl font-bold text-orange-500">ory</span>
          <p className="text-xs text-gray-500 mt-1">CRM V0.01</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h1>

          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your request has been added to the queue. Please wait until the
            administrator reviews and approves your access.
          </p>

          {user && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Registered as</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || "—"}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              {user.role && (
                <div className="pt-1 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Requested role</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {user.role === "board_member" ? "Board Member" : "Employee"}
                  </p>
                </div>
              )}
            </div>
          )}

          {user?.admin_message && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-orange-700 mb-1">
                Message from Administrator:
              </p>
              <p className="text-sm text-orange-800">{user.admin_message}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-5">
            You will receive an email notification once your access has been
            reviewed.
          </p>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full gap-2 text-gray-600"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
