/**
 * Canonical text for Veladon's Terms of Service and Privacy Policy.
 *
 * IMPORTANT: keep this file in lockstep with `docs/legal/terms.html` and
 * `docs/legal/privacy.html`. Any edit here MUST be reflected there (and
 * vice versa). The in-app screens render from this file; the HTML files
 * are for outside-counsel review and future veladon.com hosting.
 *
 * Section numbering is part of the legal text — don't renumber on a whim.
 * Bump LEGAL_DOC_VERSION + CONSENT_VERSION when you change semantics, so
 * users are forced to re-accept on next launch.
 *
 * These drafts encode HIPAA-equivalent commitments for a consumer Personal
 * Health Record (PHR) app. They are not legal advice; outside counsel must
 * review before production use.
 */

import {
  COMPANY_BRAND,
  COMPANY_LEGAL_NAME,
  GOVERNING_STATE,
  LEGAL_DOC_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_EMAIL,
  PRIVACY_EMAIL,
  SUPPORT_EMAIL,
} from "@health-agent/types";

export type LegalSection = {
  heading: string;
  /** Each paragraph is rendered as its own block. Bullet lists are an array. */
  body: Array<string | { bullets: string[] }>;
};

export type LegalDocument = {
  title: string;
  effectiveDate: string;
  version: string;
  sections: LegalSection[];
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: `${COMPANY_BRAND} Terms of Service`,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  version: LEGAL_DOC_VERSION,
  sections: [
    {
      heading: "1. Acceptance of these Terms",
      body: [
        `These Terms of Service ("Terms") are a binding agreement between you and ${COMPANY_LEGAL_NAME} ("${COMPANY_BRAND}", "we", "us", or "our"), the operator of the ${COMPANY_BRAND} mobile application (the "App"). By creating an account, accepting these Terms during sign-up, or using the App, you agree to be bound by them.`,
        `We record your acceptance, together with the version of these Terms you accepted, on the date of acceptance. If we materially change these Terms, we will bump the version and ask you to review and accept the updated Terms before you continue using the App.`,
      ],
    },
    {
      heading: "2. Eligibility and age",
      body: [
        `You must be at least 18 years old to create your own ${COMPANY_BRAND} account. By accepting these Terms you confirm you meet this age requirement.`,
        `Users under 18 may participate in ${COMPANY_BRAND} only when an adult User who is the rightful holder of the health information designates them via the User-Designated Agent ("UDA") flow described in Section 7. In that case, the adult User (or the User's legal guardian) is responsible for the minor's use of the App and for confirming that doing so is lawful in their jurisdiction. The UDA-invited account is governed by these Terms as accepted by the adult User.`,
      ],
    },
    {
      heading: "3. What Veladon does",
      body: [
        `${COMPANY_BRAND} is a personal health record ("PHR") application that helps you collect, organize, view, and share copies of your own health information. The App may, depending on the features you enable, do any of the following:`,
        {
          bullets: [
            "Read vitals you have stored in Apple Health (heart rate, step count, sleep analysis, blood glucose, active energy) and display trends and summaries.",
            "Read FHIR clinical records you have synced to Apple Health (allergies, conditions, immunizations, lab results, medications, procedures, vital signs, coverage records).",
            "Let you upload photographs or scans of health documents.",
            "Help you track your healthcare providers and insurance information.",
            "Let you generate signed authorizations (Releases) so you can request records from providers.",
            "Let you delegate access to a trusted person (a UDA) on a per-permission basis.",
          ],
        },
        `${COMPANY_BRAND} is not a medical device, is not telemedicine, does not diagnose, treat, cure, or prevent any condition, and is not a substitute for professional medical advice. See Section 6.`,
      ],
    },
    {
      heading: "4. Your account",
      body: [
        `You can create an account using an email address and password, "Sign in with Apple", or "Sign in with Google". You are responsible for keeping your credentials secure and for all activity that occurs under your account.`,
        `You may enable biometric unlock (Face ID / Touch ID) on your device for an added layer of in-app protection. Mobile sessions are valid for up to 30 days and you can revoke any active session at any time from the Active Devices screen.`,
        `You agree to provide accurate information about yourself and to keep it current. We may suspend or terminate accounts that we reasonably believe have provided false information or are being used to harm others.`,
      ],
    },
    {
      heading: "5. Acceptable use",
      body: [
        "You agree that you will not:",
        {
          bullets: [
            "Use the App for any unlawful purpose or in violation of any applicable law or regulation.",
            "Upload or share information that you do not have the right to share.",
            "Attempt to access another person's data except through a properly granted UDA relationship.",
            "Reverse-engineer, decompile, or otherwise attempt to extract source code or trade secrets from the App, except to the extent expressly permitted by law.",
            "Interfere with, disrupt, or attempt to gain unauthorized access to our systems or networks.",
            "Use the App, or any data obtained through it, as the sole basis for any medical decision.",
          ],
        },
      ],
    },
    {
      heading: "6. No medical advice",
      body: [
        `THE INFORMATION YOU SEE IN ${COMPANY_BRAND.toUpperCase()} IS FOR INFORMATIONAL AND ORGANIZATIONAL PURPOSES ONLY. ${COMPANY_BRAND} does not provide medical advice, and nothing in the App should be construed as a recommendation for any particular treatment, procedure, medication, or course of action.`,
        `Always seek the advice of a qualified licensed clinician with any questions you have about a medical condition or treatment. Never disregard professional medical advice or delay seeking it because of something you have read or seen in the App. If you think you may be having a medical emergency, call your local emergency number immediately.`,
      ],
    },
    {
      heading: "7. User-Designated Agents",
      body: [
        `You can invite another person — for example, a family member or caregiver — to act as a User-Designated Agent ("UDA") on your behalf. You choose what they can do by granting permissions in three independent areas:`,
        {
          bullets: [
            "Health records — view only, or view plus upload, edit, and delete documents and clinical data.",
            "Providers and insurance — view only, or view plus add, edit, and delete.",
            "Releases (record-request authorizations) — view releases naming the UDA as authorized agent, or create new releases as well.",
          ],
        },
        `Granting UDA access shares health information about you with the UDA. Only invite people you trust. You can revoke a UDA's access at any time from the Designated Agents screen; revocation takes effect on their next session.`,
        `A UDA who is also a ${COMPANY_BRAND} user must accept these Terms in their own right when they sign in for the first time. A UDA-only account that exists solely to act on someone else's behalf accepts these Terms through the inviting User's acceptance of them.`,
      ],
    },
    {
      heading: "8. Health Releases (authorizations)",
      body: [
        `When you create a Release in ${COMPANY_BRAND}, you authorize us to transmit the information you specify to the healthcare provider you name, for the purposes you describe, until the authorization's expiration date. You can void a Release before it is acted on. You acknowledge that information transmitted to a third-party provider is then governed by that provider's own privacy practices.`,
      ],
    },
    {
      heading: "9. Fees",
      body: [
        `The App is provided at no charge for personal use during the current release. We may introduce paid plans or premium features in the future; if we do, we will give you advance notice and you will be free to continue using the free tier or to discontinue use. Any in-app purchases will be subject to the platform store's billing terms in addition to these Terms.`,
      ],
    },
    {
      heading: "10. Intellectual property",
      body: [
        `${COMPANY_LEGAL_NAME} and its licensors own the App, the ${COMPANY_BRAND} brand, and all related intellectual property. You receive a personal, limited, non-exclusive, non-transferable, revocable license to use the App as intended.`,
        `You retain ownership of your health data. You grant us a limited license to process and store that data solely to operate the App for you and to perform the actions you direct (such as fulfilling a Release or sharing with a UDA).`,
      ],
    },
    {
      heading: "11. Termination, account deletion, and data retention",
      body: [
        `You may delete your account at any time from Account Settings. When you do:`,
        {
          bullets: [
            "All active sessions are immediately revoked, so the App can no longer be used to access your data.",
            "Your account identifiers (email address, Apple sign-in identifier, Google sign-in identifier, password) are cleared so the account cannot be signed in to.",
            "Active UDA relationships in which you are the inviting User are revoked.",
            "Your account enters a retention period of six (6) years, after which it is permanently deleted, including the health data you stored in the App, by an automated purge job. This six-year retention window is the default applied to protected health information under HIPAA and similar laws and is intended to support audit, regulatory, and dispute-resolution needs. You can ask us to shorten this window for your account by writing to us at " + PRIVACY_EMAIL + ".",
          ],
        },
        `We may suspend or terminate your account if we reasonably believe you have materially breached these Terms or applicable law, if required to do so by legal process, or if the App is discontinued. If we discontinue the App we will give you reasonable notice and a way to export your data.`,
      ],
    },
    {
      heading: "12. Disclaimers",
      body: [
        `THE APP IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, ${COMPANY_LEGAL_NAME.toUpperCase()} DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.`,
      ],
    },
    {
      heading: "13. Limitation of liability",
      body: [
        `TO THE FULLEST EXTENT PERMITTED BY LAW, ${COMPANY_LEGAL_NAME.toUpperCase()} WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE APP. OUR AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS WILL NOT EXCEED THE GREATER OF (A) ONE HUNDRED U.S. DOLLARS (\$100) OR (B) THE AMOUNTS YOU PAID US, IF ANY, IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.`,
      ],
    },
    {
      heading: "14. Indemnification",
      body: [
        `You agree to indemnify and hold harmless ${COMPANY_LEGAL_NAME} and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with (a) your use of the App, (b) your violation of these Terms, or (c) your violation of any third-party right, including any privacy or intellectual property right.`,
      ],
    },
    {
      heading: "15. Governing law",
      body: [
        `These Terms are governed by the laws of the State of ${GOVERNING_STATE}, U.S.A., without regard to its conflict-of-laws rules. The parties consent to the personal jurisdiction of, and venue in, the state and federal courts located in ${GOVERNING_STATE} for any dispute not subject to arbitration. Nothing in this Section limits any right you may have under your local consumer-protection laws.`,
      ],
    },
    {
      heading: "16. Changes to these Terms",
      body: [
        `We may update these Terms from time to time. When we do, we will update the effective date and version at the top of the document. Material changes will trigger an in-app prompt asking you to review and accept the new Terms before you continue using the App.`,
      ],
    },
    {
      heading: "17. Contact",
      body: [
        `Questions about these Terms? Email us at ${LEGAL_EMAIL}. For general support questions, write to ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  title: `${COMPANY_BRAND} Privacy Policy`,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  version: LEGAL_DOC_VERSION,
  sections: [
    {
      heading: "1. Who we are",
      body: [
        `${COMPANY_LEGAL_NAME} ("${COMPANY_BRAND}", "we", "us", or "our") operates the ${COMPANY_BRAND} mobile application (the "App"). This Privacy Policy explains what information the App collects, how we use it, with whom we share it, and the choices you have.`,
      ],
    },
    {
      heading: "2. Scope of this Policy",
      body: [
        `This Policy covers the ${COMPANY_BRAND} mobile application for iOS and Android, and the back-end services that the App talks to. There is no public ${COMPANY_BRAND} website or web product covered by this Policy at this time. If we launch a web product later, we will update this Policy and notify you in-app.`,
      ],
    },
    {
      heading: "3. Our HIPAA-equivalent commitment",
      body: [
        `${COMPANY_BRAND} is a consumer-direct personal health record (PHR) app. As a PHR vendor we may not technically be a "Covered Entity" under the U.S. Health Insurance Portability and Accountability Act ("HIPAA"). Regardless, we have voluntarily adopted safeguards that mirror HIPAA's Security and Privacy Rules — encryption of sensitive identifiers at rest, transport-layer encryption in transit, role-based access controls, session revocation, audit logging of administrative actions, and a six-year minimum retention window for health data we hold.`,
        `If a breach of unsecured health information occurs, we will notify affected users without unreasonable delay and consistent with the U.S. Federal Trade Commission's Health Breach Notification Rule and applicable state laws.`,
      ],
    },
    {
      heading: "4. Information we collect",
      body: [
        `We collect only the information needed to provide the features you use. Specifically:`,
        `Account and profile. When you create an account we collect your email address and a hashed copy of your password (or, if you sign in with Apple or Google, the subject identifier they return to us). When you complete your profile we collect your first, middle, and last name, your date of birth, mailing address, phone number, the last four digits of your Social Security Number (for record-request authorizations), and an optional avatar image.`,
        `Apple Health (iOS only). When you connect Apple Health, the App reads — with your permission, granted in Apple's system permission sheet — the following data types: heart rate, step count, sleep analysis, blood glucose, and active energy. If you have FHIR clinical records in Apple Health, the App also reads, over a one-year lookback window: allergies, conditions, immunizations, lab results, medications, procedures, vital signs, and coverage records. We do not enable HealthKit background delivery; HealthKit data is read only while the App is open.`,
        `Documents you upload. If you upload photographs or scans of health documents, we store the encrypted file and metadata you provide (such as the document type and the provider it relates to).`,
        `Providers and Releases. We store the insurance and physician information you enter, the providers you choose as recipients of Releases, and the contents of any Release you create (including the signature image and authorization period).`,
        `User-Designated Agent (UDA) relationships. We store the email of anyone you invite as a UDA, your relationship to them, and the permissions you granted, so that the App can enforce your access decisions.`,
        `Sessions and device information. For each device you sign in from, we store the operating system, device name, IP address, and a coarse geographic location derived from the IP address (country, region, city). This lets you see and revoke sessions from Active Devices.`,
        `Diagnostic information. If something goes wrong we may record error reports that contain technical details about the failure but not the contents of your health records.`,
      ],
    },
    {
      heading: "5. How we use information",
      body: [
        `We use the information we collect to:`,
        {
          bullets: [
            "Operate the App and the features you enable.",
            "Sync your data with Apple Health when you ask us to.",
            "Generate, transmit, and track the Releases you authorize.",
            "Enforce the permissions you have granted to UDAs.",
            "Authenticate you and protect your account from unauthorized access.",
            "Diagnose and fix problems in the App.",
            "Comply with our legal obligations and respond to lawful requests.",
          ],
        },
      ],
    },
    {
      heading: "6. What we do NOT do with your health information",
      body: [
        `We do not sell your health information. We do not serve targeted advertising based on it. We do not share it with insurance companies, employers, or marketers without your explicit Release. We do not use your protected health information to train artificial-intelligence models, ours or anyone else's.`,
      ],
    },
    {
      heading: "7. With whom we share information",
      body: [
        "We share information only as follows:",
        {
          bullets: [
            "With User-Designated Agents you have invited, limited to the categories and permission level you granted.",
            "With healthcare providers you have named as recipients of a Release, only after you have signed and dated the corresponding authorization.",
            "With service providers that operate the infrastructure for us — currently Vercel (application hosting), Cloudflare R2 (encrypted document storage), Apple and Google (for sign-in identification), and our transactional-email provider. Each of these vendors is contractually limited to processing information on our behalf.",
            "To comply with valid legal process, when we reasonably believe disclosure is necessary to protect against fraud or harm, or in connection with a corporate transaction such as a merger or acquisition (in which case we will notify you and your data continues to be protected by this Policy).",
          ],
        },
      ],
    },
    {
      heading: "8. Apple Health (HealthKit) specifics",
      body: [
        `Apple Health data read by the App is governed in addition by Apple's HealthKit rules:`,
        {
          bullets: [
            "Apple Health permissions are managed by you in Apple's own system permission sheet. You can grant or revoke individual data types at any time in Settings → Privacy & Security → Health.",
            "We do not use Apple Health data for advertising or other use-based data mining, and we do not sell Apple Health data.",
            "We do not share Apple Health data with third parties for advertising or similar services.",
            "We do not share Apple Health data with anyone without your consent (other than as needed to provide the service to you, e.g. transmitting it on your behalf as part of a Release you signed).",
          ],
        },
      ],
    },
    {
      heading: "9. How we protect your information",
      body: [
        `We use industry-standard safeguards, including:`,
        {
          bullets: [
            "AES-256-GCM encryption at rest for sensitive identifiers (date of birth, last four of SSN), for Apple Health data we have stored, and for files you upload.",
            "TLS encryption in transit for every connection between the App and our servers.",
            "Per-session JSON Web Tokens with server-side revocation, so a stolen session can be cut immediately.",
            "Optional biometric unlock (Face ID / Touch ID) on your device.",
            "Role-based permission checks on every request that could expose another user's data.",
          ],
        },
        `No security measure is perfect. If you believe your account has been compromised, contact ${PRIVACY_EMAIL} right away.`,
      ],
    },
    {
      heading: "10. How long we keep your information",
      body: [
        `Account and health data are kept for as long as your account is active and then for six (6) years after the date you delete your account, after which they are permanently purged by an automated job. This six-year window mirrors the HIPAA records-retention default and supports audit, regulatory, and dispute-resolution needs.`,
        `Disconnecting Apple Health from inside the App stops future syncs but does not, by itself, delete the data already synced to ${COMPANY_BRAND}. To remove that data you can delete your account, or you can email ${PRIVACY_EMAIL} to ask us to wipe the synced HealthKit data while keeping your account.`,
        `Diagnostic and audit logs are kept for as long as we need them for security investigation and legal compliance, which is generally no longer than six years.`,
      ],
    },
    {
      heading: "11. Your rights and choices",
      body: [
        "You can:",
        {
          bullets: [
            "View and correct your profile information at any time from Edit Profile.",
            "Disconnect Apple Health from inside the App.",
            "Manage your User-Designated Agents — invite, change permissions, or revoke — from the Designated Agents screen.",
            "See and sign out of any device from Active Devices.",
            "Delete your account from Account Settings, with the retention period described in Section 10.",
            "Request a copy of the information we hold about you by emailing " + PRIVACY_EMAIL + ". We will respond in a reasonable timeframe and, where required by law, within statutory deadlines.",
            "Withdraw your consent to these Terms or this Policy by deleting your account. If we materially change either document, we will re-prompt you to accept the new version before you continue.",
          ],
        },
      ],
    },
    {
      heading: "12. Children",
      body: [
        `${COMPANY_BRAND} does not allow users under the age of 18 to create their own accounts. A parent, legal guardian, or other authorized adult User may enroll a minor by designating them through the User-Designated Agent flow described in our Terms. In that case, the adult User (or the User's legal guardian) is responsible for the minor's use of the App and for confirming that doing so is lawful in their jurisdiction.`,
        `If you believe a child under 18 has created an account directly with us, please contact ${PRIVACY_EMAIL} and we will remove the account.`,
      ],
    },
    {
      heading: "13. Breach notification",
      body: [
        `If a breach of unsecured personally identifiable health information occurs, we will notify affected users without unreasonable delay and consistent with the FTC Health Breach Notification Rule (16 C.F.R. Part 318) and applicable state laws. Notice will describe, to the extent known at the time, what happened, the types of information involved, what we are doing in response, and what you can do to protect yourself.`,
      ],
    },
    {
      heading: "14. International users",
      body: [
        `${COMPANY_BRAND} is operated from the United States and is intended for users in the United States. The App is not currently designed for users in the European Economic Area or the United Kingdom; we do not address the General Data Protection Regulation (GDPR) or UK GDPR in this Policy. If you access the App from outside the United States, you do so on your own initiative and at your own risk.`,
      ],
    },
    {
      heading: "15. Changes to this Policy",
      body: [
        `We may update this Policy from time to time. Material changes will bump the version and we will ask you to review and accept the new Policy in-app before you continue. The current version and effective date appear at the top of the document.`,
      ],
    },
    {
      heading: "16. Contact us",
      body: [
        `Questions about this Policy, requests for access to your information, or breach reports? Email ${PRIVACY_EMAIL}. You can also write to us at ${COMPANY_LEGAL_NAME}, {{LEGAL_ADDRESS}}.`,
      ],
    },
  ],
};
