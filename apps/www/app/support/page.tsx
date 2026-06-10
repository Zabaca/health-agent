import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Veladon — your personal health record storage.",
};

export default function SupportPage() {
  return (
    <main>
      <section className="section">
        <div className="col col-prose stack-5">
          <p className="eyebrow">Support</p>
          <h1>We read every message<span className="accent">.</span></h1>
          <p className="lead">
            Veladon is a small team. There's no automated triage, no chatbot to escape.
            Email us and a person will answer.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="col col-prose">
          <div className="row2">
            <div className="label">Email us</div>
            <div className="body">
              <a href="mailto:info@veladon.com">info@veladon.com</a>
              <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-muted)" }}>
                One mailbox for everything: app questions, bug reports, account help,
                feature requests, data-access and deletion requests, security
                disclosures, breach inquiries, service of process, and regulatory
                questions. Tell us what you need in the subject line and a person
                will route it.
              </p>
            </div>
          </div>
          <div className="row2">
            <div className="label">Write to us</div>
            <div className="body">
              Zabaca, LLC
              <br />
              717 Brea Canyon Rd Ste 6
              <br />
              Walnut, CA 91789
            </div>
          </div>
        </div>
      </section>

      <section className="section subtle">
        <div className="col col-prose stack-4">
          <p className="eyebrow">Common requests</p>
          <h2>Before you write.</h2>
          <details className="faq">
            <summary>I can't sign in.</summary>
            <p>
              If you signed up with Apple or Google, use the same provider — switching
              identity providers creates a new account. If you used email and password,
              tap "Forgot password" on the sign-in screen. If the reset email doesn't
              arrive within five minutes, write to{" "}
              <a href="mailto:info@veladon.com">info@veladon.com</a>.
            </p>
          </details>
          <details className="faq">
            <summary>How do I delete my account?</summary>
            <p>
              In the app: Account Settings → Delete account. We immediately revoke all
              active sessions and clear your sign-in identifiers. Health data enters a
              six-year retention window required for audit, regulatory, and dispute-
              resolution purposes. You can request a shorter window in writing to{" "}
              <a href="mailto:info@veladon.com">info@veladon.com</a>.
            </p>
          </details>
          <details className="faq">
            <summary>Apple Health isn't syncing.</summary>
            <p>
              Veladon reads HealthKit only while the app is open — we do not enable
              background delivery. Open Veladon and pull to refresh. If the categories
              you expected aren't there, check Settings → Privacy &amp; Security →
              Health → Veladon and confirm the data types are granted.
            </p>
          </details>
          <details className="faq">
            <summary>I want to report a security issue.</summary>
            <p>
              Email <a href="mailto:info@veladon.com">info@veladon.com</a> with
              "security" in the subject. We respond to security reports within one
              business day and confirm fixes before public disclosure.
            </p>
          </details>
        </div>
      </section>
    </main>
  );
}
