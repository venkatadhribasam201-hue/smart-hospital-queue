import os
import smtplib

from email.message import EmailMessage
from dotenv import load_dotenv


load_dotenv()


email_address = os.getenv("EMAIL_ADDRESS")
app_password = os.getenv("EMAIL_APP_PASSWORD")


recipient_email = "venakatadhribasam201@gmail.com"


try:
    message = EmailMessage()

    message["From"] = email_address
    message["To"] = recipient_email
    message["Subject"] = "Smart Hospital - Test Email"

    message.set_content(
        """
Hello,

This is a test email from the Smart Hospital
Queue Management System.

Email notification system is working successfully.

Thank you,
Smart Hospital Team
"""
    )

    smtp = smtplib.SMTP(
        "smtp.gmail.com",
        587,
        timeout=30
    )

    smtp.ehlo()
    smtp.starttls()
    smtp.ehlo()

    smtp.login(
        email_address,
        app_password
    )

    smtp.send_message(message)

    smtp.quit()

    print("===================================")
    print("EMAIL SENT SUCCESSFULLY")
    print("===================================")

except Exception as e:
    print("===================================")
    print("EMAIL SENDING FAILED")
    print("===================================")
    print("Error:", repr(e))