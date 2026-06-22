import smtplib
import imaplib
import email
import json
import csv
import os
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from campaign_secrets import GMAIL_ADDRESS, APP_PASSWORD, ALERT_EMAIL

# ── CONFIG ────────────────────────────────────────────────
LEADS_CSV      = os.path.join(os.path.dirname(__file__), "leads.csv")
TRACKER_FILE   = os.path.join(os.path.dirname(__file__), "sent_tracker.json")
# ─────────────────────────────────────────────────────────


# ── EMAIL TEMPLATES ───────────────────────────────────────
def email_1(first_name, restaurant):
    return (
        "your reviews",
        f"""Hey {first_name},

Noticed {restaurant} has some reviews sitting there with no response — happens to almost every place.

AutoPilot writes back to each one in your voice, sounds like you wrote it yourself, and goes out automatically. Good reviews, bad reviews, doesn't matter. Every customer feels heard without you lifting a finger.

Worth a look?

— AutoPilot"""
    )

def email_2(first_name, restaurant):
    return (
        "re: your reviews",
        f"""Hey {first_name},

Just wanted to follow up — takes about 10 minutes to set up, no contract, cancel anytime.

Most owners tell us they didn't realize how many reviews were going unanswered until AutoPilot started handling them.

Happy to show you how it works.

— AutoPilot"""
    )

def email_3(first_name, restaurant):
    return (
        "last one",
        f"""Hey {first_name},

I'll leave you alone after this one.

If responding to reviews ever becomes something you want off your plate, AutoPilot's here.

— AutoPilot"""
    )
# ─────────────────────────────────────────────────────────


def load_tracker():
    if os.path.exists(TRACKER_FILE):
        with open(TRACKER_FILE, "r") as f:
            return json.load(f)
    return {"sent": {}, "replied": []}


def save_tracker(tracker):
    with open(TRACKER_FILE, "w") as f:
        json.dump(tracker, f, indent=2)


def send_email(to, subject, body):
    msg = MIMEMultipart()
    msg["From"]    = GMAIL_ADDRESS
    msg["To"]      = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(GMAIL_ADDRESS, APP_PASSWORD)
        s.send_message(msg)


def get_reply_body(imap, sender_email):
    """Return first 300 chars of the latest reply from sender, or None."""
    imap.select("INBOX")
    _, data = imap.search(None, f'FROM "{sender_email}"')
    ids = data[0].split()
    if not ids:
        return None
    _, msg_data = imap.fetch(ids[-1], "(RFC822)")
    raw = msg_data[0][1]
    msg = email.message_from_bytes(raw)
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode(errors="ignore")[:300]
    return msg.get_payload(decode=True).decode(errors="ignore")[:300]


def run():
    tracker = load_tracker()
    today   = datetime.now().date()

    # Load leads
    leads = []
    with open(LEADS_CSV, newline="", encoding="utf-8") as f:
        leads = list(csv.DictReader(f))

    # Open IMAP once for reply checks
    imap = imaplib.IMAP4_SSL("imap.gmail.com")
    imap.login(GMAIL_ADDRESS, APP_PASSWORD)

    for lead in leads:
        addr       = lead.get("email", "").strip()
        first_name = lead.get("first_name", "there").strip() or "there"
        restaurant = lead.get("restaurant_name", "your restaurant").strip() or "your restaurant"

        if not addr:
            continue

        # ── Check for new reply ───────────────────────────
        reply_body = get_reply_body(imap, addr)
        already_noted = addr in tracker["replied"]

        if reply_body and not already_noted:
            tracker["replied"].append(addr)
            save_tracker(tracker)
            alert_text = f"{first_name} from {restaurant} replied: \"{reply_body.strip()}\""
            try:
                send_email(ALERT_EMAIL, f"Reply: {restaurant}", alert_text)
                print(f"[ALERT] Texted you about reply from {addr}")
            except Exception as e:
                print(f"[ALERT ERROR] {e}")

        # Skip anyone who replied — no more follow-ups
        if addr in tracker["replied"]:
            continue

        history = tracker["sent"].get(addr, {})

        # ── Decide which email to send ────────────────────
        if "e1" not in history:
            subject, body = email_1(first_name, restaurant)
            send_email(addr, subject, body)
            tracker["sent"].setdefault(addr, {})["e1"] = str(today)
            print(f"[EMAIL 1] → {addr} ({restaurant})")

        elif "e2" not in history:
            e1_date = datetime.strptime(history["e1"], "%Y-%m-%d").date()
            if (today - e1_date).days >= 3:
                subject, body = email_2(first_name, restaurant)
                send_email(addr, subject, body)
                tracker["sent"][addr]["e2"] = str(today)
                print(f"[EMAIL 2] → {addr} ({restaurant})")

        elif "e3" not in history:
            e2_date = datetime.strptime(history["e2"], "%Y-%m-%d").date()
            if (today - e2_date).days >= 5:   # day 8 total
                subject, body = email_3(first_name, restaurant)
                send_email(addr, subject, body)
                tracker["sent"][addr]["e3"] = str(today)
                print(f"[EMAIL 3] → {addr} ({restaurant})")

        save_tracker(tracker)

    imap.logout()
    print(f"Done — {datetime.now().strftime('%Y-%m-%d %H:%M')}")


if __name__ == "__main__":
    run()
