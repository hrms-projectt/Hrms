         
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { Building2 } from "lucide-react";
import { createOrganization } from "@/services/organizationService";

const emptyForm = {
  companyName: "",
  contactEmail: "",
  logoUrl: "",
  street: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
};

export default function OrganizationPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        name: formData.companyName,
        contactEmail: formData.contactEmail,
        logoUrl: formData.logoUrl,
        address: [
          formData.street,
          formData.city,
          formData.state,
          formData.country,
          formData.pincode,
        ]
          .filter(Boolean)
          .join(", "),
      };

      const response = await createOrganization(payload);

      alert(response.message || "Organization created successfully");

      setFormData(emptyForm);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white";

  if (!allowed) return null;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Organization Setup
        </h1>

        <p className="mt-3 text-sm text-slate-400">
          Configure your company profile.
        </p>
      </div>

      <div className="max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full border-2 border-[#2a8fd0] p-2">
            <Building2 size={24} className="text-sky-400" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Company Information
            </h2>
            <p className="text-sm text-slate-400">
              Enter organization details.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="ABC Company"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Super Admin Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              placeholder="admin@company.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Logo URL
            </label>
            <input
              type="text"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="Paste S3 Logo URL Here"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Street"
              className={inputClass}
            />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className={inputClass}
            />
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              className={inputClass}
            />
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              className={inputClass}
            />
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Pincode"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Organization"}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}