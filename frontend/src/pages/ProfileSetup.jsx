import { useState, useEffect } from "react";
import LoadingSpinner from "../components/LoadingSpinner";

const INDUSTRIES = [
  { value: "information-technology", label: "Information Technology" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "healthcare", label: "Healthcare IT" },
  { value: "defense", label: "Defense & Aerospace" },
  { value: "construction", label: "Construction & Engineering" },
  { value: "professional-services", label: "Professional Services" },
];

const EMPTY_PROFILE = {
  id: null,
  email: "",
  company_name: "",
  industry: "",
  capabilities: [],
  keywords: [],
  tags: [],
};

export default function ProfileSetup({ backendOnline, api }) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCapability, setNewCapability] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    loadProfile();
  }, [backendOnline]);

  async function loadProfile() {
    setLoading(true);
    try {
      if (backendOnline) {
        const data = await api.users.list(0, 1);
        if (data.length > 0) {
          setProfile(data[0]);
        }
      }
    } catch {}
    setLoading(false);
  }

  function addItem(field, value) {
    if (!value.trim()) return;
    setProfile((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()],
    }));
    if (field === "keywords") setNewKeyword("");
    if (field === "capabilities") setNewCapability("");
    if (field === "tags") setNewTag("");
  }

  function removeItem(field, index) {
    setProfile((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  }

  function handleKeyDown(field, e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = field === "keywords" ? newKeyword : field === "capabilities" ? newCapability : newTag;
      addItem(field, val);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      if (backendOnline) {
        if (profile.id && !profile.id.startsWith("mock-")) {
          await api.users.update(profile.id, {
            company_name: profile.company_name,
            industry: profile.industry,
            capabilities: profile.capabilities,
            keywords: profile.keywords,
            tags: profile.tags,
          });
        } else {
          const created = await api.users.create({
            email: profile.email || "contractor@example.com",
            company_name: profile.company_name,
            industry: profile.industry,
            capabilities: profile.capabilities,
            keywords: profile.keywords,
            tags: profile.tags,
          });
          setProfile(created);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Setup</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your business profile for RFP matching
        </p>
      </div>

      <div className="card p-4 sm:p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Company Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
            <input
              className="input-field"
              placeholder="e.g. Acme Government Solutions"
              value={profile.company_name || ""}
              onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
            <select
              className="input-field"
              value={profile.industry || ""}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <input
            className="input-field"
            placeholder="e.g. contact@acme.com"
            value={profile.email || ""}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
      </div>

      <div className="card p-4 sm:p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Keywords</h2>
        <p className="text-xs text-gray-500 mb-3">
          Keywords help match your profile to relevant RFP opportunities. Add terms like "cloud migration", "FedRAMP", "cybersecurity".
        </p>

        <div className="flex gap-2 mb-3">
          <input
            className="input-field flex-1"
            placeholder="e.g. cloud migration"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => handleKeyDown("keywords", e)}
          />
          <button onClick={() => addItem("keywords", newKeyword)} className="btn-primary shrink-0">
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {profile.keywords?.length === 0 && (
            <p className="text-xs text-gray-400 italic">No keywords added yet</p>
          )}
          {(profile.keywords || []).map((kw, i) => (
            <span key={i} className="tag-blue inline-flex items-center gap-1">
              {kw}
              <button onClick={() => removeItem("keywords", i)} className="hover:text-red-600 ml-1 leading-none">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="card p-4 sm:p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Capabilities</h2>
        <p className="text-xs text-gray-500 mb-3">
          Define your core business capabilities. Add services like "Cloud Infrastructure", "Cybersecurity", "Data Analytics".
        </p>

        <div className="flex gap-2 mb-3">
          <input
            className="input-field flex-1"
            placeholder="e.g. Cloud Infrastructure"
            value={newCapability}
            onChange={(e) => setNewCapability(e.target.value)}
            onKeyDown={(e) => handleKeyDown("capabilities", e)}
          />
          <button onClick={() => addItem("capabilities", newCapability)} className="btn-primary shrink-0">
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {profile.capabilities?.length === 0 && (
            <p className="text-xs text-gray-400 italic">No capabilities added yet</p>
          )}
          {(profile.capabilities || []).map((cap, i) => (
            <span key={i} className="tag-green inline-flex items-center gap-1">
              {cap}
              <button onClick={() => removeItem("capabilities", i)} className="hover:text-red-600 ml-1 leading-none">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="card p-4 sm:p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Tags</h2>
        <p className="text-xs text-gray-500 mb-3">
          Tags for additional filtering. Add tags like "govtech", "defense", "healthcare".
        </p>

        <div className="flex gap-2 mb-3">
          <input
            className="input-field flex-1"
            placeholder="e.g. govtech"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => handleKeyDown("tags", e)}
          />
          <button onClick={() => addItem("tags", newTag)} className="btn-primary shrink-0">
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {profile.tags?.length === 0 && (
            <p className="text-xs text-gray-400 italic">No tags added yet</p>
          )}
          {(profile.tags || []).map((tag, i) => (
            <span key={i} className="tag-gray inline-flex items-center gap-1">
              {tag}
              <button onClick={() => removeItem("tags", i)} className="hover:text-red-600 ml-1 leading-none">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Profile saved successfully</span>
        )}
      </div>
    </div>
  );
}
