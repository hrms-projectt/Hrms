"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { UserPlus, Check } from "lucide-react";
import { getRoles, createUser } from "@/services/userService";

const emptyForm = { name: "", email: "", role: "" };

export default function AddUserPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
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

      // TODO: confirm field names with Naresh (role id or role name?)
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };

      const response = await createUser(payload);
      setSuccess(response.message || "User created successfully");
      setFormData(emptyForm);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-sky-500";

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
            <p className="text-sm text-slate-400">Enter the new user's information.</p>
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