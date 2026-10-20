
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  Sparkles,
} from "lucide-react";


const EXPERIENCES = [
  {
    id: "newborn",
    title: "Newborn",
    description: "Tiny details and first precious days",
    duration: "2–3 hours",
    icon: Baby,
  },
  {
    id: "maternity",
    title: "Maternity",
    description: "Celebrate the beauty of motherhood",
    duration: "1–2 hours",
    icon: Heart,
  },
  {
    id: "milestones",
    title: "Baby & Milestones",
    description: "Every little stage worth remembering",
    duration: "1–2 hours",
    icon: Sparkles,
  },
  {
    id: "family",
    title: "Family",
    description: "Your people, your story, your memories",
    duration: "1–2 hours",
    icon: Heart,
  },
];

const INITIAL_DETAILS = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

function BookingPage() {
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [notice, setNotice] = useState("");

  const selectedExperience = EXPERIENCES.find(
    (item) => item.id === experience
  );

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const updateDetails = (event) => {
    const { name, value } = event.target;

    setDetails((current) => ({
      ...current,
      [name]: value,
    }));

    setNotice("");
  };

  const goToStepTwo = () => {
    if (!experience) {
      setNotice("Please choose a photography experience first.");
      return;
    }

    setNotice("");
    setStep(2);
  };

  const goToStepThree = () => {
    if (!date || date < minDate || !time) {
      setNotice("Please choose a valid preferred date and time.");
      return;
    }

    setNotice("");
    setStep(3);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setNotice(
      "Your details are valid on the frontend. Online booking is not active yet because studio availability and the Django booking API are not connected."
    );
  };

  return (
    <main className="booking-page">
      <section className="booking-hero">
        <div className="booking-hero__eyebrow">
          <span />
          YOUR MOMENT, BEAUTIFULLY CAPTURED
        </div>

        <h1>
          Let's make it
          <br />
          <em>memorable.</em>
        </h1>

        <p>
          A few thoughtful details are all we need to begin planning your
          photography experience.
        </p>
      </section>

      <section className="booking-content">
        <div className="booking-intro">
          <span className="booking-intro__label">LITTLE CLICK STUDIO</span>
          <h2>
            A little moment.
            <br />
            <em>A lifetime of love.</em>
          </h2>
          <p>
            From the first tiny days to the milestones that follow, let's
            create photographs your family will treasure for years.
          </p>

          <div className="booking-intro__note">
            <Sparkles size={18} />
            <span>Thoughtful sessions, tailored to your family.</span>
          </div>
        </div>

        <div className="booking-card">
          <div className="booking-card__top">
            <div>
              <span className="booking-card__eyebrow">
                PLAN YOUR SESSION
              </span>
              <h2>
                {step === 1 && "Choose your experience"}
                {step === 2 && "Find your preferred time"}
                {step === 3 && "A little about you"}
              </h2>
            </div>

            <span className="booking-card__step">
              0{step} <span>/ 03</span>
            </span>
          </div>

          <div
            className="booking-progress"
            role="progressbar"
            aria-label="Booking form progress"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={step}
          >
            <span
              className={step >= 1 ? "is-active" : ""}
            />
            <span
              className={step >= 2 ? "is-active" : ""}
            />
            <span
              className={step >= 3 ? "is-active" : ""}
            />
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="booking-step">
                <p className="booking-step__description">
                  What special chapter would you like to capture?
                </p>

                <div className="booking-experiences">
                  {EXPERIENCES.map((item) => {
                    const Icon = item.icon;
                    const isSelected = experience === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`booking-experience ${
                          isSelected ? "is-selected" : ""
                        }`}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setExperience(item.id);
                          setNotice("");
                        }}
                      >
                        <span className="booking-experience__icon">
                          <Icon size={21} strokeWidth={1.5} />
                        </span>

                        <span className="booking-experience__content">
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                          <small className="booking-experience__duration">
                            <Clock3 size={13} />
                            {item.duration}
                          </small>
                        </span>

                        <span className="booking-experience__check">
                          {isSelected && <Check size={16} />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  className="booking-button"
                  type="button"
                  onClick={goToStepTwo}
                >
                  <span>Continue to date</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="booking-step">
                <p className="booking-step__description">
                  Choose your preferred date and time. These are requests,
                  not confirmed studio availability.
                </p>

                <div className="booking-field">
                  <label htmlFor="booking-date">
                    Preferred date *
                  </label>
                  <div className="booking-field__input-wrap">
                    <CalendarDays size={18} />
                    <input
                      id="booking-date"
                      type="date"
                      min={minDate}
                      value={date}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setNotice("");
                      }}
                      required
                    />
                  </div>
                </div>

                <fieldset className="booking-times">
                  <legend>Preferred time *</legend>
                  <div className="booking-times__grid">
                    {[
                      "09:00",
                      "11:00",
                      "13:00",
                      "15:00",
                      "17:00",
                    ].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={
                          time === slot ? "is-selected" : ""
                        }
                        aria-pressed={time === slot}
                        onClick={() => {
                          setTime(slot);
                          setNotice("");
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <p className="booking-field__hint">
                    Displayed times are preference options only. Availability
                    must be confirmed by the studio.
                  </p>
                </fieldset>

                <div className="booking-actions">
                  <button
                    type="button"
                    className="booking-button booking-button--secondary"
                    onClick={() => {
                      setNotice("");
                      setStep(1);
                    }}
                  >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    className="booking-button"
                    onClick={goToStepThree}
                  >
                    <span>Continue</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="booking-step">
                <p className="booking-step__description">
                  Share your details so your inquiry can be prepared.
                </p>

                <div className="booking-summary">
                  <div>
                    <span>EXPERIENCE</span>
                    <strong>{selectedExperience?.title}</strong>
                  </div>
                  <div>
                    <span>PREFERRED DATE</span>
                    <strong>{date}</strong>
                  </div>
                  <div>
                    <span>PREFERRED TIME</span>
                    <strong>{time}</strong>
                  </div>
                </div>

                <div className="booking-fields">
                  <div className="booking-field">
                    <label htmlFor="booking-name">Full name *</label>
                    <input
                      id="booking-name"
                      name="name"
                      autoComplete="name"
                      value={details.name}
                      onChange={updateDetails}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="booking-field">
                    <label htmlFor="booking-email">Email address *</label>
                    <input
                      id="booking-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={details.email}
                      onChange={updateDetails}
                      maxLength={254}
                      required
                    />
                  </div>

                  <div className="booking-field">
                    <label htmlFor="booking-phone">Phone number *</label>
                    <input
                      id="booking-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={details.phone}
                      onChange={updateDetails}
                      maxLength={20}
                      pattern="[0-9+() .-]{7,20}"
                      title="Enter a valid phone number using digits and common phone symbols."
                      required
                    />
                  </div>

                  <div className="booking-field">
                    <label htmlFor="booking-notes">
                      Additional details (optional)
                    </label>
                    <textarea
                      id="booking-notes"
                      name="notes"
                      rows={3}
                      maxLength={1000}
                      placeholder="Anything you'd like us to know?"
                      value={details.notes}
                      onChange={updateDetails}
                    />
                  </div>
                </div>

                <div className="booking-actions">
                  <button
                    type="button"
                    className="booking-button booking-button--secondary"
                    onClick={() => {
                      setNotice("");
                      setStep(2);
                    }}
                  >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                  </button>

                  <button className="booking-button" type="submit">
                    <span>Review inquiry</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {notice && (
              <p className="booking-notice" role="status">
                {notice}
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="booking-footer-note">
        <span>MADE WITH LOVE IN SOUTH BOPAL, AHMEDABAD</span>
        <p>One click, one moment, a lifetime of love.</p>
      </section>
    </main>
  );
}

export default BookingPage;
