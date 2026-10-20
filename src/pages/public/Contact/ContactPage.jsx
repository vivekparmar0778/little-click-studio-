
import { useState } from "react";
import { ArrowUpRight, Clock3, MapPin, Sparkles } from "lucide-react";


const PHOTOGRAPHY_TYPES = [
  "Newborn Photography",
  "Maternity Photography",
  "Baby & Milestones",
  "Family Photography",
  "Not sure yet",
];

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  photographyType: "",
  preferredDate: "",
  message: "",
};

function ContactPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [notice, setNotice] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setNotice("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Frontend validation only. Django API integration is pending.
    setNotice(
      "Your details passed frontend validation. Online submission will be available once the studio's backend is connected."
    );
  };

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero__eyebrow">
          <span className="contact-hero__line" />
          <span>LET'S CREATE SOMETHING TIMELESS</span>
        </div>

        <h1>
          Every little moment
          <br />
          <em>deserves to be remembered.</em>
        </h1>

        <p className="contact-hero__description">
          Tell us about the moments you want to preserve. We’ll help you
          explore a photography experience that feels personal to your family.
        </p>

        <div className="contact-hero__note">
          <Sparkles size={16} strokeWidth={1.5} />
          <span>Thoughtfully captured. Beautifully remembered.</span>
        </div>
      </section>

      <section className="contact-content" aria-labelledby="contact-form-title">
        <div className="contact-info">
          <span className="contact-info__eyebrow">GET IN TOUCH</span>

          <h2>
            Your story
            <br />
            starts <em>here.</em>
          </h2>

          <p className="contact-info__description">
            Whether you’re expecting your little one, celebrating a new
            arrival, or documenting another milestone, we’d love to hear from
            you.
          </p>

          <div className="contact-info__details">
            <div className="contact-info__item">
              <span className="contact-info__icon">
                <MapPin size={19} strokeWidth={1.5} />
              </span>
              <div>
                <h3>VISIT OUR STUDIO</h3>
                <p>South Bopal, Ahmedabad, Gujarat</p>
              </div>
            </div>

            <div className="contact-info__item">
              <span className="contact-info__icon">
                <Clock3 size={19} strokeWidth={1.5} />
              </span>
              <div>
                <h3>PLANNING YOUR SESSION</h3>
                <p>Share your preferred date and photography experience.</p>
              </div>
            </div>
          </div>

          <div className="contact-info__quote">
            <span aria-hidden="true">“</span>
            <p>
              The smallest moments often become our most treasured memories.
            </p>
          </div>
        </div>

        <div className="contact-form-card">
          <div className="contact-form-card__heading">
            <span className="contact-form-card__eyebrow">
              YOUR INQUIRY
            </span>
            <h2 id="contact-form-title">Tell us a little about it.</h2>
            <p>Fields marked with * are required.</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__grid">
              <div className="contact-form__field">
                <label htmlFor="contact-name">Full name *</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="contact-form__field">
                <label htmlFor="contact-email">Email address *</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  maxLength={254}
                />
              </div>

              <div className="contact-form__field">
                <label htmlFor="contact-phone">Phone number *</label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  pattern="[0-9+() .-]{7,20}"
                  title="Enter a valid phone number using digits and common phone symbols."
                />
              </div>

              <div className="contact-form__field">
                <label htmlFor="contact-type">Photography experience *</label>
                <select
                  id="contact-type"
                  name="photographyType"
                  value={formData.photographyType}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Choose an experience
                  </option>
                  {PHOTOGRAPHY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="contact-form__field contact-form__field--full">
                <label htmlFor="contact-date">
                  Preferred session date
                </label>
                <input
                  id="contact-date"
                  name="preferredDate"
                  type="date"
                  min={new Date().toLocaleDateString("en-CA")}
                  value={formData.preferredDate}
                  onChange={handleChange}
                />
                <span className="contact-form__hint">
                  Optional — we’ll discuss availability after backend
                  integration.
                </span>
              </div>

              <div className="contact-form__field contact-form__field--full">
                <label htmlFor="contact-message">Tell us your story *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="Tell us what you would love to capture..."
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={1500}
                />
                <span className="contact-form__hint">
                  A few details will help us understand your vision.
                </span>
              </div>
            </div>

            {notice && (
              <p className="contact-form__notice" role="status">
                {notice}
              </p>
            )}

            <button className="contact-form__submit" type="submit">
              <span>Prepare my inquiry</span>
              <ArrowUpRight size={19} strokeWidth={1.7} />
            </button>

            <p className="contact-form__privacy">
              This form currently validates your details in the browser. It
              does not send or save them to a server.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;
