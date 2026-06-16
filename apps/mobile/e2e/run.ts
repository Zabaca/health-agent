/**
 * E2E orchestrator. Boots a fresh temp DB + test web server + Metro, then runs
 * the multi-actor Maestro journey sequence, bridging the two actors (patient and
 * PDA) via the temp-DB oracle and the invite-accept API. Run from the repo shell:
 *
 *   bun run e2e/run.ts                 # full sequence (fast reset)
 *   bun run e2e/run.ts --keep-db       # leave the temp DB for inspection
 *
 * The journeys run in order against ONE fresh temp DB — later scenarios depend on
 * state the earlier ones create (the patient account, the pending invite, the
 * accepted PDA). Between journey 3 and 4 the harness reads the invite token from
 * the DB and accepts it over the API (a fresh invitee can't accept in-app — see
 * the project_maestro_e2e memory).
 */
import { join } from "node:path";
import { CREDS, MOBILE_DIR, tempDbPath } from "./config";
import {
  ensureE2eSim, freeStalePorts, installAppOnSim, loadRootEnv, migrateTempDb,
  runMaestroFlow, seedPhotoLibrary, startAppLogCapture, startCdpCapture,
  startMetro, startWebServer, teardown,
} from "./harness";
import {
  assert, getInvite, getProvidersForUser, getReleasesForPatient,
  getUploadedRecordsForPatient, getUploadLogForFile, getUserByEmail, openDb,
} from "./db";
import { acceptInviteAsNewUser } from "./api";
import { dbUrl } from "./config";

const journeys = (name: string) => join(MOBILE_DIR, ".maestro", "journeys", name);
const keepDb = process.argv.includes("--keep-db");

const ok = (m: string) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const step = (m: string) => console.log(`\n\x1b[1m▶ ${m}\x1b[0m`);

/** Run a journey flow and assert it passed (fails fast — the sequence is ordered). */
function journey(name: string, env: Record<string, string>, udid: string): void {
  const r = runMaestroFlow(journeys(name), env, udid);
  assert(r.passed, `${name} flow passed`);
  ok(`${name} flow passed`);
}

