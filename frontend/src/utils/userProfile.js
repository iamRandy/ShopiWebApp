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

  const avatarUrl = profile?.avatarUrl || profile?.picture || "";
  if (avatarUrl) {
    localStorage.setItem("userPicture", avatarUrl);
  } else {
    localStorage.removeItem("userPicture");
  }

  window.dispatchEvent(new CustomEvent("profile-updated"));
}

export function applyAccessToken(accessToken) {
  if (accessToken) {
    localStorage.setItem("authToken", accessToken);
  }
}

export function getStoredAvatarUrl() {
  return localStorage.getItem("userPicture") || "";
}
