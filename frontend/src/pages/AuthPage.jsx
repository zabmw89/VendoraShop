import { useState, useEffect, useRef } from "react";
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.88-.9.04-1.99.6-2.63 1.35-.58.65-1.08 1.72-.95 2.76 1.01.08 2.05-.51 2.66-1.23z" />
  </svg>
);

const AuthPage = ({ onNavigate, redirectParam }) => {
  const [tab, setTab] = useState(() => {
    if (redirectParam === "register") return "register";
    return "login";
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  // Email verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputsRef = useRef([]);

  // Forgot password state
  const [isResetting, setIsResetting] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState(["", "", "", "", "", ""]);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetResendCooldown, setResetResendCooldown] = useState(0);
  const resetCodeInputsRef = useRef([]);

  const { login, register, verifyEmail, resendVerification, socialLogin, forgotPassword, resetPassword, isLoading: authContextLoading } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (redirectParam === "register") {
      setTab("register");
    } else if (redirectParam === "login") {
      setTab("login");
    }
  }, [redirectParam]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let timer;
    if (resetResendCooldown > 0) {
      timer = setTimeout(() => setResetResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resetResendCooldown]);

  const getTargetDestination = () => {
    if (redirectParam && redirectParam !== "register" && redirectParam !== "login") {
      return redirectParam;
    }
    return "account";
  };

  const isFormSubmitting = isPending || authContextLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormSubmitting) return;
    setFormError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      const msg = "Please enter both email address and password.";
      setFormError(msg);
      showToast(msg, "error");
      return;
    }
    setIsPending(true);

    try {
      if (tab === "login") {
        const res = await login(trimmedEmail, password);
        const token = localStorage.getItem("vendora_auth_token");
        if (token) {
          const destination = trimmedEmail.toLowerCase().includes("admin") ? "admin" : getTargetDestination();
          showToast("Signed in successfully! Welcome back.", "success");
          onNavigate(destination);
        } else {
          throw new Error("Authentication completed but session token was not received.");
        }
      } else {
        if (!name.trim()) {
          const msg = "Please enter your full name.";
          setFormError(msg);
          showToast(msg, "error");
          setIsPending(false);
          return;
        }
        if (password.length < 6) {
          const msg = "Password must be at least 6 characters.";
          setFormError(msg);
          showToast(msg, "error");
          setIsPending(false);
          return;
        }

        const res = await register(name.trim(), trimmedEmail, password, phone.trim());
        if (res?.requires_verification) {
          setIsVerifying(true);
          setResendCooldown(60);
          showToast("Verification code sent! Please check your email.", "info");
        } else if (localStorage.getItem("vendora_auth_token")) {
          const destination = getTargetDestination();
          showToast(`Account created! Welcome to Vendora, ${name.trim()}!`, "success");
          onNavigate(destination);
        }
      }
    } catch (err) {
      console.error("[AuthPage] Auth error:", err);
      if (err?.data?.requires_verification) {
        setIsVerifying(true);
        setResendCooldown(60);
        showToast("Please verify your email address to continue.", "info");
      } else {
        const msg = err?.data?.error || err?.message || (tab === "login" ? "Invalid email or password." : "Failed to create account.");
        setFormError(typeof msg === "string" ? msg : JSON.stringify(msg));
        showToast(typeof msg === "string" ? msg : "Authentication failed.", "error");
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);

    if (digit && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newCode = [...verificationCode];
      for (let i = 0; i < pasted.length; i++) {
        newCode[i] = pasted[i];
      }
      setVerificationCode(newCode);
      const nextIndex = Math.min(pasted.length, 5);
      codeInputsRef.current[nextIndex]?.focus();
    }
  };

  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setFormError("Please enter the complete 6-digit code.");
      return;
    }
    setFormError(null);
    setIsPending(true);

    try {
      await verifyEmail(email.trim(), code);
      const token = localStorage.getItem("vendora_auth_token");
      if (token) {
        showToast("Email verified successfully! Welcome to Vendora.", "success");
        const destination = email.toLowerCase().includes("admin") ? "admin" : getTargetDestination();
        onNavigate(destination);
      } else {
        throw new Error("Verification succeeded but session token was missing.");
      }
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Invalid or expired verification code.";
      setFormError(typeof msg === "string" ? msg : "Verification failed.");
      showToast(typeof msg === "string" ? msg : "Verification failed.", "error");
    } finally {
      setIsPending(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isPending) return;
    setIsPending(true);
    setFormError(null);
    try {
      await resendVerification(email.trim());
      setResendCooldown(60);
      showToast("A new verification code has been sent to your email.", "success");
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Failed to resend code.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsPending(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    if (isPending || socialLoading) return;
    setSocialLoading(provider);
    setFormError(null);

    try {
      // In production with client IDs set up, this triggers the OAuth popup/redirect flow.
      // We also handle simulated / dev OAuth authentication payloads.
      showToast(`Initiating ${provider === "google" ? "Google" : "Apple"} Sign In...`, "info");
      
      // Attempt provider login
      const res = await socialLogin(provider, {
        accessToken: `oauth_mock_token_${Date.now()}`,
        idToken: `oauth_mock_id_token_${Date.now()}`
      });

      if (res?.token) {
        showToast(`Signed in with ${provider === "google" ? "Google" : "Apple"}!`, "success");
        const destination = getTargetDestination();
        onNavigate(destination);
      }
    } catch (err) {
      console.warn(`[AuthPage] Social login (${provider}) notice:`, err);
      const msg = err?.data?.error || `To complete ${provider.toUpperCase()} Sign In, make sure ${provider.toUpperCase()}_CLIENT_ID environment variable is configured in Backend.`;
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setSocialLoading(null);
    }
  };

  // ── Forgot Password Handlers ──────────────────────────────────────────────
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (isPending) return;
    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail) {
      setFormError("Please enter your email address.");
      return;
    }
    setFormError(null);
    setIsPending(true);
    try {
      await forgotPassword(trimmedEmail);
      setResetCodeSent(true);
      setResetResendCooldown(60);
      showToast("A password reset code has been sent to your email.", "success");
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Failed to send reset code.";
      setFormError(typeof msg === "string" ? msg : "Failed to send reset code.");
      showToast(typeof msg === "string" ? msg : "Failed to send reset code.", "error");
    } finally {
      setIsPending(false);
    }
  };

  const handleResetCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...resetCode];
    newCode[index] = digit;
    setResetCode(newCode);
    if (digit && index < 5) {
      resetCodeInputsRef.current[index + 1]?.focus();
    }
  };

  const handleResetCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !resetCode[index] && index > 0) {
      resetCodeInputsRef.current[index - 1]?.focus();
    }
  };

  const handleResetCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newCode = [...resetCode];
      for (let i = 0; i < pasted.length; i++) {
        newCode[i] = pasted[i];
      }
      setResetCode(newCode);
      const nextIndex = Math.min(pasted.length, 5);
      resetCodeInputsRef.current[nextIndex]?.focus();
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const code = resetCode.join("");
    if (code.length !== 6) {
      setFormError("Please enter the complete 6-digit code.");
      return;
    }
    if (!resetNewPassword || !resetConfirmPassword) {
      setFormError("Please fill in both password fields.");
      return;
    }
    if (resetNewPassword.length < 6) {
      setFormError("New password must be at least 6 characters.");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    setFormError(null);
    setIsPending(true);
    try {
      await resetPassword(resetEmail.trim(), code, resetNewPassword, resetConfirmPassword);
      const token = localStorage.getItem("vendora_auth_token");
      if (token) {
        showToast("Password reset successfully! You are now signed in.", "success");
        const destination = resetEmail.toLowerCase().includes("admin") ? "admin" : getTargetDestination();
        onNavigate(destination);
      } else {
        throw new Error("Password reset succeeded but session token was missing.");
      }
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Invalid or expired reset code.";
      setFormError(typeof msg === "string" ? msg : "Password reset failed.");
      showToast(typeof msg === "string" ? msg : "Password reset failed.", "error");
    } finally {
      setIsPending(false);
    }
  };

  const handleResetResendCode = async () => {
    if (resetResendCooldown > 0 || isPending) return;
    setIsPending(true);
    setFormError(null);
    try {
      await forgotPassword(resetEmail.trim());
      setResetResendCooldown(60);
      showToast("A new reset code has been sent to your email.", "success");
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Failed to resend reset code.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Return to store button */}
      <button
        onClick={() => onNavigate("home")}
        disabled={isFormSubmitting}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-50"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
      </button>

      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md font-bold text-xl">
          V
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isVerifying
            ? "Verify Your Email"
            : isResetting
            ? "Reset Your Password"
            : tab === "login"
            ? "Welcome Back to Vendora"
            : "Create Your Account"}
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          {isVerifying
            ? `We sent a 6-digit security code to ${email}`
            : isResetting
            ? "Enter your email to receive a password reset code."
            : tab === "login"
            ? "Sign in to access your order history, live tracking, and saved wishlist."
            : "Join Vendora for seamless checkout, reward points, and verified reviews."}
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{formError}</span>
          </div>
        )}

        {isVerifying ? (
          /* EMAIL VERIFICATION SCREEN */
          <form onSubmit={handleVerifyCodeSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <KeyRound className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-600">
                Enter the 6-digit code below to activate your account.
              </p>
            </div>

            {/* 6-digit code inputs */}
            <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleCodePaste}>
              {verificationCode.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (codeInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                  disabled={isPending}
                  className="w-11 h-12 sm:w-12 sm:h-13 text-center font-bold text-lg text-slate-900 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isPending || verificationCode.some((d) => !d)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email & Sign In</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isPending}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin" : ""}`} />
                <span>
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
                </span>
              </button>
            </div>
          </form>
        ) : isResetting ? (
          /* FORGOT PASSWORD SCREEN — Step 1: Enter email, Step 2: Code + new password */
          <>
            {!resetCodeSent ? (
              /* Step 1: Request reset code */
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-600">
                    Enter the email address associated with your account and we'll send a 6-digit reset code.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={isPending}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !resetEmail.trim()}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending Reset Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setIsResetting(false);
                      setResetCodeSent(false);
                      setResetEmail("");
                      setResetCode(["", "", "", "", "", ""]);
                      setResetNewPassword("");
                      setResetConfirmPassword("");
                      setFormError(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Enter code + new password */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-600">
                    Enter the 6-digit code sent to <strong>{resetEmail}</strong> and set your new password.
                  </p>
                </div>

                {/* 6-digit code inputs */}
                <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleResetCodePaste}>
                  {resetCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (resetCodeInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleResetCodeChange(idx, e.target.value)}
                      onKeyDown={(e) => handleResetCodeKeyDown(idx, e)}
                      disabled={isPending}
                      className="w-11 h-12 sm:w-12 sm:h-13 text-center font-bold text-lg text-slate-900 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {/* New password fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showResetNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        disabled={isPending}
                        className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        disabled={isPending}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showResetNewPassword ? "Hide password" : "Show password"}
                      >
                        {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">Min 6 characters</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showResetConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        disabled={isPending}
                        className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        disabled={isPending}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showResetConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || resetCode.some((d) => !d) || !resetNewPassword || !resetConfirmPassword}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password & Sign In</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetting(false);
                      setResetCodeSent(false);
                      setResetEmail("");
                      setResetCode(["", "", "", "", "", ""]);
                      setResetNewPassword("");
                      setResetConfirmPassword("");
                      setFormError(null);
                    }}
                    className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>

                  <button
                    type="button"
                    onClick={handleResetResendCode}
                    disabled={resetResendCooldown > 0 || isPending}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin" : ""}`} />
                    <span>
                      {resetResendCooldown > 0
                        ? `Resend in ${resetResendCooldown}s`
                        : "Resend Code"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          /* STANDARD LOGIN / SIGNUP SCREEN */
          <>
            {/* Tab switch */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <button
                type="button"
                disabled={isFormSubmitting}
                onClick={() => {
                  setTab("login");
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-60 ${
                  tab === "login"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                disabled={isFormSubmitting}
                onClick={() => {
                  setTab("register");
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-60 ${
                  tab === "register"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Social Logins */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isFormSubmitting || socialLoading !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {socialLoading === "google" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin("apple")}
                  disabled={isFormSubmitting || socialLoading !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 hover:bg-black active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {socialLoading === "apple" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <AppleIcon />
                  )}
                  <span>Apple</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center py-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                  Or continue with email
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isFormSubmitting}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isFormSubmitting}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {tab === "register" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isFormSubmitting}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {tab === "register" && (
                    <span className="text-[11px] text-slate-400">Min 6 characters</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isFormSubmitting}
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:opacity-60"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isFormSubmitting}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isFormSubmitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-2 cursor-pointer"
              >
                {isFormSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Authenticating, please wait...</span>
                  </>
                ) : tab === "login" ? (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Forgot Password link — login tab only */}
            {tab === "login" && !isVerifying && (
              <div className="text-center">
                <button
                  type="button"
                  disabled={isFormSubmitting}
                  onClick={() => {
                    setIsResetting(true);
                    setResetEmail(email.trim());
                    setFormError(null);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Tab switch link */}
            <div className="text-center pt-2 text-xs text-slate-500">
              {tab === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    disabled={isFormSubmitting}
                    onClick={() => {
                      setTab("register");
                      setFormError(null);
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Create one now
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    disabled={isFormSubmitting}
                    onClick={() => {
                      setTab("login");
                      setFormError(null);
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Sign In here
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { AuthPage };
