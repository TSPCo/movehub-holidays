function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

function layout(preheader: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <span style="display:none;font-size:0;color:#f4f5f7;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
            <tr>
              <td style="background-color:#6366F1;background:linear-gradient(135deg,#00D4FF 0%,#6366F1 40%,#EC4899 100%);padding:20px 28px;">
                <span style="color:#ffffff;font-size:16px;font-weight:700;">The Move Hub</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#111827;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <p style="color:#9CA3AF;font-size:12px;margin-top:16px;">The Move Hub — Staff Holiday Portal</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function holidayApprovedEmail(opts: { name: string; startDate: Date; endDate: Date; days: number }) {
  const { name, startDate, endDate, days } = opts;
  const range = startDate.getTime() === endDate.getTime()
    ? formatDate(startDate)
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;

  return {
    subject: "Your holiday request has been approved",
    html: layout(
      "Your holiday request has been approved",
      `
        <p>Hi ${firstName(name)},</p>
        <p>Good news — your holiday request has been <strong style="color:#16A34A;">approved</strong>.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;padding:16px;margin:16px 0;width:100%;">
          <tr><td style="color:#6B7280;font-size:12px;padding-bottom:4px;">Dates</td></tr>
          <tr><td style="font-weight:600;">${range}</td></tr>
          <tr><td style="color:#6B7280;font-size:12px;padding-top:12px;padding-bottom:4px;">Duration</td></tr>
          <tr><td style="font-weight:600;">${days} working day${days === 1 ? "" : "s"}</td></tr>
        </table>
        <p>Enjoy your time off!</p>
      `
    ),
  };
}

export function holidayRejectedEmail(opts: { name: string; startDate: Date; endDate: Date; reviewNote: string | null }) {
  const { name, startDate, endDate, reviewNote } = opts;
  const range = startDate.getTime() === endDate.getTime()
    ? formatDate(startDate)
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;

  return {
    subject: "Your holiday request was not approved",
    html: layout(
      "Your holiday request was not approved",
      `
        <p>Hi ${firstName(name)},</p>
        <p>Your holiday request for <strong>${range}</strong> was <strong style="color:#DC2626;">not approved</strong>.</p>
        ${reviewNote ? `<table role="presentation" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;padding:16px;margin:16px 0;width:100%;"><tr><td style="color:#6B7280;font-size:12px;padding-bottom:4px;">Reason</td></tr><tr><td>${reviewNote}</td></tr></table>` : ""}
        <p>If you have any questions, speak to your manager.</p>
      `
    ),
  };
}
