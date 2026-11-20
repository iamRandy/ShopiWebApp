// Privacy Policy page
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const LAST_UPDATED = "November 19, 2026";
const CONTACT_EMAIL = "shoppii.cart@gmail.com";

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-8 scroll-mt-24">
    <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <div className="overflow-hidden bg-primary text-black min-h-screen flex flex-col">
      <NavBar isLanding={true} />
      <main className="flex-1 pt-28 pb-16">
        <article className="container mx-auto px-6 max-w-2xl">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-500 text-sm">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <Section id="overview" title="Overview">
            <p>
              Chaos (“we”, “us”) is a shopping organizer made up of a web app,
              a browser extension and an iPhone app. This policy explains what
              data we collect, why, and how to contact us.
            </p>
            <p>
              We do not sell your data, we do not run ads, and we do not track
              you across the web.
            </p>
          </Section>

          <Section id="data" title="What we collect">
            <p>
              <strong>Account info.</strong> When you sign in with Google, we
              receive your name, email, and a Google account identifier. We do
              not access Gmail, Drive, contacts, or any other Google service.
              When you sign in with Apple, we receive an Apple account
              identifier, your email (or a private relay address, if you chose
              to hide yours), and your name if you chose to share it.
            </p>
            <p>
              <strong>Saved products.</strong> When you click Save in the
              extension, or share something to Chaos from another app on your
              iPhone, we save what you chose to save to your account: product
              details such as link, title, image, price and description, text
              you shared, and any nickname you add. We do not read pages,
              browsing activity, or anything in other apps beyond what you
              share.
            </p>
            <p>
              <strong>Photos.</strong> If you share a photo or screenshot to
              Chaos, it is resized on your phone and its location and camera
              details are removed before it’s uploaded. It is stored with our
              hosting provider at a random, unlisted address and shown in your
              cart. It is deleted when you delete the product, its cart or your
              account.
            </p>
            <p>
              <strong>Sign-in tokens.</strong> Your browser, the extension and
              the iPhone app (in its secure Keychain) store sign-in tokens so
              you stay logged in. Signing out removes them.
            </p>
          </Section>

          <Section id="use" title="How we use it">
            <p>
              We use this data to sign you in, save and display your products,
              show carts you share to the people you share them with, keep the
              web app, extension and iPhone app in sync, and improve site
              compatibility. We do not use it for advertising, profiling, or
              training machine-learning models.
            </p>
          </Section>

          <Section id="shared-carts" title="Carts you share">
            <p>
              You can share a cart by link. Anyone with the link can view that
              cart’s name, its products (including any nicknames you gave
              them) and your first name, without signing in. They can’t change
              anything. Stop sharing at any time and the link stops working;
              deleting the cart does the same. Carts you haven’t shared are
              visible only to you.
            </p>
          </Section>

          <Section id="sharing" title="Sharing with others">
            <p>
              We do not sell, rent, or share your personal data with third
              parties. We rely on standard cloud infrastructure providers to
              host the service and store data, and on Google and Apple to
              authenticate sign-in. Those providers process data only to
              operate Chaos.
            </p>
          </Section>

          <Section id="rights" title="Your choices">
            <p>
              You can sign out at any time, delete saved products and carts,
              and stop sharing a cart. In the iPhone app, Account, then Delete
              Account, permanently deletes your account, carts, saved
              products, photos and share links straight away. You can also
              request full account and data deletion by emailing{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="special_links">
                {CONTACT_EMAIL}
              </a>
              . We action verified requests within 30 days. Depending on your
              region (e.g. GDPR, CCPA), you may have additional rights.
            </p>
          </Section>

          <Section id="security" title="Security">
            <p>
              Traffic between your browser, the extension, the iPhone app and
              our backend is encrypted with HTTPS. Sign-in tokens are short-lived. No system
              is perfectly secure; if a breach affects your data, we will
              notify you.
            </p>
          </Section>

          <Section id="children" title="Children">
            <p>
              Chaos is not directed to children under 13 and we do not
              knowingly collect their data.
            </p>
          </Section>

          <Section id="changes" title="Changes">
            <p>
              We may update this policy. Material changes will be reflected by
              an updated date above. Continued use of Chaos after an update
              means you accept the revised policy.
            </p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              Questions about this policy or your data? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="special_links">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
