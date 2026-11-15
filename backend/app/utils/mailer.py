import base64
import json
import logging
import os
import smtplib
import socket
import ssl
import threading
import time
import urllib.request
from datetime import datetime, timezone
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app
from app.database import get_db

logger = logging.getLogger(__name__)

_SMTP_BLOCKED_ON_HOST: bool | None = None
_RELAY_THREAD_STARTED: bool = False
_RELAY_LOCK = threading.Lock()


def _is_render_cloud() -> bool:
    """Detect if running inside Render cloud where outbound TCP 25/465/587 is firewalled."""
    return bool(
        os.environ.get("RENDER")
        or os.environ.get("RENDER_SERVICE_ID")
        or os.environ.get("RENDER_EXTERNAL_URL")
    )


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


def _build_raw_mime_message(
    gmail_address: str,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str = "",
    attachment_bytes: bytes | None = None,
    attachment_filename: str = "",
) -> str:
    msg = MIMEMultipart("mixed" if attachment_bytes else "alternative")
    msg["Subject"] = subject
    msg["From"] = f"ExBOS Platform <{gmail_address}>"
    msg["To"] = to_email

    body_part = MIMEMultipart("alternative") if attachment_bytes else msg
    if text_body:
        body_part.attach(MIMEText(text_body, "plain", "utf-8"))
    body_part.attach(MIMEText(html_body, "html", "utf-8"))

    if attachment_bytes:
        msg.attach(body_part)
        part = MIMEApplication(attachment_bytes, Name=attachment_filename or "report.txt")
        part["Content-Disposition"] = f'attachment; filename="{attachment_filename or "report.txt"}"'
        msg.attach(part)

    return msg.as_string()


def _send_direct_smtp(
    gmail_address: str,
    gmail_app_password: str,
    to_email: str,
    subject: str,
    raw_msg: str,
    has_attachment: bool = False,
) -> bool:
    global _SMTP_BLOCKED_ON_HOST
    if _SMTP_BLOCKED_ON_HOST is True:
        return False

    context = ssl.create_default_context()

    # 1. Try IPv4 SMTP_SSL on port 465 (fast 5s timeout so Gunicorn is never stalled)
    try:
        with _IPv4SMTP_SSL("smtp.gmail.com", 465, timeout=5, context=context) as server:
            server.login(gmail_address, gmail_app_password)
            server.sendmail(gmail_address, [to_email], raw_msg)
        _SMTP_BLOCKED_ON_HOST = False
        logger.info("Sent email '%s' to %s via Gmail SMTP:465 (attachment=%s).", subject, to_email, has_attachment)
        return True
    except (socket.timeout, TimeoutError, OSError) as exc_465:
        # 2. Quick fallback check on STARTTLS port 587 (4s timeout)
        try:
            with _IPv4SMTP("smtp.gmail.com", 587, timeout=4) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(gmail_address, gmail_app_password)
                server.sendmail(gmail_address, [to_email], raw_msg)
            _SMTP_BLOCKED_ON_HOST = False
            logger.info("Sent email '%s' to %s via Gmail SMTP:587 (attachment=%s).", subject, to_email, has_attachment)
            return True
        except Exception:
            _SMTP_BLOCKED_ON_HOST = True
            logger.info(
                "Direct SMTP ports 465/587 are firewalled on this host (%s); switching to MongoDB Email Outbox Relay.",
                exc_465,
            )
            return False
    except Exception as exc_other:
        logger.warning("Gmail SMTP error for %s: %s", to_email, exc_other)
        return False