async function main() {
  const stamp = String(Date.now());
  const dbPath = tempDbPath(stamp);
  const rootEnv = loadRootEnv();
  let failed = false;

  const onSignal = () => { teardown(); process.exit(130); };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  try {
    step("Setup: temp DB + migrations");
    migrateTempDb(dbPath, rootEnv);

    step("Setup: dedicated E2E simulator (clean, no iCloud)");
    const udid = ensureE2eSim();
    installAppOnSim(udid);
    seedPhotoLibrary(udid);
    startAppLogCapture(udid);

    step("Setup: test web server + Metro");
    freeStalePorts(); // clear orphaned :3100/:8081 from any prior interrupted run
    await startWebServer(dbPath, rootEnv);
    await startMetro();
    startCdpCapture(); // record device console warnings (incl. debugger-routed) → cdp log

    const db = openDb(dbUrl(dbPath));

    // ---- Scenario 1: patient registers through the UI ----
    step("Scenario 1: patient register → consent → dashboard");
    journey("patient-register.yaml", {
      EMAIL: CREDS.patient.email, PASSWORD: CREDS.patient.password,
    }, udid);

    const patient = await getUserByEmail(db, CREDS.patient.email);
    assert(patient, `User row exists for ${CREDS.patient.email}`);
    assert(patient!.consentedAt, "patient consentedAt is set (consent recorded)");
    const patientId = String(patient!.id);
    ok(`DB oracle: patient user ${patientId} created and consented`);

    // ---- Scenario 2: patient completes profile + adds a provider ----
    step("Scenario 2: patient setup — edit profile + add provider");
    journey("patient-setup.yaml", {}, udid);

    const patientAfterSetup = await getUserByEmail(db, CREDS.patient.email);
    assert(patientAfterSetup!.profileComplete, "patient profileComplete is set");
    const patientProviders = await getProvidersForUser(db, patientId);
    assert(
      patientProviders.some((p) => p.providerName === "Mass General Hospital"),
      'patient has a "Mass General Hospital" provider',
    );
    ok("DB oracle: profile complete + Mass General Hospital provider added");

    // ---- Scenario 3: patient invites a PDA (records/providers/releases = editor) ----
    step("Scenario 3: patient invites a designated agent");
    journey("patient-invite-pda.yaml", { PDA_EMAIL: CREDS.pda.email }, udid);

    const invite = await getInvite(db, CREDS.pda.email);
    assert(invite, `invite row exists for ${CREDS.pda.email}`);
    assert(invite!.status === "pending", "invite status is pending");
    assert(invite!.token, "invite has a token");
    assert(
      invite!.manageProvidersPermission === "editor",
      "PDA granted providers editor (needed for scenario 5)",
    );
    ok(`DB oracle: pending invite + token for ${CREDS.pda.email}`);

    // ---- Scenario 3b: harness accepts the invite via API (register path) ----
    step("Scenario 3b: accept invite via API (creates the PDA account)");
    await acceptInviteAsNewUser(String(invite!.token), {
      password: CREDS.pda.password,
      firstName: CREDS.pda.firstName,
      lastName: CREDS.pda.lastName,
    });

    const pdaUser = await getUserByEmail(db, CREDS.pda.email);
    assert(pdaUser, `PDA user row created for ${CREDS.pda.email}`);
    const acceptedInvite = await getInvite(db, CREDS.pda.email);
    assert(acceptedInvite!.status === "accepted", "invite status flipped to accepted");
    assert(
      acceptedInvite!.agentUserId === pdaUser!.id,
      "invite linked to the new PDA user (agentUserId)",
    );
    ok(`DB oracle: invite accepted, PDA user ${String(pdaUser!.id)} linked to patient`);

    // ---- Scenario 4: PDA signs in + completes PDA onboarding ----
    step("Scenario 4: PDA login → PDA onboarding → PdaHome");
    journey("pda-onboard.yaml", {
      MAESTRO_EMAIL: CREDS.pda.email, MAESTRO_PASSWORD: CREDS.pda.password,
    }, udid);

    const pdaAfterOnboard = await getUserByEmail(db, CREDS.pda.email);
    assert(pdaAfterOnboard!.onboarded, "PDA onboarded is set");
    ok("DB oracle: PDA onboarded");

    // ---- Scenario 5: PDA adds a provider for the patient ----
    step("Scenario 5: PDA adds a provider for the patient");
    journey("pda-add-provider.yaml", {}, udid);

    const providersAfterPda = await getProvidersForUser(db, patientId);
    assert(
      providersAfterPda.some((p) => p.providerName === "Boston Children's Hospital"),
      "patient gained a \"Boston Children's Hospital\" provider (added by PDA)",
    );
    ok("DB oracle: PDA-added Boston Children's Hospital provider on patient");

    // ---- Scenario 6: PDA creates a HIPAA release for the patient (unsigned) ----
    step("Scenario 6: PDA creates a HIPAA release (4-step wizard)");
    journey("pda-create-release.yaml", {}, udid);

    const releasesAfterCreate = await getReleasesForPatient(db, patientId);
    assert(releasesAfterCreate.length >= 1, "a Release row exists for the patient");
    const pendingRelease = releasesAfterCreate[0];
    assert(pendingRelease.releaseAuthAgent, "release was created by the agent (releaseAuthAgent)");
    assert(!pendingRelease.authSignatureImage, "release is unsigned (pending patient signature)");
    ok(`DB oracle: agent-created release ${String(pendingRelease.id)} pending signature`);

    // ---- Scenario 7: PDA uploads a record for the patient (real photo picker) ----
    step("Scenario 7: PDA uploads a record for the patient");
    journey("pda-upload-record.yaml", {}, udid);

    const pdaUploads = await getUploadedRecordsForPatient(db, patientId);
    assert(pdaUploads.length >= 1, "an uploaded IncomingFile row exists for the patient");
    const pdaUpload = pdaUploads[0];
    const pdaUploadLog = await getUploadLogForFile(db, String(pdaUpload.id));
    assert(pdaUploadLog, "upload-log row exists for the PDA-uploaded record");
    assert(
      pdaUploadLog!.uploadedById === pdaUser!.id,
      "record was uploaded by the PDA (uploadedById)",
    );
    ok(`DB oracle: PDA-uploaded record ${String(pdaUpload.id)} for the patient`);

    // ---- Scenario 8: patient signs the release (typed signature, pre-filled) ----
    step("Scenario 8: patient signs the PDA-created release");
    journey("patient-sign-release.yaml", {
      MAESTRO_EMAIL: CREDS.patient.email, MAESTRO_PASSWORD: CREDS.patient.password,
    }, udid);

    const releasesAfterSign = await getReleasesForPatient(db, patientId);
    const signed = releasesAfterSign.find((r) => r.id === pendingRelease.id);
    assert(signed!.authSignatureImage, "release now carries a signature (active)");
    assert(!signed!.voided, "signed release is not voided");
    ok("DB oracle: release signed + active");

    // ---- Scenario 9: patient uploads a record themselves (real photo picker) ----
    step("Scenario 9: patient uploads a record");
    journey("patient-upload-record.yaml", {}, udid);

    const allUploads = await getUploadedRecordsForPatient(db, patientId);
    assert(allUploads.length >= 2, "a second uploaded IncomingFile row exists (patient's own)");
    const patientUpload = allUploads.find((r) => r.id !== pdaUpload.id);
    const patientUploadLog = await getUploadLogForFile(db, String(patientUpload!.id));
    assert(
      patientUploadLog!.uploadedById === patientId,
      "record was uploaded by the patient themselves (uploadedById)",
    );
    ok(`DB oracle: patient-uploaded record ${String(patientUpload!.id)}`);

    // ---- Scenario 10: patient restricts PDA provider access (editor → viewer) ----
    step("Scenario 10: patient restricts PDA provider access to viewer");
    journey("patient-restrict-pda.yaml", {
      MAESTRO_EMAIL: CREDS.patient.email, MAESTRO_PASSWORD: CREDS.patient.password,
    }, udid);

    const restricted = await getInvite(db, CREDS.pda.email);
    assert(
      restricted!.manageProvidersPermission === "viewer",
      "PDA providers permission downgraded to viewer",
    );
    ok("DB oracle: PDA manageProvidersPermission = viewer");

    // ---- Scenario 11: PDA confirms the provider "Add" action is now gated ----
    // UI-only check (the gating reads scenario 10's permission); no new DB state.
    step("Scenario 11: PDA sees provider access restricted (no Add button)");
    journey("pda-restricted-check.yaml", {
      MAESTRO_EMAIL: CREDS.pda.email, MAESTRO_PASSWORD: CREDS.pda.password,
    }, udid);
    ok("UI oracle: PDA providers Add button hidden under viewer access");

    step("All scenarios passed ✅");
  } catch (e) {
    failed = true;
    console.error(`\n\x1b[31m✗ E2E run failed:\x1b[0m ${(e as Error).message}`);
  } finally {
    teardown();
    if (keepDb || failed) console.log(`\x1b[33m[e2e]\x1b[0m temp DB kept at ${dbPath}`);
  }
  process.exit(failed ? 1 : 0);
}

main();
