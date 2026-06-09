import Image from "next/image";
import iconPng from "./icon.png";
import { AppStoreButton } from "./_components/AppStoreButton";

export default function HomePage() {
  return (
    <main>
      <section className="section">
        <div className="col col-prose stack-5">
          <p className="eyebrow">Veladon · Your personal health record storage</p>
          <div className="headline-row">
            <Image
              src={iconPng}
              alt=""
              width={96}
              height={96}
              priority
              className="headline-icon"
            />
            <h1 className="display">
              Your medical record<span className="accent">.</span> Yours
              <span className="accent">.</span>
            </h1>
          </div>
          <p className="lead" style={{ maxWidth: "62ch" }}>
            Veladon makes it easier to request your medical records from any provider
            — including the ones whose records aren't available digitally. Organize
            them in one app. Share them on your terms.
          </p>
          <div className="btn-row">
            <AppStoreButton />
          </div>
        </div>
      </section>

      <section className="section subtle">
        <div className="col col-prose stack-4">
          <p className="eyebrow">The wedge</p>
          <h2>Your record lives in eight places. None of them are you.</h2>
          <p className="lead">
            Every clinic, lab, and hospital you've visited holds a slice of your
            history. Each one hides it behind a different portal, a different login,
            and a different release form.
          </p>
          <p>
            Veladon helps you ask for your records and gives you one place to keep
            them once they arrive. You sign the authorization in the app; the provider
            sends the records to you; you store them in Veladon so your whole history
            lives somewhere you actually look.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="col col-prose">
          <p className="eyebrow">How it works</p>
          <h2 style={{ marginBottom: "var(--space-6)" }}>Three steps. One app.</h2>
          <div>
            <div className="row2">
              <div className="label">01 · Add a provider</div>
              <div className="body">
                Search for the clinic, hospital, lab, or specialist. Pick what you
                want — everything on file, or a specific date range and record type.
              </div>
            </div>
            <div className="row2">
              <div className="label">02 · Sign the release</div>
              <div className="body">
                Veladon generates a HIPAA-compliant authorization, pre-filled with your
                information. Sign it on the glass, set an expiration date, and submit.
                You can void it any time before it's acted on.
              </div>
            </div>
            <div className="row2">
              <div className="label">03 · Request and store</div>
              <div className="body">
                Veladon helps you submit the request and tracks it. The provider sends
                the records to wherever you tell them — your mailbox, your inbox, the
                front desk at your next visit. You upload them to Veladon and keep
                your whole history in one place.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section subtle">
        <div className="col col-prose">
          <p className="eyebrow">What you get</p>
          <h2 style={{ marginBottom: "var(--space-6)" }}>One app. Six things it does.</h2>
          <div>
            <div className="row2">
              <div className="label">Releases</div>
              <div className="body">
                The headline feature. Generate a HIPAA-compliant authorization,
                pre-filled with your information, and sign it on the glass. You direct
                the provider where to send the records — to you, your home, or another
                provider you name. Revoke any release before it's acted on.
              </div>
            </div>
            <div className="row2">
              <div className="label">Apple Health</div>
              <div className="body">
                A second lane into your record. Connect Apple Health to bring the
                vitals and clinical data you've already synced on your iPhone —
                heart rate, sleep, activity, lab results, immunizations, medications,
                and more — straight into Veladon alongside the records you request
                from providers.
              </div>
            </div>
            <div className="row2">
              <div className="label">Your record, organized</div>
              <div className="body">
                Once you've uploaded what your providers send you, Veladon organizes
                everything by provider and date and renders the data you've connected
                — <strong>allergies, conditions, immunizations, lab results,
                medications, procedures, vital signs, coverage</strong> — in plain
                English.
              </div>
            </div>
            <div className="row2">
              <div className="label">Documents</div>
              <div className="body">
                Upload photos or scans of paper records you already have. Tag them by
                document type and provider. Encrypted at rest, retrievable in a tap.
              </div>
            </div>
            <div className="row2">
              <div className="label">Providers &amp; insurance</div>
              <div className="body">
                Keep the directory you actually need: every clinician you've seen,
                every plan that covers you, every member ID — in one place instead of
                a stack of cards.
              </div>
            </div>
            <div className="row2">
              <div className="label">Designated Agents</div>
              <div className="body">
                Delegate access to a family member or caregiver — per category, per
                permission. View only, or view-and-edit. Revoke instantly. The right
                people see exactly what you choose.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="col col-prose stack-4">
          <p className="eyebrow">Your data, your device</p>
          <h2>Built to a HIPAA-equivalent standard. From day one.</h2>
          <p>
            Sensitive identifiers and health data are encrypted at rest with
            AES-256-GCM. Every connection to our servers uses TLS. Sessions are
            per-device, biometric-locked (Face ID / Touch ID), and revocable from any
            other device in seconds.
          </p>
          <p>
            We do not sell your health information. We do not serve targeted ads
            against it. We do not share it with employers, insurers, or marketers
            without a signed Release from you. We do not use your protected health
            information to train AI models — ours or anyone else's.
          </p>
          <p className="meta">
            Read the details in our <a href="/privacy">Privacy Policy</a>.
          </p>
        </div>
      </section>

      <section className="section subtle">
        <div className="col col-prose stack-4">
          <p className="eyebrow">Who Veladon is for</p>
          <h2>Three kinds of people we built this for.</h2>
          <div className="stack-5" style={{ marginTop: "var(--space-5)" }}>
            <div>
              <h3>Anyone whose care lives across multiple providers.</h3>
              <p style={{ marginTop: "var(--space-2)" }}>
                Primary care in one place, specialists in another, labs and imaging
                somewhere else again. When every visit starts with re-collecting the
                same record, Veladon is the place it all comes together.
              </p>
            </div>
            <div>
              <h3>Caregivers.</h3>
              <p style={{ marginTop: "var(--space-2)" }}>
                Helping a parent, partner, or child navigate the system. Designated
                Agent access gives you the visibility you need without an awkward
                password handoff or a HIPAA violation.
              </p>
            </div>
            <div>
              <h3>Anyone tired of chasing records.</h3>
              <p style={{ marginTop: "var(--space-2)" }}>
                If you've ever printed a release form and spent two weeks on hold
                trying to confirm it landed — Veladon is for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="col col-prose stack-4">
          <p className="eyebrow">What Veladon isn't</p>
          <h2>Not a doctor. Not a diagnosis. Not a substitute for care.</h2>
          <p>
            Veladon does not diagnose, treat, cure, or prevent any condition. It
            collects the records your providers already hold and puts them in front of
            you so you can show up informed. Decisions about your care belong with you
            and your clinician.
          </p>
          <p>
            If you think you may be having a medical emergency, call your local
            emergency number — not us.
          </p>
        </div>
      </section>

      <section className="section subtle">
        <div className="col col-prose">
          <p className="eyebrow">Questions</p>
          <h2 style={{ marginBottom: "var(--space-6)" }}>FAQ.</h2>
          <details className="faq">
            <summary>What's a personal health record?</summary>
            <p>
              A PHR is a copy of your health information that you — not a hospital or
              insurer — control. Veladon is a consumer-direct PHR.
            </p>
          </details>
          <details className="faq">
            <summary>How does Veladon get my records from a provider?</summary>
            <p>
              Veladon doesn't get them — you do. We help you generate a
              HIPAA-compliant authorization, pre-filled and signable in the app. You
              submit it, and the provider sends the records to the address or contact
              you specified on the release: your home, your email, your hands at the
              next visit. Veladon is where you upload and keep them once they arrive.
              Federal law gives providers up to thirty days to respond, though most
              respond in one to two weeks.
            </p>
          </details>
          <details className="faq">
            <summary>Does it work with any provider?</summary>
            <p>
              Any U.S. provider that accepts a HIPAA-compliant authorization — which,
              by law, is all of them. If a particular provider has an unusual intake
              process, we'll flag it before you sign and walk you through it.
            </p>
          </details>
          <details className="faq">
            <summary>Where does my data live?</summary>
            <p>
              On your phone and on our servers. Sensitive identifiers and health data
              are encrypted at rest with AES-256-GCM; everything in transit uses TLS.
              Documents are stored in encrypted object storage.
            </p>
          </details>
          <details className="faq">
            <summary>Is Veladon HIPAA-compliant?</summary>
            <p>
              As a PHR vendor we may not technically be a HIPAA "Covered Entity", but
              we have voluntarily adopted safeguards that mirror HIPAA's Security and
              Privacy Rules — encryption at rest and in transit, role-based access,
              session revocation, audit logging, and a six-year retention floor on
              health data we hold.
            </p>
          </details>
          <details className="faq">
            <summary>Can I share records with another doctor?</summary>
            <p>
              Yes — that's part of why Veladon exists. The app is designed to make it
              easier to share your medical records with your doctors when they need
              them, or to assign a Designated Agent — a family member, caregiver, or
              other trusted person — to help manage your records on your behalf. The
              aim is for your medical history to be accessible to the health providers
              who need it, on your terms. Generate a Release naming the recipient,
              sign it, and submit. Same authorization flow as a request; you direct
              where the records go.
            </p>
          </details>
          <details className="faq">
            <summary>Android?</summary>
            <p>
              iPhone first. Android is on the roadmap; we'd rather ship one platform
              well than two halfway.
            </p>
          </details>
          <details className="faq">
            <summary>Who built this?</summary>
            <p>
              Veladon is built by Zabaca, Inc. Questions:{" "}
              <a href="mailto:support@veladon.com">support@veladon.com</a>.
            </p>
          </details>
        </div>
      </section>

      <section className="section">
        <div className="col col-prose stack-4">
          <p className="eyebrow">Ready</p>
          <h2 style={{ maxWidth: "22ch" }}>
            Get the record you should've had all along<span className="accent">.</span>
          </h2>
          <div className="btn-row" style={{ marginTop: "var(--space-5)" }}>
            <AppStoreButton />
          </div>
        </div>
      </section>
    </main>
  );
}
