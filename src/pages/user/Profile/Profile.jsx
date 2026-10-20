
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Heart,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

const initialProfile = {
  firstName: "Aarohi",
  lastName: "Shah",
  email: "aarohi.example@email.com",
  phone: "+91 98765 43210",
  city: "Ahmedabad",
  preferredContact: "Email",
  photographyInterest: "Newborn photography",
  notes: "Warm, natural tones and candid family moments.",
};

const preferences = [
  {
    value: "Newborn photography",
    label: "Newborn",
    description: "Those first little moments",
  },
  {
    value: "Maternity photography",
    label: "Maternity",
    description: "Celebrate the journey",
  },
  {
    value: "Baby milestone photography",
    label: "Baby milestones",
    description: "Every new little chapter",
  },
  {
    value: "Family photography",
    label: "Family",
    description: "Together, just as you are",
  },
];

function ProfileField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  icon: Icon,
  disabled = false,
}) {
  return (
    <label className="customer-profile__field">
      <span>{label}</span>
      <div className="customer-profile__input-wrap">
        {Icon && <Icon size={17} aria-hidden="true" />}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={
            name === "firstName"
              ? "given-name"
              : name === "lastName"
                ? "family-name"
                : name === "email"
                  ? "email"
                  : name === "phone"
                    ? "tel"
                    : "off"
          }
        />
      </div>
    </label>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    setMessage("");
  };

  const startEditing = () => {
    setDraft(profile);
    setMessage("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setEditing(false);
    setMessage("");
  };

  const saveProfile = (event) => {
    event.preventDefault();

    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const email = draft.email.trim();

    if (!firstName || !lastName || !email) {
      setMessage("Please fill in your first name, last name and email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setSaving(true);

    const updatedProfile = {
      ...draft,
      firstName,
      lastName,
      email,
      phone: draft.phone.trim(),
      city: draft.city.trim(),
      notes: draft.notes.trim(),
    };

    setProfile(updatedProfile);
    setDraft(updatedProfile);
    setEditing(false);
    setSaving(false);
    setMessage(
      "Profile updated in this preview. Connect Django to save changes permanently."
    );
  };

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  return (
    <main className="customer-profile">
      <div className="customer-profile__ambient" aria-hidden="true" />

      <header className="customer-profile__header">
        <div>
          <Link to="/dashboard" className="customer-profile__back">
            <ArrowLeft size={15} />
            Back to overview
          </Link>

          <p className="customer-profile__eyebrow">
            YOUR SPACE · YOUR DETAILS
          </p>

          <h1>
            A little about
            <br />
            <em>you.</em>
          </h1>

          <p className="customer-profile__intro">
            Your details help us make every studio visit feel personal,
            comfortable and uniquely yours.
          </p>
        </div>

        <div className="customer-profile__header-art" aria-hidden="true">
          <div className="customer-profile__orbit customer-profile__orbit--outer" />
          <div className="customer-profile__orbit customer-profile__orbit--inner" />
          <div className="customer-profile__header-art-center">
            <Heart size={34} strokeWidth={1.15} />
          </div>
          <Sparkles className="customer-profile__sparkle" size={19} />
        </div>
      </header>

      <section className="customer-profile__identity">
        <div className="customer-profile__avatar">
          <span>{initials || "LC"}</span>
          <span className="customer-profile__avatar-camera">
            <Camera size={14} />
          </span>
        </div>

        <div className="customer-profile__identity-copy">
          <span className="customer-profile__identity-label">
            YOUR STUDIO ACCOUNT
          </span>
          <h2>{fullName || "Your profile"}</h2>
          <p>
            <Mail size={14} />
            {profile.email}
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            className="customer-profile__button customer-profile__button--dark"
            onClick={startEditing}
          >
            Edit profile
            <ArrowUpRight size={16} />
          </button>
        )}
      </section>

      {message && (
        <div
          className={`customer-profile__notice ${
            editing
              ? "customer-profile__notice--error"
              : "customer-profile__notice--success"
          }`}
          role="status"
        >
          {editing ? <X size={17} /> : <CheckCircle2 size={17} />}
          <span>{message}</span>
          {!editing && (
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      <div className="customer-profile__grid">
        <section className="customer-profile__panel customer-profile__details">
          <div className="customer-profile__panel-heading">
            <div className="customer-profile__panel-icon">
              <UserRound size={19} />
            </div>
            <div>
              <p className="customer-profile__eyebrow">THE BASICS</p>
              <h2>Personal details</h2>
              <p>How we can address and reach you.</p>
            </div>
          </div>

          <form onSubmit={saveProfile}>
            <div className="customer-profile__form-grid">
              <ProfileField
                label="First name"
                name="firstName"
                value={editing ? draft.firstName : profile.firstName}
                onChange={updateField}
                disabled={!editing}
                placeholder="Your first name"
              />

              <ProfileField
                label="Last name"
                name="lastName"
                value={editing ? draft.lastName : profile.lastName}
                onChange={updateField}
                disabled={!editing}
                placeholder="Your last name"
              />

              <ProfileField
                label="Email address"
                name="email"
                value={editing ? draft.email : profile.email}
                onChange={updateField}
                type="email"
                icon={Mail}
                disabled={!editing}
                placeholder="you@example.com"
              />

              <ProfileField
                label="Phone number"
                name="phone"
                value={editing ? draft.phone : profile.phone}
                onChange={updateField}
                type="tel"
                icon={Phone}
                disabled={!editing}
                placeholder="+91"
              />

              <ProfileField
                label="City"
                name="city"
                value={editing ? draft.city : profile.city}
                onChange={updateField}
                icon={MapPin}
                disabled={!editing}
                placeholder="Your city"
              />

              <label className="customer-profile__field">
                <span>Preferred contact</span>
                <div className="customer-profile__select-wrap">
                  <select
                    name="preferredContact"
                    value={
                      editing
                        ? draft.preferredContact
                        : profile.preferredContact
                    }
                    onChange={updateField}
                    disabled={!editing}
                  >
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
              </label>
            </div>

            <div className="customer-profile__form-divider" />

            <div className="customer-profile__form-footer">
              <p>
                <ShieldCheck size={15} />
                Your details should only be accessible to authorized staff.
              </p>

              {editing && (
                <div className="customer-profile__form-actions">
                  <button
                    type="button"
                    className="customer-profile__button"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="customer-profile__button customer-profile__button--dark"
                    disabled={saving}
                  >
                    <Save size={15} />
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              )}
            </div>
          </form>
        </section>

        <aside className="customer-profile__side">
          <section className="customer-profile__panel customer-profile__preferences">
            <div className="customer-profile__panel-heading">
              <div className="customer-profile__panel-icon">
                <Camera size={19} />
              </div>
              <div>
                <p className="customer-profile__eyebrow">YOUR STORY</p>
                <h2>Photography interests</h2>
                <p>What moments are you planning to capture?</p>
              </div>
            </div>

            <div className="customer-profile__interest-list">
              {preferences.map((item) => {
                const selected =
                  (editing ? draft.photographyInterest : profile.photographyInterest) ===
                  item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`customer-profile__interest ${
                      selected ? "customer-profile__interest--selected" : ""
                    }`}
                    aria-pressed={selected}
                    disabled={!editing}
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        photographyInterest: item.value,
                      }));
                      setMessage("");
                    }}
                  >
                    <span className="customer-profile__interest-copy">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span className="customer-profile__interest-check">
                      {selected && <Check size={14} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="customer-profile__preference-note">
              {editing
                ? "Choose the type of session you are most interested in."
                : "To update your interests, select Edit profile above."}
            </p>
          </section>

          <section className="customer-profile__panel customer-profile__notes">
            <p className="customer-profile__eyebrow">THE LITTLE DETAILS</p>
            <h2>Your preferences</h2>
            <p>
              Share the style, atmosphere or small details that would make
              your session feel like you.
            </p>

            <label className="customer-profile__field">
              <span>Session notes</span>
              <textarea
                name="notes"
                rows={4}
                maxLength={500}
                value={editing ? draft.notes : profile.notes}
                onChange={updateField}
                disabled={!editing}
                placeholder="Tell us about your preferred style..."
              />
            </label>

            {editing && (
              <span className="customer-profile__character-count">
                {draft.notes.length}/500 characters
              </span>
            )}
          </section>
        </aside>
      </div>

      <section className="customer-profile__privacy">
        <div className="customer-profile__privacy-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <p className="customer-profile__eyebrow">YOUR PRIVACY MATTERS</p>
          <h2>Your moments are personal. Your data should be, too.</h2>
          <p>
            This page is a frontend preview. Account security, data access,
            and permanent profile updates must be enforced by the Django
            backend before launch.
          </p>
        </div>
        <Link to="/contact" className="customer-profile__privacy-link">
          Need help?
          <ChevronRight size={17} />
        </Link>
      </section>

      <footer className="customer-profile__footer">
        <span>Made for the moments that matter.</span>
        <span>Little Click Studio · South Bopal</span>
      </footer>
    </main>
  );
}
