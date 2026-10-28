import { useEffect, useMemo, useRef, useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Building2,
  Clock3,
  Bell,
  Camera,
  Mail,
  CalendarDays,
  Globe,
  ImagePlus,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { createAdminSettingsService } from "../../../services/adminSettingsService";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_SETTINGS = {
  studioName: "Little Click Studio South Bopal",
  tagline: "One click, one moment, a lifetime of love",
  email: "hello@littleclickstudio.com",
  phone: "",
  address: "South Bopal, Ahmedabad, Gujarat",
  website: "",
  openingTime: "10:00",
  closingTime: "19:00",
  workingDays: DAYS.slice(0, 6),
  bookingsEnabled: true,
  advanceBookingDays: "60",
  minimumNoticeHours: "24",
  bookingNotifications: true,
  inquiryNotifications: true,
  reviewNotifications: false,
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

const PROFILE_FIELDS = [
  {
    name: "studioName",
    label: "Studio name",
    required: true,
    maxLength: 150,
  },
  { name: "tagline", label: "Tagline", maxLength: 250 },
  {
    name: "email",
    label: "Contact email",
    type: "email",
    required: true,
    maxLength: 254,
  },
  {
    name: "phone",
    label: "Phone number",
    type: "tel",
    maxLength: 20,
  },
  {
    name: "website",
    label: "Website URL",
    type: "url",
    maxLength: 200,
  },
  { name: "address", label: "Studio address", maxLength: 500 },
];

const NOTIFICATION_FIELDS = [
  {
    name: "notificationEmail",
    label: "General notification recipient",
    type: "email",
    help: "Optional email address for studio alerts.",
    maxLength: 254,
  },
  {
    name: "bookingEmail",
    label: "Booking notification recipient",
    type: "email",
    help: "Leave blank to use the general recipient.",
    maxLength: 254,
  },
  {
    name: "inquiryEmail",
    label: "Inquiry notification recipient",
    type: "email",
    help: "Leave blank to use the general recipient.",
    maxLength: 254,
  },
];

const SOCIAL_FIELDS = [
  {
    name: "instagram",
    label: "Instagram URL",
    type: "url",
    placeholder: "https://instagram.com/yourstudio",
  },
  {
    name: "facebook",
    label: "Facebook URL",
    type: "url",
    placeholder: "https://facebook.com/yourstudio",
  },
  {
    name: "youtube",
    label: "YouTube URL",
    type: "url",
    placeholder: "https://youtube.com/@yourstudio",
  },
];

const NOTIFICATION_TOGGLES = [
  {
    name: "bookingNotifications",
    title: "Booking notifications",
    description: "Receive alerts about new booking requests.",
  },
  {
    name: "inquiryNotifications",
    title: "Inquiry notifications",
    description: "Receive alerts about new client inquiries.",
  },
  {
    name: "reviewNotifications",
    title: "Review notifications",
    description: "Receive alerts about newly submitted reviews.",
  },
];

function copySettings(settings) {
  return {
    ...settings,
    workingDays: [...settings.workingDays],
  };
}

function normalizeSettings(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid settings response.");
  }

  const normalized = {};

  // Keep only the fields used by this form.
  for (const [name, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
    const value = data[name];

    if (name === "workingDays") {
      if (
        !Array.isArray(value) ||
        value.length === 0 ||
        value.some((day) => !DAYS.includes(day))
      ) {
        throw new Error("Invalid working days in settings response.");
      }

      normalized[name] = DAYS.filter((day) => value.includes(day));
    } else if (name === "logoUrl" || name === "profileImageUrl") {
      if (value !== null && typeof value !== "string") {
        throw new Error("Invalid image URL in settings response.");
      }

      normalized[name] = value || "";
    } else if (
      name === "advanceBookingDays" ||
      name === "minimumNoticeHours"
    ) {
      if (
        (typeof value !== "number" && typeof value !== "string") ||
        String(value).trim() === "" ||
        !Number.isInteger(Number(value))
      ) {
        throw new Error("Invalid booking limits in settings response.");
      }

      normalized[name] = String(value);
    } else if (typeof defaultValue === "boolean") {
      if (typeof value !== "boolean") {
        throw new Error(`Invalid setting: ${name}.`);
      }

      normalized[name] = value;
    } else {
      if (typeof value !== "string") {
        throw new Error(`Invalid setting: ${name}.`);
      }

      normalized[name] = value;
    }
  }

  return normalized;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateSettings(settings) {
  if (!settings.studioName.trim()) {
    return "Studio name is required.";
  }

  const emailFields = [
    ["email", "Contact email"],
    ["notificationEmail", "General notification recipient"],
    ["bookingEmail", "Booking notification recipient"],
    ["inquiryEmail", "Inquiry notification recipient"],
  ];

  for (const [name, label] of emailFields) {
    const value = settings[name].trim();

    if (name === "email" && !value) {
      return "Contact email is required.";
    }

    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `Enter a valid email address for ${label}.`;
    }
  }

  const urlFields = [
    ["website", "Website"],
    ["instagram", "Instagram"],
    ["facebook", "Facebook"],
    ["youtube", "YouTube"],
  ];

  for (const [name, label] of urlFields) {
    const value = settings[name].trim();

    if (value && !isValidHttpUrl(value)) {
      return `${label} must be a valid URL starting with https:// or http://.`;
    }
  }

  if (settings.workingDays.length === 0) {
    return "Select at least one working day.";
  }

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    !timePattern.test(settings.openingTime) ||
    !timePattern.test(settings.closingTime)
  ) {
    return "Enter valid opening and closing times.";
  }

  if (settings.closingTime <= settings.openingTime) {
    return "Closing time must be later than opening time.";
  }

  if (!settings.advanceBookingDays.trim()) {
    return "Advance booking window is required.";
  }

  if (!settings.minimumNoticeHours.trim()) {
    return "Minimum booking notice is required.";
  }

  const advanceDays = Number(settings.advanceBookingDays);
  const noticeHours = Number(settings.minimumNoticeHours);

  if (
    !Number.isInteger(advanceDays) ||
    advanceDays < 1 ||
    advanceDays > 365
  ) {
    return "Advance booking window must be between 1 and 365 days.";
  }

  if (
    !Number.isInteger(noticeHours) ||
    noticeHours < 0 ||
    noticeHours > 720
  ) {
    return "Minimum booking notice must be between 0 and 720 hours.";
  }

  if (noticeHours > advanceDays * 24) {
    return "Minimum notice cannot exceed the advance booking window.";
  }

  if (settings.autoReplyEnabled) {
    if (!settings.emailSubject.trim()) {
      return "Email subject is required when automatic replies are enabled.";
    }

    if (!settings.emailMessage.trim()) {
      return "Reply message is required when automatic replies are enabled.";
    }
  }

  return "";
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  help = "",
  required = false,
  ...inputProps
}) {
  return (
    <label className="admin-settings__field">
      <span className="admin-settings__label">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>

      <input
        className="admin-settings__input"
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        {...inputProps}
      />

      {help && <span className="admin-settings__help">{help}</span>}
    </label>
  );
}

