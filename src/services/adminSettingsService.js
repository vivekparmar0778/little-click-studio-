const SETTINGS_URL = "settings/admin/";

export function createAdminSettingsService(apiRequest) {
  return {
    getSettings() {
      return apiRequest(SETTINGS_URL);
    },

    updateSettings(settings, logoFile, profileFile) {
      const payload = new FormData();

      Object.entries(settings).forEach(([name, value]) => {
        // These fields are returned by the server, not submitted.
        if (["logoUrl", "profileImageUrl", "updatedAt"].includes(name)) {
          return;
        }

        if (name === "workingDays") {
          value.forEach((day) => {
            payload.append("workingDays", day);
          });
          return;
        }

        payload.append(name, String(value));
      });

      if (logoFile) {
        payload.append("logo", logoFile);
      }

      if (profileFile) {
        payload.append("profileImage", profileFile);
      }

      return apiRequest(SETTINGS_URL, {
        method: "PATCH",
        body: payload,
      });
    },
  };
}