// Privacy Policy page
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const LAST_UPDATED = "May 10, 2026";
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
              Chaos ("we", "us") is a shopping organizer made up of a web app
              and a companion browser extension. This policy explains what
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
            </p>
            <p>
              <strong>Saved products.</strong> When you click Save on a
              product page, the extension sends basic product details (such
              as URL, title, image, and price) to your account so they appear
              in your cart. We do not read pages or browser activity outside
              of that action.
            </p>
            <p>
              <strong>Sign-in tokens.</strong> Your browser and the extension
              store sign-in tokens locally so you stay logged in. Logging out
              or clearing browser data removes them.
            </p>
          </Section>

          <Section id="use" title="How we use it">
            <p>
              We use this data to sign you in, save and display your products,
              keep the web app and extension in sync, and improve site
              compatibility. We do not use it for advertising, profiling, or
              training machine-learning models.
            </p>
          </Section>

          <Section id="sharing" title="Sharing">
            <p>
              We do not sell, rent, or share your personal data with third
              parties. We rely on standard cloud infrastructure providers to
              host the service and on Google to authenticate sign-in. Those
              providers process data only to operate Chaos.
            </p>
          </Section>

          <Section id="rights" title="Your choices">
            <p>
              You can sign out at any time, delete saved products from your
              carts, or request full account and data deletion by emailing{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="special_links">
                {CONTACT_EMAIL}
              </a>
              . We action verified requests within 30 days. Depending on your
              region (e.g. GDPR, CCPA), you may have additional rights.
            </p>
          </Section>

          <Section id="security" title="Security">
            <p>
              Traffic between your browser, the extension, and our backend is
              encrypted with HTTPS. Sign-in tokens are short-lived. No system
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
