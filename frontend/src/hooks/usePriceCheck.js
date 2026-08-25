import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, authenticatedFetch } from "../utils/api";
import { PRICE_CHECK_COOLDOWN_MS } from "../components/dashboard/constants";
import { useToast } from "../context/ToastContext";

const ERROR_DISPLAY_MS = 4000;

function directionFromPrices(previous, current) {
  if (previous === null || previous === undefined || current === null || current === undefined) {
    return "same";
  }
  const prev = Number(previous);
  const curr = Number(current);
  if (!Number.isFinite(prev) || !Number.isFinite(curr)) return "same";
  if (Math.abs(curr - prev) < 0.01) return "same";
  return curr > prev ? "up" : "down";
}

/** Shared manual "refresh price" logic for the product modal and the dashboard grid card.
 * Gates on the same 5-minute cooldown the server enforces, but checks it client-side first so a
 * repeat click within the window replays the last result's direction with no network call. */
export default function usePriceCheck({ cartId, product, onUpdated }) {
  const navigate = useNavigate();
  const { push: pushToast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  // null | "error" (couldn't find a price) | "blocked" (site served a bot-check page instead)
  const [checkErrorReason, setCheckErrorReason] = useState(null);

  const flagError = (reason) => {
    setCheckErrorReason(reason);
    setTimeout(() => setCheckErrorReason(null), ERROR_DISPLAY_MS);
    pushToast(
      reason === "blocked"
        ? `${product?.hostname || "This site"} blocks automated price checks — update the price manually.`
        : "Could not check the price. Try again shortly.",
      "error"
    );
  };

  const checkPrice = async () => {
    if (!product?.url || isChecking) return null;

    const lastCheckMs = product.lastManualPriceCheckAt
      ? new Date(product.lastManualPriceCheckAt).getTime()
      : null;
    if (lastCheckMs && Date.now() - lastCheckMs < PRICE_CHECK_COOLDOWN_MS) {
      return { direction: directionFromPrices(product.priceBeforeManualCheck, product.price) };
    }

    setIsChecking(true);
    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/carts/${cartId}/products/${product.id}`,
        { method: "POST" }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.status === "error" || data.status === "blocked") {
        flagError(!response.ok ? "error" : data.status);
        return null;
      }

      if (data.status === "busy") return null;

      onUpdated?.(product.id, {
        price: data.price,
        currency: data.currency,
        lastManualPriceCheckAt: data.lastManualPriceCheckAt,
        priceBeforeManualCheck: data.previousPrice,
      });
      return { direction: directionFromPrices(data.previousPrice, data.price) };
    } catch (error) {
      if (
        error.message === "No authentication token found" ||
        error.message === "Authentication failed"
      ) {
        navigate("/login");
        return null;
      }
      flagError("error");
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  return { isChecking, checkErrorReason, checkPrice };
}
