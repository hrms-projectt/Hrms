"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { Building2 } from "lucide-react";
import { createOrganization, uploadLogo } from "@/services/organizationService";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_MB = 2;

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
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [localPreview, setLocalPreview] = useState("");
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

  // free the temporary preview image
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (e.target.name === "logoUrl") setLocalPreview("");
  };

  // Choose a logo file -> upload it -> put the returned URL into logoUrl
  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLogoError("Only PNG, JPG or WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setLogoError(`Logo must be smaller than ${MAX_MB} MB.`);
      return;
    }

    setLogoError("");
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await uploadLogo(file);
      const url = res?.url || res?.logoUrl || "";
      if (!url) throw new Error("Upload worked but no logo URL was returned.");
      setFormData((prev) => ({ ...prev, logoUrl: url }));
    } catch (error) {
      setLocalPreview("");
      setLogoError(`Logo upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return alert("Please wait for the logo upload to finish.");

    try {
      setLoading(true);

      const payload = {
        name: formData.companyName.trim(),
        contactEmail: formData.contactEmail.trim(),
        logoUrl: formData.logoUrl.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          pincode: formData.pincode.trim(),
        },
      };

      const response = await createOrganization(payload);

      alert(response?.message || "Organization created successfully");

      setFormData(emptyForm);
      setLocalPreview("");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white";

  const preview = localPreview || formData.logoUrl.trim();

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

          {/* Logo upload */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Company Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-slate-900/60 text-xs text-slate-400">
                {preview ? (
                  <img
                    src={preview}
                    alt="Logo preview"
                    className="h-full w-full object-contain"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  "No logo"
                )}
              </div>
              <label
                className={`cursor-pointer rounded-lg bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/15 ${
                  uploading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {uploading ? "Uploading..." : "Choose Logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              PNG, JPG or WEBP, max {MAX_MB} MB
            </p>
            {logoError && (
              <p className="mt-1 text-xs text-red-400" role="alert">
                {logoError}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Or paste a logo URL (optional)
            </label>
            <input
              type="text"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="https://..."
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
            disabled={loading || uploading}
            className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Organization"}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
