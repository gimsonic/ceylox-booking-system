⭐ Ceylox

Modular Cross-Platform Service Booking System

Ceylox is a scalable booking platform designed to support multiple service-based industries such as hospitality, healthcare, wellness, and appointment-driven businesses.

This implementation uses a hotel booking use case to demonstrate real-world system architecture, authentication flows, database design, and responsive cross-platform UI.

🚀 Project Vision

Most portfolio projects stop at simple CRUD operations.
Ceylox was built with a production mindset, focusing on:

scalable backend architecture

secure authentication flow

booking conflict prevention logic

cross-platform frontend design

modular domain expansion capability

The long-term vision is to evolve Ceylox into a unified service booking SaaS platform.

📱 Cross-Platform Approach

Ceylox is designed to work for:

Web browsers

Mobile apps

Service kiosks / internal dashboards

Frontend architecture follows a mobile-first responsive design strategy using React Native + Expo.

🧠 Core Features
Booking System Logic

Prevents overlapping bookings using backend validation

Transaction-safe booking creation

Guest → Registered user conversion flow

Room/service abstraction for multi-industry support

Authentication System

JWT token-based authentication

Persistent session handling

Device-level login session management

Password hashing with secure cryptographic practices

Frontend UX

Responsive room catalog grid

Booking flow optimization

Real-time loading and error states

Auto-prefill user booking data

Clean modern UI system

Database Design

Relational data modeling using PostgreSQL

UUID-based user identity system

Migration management via Alembic

Transaction-aware booking operations

🏗️ Architecture Overview
ceylox-booking-system/
│
├── backend/
│ ├── main.py
│ ├── models.py
│ ├── schemas.py
│ ├── database.py
│ ├── auth_utils.py
│ ├── alembic/
│ └── requirements.txt
│
├── frontend/
│ ├── app/
│ ├── components/
│ ├── hooks/
│ ├── constants/
│ └── assets/
│
└── README.md
🧰 Tech Stack
Backend

FastAPI

PostgreSQL

SQLAlchemy ORM

Alembic migrations

JWT authentication

Passlib + Bcrypt security

Frontend

React Native

Expo Router

AsyncStorage session persistence

Responsive layout logic

⚙️ Booking Conflict Prevention Strategy

Ceylox ensures booking integrity using:

backend overlapping date validation

transactional database writes

atomic booking confirmation

This prevents double booking scenarios commonly found in naive systems.

🔐 Authentication Strategy

Secure password hashing

Token-based authentication

Stateless backend session design

Client-side session persistence

Future enhancement:

refresh tokens

logout token revocation

role-based access control

## 📸 Screenshots

### Home

![Home](screenshots/home.png)

### Catalog

![Catalog](screenshots/catalog.png)

### Booking

![Booking](screenshots/booking.png)

### Signup

![Signup](screenshots/signup.png)
