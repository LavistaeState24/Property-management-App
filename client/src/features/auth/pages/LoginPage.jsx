import { useState } from "react";
import { Building2, Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck, UserRound, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import { useAuth } from "../../../hooks/useAuth";
import { authService } from "../../../services/authService";
import { toast } from "../../../utils/toast";
import {
  applyServerErrors,
  emailRules,
  getErrorMessage,
  passwordRules,
  phoneRules,
  textRules,
} from "../../../utils/validation";
import Logo from "../../../assets/Logo.png";
import BgVideo from "../../../assets/Bgvideo.mp4";

const initialRegisterState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    setError: setLoginFieldError,
  } = useForm({
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    watch,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    setError: setRegisterFieldError,
  } = useForm({
    mode: "onBlur",
    defaultValues: initialRegisterState,
  });

  const destination = location.state?.from?.pathname || "/dashboard";
  const registerPassword = watch("password");

  const handleLogin = async (formValues) => {
    setLoginError("");
    try {
      await login(formValues);
      navigate(destination, { replace: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to sign in");
      applyServerErrors(requestError, setLoginFieldError, setLoginError);
    }
  };

  const handleRegister = async (formValues) => {
    setRegisterError("");
    try {
      const payload = {
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone,
        password: formValues.password,
        confirmPassword: formValues.confirmPassword,
      };

      await authService.register(payload);
      await login({ email: formValues.email, password: formValues.password });
      navigate(destination, { replace: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to create account");
      applyServerErrors(requestError, setRegisterFieldError, setRegisterError);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-page/10 px-6 py-12 text-heading">

      {/* Background Image with Dark Vignette/Overlay */}
      <div className="absolute inset-0 overflow-hidden">
  <video
    src={BgVideo}
    autoPlay
    loop
    muted
    playsInline
    className="h-full w-full object-cover"
  />
  <div className="absolute inset-0 bg-slate-950/30" />
</div>

      {/* Main Container - Centered Vertically & Horizontally */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-12 items-center">

        {/* Left Side: Brand Identity */}
        <div className="hidden lg:block lg:col-span-6 space-y-4">

        </div>

        {/* Right Side: Centered Form Card */}
        <section className="max-w-md lg:col-span-8 lg:col-start-10 md:col-end-10 rounded-[20px] border border-gold  bg-heading/10 p-6 backdrop-blur-sm">

          <img src={Logo} alt="Logo" className="mx-auto mb-4 h-16 w-auto p-2 rounded-lg" />
          <h1 className="mb-6 text-center text-white  text-lg font-semibold">
            {mode === "login" ? "Login with your account" : "Create an Account"}
          </h1>

          <div className="mb-6 flex gap-3">
            <Button
              variant={mode === "login" ? "primary" : "secondary"}
              onClick={() => setMode("login")}
              className="flex-1"
            >
              Login
            </Button>

            <Button
              variant={mode === "register" ? "primary" : "secondary"}
              onClick={() => setMode("register")}
              target="_blank"
              className="flex-1"
            >
              Register
            </Button>
          </div>

          {mode === "login" ? (
            <form
              className="space-y-4"
              onSubmit={handleLoginSubmit(handleLogin)}
            >
              <FormInput
                label="Email"
                type="email"
                icon={Mail}
                placeholder="Enter your email"
                error={getErrorMessage(loginErrors.email)}
                {...registerLogin("email", emailRules())}
              />

              <FormInput
                label="Password"
                type={showLoginPassword ? "text" : "password"}
                icon={KeyRound}
                placeholder="Enter your password"
                error={getErrorMessage(loginErrors.password)}
                rightElement={
                  <button
                    type="button"
                    className="text-body transition hover:text-heading"
                    onClick={() =>
                      setShowLoginPassword((prev) => !prev)
                    }
                    aria-label={
                      showLoginPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                {...registerLogin("password", passwordRules())}
              />

              {loginError ? (
                <p className="text-sm text-rose-600">
                  {loginError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 mt-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface font-medium cursor-pointer hover:text-primary transition" title="We are working on this feature. It will be available soon.">
                    Forgot your password?
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={isLoginSubmitting}
                icon={ShieldCheck}
              >
                {isLoginSubmitting
                  ? "Loading..."
                  : "Log in"}
              </Button>
            </form>
          ) : (
            <div className="mb-4">
              <form
                className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1"
                onSubmit={handleRegisterSubmit(handleRegister)}
              >
                <FormInput
                  label="Full Name"
                  icon={UserRound}
                  placeholder="Enter your full name"
                  error={getErrorMessage(registerErrors.name)}
                  {...registerRegister(
                    "name",
                    textRules("Name", {
                      min: 3,
                      max: 60,
                    }),
                  )}
                />

                <FormInput
                  label="Email"
                  type="email"
                  icon={Mail}
                  placeholder="Enter your email"
                  error={getErrorMessage(registerErrors.email)}
                  {...registerRegister("email", emailRules())}
                />

                <FormInput
                  label="Phone"
                  type="tel"
                  icon={Phone}
                  placeholder="Enter your number"
                  error={getErrorMessage(registerErrors.phone)}
                  {...registerRegister("phone", phoneRules())}
                />

                <FormInput
                  label="Password"
                  type={showRegisterPassword ? "text" : "password"}
                  icon={KeyRound}
                  placeholder="Create a strong password"
                  error={getErrorMessage(registerErrors.password)}
                  rightElement={
                    <button
                      type="button"
                      className="text-body transition hover:text-heading"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      aria-label={
                        showRegisterPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  {...registerRegister("password", passwordRules())}
                />

                <FormInput
                  label="Confirm Password"
                  type={showRegisterPassword ? "text" : "password"}
                  icon={KeyRound}
                  placeholder="Re-enter your password"
                  error={getErrorMessage(registerErrors.confirmPassword)}
                  {...registerRegister("confirmPassword", {
                    required: "Confirm password is required",
                    validate: (value) =>
                      value === registerPassword ||
                      "Passwords do not match",
                  })}
                />
                {registerError ? (
                  <p className="lg:col-span-2 text-sm text-rose-600">
                    {registerError}
                  </p>
                ) : null}

                {/* Full width button */}
                <div className="lg:col-span-2">
                  <Button
                    className="w-full"
                    disabled={isRegisterSubmitting}
                    icon={Users}
                  >
                    {isRegisterSubmitting ? "Creating..." : "Create account"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}