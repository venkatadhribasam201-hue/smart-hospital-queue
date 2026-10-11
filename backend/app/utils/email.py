import os
import requests

from dotenv import load_dotenv


load_dotenv()


RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")


def send_email(
    to_email: str,
    subject: str,
    body: str
):

    if not RESEND_API_KEY:
        raise ValueError(
            "RESEND_API_KEY is missing"
        )

    if not EMAIL_ADDRESS:
        raise ValueError(
            "EMAIL_ADDRESS is missing"
        )

    payload = {
        "from": f"Smart Hospital Administration <{EMAIL_ADDRESS}>",
        "to": [to_email],
        "subject": subject,
        "text": body
    }

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    print("EMAIL SENDER:", EMAIL_ADDRESS)
    print("EMAIL RECEIVER:", to_email)

    try:

        response = requests.post(
            "https://api.resend.com/emails",
            json=payload,
            headers=headers,
            timeout=30
        )

        print("RESEND STATUS:", response.status_code)
        print("RESEND RESPONSE:", response.text)

        response.raise_for_status()

        print("EMAIL SENT SUCCESSFULLY")

        return True

    except Exception as e:

        print("EMAIL ERROR:")
        print(repr(e))

        raise