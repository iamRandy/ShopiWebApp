// ShopiWebApp/frontend/src/pages/SharedCart.jsx
//
// A cart someone shared by link: /shared/:shareId. Anyone with the link can
// view it, signed in or not; nothing on it can be changed. The iOS app opens
// these links itself when it's installed.
//
// Headings use Tailwind's `!` sizes: index.css sets an unlayered h1 size,
// which beats plain utilities.
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as Icons from "lucide-react";
import Navbar from "../components/NavBar";
import ProductArea from "../components/ProductArea";
import AveeLoader from "../components/AveeLoader";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function formatProductCount(count) {
  if (count === 0) return "No products yet";
  if (count === 1) return "1 product";
  return `${count} products`;
}

const SharedCart = () => {
  const { shareId } = useParams();
  // loading | loaded | gone | failed
  const [state, setState] = useState("loading");
  const [cart, setCart] = useState(null);
  const [ownerName, setOwnerName] = useState(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch(`${API_URL}/api/shared/${encodeURIComponent(shareId)}`);
      if (response.status === 404) {
        setState("gone");
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setCart(data.cart);
      setOwnerName(data.owner?.name || null);
      setState("loaded");
    } catch (error) {
      console.error("Error loading shared cart:", error);
      setState("failed");
    }
  }, [shareId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const previous = document.title;
    if (state === "loaded" && cart) document.title = `${cart.name || "Shared cart"} · Chaos`;
    return () => {
      document.title = previous;
    };
  }, [state, cart]);

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-hidden bg-[#f8f6f0]">
      <Navbar />
      <main className="flex-1 min-h-0 w-full min-w-0 px-3 pt-[4.5rem] pb-8 sm:px-4 md:px-6 md:pt-20 md:pb-10 lg:px-9">
        {state === "loading" && <AveeLoader message="Loading cart…" />}
        {state === "gone" && (
          <Message
            title="This cart isn't shared anymore"
            body="The link may be old, or its owner stopped sharing it. Ask them for a new one."
          />
        )}
        {state === "failed" && (
          <Message title="Couldn't load this cart" body="Check your connection and try again.">
            <button
              onClick={load}
              className="mt-2 rounded-full border-2 border-black bg-[#FFBC42] px-6 py-2 font-semibold text-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000]"
            >
              Try again
            </button>
          </Message>
        )}
        {state === "loaded" && cart && <LoadedCart cart={cart} ownerName={ownerName} />}
      </main>
    </div>
  );
};

const LoadedCart = ({ cart, ownerName }) => {
  const Icon = Icons[cart.icon] || Icons.ShoppingCart;
  const products = cart.products || [];
  const sharedBy = ownerName ? `Shared by ${ownerName}` : "Shared with you";

  return (
    <>
      <div className="mb-6 flex items-start gap-3 text-black md:mb-8">
        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white sm:h-12 sm:w-12">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1">
          <h1 className="text-2xl! leading-tight! font-bold tracking-wide break-words sm:text-3xl! md:text-4xl!">
            {cart.name || "Unnamed cart"}
          </h1>
          <p className="text-sm text-stone-500 sm:text-base">
            {sharedBy} · {formatProductCount(products.length)}
          </p>
        </div>
      </div>

      <ProductArea products={products} cartId={cart.id} hideSidebar readOnly />

      <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-3 rounded-3xl border-2 border-black bg-white px-6 py-6 text-center shadow-[6px_6px_0_#FFBC42]">
        <img src="/images/Avee.png" alt="" className="h-12 w-12 object-contain" />
        <p className="text-base font-semibold text-black sm:text-lg">
          Keep your own finds in one place
        </p>
        <p className="text-sm text-stone-500">
          Chaos saves products from any store into carts you can share.
        </p>
        <Link to="/" className="text-sm font-semibold text-[#B45309] hover:underline">
          Learn about Chaos
        </Link>
      </div>
    </>
  );
};

const Message = ({ title, body, children }) => (
  <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 px-6 text-center">
    <img src="/images/Avee.png" alt="" className="h-20 w-20 object-contain" />
    <h1 className="text-xl! font-bold text-black sm:text-2xl!">{title}</h1>
    <p className="max-w-md text-stone-500">{body}</p>
    {children}
  </div>
);

export default SharedCart;
