import { useMemo, useState } from "react";
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

const initialServices = [
  {
    id: "SRV-001",
    name: "Newborn Photography",
    category: "Newborn",
    price: 12999,
    duration: "2–3 hours",
    description:
      "Gentle, timeless portraits capturing your newborn's earliest days.",
    active: true,
  },
  {
    id: "SRV-002",
    name: "Maternity Portraits",
    category: "Maternity",
    price: 8999,
    duration: "90 minutes",
    description:
      "Elegant maternity portraits celebrating the journey to motherhood.",
    active: true,
  },
  {
    id: "SRV-003",
    name: "Baby Milestone Session",
    category: "Baby",
    price: 6999,
    duration: "60–90 minutes",
    description:
      "Beautiful portraits for first smiles, sitting milestones and little celebrations.",
    active: true,
  },
  {
    id: "SRV-004",
    name: "Family Portrait Session",
    category: "Family",
    price: 7999,
    duration: "60 minutes",
    description: "Natural family portraits filled with warmth and connection.",
    active: false,
  },
];

const categories = ["All", "Newborn", "Maternity", "Baby", "Family"];

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
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [services, setServices] = useState(initialServices);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedService, setSelectedService] = useState(null);
  const [notice, setNotice] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyServiceForm });
  const [formError, setFormError] = useState("");

  // Search and filter services.
  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch = [
        service.id,
        service.name,
        service.category,
        service.description,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesCategory =
        category === "All" || service.category === category;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && service.active) ||
        (statusFilter === "Inactive" && !service.active);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, search, category, statusFilter]);

  const activeCount = services.filter((service) => service.active).length;
  const inactiveCount = services.length - activeCount;
  const categoryCount = new Set(services.map((service) => service.category))
    .size;

  // Open a blank form to create a service.
  function openAddForm() {
    setEditingId(null);
    setFormData({ ...emptyServiceForm });
    setFormError("");
    setIsFormOpen(true);
  }

  // Open the form with the existing service data.
  function openEditForm(service) {
    setEditingId(service.id);

    setFormData({
      name: service.name,
      category: service.category,
      price: String(service.price),
      duration: service.duration,
      description: service.description,
      active: service.active,
    });

    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ ...emptyServiceForm });
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // Create or update a service.
  function handleSaveService(event) {
    event.preventDefault();
    setFormError("");

    const price = Number(formData.price);

    if (
      !formData.name.trim() ||
      !formData.duration.trim() ||
      !formData.description.trim() ||
      formData.price.trim() === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setFormError(
        "Fill in all fields and enter a valid price greater than zero.",
      );
      return;
    }

    const duplicateName = services.some(
      (service) =>
        service.name.trim().toLowerCase() ===
          formData.name.trim().toLowerCase() && service.id !== editingId,
    );

    if (duplicateName) {
      setFormError("A service with this name already exists.");
      return;
    }

    const serviceData = {
      name: formData.name.trim(),
      category: formData.category,
      price,
      duration: formData.duration.trim(),
      description: formData.description.trim(),
      active: formData.active,
    };

    if (editingId) {
      setServices((current) =>
        current.map((service) =>
          service.id === editingId ? { ...service, ...serviceData } : service,
        ),
      );

      setSelectedService((current) =>
        current?.id === editingId ? { ...current, ...serviceData } : current,
      );

      setNotice("Service updated successfully.");
    } else {
      const newService = {
        ...serviceData,
        id: `SRV-${Date.now()}`,
      };

      setServices((current) => [...current, newService]);
      setNotice("New service added successfully.");
    }

    closeForm();
  }

  // Activate or deactivate a service.
  function toggleService(id) {
    const service = services.find((item) => item.id === id);

    if (!service) return;

    const nextActive = !service.active;

    setServices((current) =>
      current.map((item) =>
        item.id === id ? { ...item, active: nextActive } : item,
      ),
    );

    setSelectedService((current) =>
      current?.id === id ? { ...current, active: nextActive } : current,
    );

    setNotice(`${service.name} marked ${nextActive ? "active" : "inactive"}.`);
  }

  // Delete a service after confirmation.
  function deleteService(service) {
    setServiceToDelete(service);
  }

  function confirmDeleteService() {
    if (!serviceToDelete) return;

    const serviceId = serviceToDelete.id;
    const serviceName = serviceToDelete.name;

    setServices((current) =>
      current.filter((service) => service.id !== serviceId),
    );

    setSelectedService((current) =>
      current?.id === serviceId ? null : current,
    );

    setServiceToDelete(null);
    setNotice(`${serviceName} deleted successfully.`);
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setStatusFilter("All");
  }

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

          {filteredServices.length === 0 && (
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
                  maxLength={100}
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
                  min="1"
                  step="1"
                  required
                />
              </label>

              <label>
                Session duration
                <input
                  name="duration"
                  value={formData.duration}
                  onChange={handleFormChange}
                  placeholder="e.g. 2–3 hours"
                  maxLength={60}
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
                  className="admin-services__action admin-services__action--primary"
                >
                  <Save size={16} />
                  {editingId ? "Save changes" : "Create service"}
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
