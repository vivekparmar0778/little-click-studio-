const SERVICES_URL = "services/admin/";

export function createAdminServicesService(apiRequest) {
  return {
    list(params = {}) {
      const query = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.set(key, String(value));
        }
      });

      const suffix = query.toString();
      return apiRequest(
        suffix ? `${SERVICES_URL}?${suffix}` : SERVICES_URL,
      );
    },

    create(data) {
      return apiRequest(SERVICES_URL, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update(id, data) {
      return apiRequest(`${SERVICES_URL}${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    remove(id) {
      return apiRequest(`${SERVICES_URL}${id}/`, {
        method: "DELETE",
      });
    },
  };
}