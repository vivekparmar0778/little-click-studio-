
import { useEffect, useMemo, useState } from "react";
import {
  
  ArrowLeft,
  ArrowRight,
  Heart,
  Image as ImageIcon,
  Maximize2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

const previewPhotos = [
  {
    id: 1,
    title: "Golden beginnings",
    category: "Newborn",
    date: "Sample collection",
    image:
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1000&q=85",
    alt: "Soft neutral-toned newborn-inspired portrait",
    size: "portrait",
  },
  {
    id: 2,
    title: "A mother's love",
    category: "Maternity",
    date: "Sample collection",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=85",
    alt: "Warm family portrait in natural light",
    size: "landscape",
  },
  {
    id: 3,
    title: "Little wonder",
    category: "Baby",
    date: "Sample collection",
    image:
      "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=1000&q=85",
    alt: "Tender family moment captured in soft light",
    size: "portrait",
  },
  {
    id: 4,
    title: "Together, always",
    category: "Family",
    date: "Sample collection",
    image:
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1000&q=85",
    alt: "Family spending time together outdoors",
    size: "landscape",
  },
  {
    id: 5,
    title: "The tiniest details",
    category: "Newborn",
    date: "Sample collection",
    image:
      "https://images.unsplash.com/photo-1491013516836-7db643ee125a?auto=format&fit=crop&w=1000&q=85",
    alt: "A gentle, intimate family photography moment",
    size: "portrait",
  },
  {
    id: 6,
    title: "Growing with love",
    category: "Baby",
    date: "Sample collection",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1000&q=85",
    alt: "Child portrait in natural light",
    size: "portrait",
  },
];

const categories = ["All photographs", "Newborn", "Maternity", "Baby", "Family"];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All photographs");
  const [search, setSearch] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const photos = useMemo(() => {
    const query = search.trim().toLowerCase();

    return previewPhotos.filter((photo) => {
      const matchesCategory =
        activeCategory === "All photographs" ||
        photo.category === activeCategory;

      const matchesSearch =
        !query ||
        `${photo.title} ${photo.category}`.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  useEffect(() => {
    if (!selectedPhoto) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setSelectedPhoto(null);

      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const currentIndex = photos.findIndex(
          (photo) => photo.id === selectedPhoto.id
        );

        if (currentIndex < 0 || photos.length < 2) return;

        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex =
          (currentIndex + direction + photos.length) % photos.length;

        setSelectedPhoto(photos[nextIndex]);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhoto, photos]);

  function toggleFavorite(photoId) {
    setFavorites((current) =>
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId]
    );
  }

  function movePhoto(direction) {
    const currentIndex = photos.findIndex(
      (photo) => photo.id === selectedPhoto?.id
    );

    if (currentIndex < 0 || photos.length < 2) return;

    const nextIndex =
      (currentIndex + direction + photos.length) % photos.length;

    setSelectedPhoto(photos[nextIndex]);
  }

  return (
    <div className="customer-gallery">
      <header className="customer-gallery__hero">
        <div className="customer-gallery__hero-copy">
          <span className="customer-gallery__eyebrow">
            YOUR PRIVATE COLLECTION
          </span>

          <h1>
            Moments made
            <br />
            <em>timeless.</em>
          </h1>

          <p>
            A little home for the photographs you'll return to, again and
            again. Every frame holds a story worth keeping.
          </p>

          <div className="customer-gallery__privacy">
            <ShieldCheck size={16} />
            <span>Created for you. Kept private.</span>
          </div>
        </div>

        <div className="customer-gallery__hero-art" aria-hidden="true">
          <div className="customer-gallery__hero-image customer-gallery__hero-image--back" />
          <div className="customer-gallery__hero-image customer-gallery__hero-image--front" />
          <span className="customer-gallery__hero-caption">
            LITTLE MOMENTS, FOREVER
          </span>
        </div>
      </header>

      <section className="customer-gallery__collection">
        <div className="customer-gallery__heading">
          <div>
            <span className="customer-gallery__eyebrow">
              THE ART OF REMEMBERING
            </span>
            <h2>Your photographs</h2>
            <p>Explore your collection, one beautiful frame at a time.</p>
          </div>

          <div className="customer-gallery__photo-count">
            <ImageIcon size={17} />
            <span>{photos.length} photographs</span>
          </div>
        </div>

        <div className="customer-gallery__toolbar">
          <div className="customer-gallery__filters" aria-label="Photo categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  activeCategory === category
                    ? "customer-gallery__filter is-active"
                    : "customer-gallery__filter"
                }
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <label className="customer-gallery__search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a moment..."
              aria-label="Search photographs"
            />
          </label>
        </div>

        <div className="customer-gallery__grid">
          {photos.map((photo, index) => (
            <article
              key={photo.id}
              className={`customer-gallery__card customer-gallery__card--${photo.size}`}
              style={{ "--gallery-index": index }}
            >
              <button
                type="button"
                className="customer-gallery__photo-button"
                onClick={() => setSelectedPhoto(photo)}
                aria-label={`View ${photo.title}`}
              >
                <img
                  src={photo.image}
                  alt={photo.alt}
                  loading="lazy"
                />
                <span className="customer-gallery__image-overlay">
                  <span className="customer-gallery__view-icon">
                    <Maximize2 size={18} />
                  </span>
                  <span className="customer-gallery__image-title">
                    {photo.title}
                  </span>
                  <span className="customer-gallery__image-category">
                    {photo.category} · {photo.date}
                  </span>
                </span>
              </button>

              <button
                type="button"
                className={
                  favorites.includes(photo.id)
                    ? "customer-gallery__favorite is-favorite"
                    : "customer-gallery__favorite"
                }
                onClick={() => toggleFavorite(photo.id)}
                aria-pressed={favorites.includes(photo.id)}
                aria-label={
                  favorites.includes(photo.id)
                    ? `Remove ${photo.title} from favourites`
                    : `Add ${photo.title} to favourites`
                }
              >
                <Heart
                  size={17}
                  fill={favorites.includes(photo.id) ? "currentColor" : "none"}
                />
              </button>

              <div className="customer-gallery__card-caption">
                <div>
                  <h3>{photo.title}</h3>
                  <p>{photo.category} photography</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(photo)}
                  aria-label={`Open ${photo.title}`}
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="customer-gallery__empty">
            <ImageIcon size={26} />
            <h3>No photographs found</h3>
            <p>Try a different category or search term.</p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("All photographs");
                setSearch("");
              }}
            >
              Show all photographs
            </button>
          </div>
        )}
      </section>

      <aside className="customer-gallery__footer">
        <Heart size={19} strokeWidth={1.4} />
        <p>
          The smallest moments often become the most treasured memories.
          Thank you for letting us be part of yours.
        </p>
      </aside>

      <p className="customer-gallery__disclaimer">
        Demo gallery: these are sample external images, not private client
        photographs. Favourite selections are temporary and reset on refresh.
        Secure client gallery access and original-photo downloads will be
        connected through the backend.
      </p>

      {selectedPhoto && (
        <div
          className="customer-gallery__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.title}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPhoto(null);
          }}
        >
          <button
            type="button"
            className="customer-gallery__lightbox-close"
            onClick={() => setSelectedPhoto(null)}
            aria-label="Close photo viewer"
          >
            <X size={22} />
          </button>

          <button
            type="button"
            className="customer-gallery__lightbox-nav customer-gallery__lightbox-nav--prev"
            onClick={() => movePhoto(-1)}
            aria-label="Previous photograph"
            disabled={photos.length < 2}
          >
            <ArrowLeft size={21} />
          </button>

          <figure className="customer-gallery__lightbox-content">
            <img src={selectedPhoto.image} alt={selectedPhoto.alt} />
            <figcaption>
              <div>
                <span>{selectedPhoto.category} PHOTOGRAPHY</span>
                <h2>{selectedPhoto.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(selectedPhoto.id)}
                aria-pressed={favorites.includes(selectedPhoto.id)}
                aria-label="Toggle favourite"
              >
                <Heart
                  size={19}
                  fill={favorites.includes(selectedPhoto.id) ? "currentColor" : "none"}
                />
                {favorites.includes(selectedPhoto.id) ? "Saved" : "Save favourite"}
              </button>
            </figcaption>
          </figure>

          <button
            type="button"
            className="customer-gallery__lightbox-nav customer-gallery__lightbox-nav--next"
            onClick={() => movePhoto(1)}
            aria-label="Next photograph"
            disabled={photos.length < 2}
          >
            <ArrowRight size={21} />
          </button>
        </div>
      )}
    </div>
  );
}
