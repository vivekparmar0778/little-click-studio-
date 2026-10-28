import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Save, ShieldCheck, UserRound } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const editableFields = [
  {
    name: "first_name",
    label: "First name",
    autoComplete: "given-name",
    maxLength: 150,
    required: true,
  },
  {
    name: "last_name",
    label: "Last name",
    autoComplete: "family-name",
    maxLength: 150,
  },
  {
    name: "phone_number",
    label: "Phone number",
    type: "tel",
    autoComplete: "tel",
    maxLength: 13,
    placeholder: "+919876543210",
    help: "Include country code, without spaces. Optional for now.",
  },
  {
    name: "city",
    label: "City",
    autoComplete: "address-level2",
    maxLength: 100,
    placeholder: "Your city",
  },
];

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({});
  const [notice, setNotice] = useState(null);

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((name) => name.trim().charAt(0))
    .join("")
    .toUpperCase();

  function startEditing() {
    setDraft(
      Object.fromEntries(
        editableFields.map(({ name }) => [name, user?.[name] || ""]),
      ),
    );
    setNotice(null);
    setEditing(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    setNotice(null);
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;

    const changes = Object.fromEntries(
      editableFields.map(({ name }) => [name, (draft[name] || "").trim()]),
    );

    if (!changes.first_name) {
      setNotice({
        type: "error",
        text: "Please enter your first name.",
      });
      return;
    }

    if (
      changes.phone_number &&
      !/^\+[1-9][0-9]{7,14}$/.test(changes.phone_number)
    ) {
      setNotice({
        type: "error",
        text: "Enter phone number with country code, for example +919876543210.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      await updateProfile(changes);

      setEditing(false);
      setNotice({
        type: "success",
        text: "Your profile has been updated.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update your profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="customer-profile">
      <div className="customer-profile__ambient" aria-hidden="true" />

      <header className="customer-profile__header">
        <div>
          <Link to="/dashboard" className="customer-profile__back">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to overview
          </Link>

          <p className="customer-profile__eyebrow">YOUR SPACE · YOUR DETAILS</p>

          <h1>
            A little about
            <br />
            <em>you.</em>
          </h1>

          <p className="customer-profile__intro">
            Keep your personal and contact details up to date.
          </p>
        </div>
      </header>

      <section className="customer-profile__identity">
        <div className="customer-profile__avatar" aria-hidden="true">
          {initials ? <span>{initials}</span> : <UserRound size={28} />}
        </div>

        <div className="customer-profile__identity-copy">
          <span className="customer-profile__identity-label">
            YOUR STUDIO ACCOUNT
          </span>

          <h2>{fullName || "Your profile"}</h2>

          <p>
            <Mail size={14} aria-hidden="true" />
            {user?.email}
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            className="customer-profile__button customer-profile__button--dark"
            onClick={startEditing}
          >
            Edit profile
          </button>
        )}
      </section>

      {notice && (
        <div
          className={`customer-profile__notice customer-profile__notice--${notice.type}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.text}
        </div>
      )}

      <section className="customer-profile__panel customer-profile__details">
        <div className="customer-profile__panel-heading">
          <div className="customer-profile__panel-icon">
            <UserRound size={19} aria-hidden="true" />
          </div>

          <div>
            <p className="customer-profile__eyebrow">THE BASICS</p>
            <h2>Personal details</h2>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} aria-busy={saving}>
            <div className="customer-profile__form-grid">
              {editableFields.map(
                ({
                  name,
                  label,
                  type = "text",
                  autoComplete,
                  maxLength,
                  required,
                  placeholder,
                  help,
                }) => (
                  <label className="customer-profile__field" key={name}>
                    <span>
                      {label}
                      {required ? " *" : " (optional)"}
                    </span>

                    <div className="customer-profile__input-wrap">
                      <input
                        name={name}
                        type={type}
                        autoComplete={autoComplete}
                        value={draft[name] || ""}
                        onChange={updateField}
                        maxLength={maxLength}
                        required={required}
                        placeholder={placeholder}
                        disabled={saving}
                        aria-describedby={
                          help ? `profile-${name}-help` : undefined
                        }
                      />
                    </div>

                    {help && <small id={`profile-${name}-help`}>{help}</small>}
                  </label>
                ),
              )}

              <label className="customer-profile__field">
                <span>Email address</span>

                <div className="customer-profile__input-wrap">
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    autoComplete="email"
                  />
                </div>

                <small>Email cannot be changed here.</small>
              </label>
            </div>

            <div className="customer-profile__form-footer">
              <div className="customer-profile__form-actions">
                <button
                  type="button"
                  className="customer-profile__button"
                  disabled={saving}
                  onClick={() => {
                    setEditing(false);
                    setDraft({});
                    setNotice(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-profile__button customer-profile__button--dark"
                  disabled={saving}
                >
                  <Save size={15} aria-hidden="true" />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <dl className="account-details">
            {[...editableFields, { name: "email", label: "Email address" }].map(
              ({ name, label }) => (
                <div key={name}>
                  <dt>{label}</dt>
                  <dd>{user?.[name]?.trim() || "Not provided"}</dd>
                </div>
              ),
            )}
          </dl>
        )}
      </section>

      <section className="customer-profile__privacy">
        <div className="customer-profile__privacy-icon">
          <ShieldCheck size={22} aria-hidden="true" />
        </div>

        <div>
          <h2>Need help with your account?</h2>
          <p>Contact the studio for assistance.</p>
        </div>

        <Link to="/contact" className="customer-profile__privacy-link">
          Contact us
        </Link>
      </section>
    </div>
  );
}
