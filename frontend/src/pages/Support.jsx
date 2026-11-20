// Support page: the Support URL on the App Store listing. App Review checks
// that it loads without signing in and offers a way to get help, so keep it
// reachable, and keep every answer true to the app.
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const CONTACT_EMAIL = "shoppii.cart@gmail.com";
const EXTENSION_URL =
  "https://chromewebstore.google.com/detail/chaos-cart-saver/bjofoogkolnnpldckgedhdeekajhnpcb";

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-24">
    <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </section>
);

const Email = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="special_links">
    {CONTACT_EMAIL}
  </a>
);

export default function Support() {
  return (
    <div className="overflow-hidden bg-primary text-black min-h-screen flex flex-col">
      <NavBar isLanding={true} />
      <main className="flex-1 pt-28 pb-16">
        <article className="container mx-auto px-6 max-w-2xl">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Support</h1>
            <p className="text-gray-500">
              Help with Chaos on iPhone, on the web, and in the browser
              extension.
            </p>
          </header>

          <Section id="help" title="Getting help">
            <p>
              Email <Email /> and a person will get back to you, usually
              within a couple of days. Saying what you did, what you expected
              and what happened instead saves a round trip.
            </p>
          </Section>

          <Section id="saving" title="Saving from other apps on iPhone">
            <p>
              In Safari, Instagram, TikTok, Amazon or any app with a Share
              button, tap Share and choose Chaos. Pick a cart, add a nickname
              if you like, and tap Save. Chaos saves links, web pages, text,
              and a photo or screenshot.
            </p>
            <p>
              If Chaos isn’t in the row of apps, scroll to the end of the row,
              tap More, and turn Chaos on. Sign in to the Chaos app once first:
              the share sheet uses the same account.
            </p>
          </Section>

          <Section id="sharing" title="Sharing a cart">
            <p>
              In the app, tap the Share button next to a cart’s name (or Share
              Cart in the cart’s ⋯ menu) and send the link however you like.
              Anyone with the link can see the cart and its products, with or
              without the app. Only you can change it.
            </p>
            <p>
              People you share with see the cart’s name, its products and any
              nicknames you’ve given them, and your first name. Tap Stop
              Sharing in the same place and the link stops working for
              everyone. Deleting the cart does the same.
            </p>
          </Section>

          <Section id="computer" title="Saving on a computer">
            <p>
              Install the{" "}
              <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer" className="special_links">
                Chaos browser extension
              </a>{" "}
              and click Save on any product page. Sign in with the same Google
              account in the extension and the app and your carts stay in
              sync.
            </p>
          </Section>

          <Section id="delete" title="Deleting your account">
            <p>
              In the app, tap your picture at the top right, then Delete
              Account. It deletes your account, carts, saved products, photos
              and share links straight away. You can also email <Email /> to
              ask us to do it.
            </p>
          </Section>

          <Section id="privacy" title="Privacy">
            <p>
              The{" "}
              <a href="/privacy" className="special_links">
                privacy policy
              </a>{" "}
              covers what Chaos stores and why.
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
