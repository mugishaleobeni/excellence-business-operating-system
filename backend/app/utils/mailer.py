import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app

logger = logging.getLogger(__name__)


def send_gmail_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """
    Send an HTML email via Gmail SMTP_SSL (smtp.gmail.com:465) using
    GMAIL_ADDRESS and GMAIL_APP_PASSWORD from the Flask app config.
    Returns True if delivered, False otherwise.
    """
    gmail_address = current_app.config.get("GMAIL_ADDRESS", "").strip()
    gmail_app_password = current_app.config.get("GMAIL_APP_PASSWORD", "").strip()

    if not gmail_address or not gmail_app_password:
        logger.warning("Gmail credentials not configured; skipping live email send.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"ExBOS Platform <{gmail_address}>"
    msg["To"] = to_email

    if text_body:
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=8) as server:
            server.login(gmail_address, gmail_app_password)
            server.sendmail(gmail_address, [to_email], msg.as_string())
        logger.info("Sent email '%s' to %s via Gmail SMTP.", subject, to_email)
        return True
    except Exception as exc:
        logger.warning("Failed to send email via Gmail SMTP to %s: %s", to_email, exc)
        return False

