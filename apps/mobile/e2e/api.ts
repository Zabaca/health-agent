/**
 * Direct HTTP calls the harness makes against the test web server — the few
 * "web" steps we do over the API rather than through the mobile UI. Currently
 * just PDA invite acceptance, which a fresh invitee cannot do in-app (the
 * accept screen lives only in the PDA tab tree, mounted only once isPda is true;
 * the /invite/:token deep link is web-only). See project_maestro_e2e memory.
 */
import { TEST_API_URL } from "./config";

/**
 * Accept a PDA invite via the register path: creates the agent account with the
 * given credentials and links it to the patient (sets agentUserId, flips the
 * row to "accepted", and makes the new user a PDA). Mirrors the web
 * /invite/[token] accept form.
 */
export async function acceptInviteAsNewUser(
  token: string,
  creds: { password: string; firstName: string; lastName: string },
): Promise<void> {
  const res = await fetch(`${TEST_API_URL}/api/invites/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "register",
      password: creds.password,
      firstName: creds.firstName,
      lastName: creds.lastName,
    }),
  });
  if (!res.ok) {
    throw new Error(`invite accept failed: HTTP ${res.status} ${await res.text()}`);
  }
}
