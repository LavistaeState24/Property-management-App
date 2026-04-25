import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/common/FormInput";
import SelectDropdown from "../../../components/common/SelectDropdown";
import { roles } from "../../../constants/theme";
import { useAuth } from "../../../hooks/useAuth";
import { authService } from "../../../services/authService";

const initialRegisterState = {
  name: "",
  email: "",
  password: "",
  role: "sales",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(loginForm);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await authService.register(registerForm);
      await login({ email: registerForm.email, password: registerForm.password });
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to register");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink bg-glow px-6 py-12 text-ivory">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-glass backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.4em] text-gold">Luxury Inventory Desk</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-tight text-ivory">
            The premium control system for real estate inventory, leads, and curated client sharing.
          </h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              "Inventory intelligence",
              "Role-based operations",
              "Client-safe sharing",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-muted">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex gap-3">
            <Button variant={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")}>
              Login
            </Button>
            <Button variant={mode === "register" ? "primary" : "secondary"} onClick={() => setMode("register")}>
              Register
            </Button>
          </div>

          {mode === "login" ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <FormInput
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <FormInput
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              />
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <Button className="w-full" disabled={submitting}>
                {submitting ? "Authenticating..." : "Enter CRM"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              <FormInput
                label="Full Name"
                value={registerForm.name}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <FormInput
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <FormInput
                label="Password"
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
              />
              <SelectDropdown
                label="Role"
                options={roles}
                value={registerForm.role}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, role: event.target.value }))}
              />
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
              <Button className="w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Create account"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

