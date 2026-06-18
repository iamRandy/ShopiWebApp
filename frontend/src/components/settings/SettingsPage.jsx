import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";
import { authenticatedFetch, clearAuthStorage } from "../../utils/api";
import { applyAccessToken, syncProfileToStorage } from "../../utils/userProfile";
import { clearExtensionStorage } from "../../utils/extension";
import AveeLoader from "../AveeLoader";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
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
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GoogleRelinkButton({ onSuccess, onError, disabled }) {
  return (
    <div
      className={`group relative inline-block ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <div
        className="pointer-events-none flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2.5 text-sm font-bold text-black shadow-[2px_2px_0_#000] transition-transform group-hover:-translate-y-0.5"
        aria-hidden
      >
        <GoogleIcon />
        Update Google account
      </div>
      <div className="absolute inset-0 overflow-hidden opacity-[0.01]">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="outline"
          size="medium"
          text="continue_with"
          shape="rectangular"
          width="220"
        />
      </div>
    </div>
  );
}

function SettingsField({ id, label, value, onChange, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-stone-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border-2 border-stone-300 bg-white px-3 py-2.5 text-sm text-black outline-none transition-colors focus:border-black"
      />
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [initialProfile, setInitialProfile] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authenticatedFetch(`${API_URL}/api/account`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load account");
      }
      const data = await response.json();
      setUsername(data.username || "");
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setEmail(data.email || "");
      setInitialProfile(data);
      syncProfileToStorage(data);
    } catch (err) {
      setError(err.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const profileDirty =
    initialProfile &&
    (username !== (initialProfile.username || "") ||
      firstName !== (initialProfile.firstName || "") ||
      lastName !== (initialProfile.lastName || ""));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileDirty || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await authenticatedFetch(`${API_URL}/api/account`, {
        method: "PATCH",
        body: JSON.stringify({ username, firstName, lastName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      applyAccessToken(data.accessToken);
      syncProfileToStorage(data);
      setInitialProfile(data);
      setSuccess("Profile saved.");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleRelink = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;

    setLinkingGoogle(true);
    setError("");
    setSuccess("");
    try {
      const response = await authenticatedFetch(`${API_URL}/api/account/link-google`, {
        method: "POST",
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update Google account");
      }

      applyAccessToken(data.accessToken);
      syncProfileToStorage(data);
      setEmail(data.email || "");
      setInitialProfile((prev) => (prev ? { ...prev, email: data.email } : prev));
      setSuccess("Google account updated.");
    } catch (err) {
      setError(err.message || "Failed to update Google account");
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE" || deleting) return;

    setDeleting(true);
    setError("");
    try {
      const response = await authenticatedFetch(`${API_URL}/api/account`, {
        method: "DELETE",
        body: JSON.stringify({ confirmation: deleteConfirm }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      await clearExtensionStorage();
      clearAuthStorage();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  if (loading) {
    return <AveeLoader message="Loading settings…" />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/home"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition-colors hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight text-black">Settings</h1>
      <p className="mt-1 text-sm text-stone-500">Manage your profile and account.</p>

      {(error || success) && (
        <div
          className={`mt-4 rounded-lg border-2 px-4 py-3 text-sm font-medium ${
            error
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
          role="alert"
        >
          {error || success}
        </div>
      )}

      <section className="mt-8 rounded-2xl border-2 border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-black">Profile</h2>
        <p className="mt-1 text-sm text-stone-500">
          Your username is shown in the app. First and last name help personalize your account.
        </p>

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <SettingsField
            id="username"
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="How you appear in Chaos"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField
              id="firstName"
              label="First name"
              value={firstName}
              onChange={setFirstName}
              placeholder="First name"
            />
            <SettingsField
              id="lastName"
              label="Last name"
              value={lastName}
              onChange={setLastName}
              placeholder="Last name"
            />
          </div>

          <button
            type="submit"
            disabled={!profileDirty || saving}
            className="rounded-lg border-2 border-black bg-[#FFBC42] px-5 py-2.5 text-sm font-bold text-black shadow-[2px_2px_0_#000] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-black">Google account</h2>
        <p className="mt-1 text-sm text-stone-500">
          Your account is linked to Google for sign-in.
        </p>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 rounded-lg border-2 border-stone-200 bg-[#faf8f4] px-4 py-3">
            <Mail className="h-5 w-5 shrink-0 text-stone-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Linked Gmail
              </p>
              <p className="truncate text-sm font-semibold text-black">{email || "—"}</p>
            </div>
          </div>

          <GoogleRelinkButton
            onSuccess={handleGoogleRelink}
            onError={() => setError("Google sign-in was cancelled or failed.")}
            disabled={linkingGoogle}
          />
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Updating your Google account refreshes your linked email if it changed on Google. You must
          sign in with the same Google account you originally used.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border-2 border-red-300 bg-red-50/50 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-red-900">
          <Trash2 className="h-5 w-5" />
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-red-800">
          Permanently delete your account and all associated data — carts, saved products, and
          settings. This cannot be undone.
        </p>

        <div className="mt-5">
          <label
            htmlFor="delete-confirm"
            className="mb-1.5 block text-sm font-semibold text-red-900"
          >
            Type <span className="font-mono">DELETE</span> to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            className="w-full max-w-xs rounded-lg border-2 border-red-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-red-600"
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== "DELETE" || deleting}
          className="mt-4 rounded-lg border-2 border-red-700 bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-[2px_2px_0_#7f1d1d] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {deleting ? "Deleting account…" : "Delete account"}
        </button>
      </section>
    </div>
  );
}
