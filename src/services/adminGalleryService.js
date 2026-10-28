const GALLERIES_URL = "galleries/admin/";

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

export function createAdminGalleryService(apiRequest, apiBlobRequest) {
  return {
    list(params = {}) {
      return apiRequest(withQuery(GALLERIES_URL, params));
    },

    detail(id) {
      return apiRequest(`${GALLERIES_URL}${id}/`);
    },

    create(data) {
      return apiRequest(GALLERIES_URL, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update(id, data) {
      return apiRequest(`${GALLERIES_URL}${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    remove(id) {
      return apiRequest(`${GALLERIES_URL}${id}/`, {
        method: "DELETE",
      });
    },

    listPhotos(galleryId, params = {}) {
      return apiRequest(
        withQuery(`${GALLERIES_URL}${galleryId}/photos/`, params),
      );
    },

    uploadPhoto(galleryId, file, metadata = {}) {
      const formData = new FormData();

      formData.append("image", file);
      formData.append("title", metadata.title || file.name.slice(0, 150));
      formData.append("alt_text", metadata.alt_text || "");

      if (metadata.position !== undefined) {
        formData.append("position", String(metadata.position));
      }

      return apiRequest(`${GALLERIES_URL}${galleryId}/photos/`, {
        method: "POST",
        body: formData,
      });
    },

    updatePhoto(photoId, data) {
      return apiRequest(`${GALLERIES_URL}photos/${photoId}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    removePhoto(photoId) {
      return apiRequest(`${GALLERIES_URL}photos/${photoId}/`, {
        method: "DELETE",
      });
    },

    photoFile(photoId, download = false) {
      return apiBlobRequest(
        withQuery(`${GALLERIES_URL}photos/${photoId}/file/`, {
          download: download ? "1" : "0",
        }),
      );
    },

    listBookings(params = {}) {
      return apiRequest(withQuery("bookings/admin/", params));
    },
  };
}