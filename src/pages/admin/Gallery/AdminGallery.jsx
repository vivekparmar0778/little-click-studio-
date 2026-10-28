import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { createAdminGalleryService } from "../../../services/adminGalleryService";
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

const emptyForm = {
  collectionType: "customer",
  title: "",
  booking: "",
  description: "",
  visible: false,
  allow_downloads: false,
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function PrivatePhoto({ photo, galleryApi }) {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    let active = true;
    let objectUrl;
    galleryApi
      .photoFile(photo.id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreview({ url: objectUrl });
      })
      .catch(() => {
        if (active) setPreview({ error: true });
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [galleryApi, photo.id]);
  if (preview?.error) return <span role="status">Preview unavailable</span>;
  if (!preview?.url) return <span role="status">Loading photo...</span>;
  return (
    <img src={preview.url} alt={photo.alt_text || photo.title} loading="lazy" />
  );
}

async function collectPages(fetchPage) {
  const records = [];
  let page = 1;
  while (true) {
    const response = await fetchPage(page);
    if (Array.isArray(response)) return response;
    if (!Array.isArray(response?.results))
      throw new Error("Invalid list response from server.");
    records.push(...response.results);
    if (!response.next || !response.results.length) return records;
    page += 1;
  }
}

function normalizeGallery(gallery) {
  return {
    ...gallery,
    customer: gallery.booking
      ? gallery.customer_name || gallery.customer_email || "Customer"
      : "Public collection",

    session: gallery.booking
      ? gallery.service_name || "—"
      : "Website portfolio",
    imageCount: Number(gallery.photo_count || 0),
    date: gallery.created_at?.slice(0, 10) || "",
    visible: gallery.is_published,
  };
}

export default function AdminGallery() {
  const { apiRequest, apiBlobRequest } = useAuth();
  const galleryApi = useMemo(
    () => createAdminGalleryService(apiRequest, apiBlobRequest),
    [apiRequest, apiBlobRequest],
  );
  const [galleries, setGalleries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [newFiles, setNewFiles] = useState([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [galleryToDelete, setGalleryToDelete] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const viewVersion = useRef(0);
  const listVersion = useRef(0);
  const fileInputRef = useRef(null);

  const fetchGalleries = useCallback(async () => {
    const records = await collectPages((page) =>
      galleryApi.list({ page, page_size: 100 }),
    );
    return records.map(normalizeGallery);
  }, [galleryApi]);

  const fetchPhotos = useCallback(
    (id) =>
      collectPages((page) =>
        galleryApi.listPhotos(id, { page, page_size: 100 }),
      ),
    [galleryApi],
  );

  const refreshGalleries = useCallback(async () => {
    const version = ++listVersion.current;
    const records = await fetchGalleries();
    if (mountedRef.current && version === listVersion.current)
      setGalleries(records);
  }, [fetchGalleries]);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    const version = ++listVersion.current;
    Promise.all([
      fetchGalleries(),
      collectPages((page) => galleryApi.listBookings({ page, page_size: 100 })),
    ])
      .then(([collections, bookingRecords]) => {
        if (!active) return;
        if (version === listVersion.current) setGalleries(collections);
        setBookings(bookingRecords);
      })
      .catch((error) => {
        if (active) setNotice(error.message || "Unable to load gallery data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      mountedRef.current = false;
    };
  }, [fetchGalleries, galleryApi]);

  const editingGallery = editingId ? { photos: existingPhotos } : null;
  const chosenBooking = bookings.find(
    (booking) => String(booking.id) === String(form.booking),
  );
  const availableBookings = bookings.filter(
    (booking) =>
      String(booking.id) === String(form.booking) ||
      !galleries.some(
        (gallery) => String(gallery.booking) === String(booking.id),
      ),
  );
  const filteredGalleries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return galleries.filter((gallery) => {
      const matchesSearch = [
        gallery.id,
        gallery.title,
        gallery.customer,
        gallery.session,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
      return (
        matchesSearch &&
        (visibility === "all" ||
          (visibility === "public" ? !gallery.booking : gallery.booking && (visibility === "visible" ? gallery.visible : !gallery.visible)))
      );
    });
  }, [galleries, search, visibility]);
  const visibleCount = galleries.filter((gallery) => gallery.visible).length;
  const hiddenCount = galleries.filter((gallery) => gallery.booking && !gallery.visible).length;
  const totalImages = galleries.reduce(
    (total, gallery) => total + gallery.imageCount,
    0,
  );

  const closeForm = () => {
    if (busyRef.current) return;
    viewVersion.current += 1;
    setIsFormOpen(false);
    setEditingId(null);
    setFormError("");
    setNewFiles([]);
    setRemovedPhotoIds([]);
    setExistingPhotos([]);
  };

  useEffect(() => {
    if (!isFormOpen && !selectedGallery && !galleryToDelete) return;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape" || busyRef.current) return;
      viewVersion.current += 1;
      setIsFormOpen(false);
      setSelectedGallery(null);
      setGalleryToDelete(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen, selectedGallery, galleryToDelete]);

  const openCreateForm = () => {
    if (busyRef.current) return;
    viewVersion.current += 1;
    setEditingId(null);
    setForm({ ...emptyForm });
    setNewFiles([]);
    setRemovedPhotoIds([]);
    setExistingPhotos([]);
    setFormError("");
    setPhotosLoading(false);
    setIsFormOpen(true);
  };

  const openEditForm = async (gallery) => {
    if (busyRef.current) return;
    const version = ++viewVersion.current;
    setEditingId(gallery.id);
    setForm({
      collectionType: gallery.booking ? "customer" : "public",
      title: gallery.title,
      booking: gallery.booking ? String(gallery.booking) : "",
      description: gallery.description || "",
      visible: gallery.visible,
      allow_downloads: gallery.allow_downloads,
    });
    setNewFiles([]);
    setRemovedPhotoIds([]);
    setExistingPhotos([]);
    setFormError("");
    setSelectedGallery(null);
    setPhotosLoading(true);
    setIsFormOpen(true);
    try {
      const photos = await fetchPhotos(gallery.id);
      if (version === viewVersion.current) setExistingPhotos(photos);
    } catch (error) {
      if (version === viewVersion.current)
        setFormError(error.message || "Unable to load photos.");
    } finally {
      if (version === viewVersion.current) setPhotosLoading(false);
    }
  };

  const openDetails = async (gallery) => {
    if (busyRef.current) return;
    const version = ++viewVersion.current;
    setSelectedGallery({ ...gallery, photos: [] });
    setPhotosLoading(true);
    try {
      const photos = await fetchPhotos(gallery.id);
      if (version === viewVersion.current)
        setSelectedGallery({ ...gallery, photos });
    } catch (error) {
      if (version === viewVersion.current)
        setNotice(error.message || "Unable to load photos.");
    } finally {
      if (version === viewVersion.current) setPhotosLoading(false);
    }
  };

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    const accepted = files.filter(
      (file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
        file.size <= 20 * 1024 * 1024,
    );
    setNewFiles((current) => [...current, ...accepted]);
    setFormError(
      accepted.length !== files.length
        ? "Use JPEG, PNG or WebP images no larger than 20 MB each."
        : "",
    );
    event.target.value = "";
  };
  const removeNewFile = (index) => {
    if (!busyRef.current)
      setNewFiles((current) => current.filter((_, i) => i !== index));
  };
  const toggleExistingPhotoRemoval = (id) => {
    if (!busyRef.current)
      setRemovedPhotoIds((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      );
  };

  const saveGallery = async (event) => {
    event.preventDefault();
    if (busyRef.current || photosLoading) return;
    if (!form.title.trim() || (form.collectionType === "customer" && !form.booking)) {
      setFormError("Enter a title and select a booking for a customer gallery.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setFormError("");
    let galleryId = editingId;
    let metadataSaved = false;
    try {
      const metadata = {
        title: form.title.trim(),
        description: form.description.trim(),
        allow_downloads: form.collectionType === "customer" && form.allow_downloads,
      };
      if (!galleryId) {
        const created = await galleryApi.create({
          ...metadata,
          booking: form.collectionType === "customer" ? form.booking : null,
          is_published: false,
        });
        galleryId = created.id;
        setEditingId(galleryId);
      } else {
        await galleryApi.update(galleryId, metadata);
      }
      metadataSaved = true;
      // Each successful upload is removed from the queue, so retries do not duplicate it.
      let nextPosition = existingPhotos.reduce(
        (max, photo) => Math.max(max, photo.position + 1),
        0,
      );
      for (const file of newFiles) {
        const uploaded = await galleryApi.uploadPhoto(galleryId, file, {
          position: nextPosition,
        });
        nextPosition += 1;
        setExistingPhotos((current) => [...current, uploaded]);
        setNewFiles((current) => current.filter((item) => item !== file));
      }
      for (const id of removedPhotoIds) {
        await galleryApi.removePhoto(id);
        setExistingPhotos((current) =>
          current.filter((photo) => photo.id !== id),
        );
        setRemovedPhotoIds((current) => current.filter((item) => item !== id));
      }
      await galleryApi.update(galleryId, {
        is_published: form.collectionType === "customer" && form.visible,
      });
      setIsFormOpen(false);
      setNewFiles([]);
      setRemovedPhotoIds([]);
      setNotice(`"${form.title.trim()}" was saved successfully.`);
      try {
        await refreshGalleries();
      } catch (error) {
        setNotice(`Gallery saved. List refresh failed: ${error.message}`);
      }
    } catch (error) {
      setFormError(
        `${metadataSaved ? "Gallery details were saved. " : ""}${error.message || "Unable to save gallery."} Remaining changes can be retried.`,
      );
      if (metadataSaved) {
        try {
          await refreshGalleries();
        } catch {
          /* Keep the actionable form error. */
        }
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const toggleVisibility = async (gallery) => {
    if (busyRef.current || !gallery.booking) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const response = normalizeGallery(
        await galleryApi.update(gallery.id, { is_published: !gallery.visible }),
      );
      setGalleries((current) =>
        current.map((item) => (item.id === gallery.id ? response : item)),
      );
      setSelectedGallery((current) =>
        current?.id === gallery.id ? { ...current, ...response } : current,
      );
      setNotice(
        `"${gallery.title}" is now ${response.visible ? "visible to its customer" : "hidden"}.`,
      );
    } catch (error) {
      setNotice(error.message || "Unable to change visibility.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const togglePublicPhoto = async (photo) => {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setNotice("");

    try {
      const updated = await apiRequest(`galleries/admin/photos/${photo.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_public: !photo.is_public,
        }),
      });

      if (typeof updated?.is_public !== "boolean") {
        throw new Error(
          "Photo response is missing is_public. Check AdminPhotoSerializer.",
        );
      }

      if (!mountedRef.current) return;

      setExistingPhotos((current) =>
        current.map((item) =>
          item.id === photo.id ? { ...item, ...updated } : item,
        ),
      );

      setSelectedGallery((current) =>
        current
          ? {
              ...current,
              photos: current.photos.map((item) =>
                item.id === photo.id ? { ...item, ...updated } : item,
              ),
            }
          : current,
      );

      setNotice(
        updated.is_public
          ? `"${photo.title}" is now published in the public portfolio.`
          : `"${photo.title}" is now hidden from the public portfolio.`,
      );
    } catch (error) {
      if (mountedRef.current) {
        setNotice(error.message || "Unable to update public photo visibility.");
      }
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  };
  const deleteGallery = async () => {
    if (!galleryToDelete || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const gallery = galleryToDelete;
    try {
      await galleryApi.remove(gallery.id);
      setGalleries((current) =>
        current.filter((item) => item.id !== gallery.id),
      );
      setSelectedGallery((current) =>
        current?.id === gallery.id ? null : current,
      );
      setGalleryToDelete(null);
      setNotice(`"${gallery.title}" and its photos were deleted.`);
    } catch (error) {
      setGalleryToDelete(null);
      setNotice(error.message || "Unable to delete gallery.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="admin-gallery">
      <header className="admin-gallery__header">
        <div>
          <span className="admin-gallery__eyebrow">STUDIO CONTENT</span>
          <h1>Gallery Management</h1>
          <p>
            Create collections, manage photographs and control gallery
            visibility.
          </p>
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
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="admin-gallery__stats">
        <article className="admin-gallery__stat">
          <span>Total galleries</span>
          <strong>{galleries.length}</strong>
          <small>Customer and public collections</small>
        </article>
        <article className="admin-gallery__stat">
          <span>Customer visible galleries</span>
          <strong>{visibleCount}</strong>
          <small>Marked as visible</small>
        </article>
        <article className="admin-gallery__stat">
          <span>Customer hidden galleries</span>
          <strong>{hiddenCount}</strong>
          <small>Not marked as visible</small>
        </article>
        <article className="admin-gallery__stat">
          <span>Total images</span>
          <strong>{totalImages}</strong>
          <small>Photographs stored in collections</small>
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
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
          >
            <option value="all">All galleries</option>
            <option value="public">Public collections</option>
            <option value="visible">Customer visible</option>
            <option value="hidden">Customer hidden</option>
          </select>
        </label>
      </div>

      {loading && <p role="status">Loading galleries and bookings...</p>}

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
                  <span
                    className={`admin-gallery__badge ${gallery.visible ? "admin-gallery__badge--visible" : "admin-gallery__badge--hidden"}`}
                  >
                    {!gallery.booking ? "Public: per-photo controls" : gallery.visible ? "Customer: visible" : "Customer: hidden"}
                  </span>
                </td>
                <td>
                  <div className="admin-gallery__actions">
                    <button
                      type="button"
                      className="admin-gallery__action"
                      onClick={() => openDetails(gallery)}
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
                      disabled={busy || !gallery.booking}
                      onClick={() => toggleVisibility(gallery)}
                      aria-label={`${gallery.visible ? "Hide" : "Show"} ${gallery.title}`}
                      title={gallery.visible ? "Hide gallery" : "Show gallery"}
                    >
                      {gallery.visible ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
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

            {!loading && filteredGalleries.length === 0 && (
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
          <section
            className="admin-gallery__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-form-title"
          >
            <div className="admin-gallery__modal-header">
              <div>
                <span>
                  {editingId ? "UPDATE COLLECTION" : "NEW COLLECTION"}
                </span>
                <h2 id="gallery-form-title">
                  {editingId ? "Edit gallery" : "Create gallery"}
                </h2>
                <p>Enter collection details and manage photographs.</p>
              </div>
              <button
                type="button"
                className="admin-gallery__action"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            <form className="admin-gallery__form" onSubmit={saveGallery}>
              <fieldset
                disabled={busy}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
                <label className="admin-gallery__field">
                  <span>Collection type</span>
                  <select
                    value={form.collectionType}
                    disabled={Boolean(editingId) || busy}
                    onChange={(event) => {
                      const collectionType = event.target.value;
                      setForm((current) => ({
                        ...current,
                        collectionType,
                        booking: "",
                        visible: false,
                        allow_downloads: false,
                      }));
                    }}
                  >
                    <option value="customer">Customer private gallery</option>
                    <option value="public">Public portfolio collection</option>
                  </select>
                  <small>
                    Public collections need no booking. Save uploaded photos,
                    then open View details to publish individual photos.
                  </small>
                </label>
                <label className="admin-gallery__field">
                  <span>
                    Gallery title <b>*</b>
                  </span>
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateForm}
                    maxLength={150}
                    required
                    placeholder="e.g. A Little Beginning"
                  />
                </label>

                {form.collectionType === "customer" && (
                <label className="admin-gallery__field">
                  <span>
                    Booking <b>*</b>
                  </span>
                  <select
                    name="booking"
                    value={form.booking}
                    onChange={updateForm}
                    required
                    disabled={Boolean(editingId) || busy}
                  >
                    <option value="">Select a customer booking</option>
                    {availableBookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.contact_name ||
                          booking.customer_name ||
                          booking.customer_email ||
                          booking.id}
                        {" · "}
                        {booking.service_name ||
                          booking.service?.name ||
                          "Booking"}
                        {" · "}
                        {booking.preferred_date || booking.session_date || ""}
                        {" · "}
                        {booking.id}
                      </option>
                    ))}
                    {form.booking && !chosenBooking && (
                      <option value={form.booking}>{form.booking}</option>
                    )}
                  </select>
                  <small>
                    One gallery per booking. Customer, service and session date
                    come from the booking.
                  </small>
                </label>
                )}
                <label className="admin-gallery__field">
                  <span>Description</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateForm}
                    maxLength={1000}
                    rows={3}
                  />
                </label>

                <div className="admin-gallery__upload-section">
                  <div>
                    <strong>Gallery photographs</strong>
                    <p>
                      JPEG, PNG or WebP; up to 20 MB per image and 40
                      megapixels. Uploads are saved when you submit the form.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    className="admin-gallery__file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFilesSelected}
                  />

                  <button
                    type="button"
                    className="admin-gallery__upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={17} />
                    Add photographs
                  </button>
                </div>

                {editingGallery?.photos?.length > 0 && (
                  <div className="admin-gallery__photo-grid">
                    {editingGallery.photos.map((photo) => {
                      const removed = removedPhotoIds.includes(photo.id);

                      return (
                        <div
                          className={`admin-gallery__photo ${removed ? "admin-gallery__photo--removed" : ""}`}
                          key={photo.id}
                        >
                          <PrivatePhoto
                            key={photo.id}
                            photo={photo}
                            galleryApi={galleryApi}
                          />
                          <span title={photo.title}>{photo.title}</span>
                          <button
                            type="button"
                            onClick={() => toggleExistingPhotoRemoval(photo.id)}
                            aria-label={
                              removed ? "Keep photograph" : "Remove photograph"
                            }
                          >
                            {removed ? <Plus size={15} /> : <X size={15} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {newFiles.length > 0 && (
                  <div className="admin-gallery__selected-files">
                    <strong>
                      {newFiles.length} new photograph
                      {newFiles.length === 1 ? "" : "s"} selected
                    </strong>
                    {newFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`}>
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeNewFile(index)}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {form.collectionType === "customer" && (
                  <>
                <label className="admin-gallery__visibility-control">
                  <span>
                    <strong>Gallery visible</strong>
                    <small>
                      Allow the customer linked to this booking to access this
                      gallery.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    name="visible"
                    checked={form.visible}
                    onChange={updateForm}
                  />
                </label>

                <label className="admin-gallery__visibility-control">
                  <span>
                    <strong>Allow downloads</strong>
                    <small>
                      Let this customer download original photographs.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    name="allow_downloads"
                    checked={form.allow_downloads}
                    onChange={updateForm}
                  />
                </label>
                  </>
                )}
                {photosLoading && <p role="status">Loading photographs...</p>}

                {formError && (
                  <p className="admin-gallery__form-error" role="alert">
                    {formError}
                  </p>
                )}

                <div className="admin-gallery__modal-actions">
                  <button
                    type="button"
                    className="admin-gallery__button admin-gallery__button--secondary"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy || photosLoading}
                    className="admin-gallery__button admin-gallery__button--primary"
                  >
                    <Save size={17} />
                    {busy
                      ? "Saving..."
                      : editingId
                        ? "Save changes"
                        : "Create gallery"}
                  </button>
                </div>
              </fieldset>
            </form>
          </section>
        </div>
      )}

      {/* View details modal */}
      {selectedGallery && (
        <div
          className="admin-gallery__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedGallery(null);
          }}
        >
          <section
            className="admin-gallery__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-detail-title"
          >
            <div className="admin-gallery__modal-header">
              <div>
                <span>GALLERY DETAILS · {selectedGallery.id}</span>
                <h2 id="gallery-detail-title">{selectedGallery.title}</h2>
                <p>Collection information and uploaded photographs.</p>
              </div>
              <button
                type="button"
                className="admin-gallery__action"
                onClick={() => setSelectedGallery(null)}
                aria-label="Close details"
              >
                <X size={19} />
              </button>
            </div>

            <dl className="admin-gallery__details">
              <div>
                <dt>Customer</dt>
                <dd>{selectedGallery.customer}</dd>
              </div>
              <div>
                <dt>Photography session</dt>
                <dd>{selectedGallery.session}</dd>
              </div>
              <div>
                <dt>Session date</dt>
                <dd>{formatDate(selectedGallery.session_date)}</dd>
              </div>
              <div>
                <dt>Image count</dt>
                <dd>{selectedGallery.imageCount} images</dd>
              </div>
              <div>
                <dt>Created date</dt>
                <dd>{formatDate(selectedGallery.date)}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>
                  <span
                    className={`admin-gallery__badge ${selectedGallery.visible ? "admin-gallery__badge--visible" : "admin-gallery__badge--hidden"}`}
                  >
                    {!selectedGallery.booking ? "Public: per-photo controls" : selectedGallery.visible ? "Customer: visible" : "Customer: hidden"}
                  </span>
                </dd>
              </div>
            </dl>

            {photosLoading ? (
              <p role="status">Loading photographs...</p>
            ) : selectedGallery.photos?.length > 0 ? (
              <div className="admin-gallery__preview-grid">
                {selectedGallery.photos.map((photo) => (
                  <figure key={photo.id}>
                    <PrivatePhoto photo={photo} galleryApi={galleryApi} />

                    <figcaption>
                      <strong>{photo.title}</strong>

                      <p>
                        {photo.is_public
                          ? "Published in public portfolio"
                          : "Hidden from public portfolio"}
                      </p>

                      {!photo.is_public && (
                        <small>
                          Publish only photographs approved for public display.
                        </small>
                      )}

                      <div>
                        <button
                          type="button"
                          className="admin-gallery__button admin-gallery__button--secondary"
                          disabled={busy}
                          onClick={() => togglePublicPhoto(photo)}
                        >
                          {photo.is_public ? (
                            <EyeOff size={16} aria-hidden="true" />
                          ) : (
                            <Eye size={16} aria-hidden="true" />
                          )}

                          {busy
                            ? "Please wait..."
                            : photo.is_public
                              ? "Hide from portfolio"
                              : "Publish to portfolio"}
                        </button>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="admin-gallery__no-photos">
                <ImagePlus size={25} />
                <strong>No uploaded previews</strong>
                <span>Upload photographs using Edit gallery.</span>
              </div>
            )}

            <div className="admin-gallery__modal-actions">
              <button
                type="button"
                className="admin-gallery__button admin-gallery__button--secondary"
                disabled={busy || !selectedGallery.booking}
                onClick={() => toggleVisibility(selectedGallery)}
              >
                {selectedGallery.visible ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
                {selectedGallery.visible ? "Hide gallery" : "Show gallery"}
              </button>
              <button
                type="button"
                className="admin-gallery__button admin-gallery__button--secondary"
                onClick={() => openEditForm(selectedGallery)}
              >
                <Pencil size={17} /> Edit
              </button>
              <button
                type="button"
                className="admin-gallery__button admin-gallery__button--primary"
                onClick={() => setSelectedGallery(null)}
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Delete confirmation is independent from the edit modal */}
      {galleryToDelete && (
        <div
          className="admin-gallery__modal-backdrop admin-gallery__modal-backdrop--confirm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setGalleryToDelete(null);
          }}
        >
          <section
            className="admin-gallery__confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="gallery-delete-title"
          >
            <button
              type="button"
              className="admin-gallery__confirm-close"
              onClick={() => setGalleryToDelete(null)}
              aria-label="Cancel deletion"
            >
              <X size={18} />
            </button>
            <div className="admin-gallery__confirm-icon">
              <AlertTriangle size={25} />
            </div>
            <span className="admin-gallery__eyebrow">DELETE COLLECTION</span>
            <h2 id="gallery-delete-title">Delete this gallery?</h2>
            <p>
              You are about to delete <strong>{galleryToDelete.title}</strong>.
              This permanently removes the collection and its photographs.
            </p>
            <div className="admin-gallery__confirm-summary">
              <Images size={18} />
              <span>
                {galleryToDelete.id} · {galleryToDelete.imageCount} images
              </span>
            </div>
            <div className="admin-gallery__modal-actions">
              <button
                type="button"
                className="admin-gallery__button admin-gallery__button--secondary"
                onClick={() => setGalleryToDelete(null)}
              >
                Keep gallery
              </button>
              <button
                type="button"
                className="admin-gallery__button admin-gallery__button--danger"
                onClick={deleteGallery}
                disabled={busy}
              >
                <Trash2 size={17} /> Delete gallery
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
