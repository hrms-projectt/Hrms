"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { UserPlus, Check, Eye, EyeOff } from "lucide-react";
import { getRoles, createUser } from "@/services/userService";

const emptyForm = { name: "", email: "", password: "", role: "" };

// 0-4 score for the password strength bar
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const STRENGTH = [
  { label: "Too short", text: "text-slate-500", bar: "bg-slate-600" },
  { label: "Weak", text: "text-red-400", bar: "bg-red-400" },
  { label: "Fair", text: "text-orange-400", bar: "bg-orange-400" },
  { label: "Good", text: "text-yellow-400", bar: "bg-yellow-400" },
  { label: "Strong", text: "text-green-400", bar: "bg-green-400" },
];

export default function AddUserPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Only SUPER_ADMIN can open this page
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role === "SUPER_ADMIN") {
        setAllowed(true);
      } else {
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Load roles for the dropdown
  useEffect(() => {
    if (!allowed) return;
    getRoles()
      .then((data) => setRoles(data))
      .catch((err) => setError(err.message || "Could not load roles"))
      .finally(() => setRolesLoading(false));
  }, [allowed]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await createUser({
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        roleId: Number(formData.role),
      });
      setSuccess(response.message || "User created successfully");
      setFormData(emptyForm);
      setShowPassword(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-sky-500";

  const strength = getStrength(formData.password);
  const selectedRole = roles.find((r) => String(r.id) === String(formData.role));

  if (!allowed) return null;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Add New User
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Create a system user such as an HR Admin or Manager.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full border-2 border-[#2a8fd0] p-2">
            <UserPlus size={24} className="text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">User Details</h2>
            <p className="text-sm text-slate-400">Enter the new user&apos;s information.</p>
          </div>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
              <Check size={14} strokeWidth={3} />
            </span>
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Priya Singh"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="priya@company.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* strength bar */}
            {formData.password && (
              <div className="mt-3">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        i <= strength ? STRENGTH[strength].bar : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className={`mt-1.5 text-xs ${STRENGTH[strength].text}`}>
                  {STRENGTH[strength].label}
                  {strength < 3 && " - use 8+ characters, upper and lower case, a number and a symbol"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={rolesLoading}
              className={inputClass}
            >
              <option value="">
                {rolesLoading ? "Loading roles..." : "Select a role"}
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900">
                  {r.name.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* live summary before submitting */}
          {formData.name && formData.email && selectedRole && (
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
              You are about to create{" "}
              <span className="font-medium text-slate-100">{formData.name}</span>{" "}
              ({formData.email}) as{" "}
              <span className="font-medium text-sky-400">
                {selectedRole.name.replace("_", " ")}
              </span>
              .
            </div>
          )}

          <button
            type="submit"
            disabled={loading || rolesLoading}
            className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