def _enqueue_and_wait_outbox(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str = "",
    attachment_bytes: bytes | None = None,
    attachment_filename: str = "",
    attachment_mime: str = "application/octet-stream",
) -> bool:
    """
    Enqueue an email in MongoDB Atlas `email_outbox` for the SMTP-capable relay worker
    and wait briefly (up to 3.2s) for confirmation.
    """
    try:
        db = get_db()
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()
        doc = {
            "to_email": to_email,
            "subject": subject,
            "html_body": html_body,
            "text_body": text_body or "",
            "attachment_b64": base64.b64encode(attachment_bytes).decode("ascii") if attachment_bytes else None,
            "attachment_filename": attachment_filename or "",
            "attachment_mime": attachment_mime or "application/octet-stream",
            "status": "pending",
            "created_at": now_iso,
        }
        ins = db.email_outbox.insert_one(doc)
        outbox_id = ins.inserted_id

        # Poll briefly to see if the relay worker already delivered it
        deadline = time.monotonic() + 3.2
        while time.monotonic() < deadline:
            time.sleep(0.35)
            updated = db.email_outbox.find_one({"_id": outbox_id}, {"status": 1})
            if updated and updated.get("status") == "sent":
                logger.info("Sent email '%s' to %s via MongoDB Atlas Email Relay.", subject, to_email)
                return True
            if updated and updated.get("status") == "failed":
                return False

        # Check if an SMTP relay worker heartbeat is active (updated within last 90 seconds)
        hb = db.platform_config.find_one({"key": "smtp_relay_heartbeat"})
        if hb and hb.get("updated_ts"):
            age = time.time() - float(hb.get("updated_ts") or 0)
            if age < 90:
                logger.info("Queued email '%s' to %s for active MongoDB Email Relay (heartbeat %.1fs ago).", subject, to_email, age)
                return True
    except Exception as exc:
        logger.warning("Email outbox relay queue error for %s: %s", to_email, exc)
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
    Send an HTML email via Gmail SMTP_SSL (smtp.gmail.com:465), HTTPS API, or
    MongoDB Atlas Email Outbox Relay when running on cloud hosts that firewall SMTP ports.
    """
    gmail_address = current_app.config.get("GMAIL_ADDRESS", "").strip()
    gmail_app_password = current_app.config.get("GMAIL_APP_PASSWORD", "").strip()

    # 1. Try HTTPS email API first if configured (Resend / Brevo over port 443)
    if _send_via_https_api(to_email, subject, html_body, text_body, gmail_address):
        return True

    if not gmail_address or not gmail_app_password:
        logger.warning("Gmail credentials not configured; skipping live email send.")
        return False

    # 2. On Render Free Tier (where outbound TCP 25/465/587 is blocked), use MongoDB Outbox Relay immediately
    if _is_render_cloud() or _SMTP_BLOCKED_ON_HOST is True:
        return _enqueue_and_wait_outbox(
            to_email=to_email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            attachment_bytes=attachment_bytes,
            attachment_filename=attachment_filename,
            attachment_mime=attachment_mime,
        )

    # 3. Direct SMTP send (local / unrestricted servers)
    raw_msg = _build_raw_mime_message(
        gmail_address=gmail_address,
        to_email=to_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        attachment_bytes=attachment_bytes,
        attachment_filename=attachment_filename,
    )
    if _send_direct_smtp(
        gmail_address=gmail_address,
        gmail_app_password=gmail_app_password,
        to_email=to_email,
        subject=subject,
        raw_msg=raw_msg,
        has_attachment=bool(attachment_bytes),
    ):
        return True

    # 4. Fallback to MongoDB Outbox Relay if direct SMTP was blocked
    return _enqueue_and_wait_outbox(
        to_email=to_email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        attachment_bytes=attachment_bytes,
        attachment_filename=attachment_filename,
        attachment_mime=attachment_mime,
    )


def start_email_outbox_relay(app) -> None:
    """
    Start a lightweight background thread on SMTP-capable hosts that flushes
    `db.email_outbox` documents created by firewalled cloud instances (e.g., Render).
    """
    global _RELAY_THREAD_STARTED
    if _is_render_cloud():
        return
    with _RELAY_LOCK:
        if _RELAY_THREAD_STARTED:
            return
        _RELAY_THREAD_STARTED = True

    def _worker():
        last_hb = 0.0
        while True:
            try:
                with app.app_context():
                    gmail_address = app.config.get("GMAIL_ADDRESS", "").strip()
                    gmail_app_password = app.config.get("GMAIL_APP_PASSWORD", "").strip()
                    if not gmail_address or not gmail_app_password or _SMTP_BLOCKED_ON_HOST is True:
                        time.sleep(10)
                        continue

                    db = get_db()
                    now_ts = time.time()
                    now_iso = datetime.now(timezone.utc).isoformat()

                    if now_ts - last_hb >= 15.0:
                        db.platform_config.update_one(
                            {"key": "smtp_relay_heartbeat"},
                            {
                                "$set": {
                                    "key": "smtp_relay_heartbeat",
                                    "updated_ts": now_ts,
                                    "updated_at": now_iso,
                                    "host": socket.gethostname(),
                                }
                            },
                            upsert=True,
                        )
                        last_hb = now_ts

                    job = db.email_outbox.find_one_and_update(
                        {"status": "pending"},
                        {"$set": {"status": "processing", "started_at": now_iso}},
                        sort=[("created_at", 1)],
                    )
                    if not job:
                        time.sleep(1.0)
                        continue

                    att_b64 = job.get("attachment_b64")
                    att_bytes = base64.b64decode(att_b64) if att_b64 else None
                    raw_msg = _build_raw_mime_message(
                        gmail_address=gmail_address,
                        to_email=job["to_email"],
                        subject=job["subject"],
                        html_body=job.get("html_body") or "",
                        text_body=job.get("text_body") or "",
                        attachment_bytes=att_bytes,
                        attachment_filename=job.get("attachment_filename") or "",
                    )
                    ok = _send_direct_smtp(
                        gmail_address=gmail_address,
                        gmail_app_password=gmail_app_password,
                        to_email=job["to_email"],
                        subject=job["subject"],
                        raw_msg=raw_msg,
                        has_attachment=bool(att_bytes),
                    )
                    db.email_outbox.update_one(
                        {"_id": job["_id"]},
                        {
                            "$set": {
                                "status": "sent" if ok else "failed",
                                "completed_at": datetime.now(timezone.utc).isoformat(),
                            }
                        },
                    )
            except Exception as exc:
                logger.debug("Email outbox relay loop error: %s", exc)
                time.sleep(3.0)

    t = threading.Thread(target=_worker, name="exbos-email-outbox-relay", daemon=True)
    t.start()