function Toggle({ name, title, description, checked, onChange }) {
  return (
    <label className="admin-settings__toggle-row">
      <span className="admin-settings__toggle-copy">
        <span className="admin-settings__toggle-title">{title}</span>
        <span className="admin-settings__help">{description}</span>
      </span>

      <input
        className="admin-settings__switch-input"
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />

      <span className="admin-settings__switch" aria-hidden="true" />
    </label>
  );
}

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <section className="admin-settings__card">
      <div className="admin-settings__section-heading">
        <span className="admin-settings__section-icon">
          <Icon size={20} aria-hidden="true" />
        </span>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function ImageUpload({
  title,
  description,
  preview,
  isLogo = false,
  onChange,
}) {
  return (
    <div className="admin-settings__upload-card">
      <div
        className={`admin-settings__preview ${
          isLogo ? "admin-settings__preview--logo" : ""
        }`}
      >
        {preview ? (
          <img src={preview} alt={`${title} preview`} />
        ) : (
          <Camera size={30} aria-hidden="true" />
        )}
      </div>

      <div className="admin-settings__upload-copy">
        <h3>{title}</h3>
        <p>{description}</p>

        <label className="admin-settings__upload-button">
          <ImagePlus size={16} aria-hidden="true" />
          Choose image

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onChange}
          />
        </label>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const { apiRequest } = useAuth();

  const settingsApi = useMemo(
    () => createAdminSettingsService(apiRequest),
    [apiRequest],
  );

  const [settings, setSettings] = useState(() =>
    copySettings(DEFAULT_SETTINGS),
  );
  const [savedSettings, setSavedSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const [logoFile, setLogoFile] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [profilePreview, setProfilePreview] = useState("");

  const mountedRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load settings when this page opens or the user retries.
  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await settingsApi.getSettings();
        const loadedSettings = normalizeSettings(response);

        if (active) {
          setSettings(loadedSettings);
          setSavedSettings(copySettings(loadedSettings));
          setLoadError("");
        }
      } catch (error) {
        if (active) {
          setLoadError(error?.message || "Unable to load studio settings.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [settingsApi, retryCount]);

  // Release temporary image URLs when replaced or removed.
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);

  const hasChanges =
    savedSettings !== null &&
    (
      JSON.stringify(settings) !== JSON.stringify(savedSettings) ||
      Boolean(logoFile) ||
      Boolean(profileFile)
    );

  const websiteUrl = settings.website.trim();
  const canOpenWebsite = isValidHttpUrl(websiteUrl);

  function handleRetryLoad() {
    setLoading(true);
    setLoadError("");
    setNotice(null);
    setRetryCount((count) => count + 1);
  }

  function updateField(event) {
    const { name, type, value, checked } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setNotice(null);
  }

  function toggleDay(day) {
    setSettings((current) => {
      const selectedDays = current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day];

      return {
        ...current,
        workingDays: DAYS.filter((item) => selectedDays.includes(item)),
      };
    });

    setNotice(null);
  }

  function handleImageChange(event, imageType) {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setNotice({
        type: "error",
        text: "Choose a PNG, JPEG or WebP image.",
      });
      input.value = "";
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setNotice({
        type: "error",
        text: "Choose a non-empty image of 5 MB or less.",
      });
      input.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (imageType === "logo") {
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } else {
      setProfileFile(file);
      setProfilePreview(previewUrl);
    }

    input.value = "";
    setNotice(null);
  }

  function clearImages() {
    setLogoFile(null);
    setProfileFile(null);
    setLogoPreview("");
    setProfilePreview("");
  }

  function handleDiscard() {
    if (!savedSettings || savingRef.current) return;

    setSettings(copySettings(savedSettings));
    clearImages();

    setNotice({
      type: "info",
      text: "Unsaved changes discarded. Last saved settings restored.",
    });
  }

  function handleReset() {
    if (savingRef.current) return;

    const confirmed = window.confirm(
      "Restore default field values? Existing saved images will remain. Click Save settings afterwards to apply.",
    );

    if (!confirmed) return;

    setSettings({
      ...copySettings(DEFAULT_SETTINGS),
      logoUrl: savedSettings?.logoUrl || "",
      profileImageUrl: savedSettings?.profileImageUrl || "",
    });

    clearImages();

    setNotice({
      type: "info",
      text: "Default field values restored locally. Save to apply them.",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Ref prevents duplicate submissions before React updates the button.
    if (savingRef.current || !savedSettings || !hasChanges) return;

    const validationError = validateSettings(settings);

    if (validationError) {
      setNotice({ type: "error", text: validationError });
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setNotice(null);

    try {
      const response = await settingsApi.updateSettings(
        settings,
        logoFile,
        profileFile,
      );

      const updatedSettings = normalizeSettings(response);

      if (!mountedRef.current) return;

      setSettings(updatedSettings);
      setSavedSettings(copySettings(updatedSettings));
      clearImages();

      setNotice({
        type: "success",
        text: "Settings saved successfully.",
      });
    } catch (error) {
      if (mountedRef.current) {
        setNotice({
          type: "error",
          text: error?.message || "Unable to save studio settings.",
        });
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-settings">
        <div className="admin-settings__loading" role="status">
          <LoaderCircle
            className="admin-settings__spinner"
            size={24}
            aria-hidden="true"
          />
          <span>Loading studio settings...</span>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="admin-settings">
        <h1 className="admin-settings__title">Studio Settings</h1>

        <div
          className="admin-settings__notice admin-settings__notice--error"
          role="alert"
        >
          <AlertCircle size={19} aria-hidden="true" />
          <span>{loadError}</span>
        </div>

        <button
          type="button"
          className="admin-settings__secondary-button"
          onClick={handleRetryLoad}
        >
          <RotateCcw size={17} aria-hidden="true" />
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="admin-settings">
      <header className="admin-settings__header">
        <div>
          <span className="admin-settings__eyebrow">CONTROL CENTRE</span>
          <h1 className="admin-settings__title">Studio Settings</h1>
          <p className="admin-settings__subtitle">
            Manage your studio profile, bookings, notifications and brand.
          </p>
        </div>

        
      </header>

      {notice && (
        <div
          className={`admin-settings__notice admin-settings__notice--${
            notice.type === "error" ? "error" : "success"
          }`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.type === "error" ? (
            <AlertCircle size={19} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={19} aria-hidden="true" />
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

      <form
        className="admin-settings__form"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={saving}
      >
        {/* Prevent edits while a save request is running. */}
        <fieldset
          disabled={saving}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <legend className="admin-settings__help">
            Studio configuration
          </legend>

          <div className="admin-settings__layout">
            <div className="admin-settings__main">
              <SettingsCard
                icon={Building2}
                title="Studio Profile"
                description="Business identity and public contact information."
              >
                <div className="admin-settings__fields">
                  {PROFILE_FIELDS.map((field) => (
                    <Field
                      key={field.name}
                      {...field}
                      value={settings[field.name]}
                      onChange={updateField}
                    />
                  ))}
                </div>
              </SettingsCard>

              <SettingsCard
                icon={ImagePlus}
                title="Studio Branding"
                description="Choose the visual assets for your studio identity."
              >
                <div className="admin-settings__branding-grid">
                  <ImageUpload
                    title="Studio logo"
                    description="Use a square or transparent PNG."
                    preview={logoPreview || settings.logoUrl}
                    isLogo
                    onChange={(event) => handleImageChange(event, "logo")}
                  />

                  <ImageUpload
                    title="Studio profile image"
                    description="Use a clear studio or brand photograph."
                    preview={profilePreview || settings.profileImageUrl}
                    onChange={(event) =>
                      handleImageChange(event, "profile")
                    }
                  />
                </div>

                <p className="admin-settings__help">
                  PNG, JPEG or WebP. Maximum 5 MB per image. Selected
                  images upload when you save.
                </p>
              </SettingsCard>

              <SettingsCard
                icon={Clock3}
                title="Business Hours"
                description="Set your studio's opening hours and working days."
              >
                <div className="admin-settings__fields admin-settings__fields--two">
                  <Field
                    label="Opening time"
                    name="openingTime"
                    type="time"
                    value={settings.openingTime}
                    onChange={updateField}
                    required
                  />

                  <Field
                    label="Closing time"
                    name="closingTime"
                    type="time"
                    value={settings.closingTime}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="admin-settings__days-block">
                  <span className="admin-settings__label">
                    Working days
                  </span>

                  <div className="admin-settings__days">
                    {DAYS.map((day) => {
                      const selected = settings.workingDays.includes(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          className={`admin-settings__day ${
                            selected ? "admin-settings__day--active" : ""
                          }`}
                          aria-label={day}
                          aria-pressed={selected}
                          onClick={() => toggleDay(day)}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard
                icon={CalendarDays}
                title="Booking Configuration"
                description="Set your preferences for new booking requests."
              >
                <Toggle
                  name="bookingsEnabled"
                  title="Accept booking requests"
                  description="Allow clients to submit new booking requests."
                  checked={settings.bookingsEnabled}
                  onChange={updateField}
                />

                <div className="admin-settings__fields admin-settings__fields--two">
                  <Field
                    label="Advance booking window (days)"
                    name="advanceBookingDays"
                    type="number"
                    min={1}
                    max={365}
                    step={1}
                    required
                    value={settings.advanceBookingDays}
                    onChange={updateField}
                    help="How far ahead clients may request a session."
                  />

                  <Field
                    label="Minimum notice (hours)"
                    name="minimumNoticeHours"
                    type="number"
                    min={0}
                    max={720}
                    step={1}
                    required
                    value={settings.minimumNoticeHours}
                    onChange={updateField}
                    help="Minimum notice before a requested session."
                  />
                </div>
              </SettingsCard>

              <SettingsCard
                icon={Bell}
                title="Notifications"
                description="Choose which events should trigger notifications."
              >
                {NOTIFICATION_TOGGLES.map((toggle) => (
                  <Toggle
                    key={toggle.name}
                    {...toggle}
                    checked={settings[toggle.name]}
                    onChange={updateField}
                  />
                ))}

                <div className="admin-settings__fields">
                  {NOTIFICATION_FIELDS.map((field) => (
                    <Field
                      key={field.name}
                      {...field}
                      value={settings[field.name]}
                      onChange={updateField}
                    />
                  ))}
                </div>
              </SettingsCard>

              <SettingsCard
                icon={Mail}
                title="Email Configuration"
                description="Prepare the automatic reply sent after an inquiry."
              >
                <Toggle
                  name="autoReplyEnabled"
                  title="Automatic inquiry reply"
                  description="Send a confirmation after an inquiry is received."
                  checked={settings.autoReplyEnabled}
                  onChange={updateField}
                />

                <div className="admin-settings__fields">
                  <Field
                    label="Email subject"
                    name="emailSubject"
                    value={settings.emailSubject}
                    onChange={updateField}
                    maxLength={250}
                    required={settings.autoReplyEnabled}
                    disabled={!settings.autoReplyEnabled}
                  />

                  <label className="admin-settings__field">
                    <span className="admin-settings__label">
                      Automatic reply message
                      {settings.autoReplyEnabled && (
                        <span aria-hidden="true"> *</span>
                      )}
                    </span>

                    <textarea
                      className="admin-settings__input admin-settings__textarea"
                      name="emailMessage"
                      value={settings.emailMessage}
                      onChange={updateField}
                      rows={5}
                      maxLength={5000}
                      required={settings.autoReplyEnabled}
                      disabled={!settings.autoReplyEnabled}
                    />
                  </label>
                </div>
              </SettingsCard>

              <SettingsCard
                icon={Globe}
                title="Social Media Links"
                description="Connect your studio's public social profiles."
              >
                <div className="admin-settings__fields">
                  {SOCIAL_FIELDS.map((field) => (
                    <Field
                      key={field.name}
                      {...field}
                      maxLength={200}
                      value={settings[field.name]}
                      onChange={updateField}
                    />
                  ))}
                </div>
              </SettingsCard>
            </div>

            <aside className="admin-settings__sidebar">
              

              <SettingsCard
                icon={Settings}
                title="Change Management"
                description="Review or discard your edits."
              >
                <div className="admin-settings__change-status">
                  <span
                    className={`admin-settings__status-dot ${
                      hasChanges
                        ? "admin-settings__status-dot--changed"
                        : ""
                    }`}
                  />

                  {hasChanges
                    ? "Unsaved changes"
                    : "Matches last saved settings"}
                </div>

                <button
                  type="button"
                  className="admin-settings__secondary-button"
                  onClick={handleDiscard}
                  disabled={!hasChanges || saving}
                >
                  <RotateCcw size={17} aria-hidden="true" />
                  Discard changes
                </button>

                <button
                  type="button"
                  className="admin-settings__secondary-button"
                  onClick={handleReset}
                  disabled={saving}
                >
                  <RotateCcw size={17} aria-hidden="true" />
                  Restore defaults
                </button>
              </SettingsCard>

              {canOpenWebsite && (
                <a
                  className="admin-settings__website-link"
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View studio website
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              )}
            </aside>
          </div>

          <div className="admin-settings__footer">
            <span className="admin-settings__footer-note">
              {saving
                ? "Saving settings..."
                : hasChanges
                  ? "Remember to save your changes."
                  : "Your form matches the last saved settings."}
            </span>

            <button
              className="admin-settings__save-button"
              type="submit"
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <LoaderCircle
                  className="admin-settings__spinner"
                  size={18}
                  aria-hidden="true"
                />
              ) : (
                <Save size={18} aria-hidden="true" />
              )}

              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}