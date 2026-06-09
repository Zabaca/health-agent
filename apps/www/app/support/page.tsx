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
            <div className="label">General help</div>
            <div className="body">
              <a href="mailto:support@veladon.com">support@veladon.com</a>
              <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-muted)" }}>
                App questions, bug reports, account help, feature requests.
              </p>
            </div>
          </div>
          <div className="row2">
            <div className="label">Privacy</div>
            <div className="body">
              <a href="mailto:privacy@veladon.com">privacy@veladon.com</a>
              <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-muted)" }}>
                Data access requests, deletion requests, security disclosures, breach
                inquiries.
              </p>
            </div>
          </div>
          <div className="row2">
            <div className="label">Legal</div>
            <div className="body">
              <a href="mailto:legal@veladon.com">legal@veladon.com</a>
              <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-muted)" }}>
                Service of process, terms questions, regulatory inquiries.
              </p>
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
              <a href="mailto:support@veladon.com">support@veladon.com</a>.
            </p>
          </details>
          <details className="faq">
            <summary>How do I delete my account?</summary>
            <p>
              In the app: Account Settings → Delete account. We immediately revoke all
              active sessions and clear your sign-in identifiers. Health data enters a
              six-year retention window required for audit, regulatory, and dispute-
              resolution purposes. You can request a shorter window in writing to{" "}
              <a href="mailto:privacy@veladon.com">privacy@veladon.com</a>.
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
              Email <a href="mailto:privacy@veladon.com">privacy@veladon.com</a> with
              "security" in the subject. We respond to security reports within one
              business day and confirm fixes before public disclosure.
            </p>
          </details>
        </div>
      </section>
    </main>
  );
}
