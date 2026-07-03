import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ShoppingCart, X as XIcon } from "lucide-react";
import { API_URL, optionalAuthFetch, authenticatedFetch } from "../utils/api";
import { getCartIcon } from "../utils/cartIcons";
import {
  getProductDisplayName,
  getFormattedProductPrice,
  formatItemCount,
} from "../utils/product";
import AveeLoader from "../components/AveeLoader";

export default function SharedCart() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    optionalAuthFetch(`${API_URL}/api/shared/${token}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "This link is invalid or has expired.");
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        if (body.status === "owner" || body.status === "collaborator") {
          navigate(`/home?cart=${body.cartId}`, { replace: true });
          return;
        }
        setData(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "This link is invalid or has expired.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const handleAccept = async () => {
    setResponding(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/shared/${token}/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to accept");
      const body = await res.json();
      navigate(`/home?cart=${body.cartId}`, { replace: true });
    } catch {
      setError("Failed to accept this invite. Please try again.");
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    try {
      await authenticatedFetch(`${API_URL}/api/shared/${token}/decline`, { method: "POST" });
    } catch {
      /* nothing to roll back — declining has no server-side state to undo */
    }
    setDeclined(true);
    setResponding(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg-app)]">
        <AveeLoader message="Loading shared cart…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[var(--color-bg-app)] px-4 text-center">
        <p className="text-lg font-semibold text-stone-700 dark:text-stone-300">{error}</p>
        <Link
          to="/"
          className="text-sm font-semibold text-[#c47f00] hover:underline dark:text-[#FFBC42]"
        >
          Go back home
        </Link>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[var(--color-bg-app)] px-4 text-center">
        <p className="text-lg font-semibold text-stone-700 dark:text-stone-300">Invite declined.</p>
        <Link
          to="/"
          className="text-sm font-semibold text-[#c47f00] hover:underline dark:text-[#FFBC42]"
        >
          Go back home
        </Link>
      </div>
    );
  }

  const isPending = data?.status === "pending";
  const isGuest = data?.status === "guest";
  const products = data?.products || [];

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg-app)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="mb-6 rounded-2xl border border-stone-200 bg-[var(--color-bg-surface)] p-5 shadow-xl dark:border-stone-700"
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--color-border-strong)] bg-[#FFBC42]/30 text-stone-700 dark:text-stone-200">
                {getCartIcon(data?.cartIcon, { className: "h-6 w-6" }) || (
                  <ShoppingCart className="h-6 w-6" />
                )}
              </span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                  {data?.cartName}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Shared by {data?.ownerName} · {formatItemCount(data?.productCount || 0)} ·{" "}
                  {data?.linkRole === "edit" ? "Can edit" : "Can view"}
                </p>
              </div>
            </div>

            {isPending && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={responding}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-bold text-stone-600 transition-transform hover:-translate-y-0.5 disabled:opacity-60 dark:text-stone-300"
                >
                  <XIcon className="h-4 w-4" />
                  Decline
                </button>
                <motion.button
                  type="button"
                  onClick={handleAccept}
                  disabled={responding}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 rounded-xl bg-[#FFBC42] px-4 py-2 text-sm font-bold text-stone-900 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]"
            >
              <div className="flex aspect-square items-center justify-center bg-stone-100 dark:bg-stone-800">
                {product.image && (
                  <img src={product.image} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
                  {getProductDisplayName(product)}
                </p>
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  {getFormattedProductPrice(product)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <p className="py-10 text-center text-stone-400">This cart is empty.</p>
        )}

        {isGuest && (
          <div className="mt-8 rounded-xl border-2 border-dashed border-stone-300 bg-[var(--color-bg-surface)]/50 p-5 text-center dark:border-stone-700">
            <p className="text-stone-600 dark:text-stone-400">
              Create an account, or login to add or edit products!
            </p>
            <Link
              to="/login"
              className="mt-2 inline-block rounded-xl bg-[#FFBC42] px-4 py-2 text-sm font-bold text-stone-900 transition-transform hover:-translate-y-0.5"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
