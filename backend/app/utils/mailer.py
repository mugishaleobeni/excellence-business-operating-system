import logging
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app

logger = logging.getLogger(__name__)


def send_gmail_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str = "",
    attachment_bytes: bytes | None = None,
    attachment_filename: str = "",
    attachment_mime: str = "application/octet-stream"
) -> bool:
    """
    Send an HTML email via Gmail SMTP_SSL (smtp.gmail.com:465) using
    GMAIL_ADDRESS and GMAIL_APP_PASSWORD from the Flask app config.
    Supports optional file attachments (e.g. PDF, CSV, Excel).
    Returns True if delivered, False otherwise.
    """
    gmail_address = current_app.config.get("GMAIL_ADDRESS", "").strip()
    gmail_app_password = current_app.config.get("GMAIL_APP_PASSWORD", "").strip()

    if not gmail_address or not gmail_app_password:
        logger.warning("Gmail credentials not configured; skipping live email send.")
        return False

    msg = MIMEMultipart("mixed" if attachment_bytes else "alternative")
    msg["Subject"] = subject
    msg["From"] = f"ExBOS Platform <{gmail_address}>"
    msg["To"] = to_email

    # Email text and html body
    body_part = MIMEMultipart("alternative") if attachment_bytes else msg
    if text_body:
        body_part.attach(MIMEText(text_body, "plain", "utf-8"))
    body_part.attach(MIMEText(html_body, "html", "utf-8"))

    if attachment_bytes:
        msg.attach(body_part)
        part = MIMEApplication(attachment_bytes, Name=attachment_filename or "report.txt")
        part["Content-Disposition"] = f'attachment; filename="{attachment_filename or "report.txt"}"'
        msg.attach(part)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=12) as server:
            server.login(gmail_address, gmail_app_password)
            server.sendmail(gmail_address, [to_email], msg.as_string())
        logger.info("Sent email '%s' to %s via Gmail SMTP (attachment=%s).", subject, to_email, bool(attachment_bytes))
        return True
    except Exception as exc:
        logger.warning("Failed to send email via Gmail SMTP to %s: %s", to_email, exc)
        return False


