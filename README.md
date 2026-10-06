
# 🏥 AI-Driven Smart Hospital Queue Management and Waiting Time Prediction System

An intelligent hospital queue management system that helps patients, doctors, and hospital staff manage appointments, queues, consultations, prescriptions, vital records, laboratory tests, laboratory reports, notifications, and estimated waiting times.

The system uses **Machine Learning** to predict patient waiting time and helps hospitals improve queue management and reduce unnecessary waiting.

---

## 📌 Project Overview

The **AI-Driven Smart Hospital Queue Management and Waiting Time Prediction System** is a web-based healthcare management application developed using modern web technologies and machine learning.

The system provides separate dashboards and functionalities for different hospital users such as:

* 👤 Patients
* 👨‍⚕️ Doctors
* 👩‍⚕️ Nurses
* 🧑‍💼 Receptionists
* 🧪 Laboratory Staff
* 💊 Pharmacy Staff
* 🛠️ Administrators

The main goal is to reduce manual queue management, improve hospital workflow, and provide patients with an estimated waiting time.

---

## 🎯 Objectives

* Reduce patient waiting time.
* Manage hospital appointments digitally.
* Generate and manage queue tokens.
* Predict estimated waiting time using Machine Learning.
* Provide separate dashboards for different hospital users.
* Manage consultations and prescriptions.
* Maintain patient vital information.
* Manage laboratory tests and reports.
* Send email notifications to patients.
* Improve communication between patients and hospital staff.
* Maintain centralized hospital information.

---

## ✨ Key Features

### 👤 Patient Module

* Patient registration and login.
* Patient dashboard.
* View appointments.
* Book appointments.
* View queue token.
* View estimated waiting time.
* View consultation details.
* View prescriptions.
* View vital information.
* View laboratory tests.
* View laboratory reports.
* Receive notifications.
* Receive appointment and queue email notifications.

### 👨‍⚕️ Doctor Module

* Doctor login.
* Doctor dashboard.
* View assigned appointments.
* Manage patient queue.
* Update queue status.
* Add and view consultations.
* Add and view prescriptions.
* Add and view patient vitals.
* Add and view laboratory tests.
* Add and view laboratory reports.
* View patient medical information.
* Manage patient-specific medical records.

### 🧪 Laboratory Module

* View requested laboratory tests.
* Manage laboratory test information.
* Create laboratory reports.
* Update report status.
* Maintain patient-specific laboratory records.

### 💊 Pharmacy Module

* Manage medicine-related information.
* Maintain prescription-related data.

### 🛠️ Admin Module

* Manage hospital-related information.
* Manage users and hospital data.
* Monitor system operations.

---

## 🤖 Machine Learning

The system uses Machine Learning to predict the estimated patient waiting time.

### Algorithms Used

* Random Forest
* XGBoost

### Model Comparison

| Model         |  MAE |   MSE | R² Score |
| ------------- | ---: | ----: | -------: |
| Random Forest | 6.95 | 70.47 |     0.82 |
| XGBoost       | 5.45 | 41.30 |     0.89 |

Based on the evaluation results, **XGBoost** is used as the primary waiting-time prediction model.

### Prediction Features

The model uses features such as:

* Queue position
* Number of patients ahead
* Doctor experience
* Average consultation time
* Day of the week
* Appointment/queue hour

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      Patient        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌─────────────┐  ┌─────────────┐
       │ PostgreSQL │   │ ML Prediction│  │ Email System│
       │  Database  │   │   XGBoost    │  │   Gmail     │
       └────────────┘   └─────────────┘  └─────────────┘
```

---

## 🛠️ Technologies Used

### Frontend

* React.js
* JavaScript
* HTML
* CSS
* Vite

### Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* Pydantic

### Database

* PostgreSQL

### Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* XGBoost
* Joblib

### Development Tools

* Visual Studio Code
* Git
* GitHub
* Swagger / OpenAPI

### Notifications

* Gmail SMTP
* Python EmailMessage

---

## 📂 Project Structure

```text
smart-hospital-queue/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── test_email.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── ml/
│   ├── dataset/
│   ├── model/
│   ├── models/
│   ├── predict.py
│   ├── train_model.py
│   └── train_xgboost.py
│
├── .gitignore
├── prescription.py
└── README.md
```

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/venkatadhribasam201-hue/smart-hospital-queue.git
```

```bash
cd smart-hospital-queue
```

---

## 🐍 Backend Setup

Go to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
DATABASE_URL=your_postgresql_database_url

EMAIL_ADDRESS=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
ADMIN_EMAIL=your_email@gmail.com
```

⚠️ Never upload `.env` or passwords to GitHub.

---

## 🚀 Run the Backend

From the `backend` directory:

```bash
python -m uvicorn app.main:app --reload
```

Backend API:

```text
http://127.0.0.1:8000
```

Swagger API Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 💻 Run the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🗄️ Database

The project uses **PostgreSQL** for storing:

* Users
* Patients
* Doctors
* Departments
* Appointments
* Queue tokens
* Consultations
* Prescriptions
* Vitals
* Laboratory tests
* Laboratory reports
* Medicines
* Notifications

---

## 🔄 Main Workflow

```text
Patient Registration
        ↓
Patient Login
        ↓
Book Appointment
        ↓
Queue Token Generation
        ↓
Waiting Time Prediction
        ↓
Doctor Consultation
        ↓
Prescription / Vitals
        ↓
Laboratory Test
        ↓
Laboratory Report
        ↓
Patient Notification
```

---

## 📧 Email Notifications

The system can send email notifications for important hospital events such as:

* Appointment confirmation
* Queue token creation
* Estimated waiting time
* Laboratory-related updates

Emails are sent using the configured hospital administration email account.

---

## 🔒 Security

The project includes:

* Password hashing
* Authentication
* Role-based user handling
* Environment variables for sensitive information
* `.gitignore` protection for passwords and environment files

---

## 📊 Expected Benefits

* Reduced manual queue management.
* Better hospital workflow.
* Improved patient experience.
* Reduced unnecessary waiting.
* Faster access to patient information.
* Better communication between patients and hospital staff.
* Data-driven waiting-time prediction.
* Centralized healthcare information management.

---

## 🔮 Future Enhancements

* WhatsApp notifications.
* SMS notifications.
* Real-time queue tracking.
* Hospital mobile application.
* Online payment integration.
* Advanced analytics dashboard.
* Multi-hospital support.
* Cloud deployment.
* Real-time doctor availability.
* Improved Machine Learning models using larger datasets.

---

## 👨‍💻 Developer

**Venkatadhri Basam**

B.Tech Final Year Project

**Project:**
AI-Driven Smart Hospital Queue Management and Waiting Time Prediction System Using Machine Learning

---

## 📜 License

This project is developed for academic and educational purposes.
