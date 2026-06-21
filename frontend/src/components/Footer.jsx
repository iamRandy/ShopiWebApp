import { Link } from "react-router-dom";
import {
  HeartPlus,
  Blocks,
  BadgeQuestionMark,
  Shield,
  ExternalLink,
} from "lucide-react";

const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/chaos-cart-saver/bjofoogkolnnpldckgedhdeekajhnpcb?authuser=0&hl=en";

const EXPLORE_LINKS = [
  { label: "Save", href: "/#features", icon: HeartPlus },
  { label: "Organize", href: "/#how-it-works", icon: Blocks },
  { label: "Privacy", to: "/privacy", icon: Shield },
];

const CTA_LINKS = [
  { label: "Get started", to: "/login", icon: BadgeQuestionMark },
  {
    label: "Chrome extension",
    href: EXTENSION_URL,
    external: true,
    icon: ExternalLink,
  },
];

function FooterLink({ link }) {
  const className =
    "group inline-flex items-center gap-2 text-sm font-medium text-stone-700 transition-colors hover:text-[var(--color-text-primary)] dark:text-stone-300";
  const icon = (
    <link.icon
      className="h-4 w-4 text-[#b45309] transition-transform group-hover:scale-110"
      strokeWidth={2.25}
    />
  );

  if (link.to) {
    return (
      <Link to={link.to} className={`${className} special_links`}>
        {icon}
        {link.label}
      </Link>
    );
  }

  return (
    <a
      href={link.href}
      className={`${className} special_links`}
      {...(link.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {icon}
      {link.label}
    </a>
  );
}

export default function Footer() {
  return (
    <footer
      id="footer"
      className="relative border-t-2 border-[var(--color-border-strong)] bg-gradient-to-b from-[#f5ebe0] to-[#ebe3d6] dark:from-[#241f1a] dark:to-[#18181b]"
    >
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10">
          <div className="flex flex-col items-center text-center sm:col-span-2 md:col-span-1 md:items-start md:text-left">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <img
                src="/images/Avee.png"
                alt="Chaos"
                className="h-9 w-9 object-contain drop-shadow-sm"
              />
              <span
                id="logo_text"
                className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
              >
                Chaos
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-primary-dark">
              Your playful shopping buddy — save anything, organize everything,
              decide later.
            </p>
            <span className="mt-3 inline-flex items-center rounded-full border-2 border-[var(--color-border-strong)] bg-[#FFBC42] px-3 py-1 text-xs font-bold uppercase tracking-wide text-black shadow-[2px_2px_0_var(--color-shadow)]">
              Free to use
            </span>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Explore
            </h3>
            <ul className="flex flex-col gap-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Get started
            </h3>
            <ul className="flex flex-col gap-2.5">
              {CTA_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-black/10 dark:border-white/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            &copy; {new Date().getFullYear()} Chaos. All rights reserved.
          </p>
          <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
            Made for shoppers who hate losing great finds.
          </p>
        </div>
      </div>
    </footer>
  );
}
