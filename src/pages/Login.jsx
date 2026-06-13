import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, Shield, Users, Crown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import GoogleIcon from "@/components/GoogleIcon";

const ADMIN_EMAIL = "buzzory.it@gmail.com";

export default function Login() {
  const [step, setStep] = useState("role");
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep("login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile load error:", profileError);
        navigate("/pending-approval", { replace: true });
        return;
      }

      if (!profile || profile.status !== "approved") {
        navigate("/pending-approval", { replace: true });
        return;
      }

      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!selectedRole) {
      setError("Please select a role before signing in with Google.");
      return;
    }
  
    sessionStorage.setItem("requested_role", selectedRole);
    sessionStorage.setItem("sign_in_method", "google");
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/oauth-callback`,
      },
    });
  
    if (error) {
      setError(error.message);
    }
  };

  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden flex-col justify-between p-10">
      <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-orange-400/40" />
      <div className="absolute top-40 right-32 w-2 h-2 rounded-full bg-orange-400/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent" />
      <div className="relative z-10">
        <div className="mb-1">
          <span className="text-2xl font-bold text-white">Buzz</span>
          <span className="text-2xl font-bold text-orange-500">ory</span>
        </div>
        <p className="text-xs text-gray-500">CRM V0.01</p>
        <div className="mt-16">
          <h1 className="text-4xl font-bold text-white leading-tight">Influencer Marketing,</h1>
          <h1 className="text-4xl font-bold text-orange-500 leading-tight">Simplified.</h1>
          <p className="text-gray-400 mt-4 text-sm leading-relaxed max-w-sm">
            Manage campaigns, influencers, finances and invoices seamlessly in one place.
          </p>
        </div>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center my-8">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-2xl">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="w-6 h-6 rounded bg-orange-500/20 mb-2" />
              <div className="h-2 bg-white/20 rounded w-16 mb-1" />
              <div className="h-3 bg-white/30 rounded w-10" />
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="w-6 h-6 rounded bg-blue-500/20 mb-2" />
              <div className="h-2 bg-white/20 rounded w-16 mb-1" />
              <div className="h-3 bg-white/30 rounded w-10" />
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 mb-3">
            <div className="flex gap-1 items-end h-16">
              {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-orange-500/40 to-orange-500/10 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Secure. Reliable. Built for Agencies.</p>
          <p className="text-xs text-gray-500">Your data is safe with us.</p>
        </div>
      </div>
    </div>
  );

  if (step === "role") {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Welcome to Buzzory</h1>
            <p className="text-sm text-center text-gray-500 mb-8">Please select how you are signing in</p>

            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect("board_member")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                  <Crown className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Board Member</p>
                  <p className="text-xs text-gray-500">Executive / leadership access</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 ml-auto transition-colors" />
              </button>

              <button
                onClick={() => handleRoleSelect("employee")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Employee</p>
                  <p className="text-xs text-gray-500">Team member / staff access</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 ml-auto transition-colors" />
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-8">
              Access is subject to administrator approval
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md">
          <button
            onClick={() => { setStep("role"); setError(""); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-6 transition-colors"
          >
            ← Back to role selection
          </button>

          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-orange-50 border border-orange-100">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === 'board_member' ? 'bg-purple-100' : 'bg-blue-100'}`}>
              {selectedRole === 'board_member' ? <Crown className="w-4 h-4 text-purple-600" /> : <Users className="w-4 h-4 text-blue-600" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Signing in as: {selectedRole === 'board_member' ? 'Board Member' : 'Employee'}</p>
              <p className="text-[10px] text-gray-400">Your request will be reviewed by the administrator</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Welcome Back!</h1>
          <p className="text-sm text-center text-gray-500 mb-6">Login to your Buzzory CRM account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" autoComplete="email" autoFocus placeholder="Enter your email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-200 bg-gray-50/50 focus:bg-white" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                  placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 bg-gray-50/50 focus:bg-white" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">Remember me</label>
              </div>
              <Link to="/forgot-password" className="text-sm text-orange-500 hover:text-orange-600 font-medium">Forgot Password?</Link>
            </div>
            <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/20" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging in...</> : <>Login <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or continue with</span></div>
          </div>

          <Button variant="outline" className="w-full h-12 text-sm font-medium border-gray-200 hover:bg-gray-50" onClick={handleGoogle}>
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <Link to="/register" className="text-orange-500 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
