import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, ArrowRight, Crown, Users, Shield, Eye, EyeOff } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";

const ADMIN_EMAIL = "buzzory.it@gmail.com";

export default function Register() {
  const [step, setStep] = useState("role"); // role | form | otp
  const [selectedRole, setSelectedRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden flex-col justify-between p-10">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 via-transparent to-transparent" />
      <div className="relative z-10">
        <div className="mb-1">
          <span className="text-2xl font-bold text-white">Buzz</span>
          <span className="text-2xl font-bold text-orange-500">ory</span>
        </div>
        <p className="text-xs text-gray-500">CRM V0.01</p>
        <div className="mt-16">
          <h1 className="text-4xl font-bold text-white leading-tight">Join the</h1>
          <h1 className="text-4xl font-bold text-orange-500 leading-tight">Buzzory Family.</h1>
          <p className="text-gray-400 mt-4 text-sm leading-relaxed max-w-sm">
            Your access will be reviewed and approved by the administrator before you can log in.
          </p>
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

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
            sign_in_method: "email"
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      const userId = data.user?.id;
      
      if (userId) {
        await supabase.from("profiles").upsert(
          {
            id: userId,
            full_name: fullName,
            email,
            role: selectedRole,
            status: email === ADMIN_EMAIL ? "approved" : "pending",
            sign_in_method: "email",
            admin_message: "",
          },
          { onConflict: "id" }
        );
      }
      
      alert(
        "Account created successfully. Please check your email and click the confirmation link."
      );
      
      window.location.href = "/pending-approval";

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

//   const handleVerify = async () => {
//     setError("");
//     setLoading(true);
//     try {
//       const result = await base44.auth.verifyOtp({ email, otpCode });
//       if (result?.access_token) {
//         base44.auth.setToken(result.access_token);
//       }

//       // Now update user profile with name + requested role + pending status
//       const user = await base44.auth.me();

//       // Update user record
//       await base44.entities.User.update(user.id, {
//         approval_status: email === ADMIN_EMAIL ? "approved" : "pending",
//         role: email === ADMIN_EMAIL ? "admin" : selectedRole,
//         requested_role: selectedRole,
//         sign_in_method: "email",
//       });

//       // Update name
//       await base44.auth.updateMe({ full_name: fullName });

//       if (email === ADMIN_EMAIL) {
//         window.location.href = "/";
//         return;
//       }

//       // Notify admin
//       const roleLabel = selectedRole === "board_member" ? "Board Member" : "Employee";
//       const emailBody = `
// <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//   <div style="background: #f97316; padding: 24px; border-radius: 8px 8px 0 0;">
//     <h1 style="color: white; margin: 0; font-size: 20px;">Buzzory CRM — New Access Request</h1>
//   </div>
//   <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
//     <p style="color: #374151; font-size: 15px;">A new user has requested access to Buzzory CRM:</p>
//     <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
//       <tr style="background: #f9fafb;">
//         <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px; border: 1px solid #e5e7eb;">Full Name</td>
//         <td style="padding: 10px 12px; color: #111827; font-size: 14px; border: 1px solid #e5e7eb;">${fullName || "Not provided"}</td>
//       </tr>
//       <tr>
//         <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px; border: 1px solid #e5e7eb;">Email</td>
//         <td style="padding: 10px 12px; color: #111827; font-size: 14px; border: 1px solid #e5e7eb;">${email}</td>
//       </tr>
//       <tr style="background: #f9fafb;">
//         <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px; border: 1px solid #e5e7eb;">Requested Role</td>
//         <td style="padding: 10px 12px; color: #111827; font-size: 14px; border: 1px solid #e5e7eb;">${roleLabel}</td>
//       </tr>
//       <tr>
//         <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px; border: 1px solid #e5e7eb;">Sign-in Method</td>
//         <td style="padding: 10px 12px; color: #111827; font-size: 14px; border: 1px solid #e5e7eb;">Email & Password</td>
//       </tr>
//     </table>
//     <p style="color: #6b7280; font-size: 13px;">Please log in to the Buzzory Admin Panel to review this request.</p>
//   </div>
// </div>`.trim();

//       // Send email and wait to see if it works, but redirect either way
//       try {
//         await base44.integrations.Core.SendEmail({
//           to: ADMIN_EMAIL,
//           from_name: "Buzzory CRM",
//           subject: `New Access Request: ${fullName || email} (${roleLabel})`,
//           body: emailBody,
//         });
//         console.log("Admin notification email sent successfully to", ADMIN_EMAIL);
//       } catch (emailErr) {
//         console.error("Failed to send admin notification email:", emailErr);
//         // Still redirect — don't block user
//       }

//       window.location.href = "/pending-approval";
//     } catch (err) {
//       setError(err.message || "Verification failed");
//     } finally {
//       setLoading(false);
//     }
//   };

const handleGoogleRegister = async () => {
  try {
  sessionStorage.setItem("requested_role", selectedRole);
  
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/oauth-callback`,
    },
  });
  
  if (error) throw error;
  
  
  } catch (err) {
  setError(err.message || "Google sign in failed");
  }
  };
  

  // OTP step
  // if (step === "otp") {
  //   return (
  //     <div className="min-h-screen flex">
  //       <LeftPanel />
  //       <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
  //         <div className="w-full max-w-md text-center">
  //           <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
  //             <Mail className="w-7 h-7 text-white" />
  //           </div>
  //           <h1 className="text-2xl font-bold text-gray-900 mb-1">Verify your email</h1>
  //           <p className="text-sm text-gray-500 mb-8">We sent a 6-digit code to <strong>{email}</strong></p>
  //           {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}
  //           <div className="flex justify-center mb-6">
  //             <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
  //               <InputOTPGroup>
  //                 <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
  //                 <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
  //               </InputOTPGroup>
  //             </InputOTP>
  //           </div>
  //           <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
  //             onClick={handleVerify} disabled={loading || otpCode.length < 6}>
  //             {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Continue"}
  //           </Button>
  //           <p className="text-center text-sm text-gray-500 mt-4">
  //             Didn't receive the code?{" "}
  //             <button onClick={() => base44.auth.resendOtp(email)} className="text-orange-500 font-medium hover:underline">Resend</button>
  //           </p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Role selection step
  if (step === "role") {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Create Account</h1>
            <p className="text-sm text-center text-gray-500 mb-8">How will you be using Buzzory CRM?</p>
            <div className="space-y-3">
              <button onClick={() => { setSelectedRole("board_member"); setStep("form"); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                  <Crown className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Board Member</p>
                  <p className="text-xs text-gray-500">Executive / leadership access</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 ml-auto" />
              </button>
              <button onClick={() => { setSelectedRole("employee"); setStep("form"); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Employee</p>
                  <p className="text-xs text-gray-500">Team member / staff access</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 ml-auto" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-8">Access is subject to administrator approval</p>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-orange-500 font-medium hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form step
  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md">
          <button onClick={() => { setStep("role"); setError(""); }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-6 transition-colors">
            ← Back to role selection
          </button>
          <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-orange-50 border border-orange-100">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === "board_member" ? "bg-purple-100" : "bg-blue-100"}`}>
              {selectedRole === "board_member" ? <Crown className="w-4 h-4 text-purple-600" /> : <Users className="w-4 h-4 text-blue-600" />}
            </div>
            <p className="text-xs font-semibold text-gray-700">Registering as: {selectedRole === "board_member" ? "Board Member" : "Employee"}</p>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Create Account</h1>
          <p className="text-sm text-center text-gray-500 mb-6">Fill in your details to request access</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}
          <Button variant="outline" className="w-full h-12 text-sm font-medium border-gray-200 hover:bg-gray-50 mb-4" onClick={handleGoogleRegister}>
            <GoogleIcon className="w-5 h-5 mr-2" />Continue with Google
          </Button>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or with email</span></div>
          </div>
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
              <Input placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="h-11 mt-1 border-gray-200 bg-gray-50/50 focus:bg-white" required />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-gray-200 bg-gray-50/50 focus:bg-white" required />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type={showPassword ? "text" : "password"} placeholder="Create a password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-11 border-gray-200 bg-gray-50/50 focus:bg-white" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Confirm Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="password" placeholder="Confirm your password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-11 border-gray-200 bg-gray-50/50 focus:bg-white" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold mt-2" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account & Request Access"}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-500 font-medium hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}