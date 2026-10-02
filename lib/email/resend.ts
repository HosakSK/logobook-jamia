/**
 * Transactional Email Service via Resend (21.01)
 */

export interface SendTierActivatedEmailInput {
  toEmail: string;
  userName?: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
}

/**
 * Sends a welcome/onboarding email to the customer upon successful tier upgrade.
 */
export async function sendTierActivatedEmail(
  input: SendTierActivatedEmailInput
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { toEmail, userName, planName, billingCycle } = input;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[Resend] Missing RESEND_API_KEY. Skipping transactional email.");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const cycleText = billingCycle === "yearly" ? "ročné predplatné" : "mesačné predplatné";
  const greeting = userName ? `Dobrý deň, ${userName},` : "Dobrý deň,";

  const htmlBody = `
<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Váš balíček ${planName} na Logobook.sk je aktívny</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070b0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fafbfc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070b0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0e161d; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #fafbfc;">
                LOGOBOOK<span style="color: #c8d400;">.SK</span>
              </div>
              <div style="font-size: 11px; font-family: monospace; color: #8899a6; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">
                Single Source of Truth pre Vizuálnu Identitu
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #fafbfc; margin: 0 0 16px 0; letter-spacing: -0.5px;">
                Licencia ${planName} bola úspešne aktivovaná! 🚀
              </h1>

              <p style="font-size: 14px; line-height: 1.6; color: #a1b0cb; margin: 0 0 24px 0;">
                ${greeting}<br>
                Ďakujeme za prejavenú dôveru. Vaša platba za <strong>${planName} (${cycleText})</strong> bola úspešne spracovaná a všetky pokročilé funkcie boli okamžite odomknuté vo vašom účte.
              </p>

              <!-- Feature Highlights Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #17212a; border: 1px solid rgba(200,212,0,0.25); border-radius: 3px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 12px; font-weight: bold; color: #c8d400; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                      Vaše odomknuté možnosti:
                    </div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: #fafbfc;">
                      <li>Vlastná doména a SSL certifikát pre váš dizajn manuál</li>
                      <li>Zabezpečenie manuálu privátnym heslom</li>
                      <li>Kompletný klientsky Offline ZIP balíček bez závislosti na webe</li>
                      <li>Živé Design Tokens API (theme.css, W3C tokens.json pre Figmu)</li>
                      <li>AI Context Generator (llms.txt a ai.md pre ChatGPT a Cursor)</li>
                      <li>Navýšené úložisko pre vektorové SVG, EPS a PDF súbory</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 3px; background-color: #c8d400;">
                    <a href="https://logobook.sk/admin" target="_blank" style="font-size: 13px; font-weight: 700; color: #070b0f; text-decoration: none; padding: 12px 24px; display: inline-block;">
                      Prejsť do Admin Dashboardu &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 1.5; color: #627282; margin: 28px 0 0 0;">
                Oficiálnu daňovú faktúru a potvrdenie o platbe (Receipt) vám odoslal platobný systém Lemon Squeezy v samostatnom e-maile.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #070b0f; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #526372; text-align: center;">
              Logobook.sk &bull; Vyrobené pre dizajnérov, agentúry a značky &bull;
              <a href="https://logobook.sk" style="color: #8899a6; text-decoration: underline;">logobook.sk</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Logobook.sk <noreply@logobook.sk>",
        to: [toEmail],
        subject: `Váš balíček ${planName} na Logobook.sk je aktívny 🚀`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Resend] Email send failed:", res.status, errText);
      return { success: false, error: errText };
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, messageId: data.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    console.error("[Resend] Network exception:", msg);
    return { success: false, error: msg };
  }
}
