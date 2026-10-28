import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { createAdminServicesService } from "../../../services/adminServicesService";
import {
  Camera,
  Check,
  Eye,
  Image,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
  Plus,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

const categories = ["All", "Newborn", "Maternity", "Baby", "Family", "Other"];

const emptyServiceForm = {
  name: "",
  category: "Newborn",
  price: "",
  duration: "",
  description: "",
  active: true,
};

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminServices() {
  const { apiRequest } = useAuth();
  const servicesApi = useMemo(() => createAdminServicesService(apiRequest), [apiRequest]);
  const requestVersion = useRef(0);
  const mounted = useRef(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedService, setSelectedService] = useState(null);
  const [notice, setNotice] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyServiceForm });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const fetchServices = useCallback(async () => {
    const records = [];
    let currentPage = 1;
    let total = Infinity;
    while (records.length < total) {
      const response = await servicesApi.list({ page: currentPage, page_size: 100 });
      if (!Array.isArray(response?.results)) throw new Error("Invalid services response.");
      records.push(...response.results);
      total = Number(response.count);
      if (!response.results.length || !response.next) break;
      currentPage += 1;
    }
    return records.map((service) => ({
      ...service,
      category: service.category || "Other",
      active: service.is_active,
      duration: `${service.duration_minutes} minutes`,
    }));
  }, [servicesApi]);

  const refreshServices = useCallback(async () => {
    const version = ++requestVersion.current;
    const records = await fetchServices();
    if (mounted.current && version === requestVersion.current) setServices(records);
  }, [fetchServices]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    const version = ++requestVersion.current;
    fetchServices()
      .then((records) => {
        if (active && version === requestVersion.current) setServices(records);
      })
      .catch((error) => {
        if (active) setNotice(error.message || "Unable to load services.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [fetchServices]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return services.filter((service) => {
      const matchesSearch = [service.id, service.name, service.category, service.description]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
      return matchesSearch && (category === "All" || service.category === category)
        && (statusFilter === "All" || (statusFilter === "Active" ? service.active : !service.active));
    });
  }, [services, search, category, statusFilter]);
  const activeCount = services.filter((service) => service.active).length;
  const inactiveCount = services.length - activeCount;
  const categoryCount = new Set(services.map((service) => service.category)).size;

  function openAddForm() {
    setEditingId(null);
    setFormData({ ...emptyServiceForm });
    setFormError("");
    setSelectedService(null);
    setIsFormOpen(true);
  }
  function openEditForm(service) {
    setEditingId(service.id);
    setFormData({ name: service.name, category: service.category, price: String(service.price),
      duration: String(service.duration_minutes), description: service.description, active: service.active });
    setSelectedService(null);
    setFormError("");
    setIsFormOpen(true);
  }
  function closeForm() {
    if (busyRef.current) return;
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ ...emptyServiceForm });
    setFormError("");
  }
  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }
  async function handleSaveService(event) {
    event.preventDefault();
    if (busyRef.current) return;
    const price = Number(formData.price);
    const duration = Number(formData.duration);
    if (!formData.name.trim() || !formData.description.trim() || formData.price.trim() === ""
      || !Number.isFinite(price) || price < 0 || !Number.isInteger(duration) || duration < 1) {
      setFormError("Enter a name, description, non-negative price and duration in whole minutes.");
      return;
    }
    const payload = { name: formData.name.trim(), category: formData.category,
      price: price.toFixed(2), duration_minutes: duration,
      description: formData.description.trim(), is_active: formData.active };
    busyRef.current = true;
    setBusy(true);
    setFormError("");
    try {
      if (editingId !== null) await servicesApi.update(editingId, payload);
      else await servicesApi.create(payload);
    } catch (error) {
      setFormError(error.message || "Unable to save service.");
      busyRef.current = false;
      setBusy(false);
      return;
    }
    setIsFormOpen(false);
    setEditingId(null);
    setNotice("Service saved successfully.");
    try { await refreshServices(); }
    catch (error) { setNotice(`Service saved, but the list could not refresh: ${error.message}`); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function toggleService(id) {
    if (busyRef.current) return;
    const service = services.find((item) => item.id === id);
    if (!service) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await servicesApi.update(id, { is_active: !service.active });
      setServices((current) => current.map((item) => item.id === id ? { ...item, active: !service.active, is_active: !service.active } : item));
      setSelectedService((current) => current?.id === id ? { ...current, active: !service.active } : current);
      setNotice(`${service.name} marked ${service.active ? "inactive" : "active"}.`);
    } catch (error) { setNotice(error.message || "Unable to change service status."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  function deleteService(service) { setServiceToDelete(service); }
  async function confirmDeleteService() {
    if (!serviceToDelete || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const service = serviceToDelete;
    try {
      await servicesApi.remove(service.id);
      setServices((current) => current.filter((item) => item.id !== service.id));
      setSelectedService((current) => current?.id === service.id ? null : current);
      setServiceToDelete(null);
      setNotice(`${service.name} deleted successfully.`);
    } catch (error) {
      setServiceToDelete(null);
      setNotice(error.message || "Unable to delete service.");
    } finally { busyRef.current = false; setBusy(false); }
  }
  function clearFilters() { setSearch(""); setCategory("All"); setStatusFilter("All"); }

  return (
    <section className="admin-services">
      {/* Page heading */}
      <header className="admin-services__heading">
        <div>
          <p className="admin-services__eyebrow">STUDIO MANAGEMENT</p>
          <h1>Services &amp; packages</h1>
          <p className="admin-services__description">
            Curate the photography experiences offered to every family.
          </p>
        </div>

        <div className="admin-services__heading-actions">
          <span className="admin-services__heading-mark" aria-hidden="true">
            <Camera size={22} />
          </span>

          <button
            type="button"
            className="admin-services__add-button"
            onClick={openAddForm}
          >
            <Plus size={18} />
            <span>Add service</span>
          </button>
        </div>
      </header>

      {/* Summary cards */}
      <div className="admin-services__stats">
        <article className="admin-services__stat">
          <span>Total services</span>
          <strong>{services.length}</strong>
          <Camera size={19} aria-hidden="true" />
        </article>

        <article className="admin-services__stat">
          <span>Active services</span>
          <strong>{activeCount}</strong>
          <Check size={19} aria-hidden="true" />
        </article>

        <article className="admin-services__stat">
          <span>Inactive services</span>
          <strong>{inactiveCount}</strong>
          <ToggleLeft size={19} aria-hidden="true" />
        </article>

        <article className="admin-services__stat">
          <span>Service categories</span>
          <strong>{categoryCount}</strong>
          <Image size={19} aria-hidden="true" />
        </article>
      </div>

      {/* Service catalogue */}
      <div className="admin-services__panel">
        <div className="admin-services__panel-heading">
          <div>
            <h2>Service catalogue</h2>
            <p>Review packages and control their availability.</p>
          </div>

          <span className="admin-services__result-count">
            {filteredServices.length} results
          </span>
        </div>

        {/* Search and filters */}
        <div className="admin-services__filters">
          <label className="admin-services__search">
            <Search size={18} aria-hidden="true" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search services or packages"
              aria-label="Search services"
            />
          </label>

          <label className="admin-services__select">
            <span>Category</span>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-services__select">
            <span>Status</span>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </div>

        {/* Feedback notification */}
        {notice && (
          <div className="admin-services__notice" role="status">
            <Check size={16} aria-hidden="true" />
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

        {loading && <p role="status">Loading services...</p>}

        {/* Table */}
        <div className="admin-services__table-wrap">
          <table className="admin-services__table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div className="admin-services__identity">
                      <span className="admin-services__service-icon">
                        <Camera size={18} aria-hidden="true" />
                      </span>

                      <span>
                        <strong>{service.name}</strong>
                        <small>{service.id}</small>
                      </span>
                    </div>
                  </td>

                  <td>{service.category}</td>

                  <td className="admin-services__price">
                    {formatPrice(service.price)}
                  </td>

                  <td>{service.duration}</td>

                  <td>
                    <span
                      className={`admin-services__status admin-services__status--${
                        service.active ? "active" : "inactive"
                      }`}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <div className="admin-services__actions">
                      <button
                        type="button"
                        className="admin-services__icon-button"
                        onClick={() => setSelectedService(service)}
                        aria-label={`View ${service.name}`}
                        title="View details"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        className="admin-services__icon-button"
                        onClick={() => openEditForm(service)}
                        aria-label={`Edit ${service.name}`}
                        title="Edit service"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="admin-services__icon-button"
                        disabled={busy}
                        onClick={() => toggleService(service.id)}
                        aria-label={`${
                          service.active ? "Deactivate" : "Activate"
                        } ${service.name}`}
                        title={
                          service.active
                            ? "Deactivate service"
                            : "Activate service"
                        }
                      >
                        {service.active ? (
                          <ToggleRight size={19} />
                        ) : (
                          <ToggleLeft size={19} />
                        )}
                      </button>

                      <button
                        type="button"
                        className="admin-services__icon-button"
                        disabled={busy}
                        onClick={() => deleteService(service)}
                        aria-label={`Delete ${service.name}`}
                        title="Delete service"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredServices.length === 0 && (
            <div className="admin-services__empty">
              <Search size={24} aria-hidden="true" />
              <h3>No services found</h3>
              <p>Try another search term or change the filters.</p>

              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View service details modal */}
      {selectedService && (
        <div
          className="admin-services__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedService(null);
            }
          }}
        >
          <section
            className="admin-services__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-dialog-title"
          >
            <div className="admin-services__modal-heading">
              <div>
                <p className="admin-services__eyebrow">SERVICE DETAILS</p>
                <h2 id="service-dialog-title">{selectedService.name}</h2>
              </div>

              <button
                type="button"
                className="admin-services__modal-close"
                onClick={() => setSelectedService(null)}
                aria-label="Close service details"
              >
                <X size={20} />
              </button>
            </div>

            <p className="admin-services__modal-description">
              {selectedService.description}
            </p>

            <dl className="admin-services__details">
              <div>
                <dt>Service ID</dt>
                <dd>{selectedService.id}</dd>
              </div>

              <div>
                <dt>Category</dt>
                <dd>{selectedService.category}</dd>
              </div>

              <div>
                <dt>Price</dt>
                <dd>{formatPrice(selectedService.price)}</dd>
              </div>

              <div>
                <dt>Duration</dt>
                <dd>{selectedService.duration}</dd>
              </div>

              <div>
                <dt>Availability</dt>
                <dd>{selectedService.active ? "Active" : "Inactive"}</dd>
              </div>
            </dl>

            <div className="admin-services__modal-actions">
              <button
                type="button"
                className="admin-services__action"
                onClick={() => openEditForm(selectedService)}
              >
                <Pencil size={16} />
                Edit service
              </button>

              <button
                type="button"
                className="admin-services__action admin-services__action--primary"
                onClick={() => setSelectedService(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Add/Edit service modal: independent of the details modal */}
      {isFormOpen && (
        <div
          className="admin-services__modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <section
            className="admin-services__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-form-title"
          >
            <div className="admin-services__modal-heading">
              <div>
                <p className="admin-services__eyebrow">STUDIO MANAGEMENT</p>

                <h2 id="service-form-title">
                  {editingId ? "Edit service" : "Add a new service"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-services__modal-close"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form className="admin-services__form" onSubmit={handleSaveService}>
              <label>
                Service name
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Newborn Photography"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                >
                  {categories
                    .filter((item) => item !== "All")
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Price (₹)
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  placeholder="12999"
                  min="0"
                  step="0.01"
                  required
                />
              </label>

              <label>
                Session duration (minutes)
                <input
                  name="duration"
                  value={formData.duration}
                  onChange={handleFormChange}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 120"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe this photography experience..."
                  rows={4}
                  maxLength={1000}
                  required
                />
              </label>

              <label className="admin-services__form-checkbox">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />
                Make this service active
              </label>

              {formError && (
                <p className="admin-services__form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="admin-services__modal-actions">
                <button
                  type="button"
                  className="admin-services__action"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className="admin-services__action admin-services__action--primary"
                >
                  <Save size={16} />
                  {busy ? "Saving..." : editingId ? "Save changes" : "Create service"}
                </button>
              </div>
            </form>

           
          </section>
        </div>
      )}
       {serviceToDelete && (
              <div
                className="admin-services__confirm-backdrop"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setServiceToDelete(null);
                  }
                }}
              >
                <section
                  className="admin-services__confirm-modal"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="delete-service-title"
                  aria-describedby="delete-service-description"
                >
                  <button
                    type="button"
                    className="admin-services__confirm-close"
                    onClick={() => setServiceToDelete(null)}
                    aria-label="Close confirmation"
                  >
                    <X size={20} />
                  </button>

                  <div className="admin-services__confirm-icon">
                    <Trash2 size={25} />
                  </div>

                  <p className="admin-services__eyebrow">CONFIRM DELETION</p>

                  <h2 id="delete-service-title">Delete this service?</h2>

                  <p
                    id="delete-service-description"
                    className="admin-services__confirm-description"
                  >
                    Are you sure you want to delete{" "}
                    <strong>{serviceToDelete.name}</strong>? This action cannot
                    be undone.
                  </p>

                  <div className="admin-services__confirm-summary">
                    <span className="admin-services__confirm-summary-icon">
                      <Camera size={20} />
                    </span>

                    <div>
                      <strong>{serviceToDelete.name}</strong>
                      <span>
                        {serviceToDelete.category} ·{" "}
                        {formatPrice(serviceToDelete.price)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-services__confirm-actions">
                    <button
                      type="button"
                      className="admin-services__confirm-cancel"
                      onClick={() => setServiceToDelete(null)}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="admin-services__confirm-delete"
                      onClick={confirmDeleteService}
                      disabled={busy}
                    >
                      <Trash2 size={17} />
                      Delete service
                    </button>
                  </div>
                </section>
              </div>
            )}
    </section>
  );
}
