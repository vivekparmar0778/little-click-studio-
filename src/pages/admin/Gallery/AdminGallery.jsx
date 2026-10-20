
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Images,
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Upload,
  ImagePlus,
  Save,
  AlertTriangle,
} from "lucide-react";


const initialGalleries = [
  {
    id: "GAL-001",
    title: "A Little Beginning",
    customer: "Aarav Sharma",
    session: "Newborn Photography",
    imageCount: 24,
    date: "2026-10-05",
    visible: true,
    photos: [],
  },
  {
    id: "GAL-002",
    title: "Waiting for You",
    customer: "Priya Mehta",
    session: "Maternity Portraits",
    imageCount: 18,
    date: "2026-10-08",
    visible: true,
    photos: [],
  },
  {
    id: "GAL-003",
    title: "Six Months of Wonder",
    customer: "Riya Patel",
    session: "Baby Milestone Session",
    imageCount: 16,
    date: "2026-10-10",
    visible: false,
    photos: [],
  },
  {
    id: "GAL-004",
    title: "Our Little Family",
    customer: "Neha Desai",
    session: "Family Portrait Session",
    imageCount: 32,
    date: "2026-10-12",
    visible: true,
    photos: [],
  },
];

const emptyForm = {
  title: "",
  customer: "",
  session: "Newborn Photography",
  date: new Date().toLocaleDateString("en-CA"),
  visible: true,
};

