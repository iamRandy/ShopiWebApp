import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Crown, Eye, Pencil, X } from "lucide-react";
import { authenticatedFetch, API_URL } from "../../utils/api";
import ModalPortal from "../ModalPortal";

const ROLE_LABEL = { view: "Can view", edit: "Can edit" };

const RoleToggle = ({ value, onChange }) => (
  <div className="flex overflow-hidden rounded-xl border-2 border-[var(--color-border-strong)]">
    <button
      type="button"
      onClick={() => onChange("view")}
      className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${
        value === "view" ? "bg-[#FFBC42]/40" : "hover:bg-stone-50 dark:hover:bg-white/5"
      }`}
    >
      Can view
    </button>
    <button
      type="button"
      onClick={() => onChange("edit")}
      className={`flex-1 border-l-2 border-[var(--color-border-strong)] px-3 py-2 text-sm font-semibold transition-colors ${
        value === "edit" ? "bg-[#FFBC42]/40" : "hover:bg-stone-50 dark:hover:bg-white/5"
      }`}
    >
      Can edit
    </button>
  </div>
);

export default function ShareCartModal({ isOpen, onClose, cart }) {
  const [shareInfo, setShareInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingRole, setPendingRole] = useState("edit");
  const [generating, setGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [roleChangingSub, setRoleChangingSub] = useState(null);
  const [removingSub, setRemovingSub] = useState(null);
  const [transferConfirmSub, setTransferConfirmSub] = useState(null);
  const [transferring, setTransferring] = useState(false);

  const cartId = cart?.id;

  useEffect(() => {
    if (!isOpen || !cartId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTransferConfirmSub(null);

    authenticatedFetch(`${API_URL}/api/carts/${cartId}/share`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setShareInfo(data);
        if (data.linkRole) setPendingRole(data.linkRole);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load sharing settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, cartId]);

  useEffect(() => {
    if (!linkCopied) return;
    const id = setTimeout(() => setLinkCopied(false), 1500);
    return () => clearTimeout(id);
  }, [linkCopied]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/carts/${cartId}/share`, {
        method: "POST",
        body: JSON.stringify({ role: pendingRole }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setShareInfo((prev) => ({ ...data, collaborators: prev?.collaborators || [] }));
    } catch {
      setError("Failed to generate share link. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareInfo?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      setLinkCopied(true);
    } catch {
      setError("Could not copy the link — copy it manually instead.");
    }
  };

  const handleRoleChange = async (sub, role) => {
    setRoleChangingSub(sub);
    setError(null);
    try {
      const res = await authenticatedFetch(
        `${API_URL}/api/carts/${cartId}/share/collaborators/${sub}`,
        { method: "PATCH", body: JSON.stringify({ role }) }
      );
      if (!res.ok) throw new Error("Request failed");
      setShareInfo((prev) => ({
        ...prev,
        collaborators: prev.collaborators.map((c) => (c.sub === sub ? { ...c, role } : c)),
      }));
    } catch {
      setError("Failed to change that collaborator's role.");
    } finally {
      setRoleChangingSub(null);
    }
  };

  const handleRemove = async (sub) => {
    setRemovingSub(sub);
    setError(null);
    try {
      const res = await authenticatedFetch(
        `${API_URL}/api/carts/${cartId}/share/collaborators/${sub}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Request failed");
      setShareInfo((prev) => ({
        ...prev,
        collaborators: prev.collaborators.filter((c) => c.sub !== sub),
      }));
    } catch {
      setError("Failed to remove that collaborator.");
    } finally {
      setRemovingSub(null);
    }
  };

  const handleTransfer = async (sub) => {
    setTransferring(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/carts/${cartId}/share/transfer`, {
        method: "POST",
        body: JSON.stringify({ toSub: sub }),
      });
      if (!res.ok) throw new Error("Request failed");
      onClose({ ownershipTransferred: true });
    } catch {
      setError("Failed to transfer ownership. Please try again.");
      setTransferring(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const collaborators = shareInfo?.collaborators || [];

  return (
    <ModalPortal>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex max-h-[min(92dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-[var(--color-bg-surface)] shadow-xl sm:rounded-2xl dark:border-stone-700"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-cart-modal-title"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-stone-800">
            <h2
              id="share-cart-modal-title"
              className="truncate text-lg font-semibold text-stone-900 dark:text-stone-50"
            >
              Share &ldquo;{cart?.name || "cart"}&rdquo;
            </h2>
            <button
              type="button"
              onClick={() => onClose()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-white/5 dark:hover:text-stone-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="scrollbar-minimal min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {loading ? (
              <p className="py-8 text-center text-sm text-stone-400">Loading…</p>
            ) : (
              <>
                {!shareInfo?.shareToken ? (
                  <div className="space-y-3">
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Generate a link anyone can use to view or edit this cart.
                    </p>
                    <RoleToggle value={pendingRole} onChange={setPendingRole} />
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="w-full rounded-xl bg-[#FFBC42] px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#f0ad35] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generating ? "Generating…" : "Generate share link"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={shareInfo.shareUrl}
                        onFocus={(e) => e.target.select()}
                        className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-[var(--color-bg-app-alt)] px-3 py-2 text-sm text-stone-700 outline-none dark:border-stone-700 dark:text-stone-300"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-[2px_2px_0_var(--color-shadow)] transition-transform hover:-translate-y-0.5"
                        title="Copy link"
                        aria-label="Copy link"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {linkCopied ? (
                            <motion.span
                              key="copied"
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.6, opacity: 0 }}
                              transition={{ duration: 0.12 }}
                            >
                              <Check className="h-4 w-4" />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.6, opacity: 0 }}
                              transition={{ duration: 0.12 }}
                            >
                              <Copy className="h-4 w-4" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>

                    <div>
                      <p className="mb-2 text-xs text-stone-500 dark:text-stone-400">
                        New link role:{" "}
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          {ROLE_LABEL[pendingRole]}
                        </span>{" "}
                        — applies next time you regenerate.
                      </p>
                      <RoleToggle value={pendingRole} onChange={setPendingRole} />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="w-full rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generating ? "Regenerating…" : "Regenerate link"}
                    </button>
                  </div>
                )}

                {collaborators.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-400">
                      People with access
                    </h3>
                    <ul className="space-y-2">
                      {collaborators.map((collab) => (
                        <li
                          key={collab.sub}
                          className="flex items-center gap-2.5 rounded-xl border border-stone-200 px-3 py-2 dark:border-stone-700"
                        >
                          {collab.picture ? (
                            <img
                              src={collab.picture}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                              {(collab.name || collab.email || "?")[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
                              {collab.name || collab.email}
                            </p>
                            <p className="truncate text-xs text-stone-400">{collab.email}</p>
                          </div>

                          <AnimatePresence mode="wait" initial={false}>
                            {transferConfirmSub === collab.sub ? (
                              <motion.div
                                key="confirm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex shrink-0 items-center gap-1.5 text-xs"
                              >
                                <span className="text-stone-500">
                                  Transfer to {collab.name?.split(" ")[0] || "them"}?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleTransfer(collab.sub)}
                                  disabled={transferring}
                                  className="rounded-lg bg-red-600 px-2 py-1 font-semibold text-white disabled:opacity-60"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTransferConfirmSub(null)}
                                  className="rounded-lg px-2 py-1 font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5"
                                >
                                  Cancel
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="actions"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex shrink-0 items-center gap-1"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRoleChange(collab.sub, collab.role === "edit" ? "view" : "edit")
                                  }
                                  disabled={roleChangingSub === collab.sub}
                                  title={
                                    collab.role === "edit"
                                      ? "Editor — click to make view-only"
                                      : "Viewer — click to allow editing"
                                  }
                                  className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-white/5"
                                >
                                  {collab.role === "edit" ? (
                                    <Pencil className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                  {ROLE_LABEL[collab.role]}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTransferConfirmSub(collab.sub)}
                                  title="Transfer ownership"
                                  aria-label={`Transfer ownership to ${collab.name || collab.email}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
                                >
                                  <Crown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemove(collab.sub)}
                                  disabled={removingSub === collab.sub}
                                  title="Remove access"
                                  aria-label={`Remove ${collab.name || collab.email}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-950/30"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {error && (
                  <p
                    className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}
