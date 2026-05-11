// Privacy Policy page
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const LAST_UPDATED = "May 10, 2026";
const CONTACT_EMAIL = "shoppii.cart@gmail.com";

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-10 scroll-mt-24">
    <h2 className="text-2xl font-semibold text-gray-900 mb-3">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <div className="overflow-hidden bg-primary text-black min-h-screen flex flex-col">
      <NavBar isLanding={true} />
      <main className="flex-1 pt-28 pb-16">
        <article className="container mx-auto px-6 max-w-3xl">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Privacy Policy
            </h1>
            <p className="text-gray-500 text-sm">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <nav
            aria-label="Table of contents"
            className="mb-12 rounded-lg border border-gray-300 bg-white/40 p-5"
          >
            <p className="font-medium text-gray-900 mb-2">On this page</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
              <li>
                <a href="#overview" className="special_links">
                  Overview
                </a>
              </li>
              <li>
                <a href="#data-we-collect" className="special_links">
                  Data we collect
                </a>
              </li>
              <li>
                <a href="#how-we-use-data" className="special_links">
                  How we use your data
                </a>
              </li>
              <li>
                <a href="#extension-permissions" className="special_links">
                  Browser extension permissions
                </a>
              </li>
              <li>
                <a href="#storage-and-sharing" className="special_links">
                  Storage and sharing
                </a>
              </li>
              <li>
                <a href="#your-rights" className="special_links">
                  Your rights and choices
                </a>
              </li>
              <li>
                <a href="#security" className="special_links">
                  Security
                </a>
              </li>
              <li>
                <a href="#children" className="special_links">
                  Children's privacy
                </a>
              </li>
              <li>
                <a href="#changes" className="special_links">
                  Changes to this policy
                </a>
              </li>
              <li>
                <a href="#contact" className="special_links">
                  Contact
                </a>
              </li>
            </ol>
          </nav>

          <Section id="overview" title="1. Overview">
            <p>
              Chaos ("we", "us") is a shopping organizer that lets you save
              products from any website into personal carts so you can compare
              and revisit them later. It consists of a web app at{" "}
              <a
                href="https://shopi-web-app.vercel.app"
                className="special_links"
              >
                shopi-web-app.vercel.app
              </a>{" "}
              and a companion browser extension ("Chaos Cart Saver"). This
              policy explains what data those products collect, why, and what
              you can do about it.
            </p>
            <p>
              <strong>Short version:</strong> we only store the account info
              Google sends us when you sign in and the product data you
              explicitly choose to save. We do not sell your data, we do not
              run ads, and we do not track you across the web.
            </p>
          </Section>

          <Section id="data-we-collect" title="2. Data we collect">
            <p>We collect three categories of data:</p>
            <h3 className="text-lg font-semibold text-gray-900 mt-4">
              a. Account information (Sign in with Google)
            </h3>
            <p>
              When you sign in with Google we receive, from Google's OAuth
              service, the following fields from your Google profile:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>
                Google account ID (an opaque identifier called <code>sub</code>)
              </li>
              <li>Email address</li>
              <li>Display name</li>
            </ul>
            <p>
              We do not receive or store your Google password. We do not
              request access to your Gmail, Drive, contacts, or any other
              Google service.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-4">
              b. Saved product data
            </h3>
            <p>
              When you click "Save" on a product page, the extension extracts
              the following fields from the page and sends them to our backend
              so they can appear in your cart:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Product URL and hostname</li>
              <li>Product title</li>
              <li>Product description</li>
              <li>Product image URL</li>
              <li>Product price and currency</li>
              <li>The cart you chose to save it to</li>
              <li>A timestamp of when it was saved</li>
            </ul>
            <p>
              We do <strong>not</strong> read pages, form fields, search
              history, or any other browser activity. Extraction only happens
              when you explicitly click Save on a product page.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-4">
              c. Operational diagnostics
            </h3>
            <p>
              If our scraper fails to extract a complete product (for example,
              a site we don't yet support), the URL and partial fields of that
              save are logged on our backend so we can improve site coverage.
              These logs contain only the product fields above; they do not
              contain your name, email, or account ID.
            </p>
            <p>
              We do <strong>not</strong> use third-party analytics, advertising
              SDKs, fingerprinting, session replay, or behavioral tracking.
            </p>
          </Section>

          <Section id="how-we-use-data" title="3. How we use your data">
            <p>We use the data described above strictly to:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Authenticate you and keep you signed in.</li>
              <li>
                Store, display, and organize the products you save into carts.
              </li>
              <li>
                Sync your account between the web app and the browser
                extension.
              </li>
              <li>
                Diagnose extraction failures so we can support more retailers.
              </li>
            </ul>
            <p>
              We do not use your data for advertising, profiling, or training
              machine-learning models.
            </p>
          </Section>

          <Section
            id="extension-permissions"
            title="4. Browser extension permissions"
          >
            <p>
              The browser extension requests the following permissions. Each
              has a specific, narrow purpose:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-2">
              <li>
                <strong>storage</strong> &mdash; saves your sign-in tokens and
                preferences locally inside the extension so you don't have to
                sign in on every page.
              </li>
              <li>
                <strong>tabs / activeTab</strong> &mdash; reads the URL of the
                tab you are currently viewing so the Save button can be linked
                to the correct product.
              </li>
              <li>
                <strong>scripting</strong> &mdash; injects the product
                extractor into the current tab when you click Save.
              </li>
              <li>
                <strong>host_permissions: &lt;all_urls&gt;</strong> &mdash;
                required because Chaos lets you save products from any online
                store. The extractor only runs on the page you are actively
                viewing, only when you click Save, and only reads publicly
                visible product fields.
              </li>
            </ul>
            <p>
              The extension never silently scrapes pages, runs in the
              background, or reads tabs you are not interacting with.
            </p>
          </Section>

          <Section id="storage-and-sharing" title="5. Storage and sharing">
            <p>Your data is stored in three places:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>
                <strong>MongoDB Atlas</strong> &mdash; cloud database that
                holds your account record and the products in your carts.
              </li>
              <li>
                <strong>Render</strong> &mdash; hosts our API server. Render
                processes requests in transit but does not store your data
                long-term.
              </li>
              <li>
                <strong>Vercel</strong> &mdash; hosts our web app's static
                files.
              </li>
            </ul>
            <p>
              The only third party that receives identifying information from
              you directly is Google, which authenticates your sign-in. Apart
              from these infrastructure providers, we do <strong>not</strong>{" "}
              share, sell, rent, or trade your personal data with anyone.
            </p>
            <p>
              Your browser also stores a short-lived access token and a
              refresh token in <code>localStorage</code> and inside the
              extension so you stay signed in. Clearing your browser data or
              logging out removes them.
            </p>
          </Section>

          <Section id="your-rights" title="6. Your rights and choices">
            <p>You can, at any time:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Sign out from the web app or extension to clear tokens.</li>
              <li>
                Delete individual saved products from inside your carts.
              </li>
              <li>
                Request full deletion of your account and all associated saved
                products by emailing{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="special_links"
                >
                  {CONTACT_EMAIL}
                </a>
                . We will action verified requests within 30 days.
              </li>
              <li>
                Request a copy of the data we hold on you by emailing the same
                address.
              </li>
            </ul>
            <p>
              Depending on where you live (for example, the EU/UK under GDPR
              or California under CCPA), you may have additional rights,
              including the right to object to processing or to lodge a
              complaint with a supervisory authority.
            </p>
          </Section>

          <Section id="security" title="7. Security">
            <p>
              Connections between your browser, the extension, the web app,
              and our backend use HTTPS. Access tokens are short-lived and are
              rotated using refresh tokens. Account records are scoped by
              Google's <code>sub</code> identifier so one user cannot read
              another user's data. No system is perfectly secure; if we
              discover a breach affecting your data, we will notify you
              promptly.
            </p>
          </Section>

          <Section id="children" title="8. Children's privacy">
            <p>
              Chaos is not directed to children under 13, and we do not
              knowingly collect personal information from them. If you believe
              a child has provided us data, please contact us and we will
              delete it.
            </p>
          </Section>

          <Section id="changes" title="9. Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes
              will be reflected by an updated "Last updated" date at the top
              of this page and, where appropriate, a notice in the web app.
              Continued use of Chaos after an update means you accept the
              revised policy.
            </p>
          </Section>

          <Section id="contact" title="10. Contact">
            <p>
              Questions about this policy or about your data? Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="special_links"
              >
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