const sessions = [
  "Newborn Photography",
  "Maternity Portraits",
  "Baby Milestone Session",
  "Family Portrait Session",
  "Baby Photography",
  "Other",
];

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const makeGalleryId = (galleries) => {
  const highestId = galleries.reduce((highest, gallery) => {
    const number = Number(gallery.id.replace("GAL-", ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);

  return `GAL-${String(highestId + 1).padStart(3, "0")}`;
};

export default function AdminGallery() {
  const [galleries, setGalleries] = useState(initialGalleries);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [removedPhotoIndexes, setRemovedPhotoIndexes] = useState([]);

  const [selectedGallery, setSelectedGallery] = useState(null);
  const [galleryToDelete, setGalleryToDelete] = useState(null);
  const [notice, setNotice] = useState("");

  const fileInputRef = useRef(null);

  const editingGallery = useMemo(
    () => galleries.find((gallery) => gallery.id === editingId) ?? null,
    [galleries, editingId],
  );

  const filteredGalleries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return galleries.filter((gallery) => {
      const matchesSearch = [
        gallery.id,
        gallery.title,
        gallery.customer,
        gallery.session,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesVisibility =
        visibility === "all" ||
        (visibility === "visible" && gallery.visible) ||
        (visibility === "hidden" && !gallery.visible);

      return matchesSearch && matchesVisibility;
    });
  }, [galleries, search, visibility]);

  const visibleCount = galleries.filter((gallery) => gallery.visible).length;
  const hiddenCount = galleries.length - visibleCount;
  const totalImages = galleries.reduce(
    (total, gallery) => total + gallery.imageCount,
    0,
  );

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!isFormOpen && !selectedGallery && !galleryToDelete) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsFormOpen(false);
        setSelectedGallery(null);
        setGalleryToDelete(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen, selectedGallery, galleryToDelete]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date().toLocaleDateString("en-CA") });
    setNewFiles([]);
    setRemovedPhotoIndexes([]);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (gallery) => {
    setEditingId(gallery.id);
    setForm({
      title: gallery.title,
      customer: gallery.customer,
      session: gallery.session,
      date: gallery.date,
      visible: gallery.visible,
    });
    setNewFiles([]);
    setRemovedPhotoIndexes([]);
    setFormError("");
    setSelectedGallery(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormError("");
    setNewFiles([]);
    setRemovedPhotoIndexes([]);
  };

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files ?? []);
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length) {
      setFormError("Only image files can be selected.");
    } else {
      setFormError("");
    }

    setNewFiles((current) => [...current, ...validFiles]);

    // Allow selecting the same file again after removing it.
    event.target.value = "";
  };

  const removeNewFile = (index) => {
    setNewFiles((current) => current.filter((_, i) => i !== index));
  };

  const toggleExistingPhotoRemoval = (index) => {
    setRemovedPhotoIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  };

  const saveGallery = (event) => {
    event.preventDefault();
    setFormError("");

    const title = form.title.trim();
    const customer = form.customer.trim();

    if (!title || !customer || !form.date || !form.session) {
      setFormError("Please complete all required fields.");
      return;
    }

    const duplicateTitle = galleries.some(
      (gallery) =>
        gallery.title.trim().toLowerCase() === title.toLowerCase() &&
        gallery.id !== editingId,
    );

    if (duplicateTitle) {
      setFormError("A gallery with this title already exists.");
      return;
    }

    if (editingGallery) {
      const keptPhotos = editingGallery.photos.filter(
        (_, index) => !removedPhotoIndexes.includes(index),
      );

      const updatedGallery = {
        ...editingGallery,
        ...form,
        title,
        customer,
        photos: [...keptPhotos, ...newFiles.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
        }))],
        imageCount: Math.max(
          0,
          editingGallery.imageCount -
            removedPhotoIndexes.length +
            newFiles.length,
        ),
      };

      setGalleries((current) =>
        current.map((gallery) =>
          gallery.id === editingId ? updatedGallery : gallery,
        ),
      );

      setSelectedGallery((current) =>
        current?.id === editingId ? updatedGallery : current,
      );

      setNotice(`"${title}" has been updated.`);
    } else {
      const gallery = {
        id: makeGalleryId(galleries),
        ...form,
        title,
        customer,
        imageCount: newFiles.length,
        photos: newFiles.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
        })),
      };

      setGalleries((current) => [gallery, ...current]);
      setNotice(`"${title}" has been created.`);
    }

    closeForm();
  };

  const toggleVisibility = (gallery) => {
    const nextVisible = !gallery.visible;

    setGalleries((current) =>
      current.map((item) =>
        item.id === gallery.id
          ? { ...item, visible: nextVisible }
          : item,
      ),
    );

    setSelectedGallery((current) =>
      current?.id === gallery.id
        ? { ...current, visible: nextVisible }
        : current,
    );

    setNotice(
      `"${gallery.title}" is now ${nextVisible ? "visible" : "hidden"}.`,
    );
  };

  const deleteGallery = () => {
    if (!galleryToDelete) return;

    const title = galleryToDelete.title;
    const id = galleryToDelete.id;

    setGalleries((current) =>
      current.filter((gallery) => gallery.id !== id),
    );

    setSelectedGallery((current) => (current?.id === id ? null : current));
    setGalleryToDelete(null);
    setNotice(`"${title}" has been deleted from this demo.`);
  };

  return (
    <section className="admin-gallery">
      <header className="admin-gallery__header">
        <div>
          <span className="admin-gallery__eyebrow">STUDIO CONTENT</span>
          <h1>Gallery Management</h1>
          <p>Create collections, manage photographs and control gallery visibility.</p>
        </div>

        <button
          type="button"
          className="admin-gallery__add-button"
          onClick={openCreateForm}
        >
          <Plus size={18} />
          <span>Add gallery</span>
        </button>
      </header>

      {notice && (
        <div className="admin-gallery__notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="admin-gallery__stats">
        <article className="admin-gallery__stat">
          <span>Total galleries</span>
          <strong>{galleries.length}</strong>
          <small>Client collections</small>
        </article>
        <article className="admin-gallery__stat">
          <span>Visible galleries</span>
          <strong>{visibleCount}</strong>
          <small>Marked as visible</small>
        </article>
        <article className="admin-gallery__stat">
          <span>Hidden galleries</span>
          <strong>{hiddenCount}</strong>
          <small>Not marked as visible</small>
        </article>
        <article className="admin-gallery__stat">
          <span>Total images</span>
          <strong>{totalImages}</strong>
          <small>Includes demo image counts</small>
        </article>
      </div>

      <div className="admin-gallery__toolbar">
        <label className="admin-gallery__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search gallery, customer or session..."
            aria-label="Search galleries"
          />
        </label>

        <label className="admin-gallery__filter">
          <span>Visibility</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="all">All galleries</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </div>

      <div className="admin-gallery__table-wrap">
        <table className="admin-gallery__table">
          <thead>
            <tr>
              <th>Gallery</th>
              <th>Customer</th>
              <th>Session</th>
              <th>Images</th>
              <th>Created</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredGalleries.map((gallery) => (
              <tr key={gallery.id}>
                <td>
                  <div className="admin-gallery__gallery-name">
                    <span className="admin-gallery__thumbnail">
                      <Images size={19} />
                    </span>
                    <span>
                      <strong>{gallery.title}</strong>
                      <small>{gallery.id}</small>
                    </span>
                  </div>
                </td>
                <td>{gallery.customer}</td>
                <td>{gallery.session}</td>
                <td>{gallery.imageCount}</td>
                <td>{formatDate(gallery.date)}</td>
                <td>
                  <span className={`admin-gallery__badge ${gallery.visible ? "admin-gallery__badge--visible" : "admin-gallery__badge--hidden"}`}>
                    {gallery.visible ? "Visible" : "Hidden"}
                  </span>
                </td>
                <td>
                  <div className="admin-gallery__actions">
                    <button
                      type="button"
                      className="admin-gallery__action"
                      onClick={() => setSelectedGallery(gallery)}
                      aria-label={`View ${gallery.title}`}
                      title="View details"
                    >
                      <Eye size={17} />
                    </button>
                    <button
                      type="button"
                      className="admin-gallery__action"
                      onClick={() => openEditForm(gallery)}
                      aria-label={`Edit ${gallery.title}`}
                      title="Edit gallery"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      className="admin-gallery__action"
                      onClick={() => toggleVisibility(gallery)}
                      aria-label={`${gallery.visible ? "Hide" : "Show"} ${gallery.title}`}
                      title={gallery.visible ? "Hide gallery" : "Show gallery"}
                    >
                      {gallery.visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                    <button
                      type="button"
                      className="admin-gallery__action admin-gallery__action--danger"
                      onClick={() => setGalleryToDelete(gallery)}
                      aria-label={`Delete ${gallery.title}`}
                      title="Delete gallery"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredGalleries.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-gallery__empty">
                    <Images size={28} />
                    <strong>No galleries found</strong>
                    <span>Try another search or create a new gallery.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {isFormOpen && (
        <div
          className="admin-gallery__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section className="admin-gallery__modal" role="dialog" aria-modal="true" aria-labelledby="gallery-form-title">
            <div className="admin-gallery__modal-header">
              <div>
                <span>{editingId ? "UPDATE COLLECTION" : "NEW COLLECTION"}</span>
                <h2 id="gallery-form-title">{editingId ? "Edit gallery" : "Create gallery"}</h2>
                <p>Enter collection details and manage photographs.</p>
              </div>
              <button type="button" className="admin-gallery__action" onClick={closeForm} aria-label="Close form">
                <X size={19} />
              </button>
            </div>

            <form className="admin-gallery__form" onSubmit={saveGallery}>
              <label className="admin-gallery__field">
                <span>Gallery title <b>*</b></span>
                <input name="title" value={form.title} onChange={updateForm} maxLength={100} required placeholder="e.g. A Little Beginning" />
              </label>

              <label className="admin-gallery__field">
                <span>Customer name <b>*</b></span>
                <input name="customer" value={form.customer} onChange={updateForm} maxLength={100} required placeholder="Enter customer name" />
              </label>

              <div className="admin-gallery__form-grid">
                <label className="admin-gallery__field">
                  <span>Photography session <b>*</b></span>
                  <select name="session" value={form.session} onChange={updateForm} required>
                    {sessions.map((session) => <option key={session} value={session}>{session}</option>)}
                  </select>
                </label>

                <label className="admin-gallery__field">
                  <span>Created date <b>*</b></span>
                  <input type="date" name="date" value={form.date} onChange={updateForm} required />
                </label>
              </div>

              <div className="admin-gallery__upload-section">
                <div>
                  <strong>Gallery photographs</strong>
                  <p>Choose image files from your device. These previews are temporary until backend storage is connected.</p>
                </div>

                <input
                  ref={fileInputRef}
                  className="admin-gallery__file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFilesSelected}
                />

                <button type="button" className="admin-gallery__upload-button" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={17} />
                  Add photographs
                </button>
              </div>

              {editingGallery?.photos?.length > 0 && (
                <div className="admin-gallery__photo-grid">
                  {editingGallery.photos.map((photo, index) => {
                    const removed = removedPhotoIndexes.includes(index);

                    return (
                      <div className={`admin-gallery__photo ${removed ? "admin-gallery__photo--removed" : ""}`} key={`${photo.name}-${index}`}>
                        <img src={photo.url} alt={photo.name} />
                        <span title={photo.name}>{photo.name}</span>
                        <button type="button" onClick={() => toggleExistingPhotoRemoval(index)} aria-label={removed ? "Keep photograph" : "Remove photograph"}>
                          {removed ? <Plus size={15} /> : <X size={15} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {newFiles.length > 0 && (
                <div className="admin-gallery__selected-files">
                  <strong>{newFiles.length} new photograph{newFiles.length === 1 ? "" : "s"} selected</strong>
                  {newFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`}>
                      <span>{file.name}</span>
                      <button type="button" onClick={() => removeNewFile(index)} aria-label={`Remove ${file.name}`}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="admin-gallery__visibility-control">
                <span>
                  <strong>Gallery visible</strong>
                  <small>Allow this gallery to be marked as visible on the website.</small>
                </span>
                <input type="checkbox" name="visible" checked={form.visible} onChange={updateForm} />
              </label>

              {formError && <p className="admin-gallery__form-error" role="alert">{formError}</p>}

              <div className="admin-gallery__modal-actions">
                <button type="button" className="admin-gallery__button admin-gallery__button--secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="admin-gallery__button admin-gallery__button--primary">
                  <Save size={17} />
                  {editingId ? "Save changes" : "Create gallery"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* View details modal */}
      {selectedGallery && (
        <div className="admin-gallery__modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedGallery(null);
        }}>
          <section className="admin-gallery__modal" role="dialog" aria-modal="true" aria-labelledby="gallery-detail-title">
            <div className="admin-gallery__modal-header">
              <div>
                <span>GALLERY DETAILS · {selectedGallery.id}</span>
                <h2 id="gallery-detail-title">{selectedGallery.title}</h2>
                <p>Collection information and uploaded photographs.</p>
              </div>
              <button type="button" className="admin-gallery__action" onClick={() => setSelectedGallery(null)} aria-label="Close details">
                <X size={19} />
              </button>
            </div>

            <dl className="admin-gallery__details">
              <div><dt>Customer</dt><dd>{selectedGallery.customer}</dd></div>
              <div><dt>Photography session</dt><dd>{selectedGallery.session}</dd></div>
              <div><dt>Image count</dt><dd>{selectedGallery.imageCount} images</dd></div>
              <div><dt>Created date</dt><dd>{formatDate(selectedGallery.date)}</dd></div>
              <div><dt>Visibility</dt><dd><span className={`admin-gallery__badge ${selectedGallery.visible ? "admin-gallery__badge--visible" : "admin-gallery__badge--hidden"}`}>{selectedGallery.visible ? "Visible" : "Hidden"}</span></dd></div>
            </dl>

            {selectedGallery.photos?.length > 0 ? (
              <div className="admin-gallery__preview-grid">
                {selectedGallery.photos.map((photo, index) => (
                  <figure key={`${photo.name}-${index}`}>
                    <img src={photo.url} alt={photo.name} />
                    <figcaption>{photo.name}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="admin-gallery__no-photos">
                <ImagePlus size={25} />
                <strong>No uploaded previews</strong>
                <span>This demo record has an image count but no local preview files.</span>
              </div>
            )}

            <div className="admin-gallery__modal-actions">
              <button type="button" className="admin-gallery__button admin-gallery__button--secondary" onClick={() => toggleVisibility(selectedGallery)}>
                {selectedGallery.visible ? <EyeOff size={17} /> : <Eye size={17} />}
                {selectedGallery.visible ? "Hide gallery" : "Show gallery"}
              </button>
              <button type="button" className="admin-gallery__button admin-gallery__button--secondary" onClick={() => openEditForm(selectedGallery)}>
                <Pencil size={17} /> Edit
              </button>
              <button type="button" className="admin-gallery__button admin-gallery__button--primary" onClick={() => setSelectedGallery(null)}>Done</button>
            </div>
          </section>
        </div>
      )}

      {/* Delete confirmation is independent from the edit modal */}
      {galleryToDelete && (
        <div className="admin-gallery__modal-backdrop admin-gallery__modal-backdrop--confirm" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setGalleryToDelete(null);
        }}>
          <section className="admin-gallery__confirm" role="alertdialog" aria-modal="true" aria-labelledby="gallery-delete-title">
            <button type="button" className="admin-gallery__confirm-close" onClick={() => setGalleryToDelete(null)} aria-label="Cancel deletion">
              <X size={18} />
            </button>
            <div className="admin-gallery__confirm-icon"><AlertTriangle size={25} /></div>
            <span className="admin-gallery__eyebrow">DELETE COLLECTION</span>
            <h2 id="gallery-delete-title">Delete this gallery?</h2>
            <p>
              You are about to delete <strong>{galleryToDelete.title}</strong>.
              This action cannot be undone in this demo.
            </p>
            <div className="admin-gallery__confirm-summary">
              <Images size={18} />
              <span>{galleryToDelete.id} · {galleryToDelete.imageCount} images</span>
            </div>
            <div className="admin-gallery__modal-actions">
              <button type="button" className="admin-gallery__button admin-gallery__button--secondary" onClick={() => setGalleryToDelete(null)}>Keep gallery</button>
              <button type="button" className="admin-gallery__button admin-gallery__button--danger" onClick={deleteGallery}>
                <Trash2 size={17} /> Delete gallery
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
