const REVIEWS_URL = "reviews/admin/";

function withQuery(path, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function createAdminReviewsService(apiRequest) {
  return {
    list(params = {}) {
      return apiRequest(withQuery(REVIEWS_URL, params));
    },

    summary() {
      return apiRequest(`${REVIEWS_URL}summary/`);
    },

    detail(id) {
      return apiRequest(`${REVIEWS_URL}${id}/`);
    },

    create(data) {
      return apiRequest(REVIEWS_URL, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    setPublished(id, isPublished) {
      return apiRequest(`${REVIEWS_URL}${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          is_published: isPublished,
        }),
      });
    },

    remove(id) {
      return apiRequest(`${REVIEWS_URL}${id}/`, {
        method: "DELETE",
      });
    },

    listBookings(params = {}) {
      return apiRequest(withQuery("bookings/admin/", params));
    },
  };
}

const OVERVIEW_URL = "admin/overview/";

export function createAdminOverviewService(apiRequest) {
  return {
    getOverview() {
      return apiRequest(OVERVIEW_URL);
    },
  };
}