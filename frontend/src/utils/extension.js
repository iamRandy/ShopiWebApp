export async function clearExtensionStorage() {
  return new Promise((resolve) => {
    const TIMEOUT_MS = 1500;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onResponse);
      resolve();
    };

    const onResponse = (event) => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.type !== "SHOPI_EXT_RESPONSE") return;
      const msg = data?.response?.message;
      if (msg === "Storage cleared successfully" || data?.response?.ok) {
        finish();
      }
    };
    window.addEventListener("message", onResponse);

    window.postMessage(
      { type: "SHOPI_CLEAR_STORAGE", payload: { type: "CLEAR_STORAGE" } },
      "*"
    );

    const FIREFOX_EXT_ID = "{a8f4c9e2-7b3d-4e1a-9c5f-2d8b6e4a1c7f}";
    const CHROME_EXT_ID =
      import.meta.env.VITE_EXTENSION_ID || "kihghmelfnfgbkbeiebkgconkmgboilg";

    const tryExternal = (extId) => {
      if (!window.chrome?.runtime?.sendMessage) return;
      try {
        window.chrome.runtime.sendMessage(extId, { type: "CLEAR_STORAGE" }, (response) => {
          if (chrome.runtime.lastError) return;
          if (response?.ok) finish();
        });
      } catch {
        // Extension messaging unavailable
      }
    };
    tryExternal(FIREFOX_EXT_ID);
    tryExternal(CHROME_EXT_ID);

    setTimeout(() => finish(), TIMEOUT_MS);
  });
}
