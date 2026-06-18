export function syncProfileToStorage(profile) {
  if (profile?.name != null) {
    localStorage.setItem("userName", profile.name);
  }
  if (profile?.email != null) {
    localStorage.setItem("userEmail", profile.email);
  }
  if (profile?.sub != null) {
    localStorage.setItem("userSub", profile.sub);
  }
  window.dispatchEvent(new CustomEvent("profile-updated"));
}

export function applyAccessToken(accessToken) {
  if (accessToken) {
    localStorage.setItem("authToken", accessToken);
  }
}
