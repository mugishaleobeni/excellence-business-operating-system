import json
import logging
import os
import smtplib
import socket
import ssl
import urllib.request
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app

logger = logging.getLogger(__name__)


class _IPv4SMTP_SSL(smtplib.SMTP_SSL):
    """SMTP_SSL that resolves IPv4 only to avoid [Errno 101] on IPv6-less hosts."""

    def _get_socket(self, host, port, timeout):
        ipv4_infos = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
        if not ipv4_infos:
            return super()._get_socket(host, port, timeout)
        sock = socket.create_connection((ipv4_infos[0][4][0], port), timeout, self.source_address)
        return self.context.wrap_socket(sock, server_hostname=self._host)


class _IPv4SMTP(smtplib.SMTP):
    """SMTP that resolves IPv4 only to avoid [Errno 101] on IPv6-less hosts."""

    def _get_socket(self, host, port, timeout):
        ipv4_infos = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
        if not ipv4_infos:
            return super()._get_socket(host, port, timeout)
        return socket.create_connection((ipv4_infos[0][4][0], port), timeout, self.source_address)


def _send_via_https_api(to_email: str, subject: str, html_body: str, text_body: str, from_email: str) -> bool:
    """Optional HTTPS email fallback (Resend or Brevo) when SMTP ports are blocked."""
    resend_key = (current_app.config.get("RESEND_API_KEY") or os.environ.get("RESEND_API_KEY") or "").strip()
    if resend_key:
        sender = (current_app.config.get("RESEND_FROM") or os.environ.get("RESEND_FROM") or from_email or "onboarding@resend.dev").strip()
        payload = json.dumps({
            "from": f"ExBOS Platform <{sender}>",
            "to": [to_email],
            "subject": subject,
            "html": html_body,
            "text": text_body or "",
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                if 200 <= resp.status < 300:
                    logger.info("Sent email '%s' to %s via Resend HTTPS API.", subject, to_email)
                    return True
        except Exception as exc:
            logger.warning("Resend HTTPS email failed for %s: %s", to_email, exc)

    brevo_key = (current_app.config.get("BREVO_API_KEY") or os.environ.get("BREVO_API_KEY") or "").strip()
    if brevo_key and from_email:
        payload = json.dumps({
            "sender": {"name": "ExBOS Platform", "email": from_email},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_body,
            "textContent": text_body or "",
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=payload,
            headers={"api-key": brevo_key, "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                if 200 <= resp.status < 300:
                    logger.info("Sent email '%s' to %s via Brevo HTTPS API.", subject, to_email)
                    return True
        except Exception as exc:
            logger.warning("Brevo HTTPS email failed for %s: %s", to_email, exc)

    return False


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
        if _send_via_https_api(to_email, subject, html_body, text_body, gmail_address):
            return True
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

    raw_msg = msg.as_string()
    context = ssl.create_default_context()

    # 1. Try IPv4 SMTP_SSL on port 465
    try:
        with _IPv4SMTP_SSL("smtp.gmail.com", 465, timeout=12, context=context) as server:
            server.login(gmail_address, gmail_app_password)
            server.sendmail(gmail_address, [to_email], raw_msg)
        logger.info("Sent email '%s' to %s via Gmail SMTP:465 (attachment=%s).", subject, to_email, bool(attachment_bytes))
        return True
    except Exception as exc_465:
        logger.warning("Gmail SMTP:465 failed for %s: %s; trying STARTTLS:587...", to_email, exc_465)

    # 2. Fallback to IPv4 STARTTLS on port 587
    try:
        with _IPv4SMTP("smtp.gmail.com", 587, timeout=12) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(gmail_address, gmail_app_password)
            server.sendmail(gmail_address, [to_email], raw_msg)
        logger.info("Sent email '%s' to %s via Gmail SMTP:587 (attachment=%s).", subject, to_email, bool(attachment_bytes))
        return True
    except Exception as exc_587:
        logger.warning("Gmail SMTP:587 failed for %s: %s", to_email, exc_587)

    # 3. Optional HTTPS API fallback if configured
    return _send_via_https_api(to_email, subject, html_body, text_body, gmail_address)


