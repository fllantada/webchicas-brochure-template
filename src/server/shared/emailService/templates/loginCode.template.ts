/** Branding params para el email de magic link. Defaults configurables via env. */
export interface LoginCodeBranding {
  /** Nombre visible del negocio. */
  brandName: string;
  /** Color primario (hex) — usado en hairlines + botón. */
  primaryColor: string;
  /** URL del logo (absoluta). Opcional. */
  logoUrl?: string;
}

export interface LoginCodeEmailData {
  code: string;
  email: string;
  branding: LoginCodeBranding;
}

/** HTML del email de magic link — estilo editorial limpio. */
export function buildLoginCodeEmail(data: LoginCodeEmailData): string {
  const { code, email, branding } = data;
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const loginLink = `${baseUrl}/admin/login?email=${encodeURIComponent(email)}&code=${code}`;

  const logoBlock = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${branding.brandName}" width="64" height="64" style="display:block; margin:0 auto 16px;" />`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu acceso a ${branding.brandName}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAF9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color:#1C1917;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAF9;">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px; background-color:#FFFFFF; border:1px solid #EAEAE7; border-radius:8px;">
          <tr>
            <td style="padding:48px 40px 16px; text-align:center;">
              ${logoBlock}
              <p style="margin:0; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:${branding.primaryColor};">Acceso al panel</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 24px;">
              <h1 style="margin:0 0 24px; font-family:Georgia, 'Times New Roman', serif; font-weight:400; font-size:26px; line-height:1.2; color:#1C1917; text-align:center;">
                ${branding.brandName}
              </h1>
              <p style="margin:0 0 32px; font-size:15px; line-height:1.6; color:#525252; text-align:center;">
                Hacé click para entrar al panel de administración.
              </p>
              <p style="margin:0 0 12px; text-align:center;">
                <a href="${loginLink}" style="display:inline-block; padding:14px 32px; font-size:14px; font-weight:600; color:#FFFFFF; background-color:${branding.primaryColor}; text-decoration:none; border-radius:6px; letter-spacing:0.02em;">Entrar al panel</a>
              </p>
              <p style="margin:32px 0 12px; font-size:12px; color:#A3A3A3; text-align:center;">
                O ingresá este código manualmente:
              </p>
              <p style="margin:0; text-align:center;">
                <span style="display:inline-block; padding:12px 24px; background-color:#F5F5F4; border:1px solid #EAEAE7; border-radius:6px; font-family:'SF Mono', Menlo, Consolas, monospace; font-size:22px; font-weight:600; letter-spacing:0.32em; color:#1C1917;">${code}</span>
              </p>
              <p style="margin:24px 0 0; font-size:12px; line-height:1.5; color:#A3A3A3; text-align:center;">
                El enlace y el código vencen en 1 hora.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px; border-top:1px solid #F5F5F4; text-align:center;">
              <p style="margin:0; font-size:11px; line-height:1.5; color:#A3A3A3;">
                Si no pediste este acceso, podés ignorar este email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0; font-size:11px; color:#A3A3A3; text-align:center;">
          ${branding.brandName}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
