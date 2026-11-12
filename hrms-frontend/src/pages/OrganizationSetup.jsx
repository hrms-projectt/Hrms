import { useState } from "react";
import { saveOrganization } from "../services/organizationService";

function OrganizationSetup() {
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    logoUrl: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!formData.name.trim()) {
      setError("Company Name is required.");
      return;
    }

    if (!formData.contactEmail.trim()) {
      setError("Contact Email is required.");
      return;
    }

    if (!formData.logoUrl.trim()) {
      setError("Logo URL is required.");
      return;
    }

    if (!formData.address.street.trim()) {
      setError("Street Address is required.");
      return;
    }

    if (!formData.address.city.trim()) {
      setError("City is required.");
      return;
    }

    if (!formData.address.state.trim()) {
      setError("State is required.");
      return;
    }

    if (!formData.address.country.trim()) {
      setError("Country is required.");
      return;
    }

    if (!formData.address.pincode.trim()) {
      setError("Pincode is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await saveOrganization(formData);

      setMessage(
        response?.message || "Organization saved successfully."
      );

      setFormData({
        name: "",
        contactEmail: "",
        logoUrl: "",
        address: {
          street: "",
          city: "",
          state: "",
          country: "India",
          pincode: "",
        },
      });
    } catch (err) {
      setError(err.message || "Failed to save organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card organization-card">
        <h1>Organization Setup</h1>

        <p className="subtitle">
          Enter your company details
        </p>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter company name"
            />
          </div>

          <div className="form-group">
            <label>Contact Email *</label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="Enter SUPER_ADMIN email"
            />
          </div>

          <div className="form-group">
            <label>Company Logo S3 URL *</label>
            <input
              type="url"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="Paste S3 logo URL"
            />
          </div>

          <div className="form-group">
            <label>Street Address *</label>
            <input
              type="text"
              name="street"
              value={formData.address.street}
              onChange={handleAddressChange}
              placeholder="Enter street address"
            />
          </div>

          <div className="form-group">
            <label>City *</label>
            <input
              type="text"
              name="city"
              value={formData.address.city}
              onChange={handleAddressChange}
              placeholder="Enter city"
            />
          </div>

          <div className="form-group">
            <label>State *</label>
            <input
              type="text"
              name="state"
              value={formData.address.state}
              onChange={handleAddressChange}
              placeholder="Enter state"
            />
          </div>

          <div className="form-group">
            <label>Country *</label>
            <input
              type="text"
              name="country"
              value={formData.address.country}
              onChange={handleAddressChange}
              placeholder="Enter country"
            />
          </div>

          <div className="form-group">
            <label>Pincode *</label>
            <input
              type="text"
              name="pincode"
              value={formData.address.pincode}
              onChange={handleAddressChange}
              placeholder="Enter pincode"
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Organization"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrganizationSetup;