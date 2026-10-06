import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv


load_dotenv()


EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")


def send_email(
    to_email: str,
    subject: str,
    body: str
):

    if not EMAIL_ADDRESS:
        raise ValueError(
            "EMAIL_ADDRESS is missing in .env"
        )

    if not EMAIL_APP_PASSWORD:
        raise ValueError(
            "EMAIL_APP_PASSWORD is missing in .env"
        )

    message = EmailMessage()

    message["From"] = (
        f"Smart Hospital Administration "
        f"<{EMAIL_ADDRESS}>"
    )

    message["To"] = to_email

    message["Subject"] = subject

    message.set_content(body)

    print("EMAIL SENDER:", EMAIL_ADDRESS)
    print("EMAIL RECEIVER:", to_email)

    try:

        with smtplib.SMTP(
            "smtp.gmail.com",
            587,
            timeout=30
        ) as smtp:

            smtp.ehlo()

            smtp.starttls()

            smtp.ehlo()

            smtp.login(
                EMAIL_ADDRESS,
                EMAIL_APP_PASSWORD
            )

            smtp.send_message(message)

        print(
            "EMAIL SENT SUCCESSFULLY "
            f"FROM: {EMAIL_ADDRESS}"
        )

        return True

    except Exception as e:

        print("EMAIL ERROR:")
        print(repr(e))

        raise