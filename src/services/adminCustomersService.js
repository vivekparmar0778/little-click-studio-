const CUSTOMERS_URL = "auth/admin/customers/";

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      const apiKey = key === "pageSize" ? "page_size" : key;
      query.set(apiKey, String(value));
    }
  });

  return query.toString();
}

export function createAdminCustomersService(apiRequest) {
  return {
    list(params = {}) {
      const query = buildQuery(params);
      const path = query ? `${CUSTOMERS_URL}?${query}` : CUSTOMERS_URL;
      return apiRequest(path);
    },

    summary() {
      return apiRequest(`${CUSTOMERS_URL}summary/`);
    },

    detail(id) {
      return apiRequest(`${CUSTOMERS_URL}${id}/`);
    },

    create(customerData) {
      return apiRequest(CUSTOMERS_URL, {
        method: "POST",
        body: customerData,
      });
    },

    update(id, customerData) {
      return apiRequest(`${CUSTOMERS_URL}${id}/`, {
        method: "PATCH",
        body: customerData,
      });
    },

    remove(id) {
      return apiRequest(`${CUSTOMERS_URL}${id}/`, {
        method: "DELETE",
      });
    },
  };
}