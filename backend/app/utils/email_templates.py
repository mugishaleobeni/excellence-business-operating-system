"""
ExBOS Classic & Modern Branded Email Template System.

Single source of truth for all transactional, security, billing, tax, branch,
and team notification emails sent by ExBOS.

Design principles:
- Uses the official ExBOS Sapphire & Royal Navy theme (#03091F, #071544, #0A2786, #218DFF, #9EDCFF)
- Clean white executive body card on a soft slate-blue email canvas (#EEF4FB) for maximum
  clarity and readability in both Light and Dark mode email clients (Gmail, Outlook, Apple Mail).
- Displays the official ExBOS logo cleanly in the branded Sapphire header.
- Zero emojis, zero visual clutter — crisp typography, generous spacing, structured detail tables,
  and clear primary/secondary action buttons.
"""

from __future__ import annotations
import html
import os
from datetime import datetime, timezone

EXBOS_LOGO_URL = os.environ.get(
    "EXBOS_EMAIL_LOGO_URL",
    "https://exbos.pages.dev/logo/exboslogo.png",
)
EXBOS_APP_URL = os.environ.get("EXBOS_APP_URL", "https://exbos.pages.dev")


def _esc(val: object) -> str:
    return html.escape(str(val or ""), quote=True)


def render_exbos_email(
    *,
    category: str = "SYSTEM NOTIFICATION",
    title: str,
    greeting: str = "",
    intro_html: str = "",
    code: str | None = None,
    code_label: str = "VERIFICATION CODE",
    details: list[tuple[str, str]] | None = None,
    highlight_box_html: str = "",
    primary_cta: tuple[str, str] | None = None,
    secondary_cta: tuple[str, str] | None = None,
    footer_note: str = "",
    fallback_link: str | None = None,
) -> str:
    """
    Render a classic, modern, table-based HTML email with the ExBOS logo and Sapphire color theme.
    """
    year = datetime.now(timezone.utc).year
    cat_safe = _esc(category.upper())
    title_safe = _esc(title)
    greeting_html = (
        f'<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#0F172A;">{greeting}</p>'
        if greeting
        else ""
    )

    intro_block = (
        f'<p style="margin:0 0 22px 0;font-size:14px;line-height:1.65;color:#334155;">{intro_html}</p>'
        if intro_html
        else ""
    )

    code_block = ""
    if code:
        code_safe = _esc(code)
        code_label_safe = _esc(code_label.upper())
        code_block = f"""
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;">
          <tr>
            <td align="center" style="background-color:#F0F7FF;border:1px solid #BFDBFE;border-radius:12px;padding:22px 16px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.6px;color:#0A2786;text-transform:uppercase;margin-bottom:10px;">
                {code_label_safe}
              </div>
              <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;font-weight:800;letter-spacing:10px;color:#071544;user-select:all;-webkit-user-select:all;">
                {code_safe}
              </div>
              <div style="font-size:11px;color:#64748B;margin-top:8px;">
                Tap or click the code above to select and copy
              </div>
            </td>
          </tr>
        </table>
        """

    details_block = ""
    if details:
        rows_html = []
        for idx, (label, value) in enumerate(details):
            border_style = "border-bottom:1px solid #E2E8F0;" if idx < len(details) - 1 else ""
            rows_html.append(
                f"""
                <tr>
                  <td style="padding:11px 16px;font-size:13px;color:#64748B;font-weight:600;{border_style}width:42%;vertical-align:top;">
                    {_esc(label)}
                  </td>
                  <td style="padding:11px 16px;font-size:13px;color:#071544;font-weight:700;text-align:right;{border_style}vertical-align:top;">
                    {value}
                  </td>
                </tr>
                """
            )
        details_block = f"""
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;border-collapse:separate;overflow:hidden;">
          {''.join(rows_html)}
        </table>
        """

    highlight_section = (
        f'<div style="margin:0 0 24px 0;">{highlight_box_html}</div>'
        if highlight_box_html
        else ""
    )

    cta_block = ""
    if primary_cta or secondary_cta:
        buttons = []
        if primary_cta:
            p_label, p_url = primary_cta
            buttons.append(
                f'<a href="{_esc(p_url)}" target="_blank" style="display:inline-block;margin:6px 6px;padding:13px 26px;background-color:#1045CA;background-image:linear-gradient(135deg,#218DFF 0%,#0A2786 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;letter-spacing:0.2px;">{_esc(p_label)}</a>'
            )
        if secondary_cta:
            s_label, s_url = secondary_cta
            buttons.append(
                f'<a href="{_esc(s_url)}" target="_blank" style="display:inline-block;margin:6px 6px;padding:12px 22px;background-color:#FFFFFF;color:#0A2786;border:1.5px solid #218DFF;text-decoration:none;font-size:13px;font-weight:700;border-radius:10px;">{_esc(s_label)}</a>'
            )
        cta_block = f"""
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px 0;">
          <tr>
            <td align="center">
              {''.join(buttons)}
            </td>
          </tr>
        </table>
        """

    note_section = ""
    if footer_note or fallback_link:
        note_parts = []
        if footer_note:
            note_parts.append(f'<p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:#64748B;">{footer_note}</p>')
        if fallback_link:
            safe_link = _esc(fallback_link)
            note_parts.append(
                f'<p style="margin:0;font-size:11px;line-height:1.5;color:#64748B;word-break:break-all;">'
                f'Direct link: <a href="{safe_link}" style="color:#1045CA;text-decoration:underline;">{safe_link}</a>'
                f'</p>'
            )
        note_section = f"""
        <div style="border-top:1px solid #E2E8F0;padding-top:16px;margin-top:4px;">
          {''.join(note_parts)}
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title_safe} — ExBOS</title>
</head>
<body style="margin:0;padding:0;background-color:#EEF4FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#EEF4FB;padding:32px 14px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #D6E4F5;box-shadow:0 12px 32px rgba(7,21,68,0.08);">
          <!-- Sapphire Branded Header -->
          <tr>
            <td style="background-color:#071544;background-image:linear-gradient(135deg,#03091F 0%,#071544 52%,#0A2786 100%);padding:26px 32px;border-bottom:3px solid #218DFF;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <img src="{_esc(EXBOS_LOGO_URL)}" alt="ExBOS" width="38" height="38" style="display:block;width:38px;height:38px;border-radius:10px;border:1px solid rgba(158,220,255,0.35);background-color:#03091F;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-size:16px;font-weight:800;letter-spacing:1.2px;color:#FFFFFF;line-height:1.2;">
                            EXCELLENCE BOS
                          </div>
                          <div style="font-size:10px;font-weight:600;letter-spacing:1.4px;color:#9EDCFF;text-transform:uppercase;margin-top:2px;">
                            Business Operating System
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;padding:5px 11px;border-radius:999px;background-color:rgba(33,141,255,0.2);border:1px solid rgba(158,220,255,0.35);font-size:10px;font-weight:700;letter-spacing:1px;color:#9EDCFF;text-transform:uppercase;">
                      {cat_safe}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Clean Executive Body -->
          <tr>
            <td style="padding:32px 32px 26px 32px;">
              <h1 style="margin:0 0 16px 0;font-size:21px;font-weight:800;line-height:1.3;color:#071544;letter-spacing:-0.2px;">
                {title_safe}
              </h1>
              {greeting_html}
              {intro_block}
              {code_block}
              {details_block}
              {highlight_section}
              {cta_block}
              {note_section}
            </td>
          </tr>

          <!-- Subtle Classic Footer -->
          <tr>
            <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:18px 32px;text-align:center;">
              <div style="font-size:12px;font-weight:700;color:#071544;letter-spacing:0.4px;margin-bottom:4px;">
                PYLARIX &middot; Excellence Business Operating System (ExBOS)
              </div>
              <div style="font-size:11px;color:#64748B;line-height:1.5;">
                Kigali, Rwanda &middot; Official Automated Notification &middot;
                <a href="{_esc(EXBOS_APP_URL)}" style="color:#1045CA;text-decoration:none;font-weight:600;">exbos.pages.dev</a>
              </div>
              <div style="font-size:10px;color:#94A3B8;margin-top:6px;">
                &copy; {year} PYLARIX. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
