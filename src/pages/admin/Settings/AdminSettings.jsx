
import { useEffect, useMemo, useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Building2,
  Clock3,
  Bell,
  Camera,
  Mail,
  ShieldCheck,
  CalendarDays,
  Globe,
  ImagePlus,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

const API_URL = "/api/admin/settings/";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultSettings = {
  studioName: "Little Click Studio South Bopal",
  tagline: "One click, one moment, a lifetime of love",
  email: "hello@littleclickstudio.com",
  phone: "",
  address: "South Bopal, Ahmedabad, Gujarat",
  website: "",
  openingTime: "10:00",
  closingTime: "19:00",
  workingDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],

  bookingNotifications: true,
  inquiryNotifications: true,
  reviewNotifications: false,

  bookingsEnabled: true,
  advanceBookingDays: "60",
  minimumNoticeHours: "24",
  bookingEmail: "",
  inquiryEmail: "",
  notificationEmail: "",

  autoReplyEnabled: true,
  emailSubject: "Thank you for contacting Little Click Studio",
  emailMessage:
    "Thank you for reaching out to Little Click Studio. We have received your message and will contact you soon.",

  instagram: "",
  facebook: "",
  youtube: "",
  logoUrl: "",
  profileImageUrl: "",
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function readCookie(name) {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

function normalizeSettings(data = {}) {
  return {
    ...defaultSettings,
    ...data,
    workingDays: Array.isArray(data.workingDays)
      ? data.workingDays
      : defaultSettings.workingDays,
  };
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(() =>
    clone(defaultSettings)
  );
  const [savedSettings, setSavedSettings] = useState(() =>
    clone(defaultSettings)
  );

  const [logoFile, setLogoFile] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [profilePreview, setProfilePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [serverConnected, setServerConnected] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(settings) !== JSON.stringify(savedSettings) ||
      Boolean(logoFile) ||
      Boolean(profileFile)
    );
  }, [settings, savedSettings, logoFile, profileFile]);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "Access denied. Please sign in with an authorized admin account."
            );
          }

          throw new Error(
            `Unable to load settings (HTTP ${response.status}).`
          );
        }

        const data = normalizeSettings(await response.json());

        if (!active) return;

        setSettings(data);
        setSavedSettings(clone(data));
        setServerConnected(true);
        setNotice({
          type: "success",
          text: "Settings loaded from the server.",
        });
      } catch (error) {
        if (!active) return;

        setServerConnected(false);
        setNotice({
          type: "error",
          text:
            error.message ||
            "Could not load settings. Check your Django API connection.",
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  useEffect(() => {
    return () => {
      if (profilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setNotice(null);
  };

  const toggleDay = (day) => {
    setSettings((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
    }));

    setNotice(null);
  };

  const handleImageChange = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice({
        type: "error",
        text: "Please select a valid image file.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({
        type: "error",
        text: "Image size must be 5 MB or less.",
      });
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview((current) => {
        if (current.startsWith("blob:")) URL.revokeObjectURL(current);
        return previewUrl;
      });
    } else {
      setProfileFile(file);
      setProfilePreview((current) => {
        if (current.startsWith("blob:")) URL.revokeObjectURL(current);
        return previewUrl;
      });
    }

    setNotice(null);
  };

  const validateSettings = () => {
    if (!settings.studioName.trim()) {
      return "Studio name is required.";
    }

    if (!settings.email.trim()) {
      return "Studio email is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      return "Enter a valid studio email address.";
    }

    if (
      settings.website &&
      !/^https?:\/\/.+/i.test(settings.website)
    ) {
      return "Website URL must start with http:// or https://.";
    }

    if (settings.workingDays.length === 0) {
      return "Select at least one working day.";
    }

    if (settings.closingTime <= settings.openingTime) {
      return "Closing time must be later than opening time.";
    }

    const advanceDays = Number(settings.advanceBookingDays);
    const noticeHours = Number(settings.minimumNoticeHours);

    if (
      !Number.isInteger(advanceDays) ||
      advanceDays < 1 ||
      advanceDays > 365
    ) {
      return "Advance booking days must be between 1 and 365.";
    }

    if (
      !Number.isInteger(noticeHours) ||
      noticeHours < 0 ||
      noticeHours > 720
    ) {
      return "Minimum booking notice must be between 0 and 720 hours.";
    }

    for (const field of ["bookingEmail", "inquiryEmail", "notificationEmail"]) {
      const email = settings[field].trim();

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return `Please enter a valid email in ${field}.`;
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateSettings();

    if (validationError) {
      setNotice({ type: "error", text: validationError });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const payload = new FormData();

      Object.entries(settings).forEach(([key, value]) => {
        payload.append(
          key,
          Array.isArray(value) ? JSON.stringify(value) : String(value)
        );
      });

      if (logoFile) payload.append("logo", logoFile);
      if (profileFile) payload.append("profileImage", profileFile);

      const headers = { Accept: "application/json" };
      const csrfToken = readCookie("csrftoken");

      if (csrfToken) {
        headers["X-CSRFToken"] = csrfToken;
      }

      const response = await fetch(API_URL, {
        method: "PUT",
        credentials: "include",
        headers,
        body: payload,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "You are not authorized to update these settings."
          );
        }

        const detail = await response.text();
        throw new Error(
          detail || `Settings could not be saved (HTTP ${response.status}).`
        );
      }

      const responseData = await response.json();
      const updatedSettings = normalizeSettings(responseData);

      setSettings(updatedSettings);
      setSavedSettings(clone(updatedSettings));
      setLogoFile(null);
      setProfileFile(null);
      setLogoPreview("");
      setProfilePreview("");
      setServerConnected(true);

      setNotice({
        type: "success",
        text: "Settings saved successfully.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.message ||
          "Could not save settings. Check your Django API connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(clone(savedSettings));
    setLogoFile(null);
    setProfileFile(null);
    setLogoPreview("");
    setProfilePreview("");
    setNotice({
      type: "success",
      text: "Unsaved changes have been discarded.",
    });
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset all fields to the original defaults? Save afterwards to update the server."
    );

    if (!confirmed) return;

    setSettings(clone(defaultSettings));
    setLogoFile(null);
    setProfileFile(null);
    setLogoPreview("");
    setProfilePreview("");
    setNotice({
      type: "success",
      text: "Defaults restored locally. Save to persist these changes.",
    });
  };


function ToggleControl({ checked, onChange, label, description }) {
  return (
    <label className="admin-settings__toggle-row">
      <span className="admin-settings__toggle-copy">
        <span className="admin-settings__toggle-title">
          {label}
        </span>

        {description && <span>{description}</span>}
      </span>

      <span>
        <input
          className="admin-settings__switch-input"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="admin-settings__switch" />
      </span>
    </label>
  );
}
  const Field = ({
    label,
    name,
    type = "text",
    placeholder = "",
    help = "",
    required = false,
  }) => (
    <label className="admin-settings__field">
      <span className="admin-settings__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <input
        className="admin-settings__input"
        name={name}
        type={type}
        value={settings[name] ?? ""}
        onChange={updateField}
        placeholder={placeholder}
        required={required}
      />
      {help && <span className="admin-settings__help">{help}</span>}
    </label>
  );

  const Toggle = ({ name, title, description }) => (
    <label className="admin-settings__toggle-row">
      <span className="admin-settings__toggle-copy">
        <span className="admin-settings__toggle-title">{title}</span>
        <span className="admin-settings__help">{description}</span>
      </span>
      <input
        className="admin-settings__switch-input"
        type="checkbox"
        name={name}
        checked={Boolean(settings[name])}
        onChange={updateField}
      />
      <span className="admin-settings__switch" aria-hidden="true" />
    </label>
  );

  return (
    <section className="admin-settings">
      <header className="admin-settings__header">
        <div>
          <span className="admin-settings__eyebrow">
            CONTROL CENTRE
          </span>
          <h1 className="admin-settings__title">Studio Settings</h1>
          <p className="admin-settings__subtitle">
            Manage your studio profile, bookings, notifications and brand.
          </p>
        </div>

        <div
          className={`admin-settings__connection ${
            serverConnected
              ? "admin-settings__connection--online"
              : "admin-settings__connection--offline"
          }`}
        >
          <span className="admin-settings__connection-dot" />
          {serverConnected ? "Server connected" : "Server not verified"}
        </div>
      </header>

      {notice && (
        <div
          className={`admin-settings__notice admin-settings__notice--${notice.type}`}
          role="status"
          aria-live="polite"
        >
          {notice.type === "error" ? (
            <AlertCircle size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {hasChanges && (
        <div className="admin-settings__unsaved" role="status">
          <span className="admin-settings__unsaved-dot" />
          You have unsaved changes.
        </div>
      )}

      {loading ? (
        <div className="admin-settings__loading">
          <LoaderCircle className="admin-settings__spinner" size={24} />
          <span>Loading studio settings…</span>
        </div>
      ) : (
        <form
          className="admin-settings__form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="admin-settings__layout">
            <div className="admin-settings__main">
              <section className="admin-settings__card">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <Building2 size={20} />
                  </span>
                  <div>
                    <h2>Studio Profile</h2>
                    <p>Business identity and public contact information.</p>
                  </div>
                </div>

                <div className="admin-settings__fields">
                  <Field
                    label="Studio name"
                    name="studioName"
                    required
                  />
                  <Field label="Tagline" name="tagline" />
                  <Field
                    label="Contact email"
                    name="email"
                    type="email"
                    required
                  />
                  <Field label="Phone number" name="phone" type="tel" />
                  <Field label="Website URL" name="website" type="url" />
                  <Field label="Studio address" name="address" />
                </div>
              </section>

              <section className="admin-settings__card">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <ImagePlus size={20} />
                  </span>
                  <div>
                    <h2>Studio Branding</h2>
                    <p>Upload the visual assets used for your studio identity.</p>
                  </div>
                </div>

                <div className="admin-settings__branding-grid">
                  <div className="admin-settings__upload-card">
                    <div className="admin-settings__preview admin-settings__preview--logo">
                      {logoPreview || settings.logoUrl ? (
                        <img
                          src={logoPreview || settings.logoUrl}
                          alt="Studio logo preview"
                        />
                      ) : (
                        <Camera size={30} />
                      )}
                    </div>
                    <div className="admin-settings__upload-copy">
                      <h3>Studio logo</h3>
                      <p>Recommended: square or transparent PNG/SVG.</p>
                      <label className="admin-settings__upload-button">
                        <ImagePlus size={16} />
                        Choose logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleImageChange(event, "logo")
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="admin-settings__upload-card">
                    <div className="admin-settings__preview">
                      {profilePreview || settings.profileImageUrl ? (
                        <img
                          src={profilePreview || settings.profileImageUrl}
                          alt="Studio profile preview"
                        />
                      ) : (
                        <Camera size={30} />
                      )}
                    </div>
                    <div className="admin-settings__upload-copy">
                      <h3>Studio profile image</h3>
                      <p>Use a high-quality studio or brand photograph.</p>
                      <label className="admin-settings__upload-button">
                        <ImagePlus size={16} />
                        Choose image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleImageChange(event, "profile")
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <p className="admin-settings__help">
                  Maximum image size: 5 MB. Images are uploaded only when you save.
                </p>
              </section>

              <section className="admin-settings__card">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <Clock3 size={20} />
                  </span>
                  <div>
                    <h2>Business Hours</h2>
                    <p>Set when clients can contact or visit the studio.</p>
                  </div>
                </div>

                <div className="admin-settings__fields admin-settings__fields--two">
                  <Field
                    label="Opening time"
                    name="openingTime"
                    type="time"
                    required
                  />
                  <Field
                    label="Closing time"
                    name="closingTime"
                    type="time"
                    required
                  />
                </div>

                <div className="admin-settings__days-block">
                  <span className="admin-settings__label">
                    Working days
                  </span>
                  <div className="admin-settings__days">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        className={`admin-settings__day ${
                          settings.workingDays.includes(day)
                            ? "admin-settings__day--active"
                            : ""
                        }`}
                        aria-pressed={settings.workingDays.includes(day)}
                        onClick={() => toggleDay(day)}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="admin-settings__card">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <CalendarDays size={20} />
                  </span>
                  <div>
                    <h2>Booking Configuration</h2>
                    <p>Control whether clients can submit booking requests.</p>
                  </div>
                </div>

                <Toggle
                  name="bookingsEnabled"
                  title="Accept booking requests"
                  description="Allow clients to submit new booking requests."
                />

                <div className="admin-settings__fields admin-settings__fields--two">
                  <Field
                    label="Advance booking window (days)"
                    name="advanceBookingDays"
                    type="number"
                    help="How far ahead clients may request a session."
                  />
                  <Field
                    label="Minimum notice (hours)"
                    name="minimumNoticeHours"
                    type="number"
                    help="Minimum notice before a requested session."
                  />
                </div>
              </section>

              <section className="admin-settings__card">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <Bell size={20} />
                  </span>
                  <div>
                    <h2>Notifications</h2>
                    <p>Choose which events should trigger notifications.</p>
                  </div>
                </div>

                <Toggle
                  name="bookingNotifications"
                  title="Booking notifications"
                  description="Get notified about new booking requests."
                />
                <Toggle
                  name="inquiryNotifications"
                  title="Inquiry notifications"
                  description="Get notified when a client sends an inquiry."
                />
                <Toggle
                  name="reviewNotifications"
                  title="Review notifications"
                  description="Get notified when a new review is submitted."
                />

                <div className="admin-settings__fields">
                  <Field
                    label="General notification recipient"
                    name="notificationEmail"
                    type="email"
                    help="Optional email address for studio alerts."
                  />
                  <Field
                    label="Booking notification recipient"
                    name="bookingEmail"
                    type="email"
                    help="Leave blank to use the general recipient."
                  />
                  <Field
                    label="Inquiry notification recipient"
                    name="inquiryEmail"
                    type="email"
                    help="Leave blank to use the general recipient."
                  />
                </div>
              </section>

              <section className="admin-settings__card">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <Mail size={20} />
                  </span>
                  <div>
                    <h2>Email Configuration</h2>
                    <p>Configure the automatic reply sent to clients.</p>
                  </div>
                </div>

                <Toggle
                  name="autoReplyEnabled"
                  title="Automatic inquiry reply"
                  description="Send a confirmation message after an inquiry is received."
                />

                <div className="admin-settings__fields">
                  <Field
                    label="Email subject"
                    name="emailSubject"
                    required
                  />
                  <label className="admin-settings__field">
                    <span className="admin-settings__label">
                      Automatic reply message
                    </span>
                    <textarea
                      className="admin-settings__input admin-settings__textarea"
                      name="emailMessage"
                      value={settings.emailMessage}
                      onChange={updateField}
                      rows={5}
                      required
                    />
                  </label>
                </div>

                <p className="admin-settings__help">
                  Actual email delivery also requires Django email settings and
                  a backend email-sending workflow.
                </p>
              </section>

              <section className="admin-settings__card">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <Globe size={20} />
                  </span>
                  <div>
                    <h2>Social Media Links</h2>
                    <p>Connect your studio's public social profiles.</p>
                  </div>
                </div>

                <div className="admin-settings__fields">
                  <Field
                    label="Instagram URL"
                    name="instagram"
                    type="url"
                    placeholder="https://instagram.com/yourstudio"
                  />
                  <Field
                    label="Facebook URL"
                    name="facebook"
                    type="url"
                    placeholder="https://facebook.com/yourstudio"
                  />
                  <Field
                    label="YouTube URL"
                    name="youtube"
                    type="url"
                    placeholder="https://youtube.com/@yourstudio"
                  />
                </div>
              </section>
            </div>

            <aside className="admin-settings__sidebar">
              <section className="admin-settings__card admin-settings__security">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <h2>Admin Security</h2>
                    <p>Access and permission status.</p>
                  </div>
                </div>

                <div className="admin-settings__security-status">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Protected admin endpoint</strong>
                    <span>
                      {serverConnected
                        ? "Settings endpoint responded successfully."
                        : "Backend authorization has not been verified."}
                    </span>
                  </div>
                </div>

                <ul className="admin-settings__security-list">
                  <li>
                    <CheckCircle2 size={16} />
                    Frontend validation enabled
                  </li>
                  <li>
                    <AlertCircle size={16} />
                    Django role checks required
                  </li>
                  <li>
                    <AlertCircle size={16} />
                    CSRF/session configuration required
                  </li>
                </ul>

                <p className="admin-settings__help">
                  This panel does not grant admin rights by itself. Django
                  must verify the signed-in user and reject unauthorized
                  requests on both GET and PUT.
                </p>
              </section>

              <section className="admin-settings__card">
                <div className="admin-settings__section-heading">
                  <span className="admin-settings__section-icon">
                    <Settings size={20} />
                  </span>
                  <div>
                    <h2>Change Management</h2>
                    <p>Keep edits under control.</p>
                  </div>
                </div>

                <div className="admin-settings__change-status">
                  <span
                    className={`admin-settings__status-dot ${
                      hasChanges
                        ? "admin-settings__status-dot--changed"
                        : ""
                    }`}
                  />
                  {hasChanges ? "Unsaved changes" : "All changes saved"}
                </div>

                <button
                  type="button"
                  className="admin-settings__secondary-button"
                  onClick={handleDiscard}
                  disabled={!hasChanges || saving}
                >
                  <RotateCcw size={17} />
                  Discard changes
                </button>

                <button
                  type="button"
                  className="admin-settings__secondary-button"
                  onClick={handleReset}
                  disabled={saving}
                >
                  <RotateCcw size={17} />
                  Restore defaults
                </button>
              </section>

              {settings.website && (
                <a
                  className="admin-settings__website-link"
                  href={settings.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  View studio website
                  <ExternalLink size={16} />
                </a>
              )}
            </aside>
          </div>

          <div className="admin-settings__footer">
            <span className="admin-settings__footer-note">
              {hasChanges
                ? "Remember to save your changes."
                : "Your form matches the last loaded or saved settings."}
            </span>

            <button
              className="admin-settings__save-button"
              type="submit"
              disabled={saving || loading || !hasChanges}
            >
              {saving ? (
                <LoaderCircle
                  className="admin-settings__spinner"
                  size={18}
                />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
