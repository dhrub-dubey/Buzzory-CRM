import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "buzzory.it@gmail.com";

export default function OAuthCallback() {
  useEffect(() => {
    const run = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          window.location.href = "/login";
          return;
        }

        const requestedRole =
          sessionStorage.getItem("requested_role") || "employee";
        sessionStorage.removeItem("requested_role");

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error(error);
          window.location.href = "/login";
          return;
        }

        const profilePayload = {
          id: session.user.id,
          email: session.user.email,
          full_name:
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.email,
          role: profile?.role || requestedRole,
          sign_in_method: "google",
          status:
            profile?.status ||
            (session.user.email === ADMIN_EMAIL ? "approved" : "pending"),
          admin_message: profile?.admin_message || "",
        };

        //await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });

        const { data, error: upsertError } = await supabase
            .from("profiles")
            .upsert(profilePayload, {
              onConflict: "id",
            });

          console.log(data);

          if (upsertError) {
            console.error("UPSERT ERROR:", upsertError);
          }

        const currentStatus = profile?.status || profilePayload.status;

        if (currentStatus === "approved") {
          window.location.href = "/";
          return;
        }

        window.location.href = "/pending-approval";
      } catch (err) {
        console.error(err);
        window.location.href = "/login";
      }
    };

    run();
  }, []);

return ( <div className="min-h-screen flex items-center justify-center bg-[#0f172a]"> <div className="text-center"> <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" /> <p className="text-white text-sm">
Setting up your account... </p> </div> </div>
);
}
