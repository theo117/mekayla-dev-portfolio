# 🌸 Mekayla's Developer Portfolio

Welcome to my developer portfolio!

## Run locally

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite in your browser. The portfolio runs without a database. The Rate My Work section and review submission form have been removed.

## Contact form

The contact form submits the visitor's name, email, and message to
[Web3Forms](https://docs.web3forms.com/how-to-guides/js-frameworks/react-js/simple-react-contact-form).
Messages are forwarded to the email address associated with the configured access
key; the visitor's email becomes the reply-to address. The supplied key is already
configured. To use a different key, set `VITE_WEB3FORMS_ACCESS_KEY` in `.env.local`
or the hosting provider's build environment, then rebuild the site. Web3Forms
[access keys are public](https://docs.web3forms.com/getting-started/faq), so they
are intended to be included in the browser bundle.

The form validates required fields, prevents duplicate submissions while sending,
and shows success only after the API confirms acceptance. Errors and timeouts
keep the entered details available for retry. No contact details are written to
this repository or a portfolio database.

With a local dev or preview server running, run `npm run test:contact` (Node 22+
and Chrome required; set `CONTACT_TEST_URL` if the server is not on port 5173).
These browser tests mock Web3Forms responses and never send email. Actual inbox
delivery must be checked separately using the deployed form and the key owner's
inbox.

## Interactive character

The hero includes an interactive character extracted from the supplied Hailuo video.
See [the character guide](docs/interactive-character.md) for the source timeline,
browser verification, limitations, and asset replacement instructions. To regenerate
the optimized frames with FFmpeg and FFprobe installed, run `npm run character:extract`.
The [original character video](character-animation.mp4) is included for viewing
and regenerating the assets. The website's animation player uses the optimized
WebP sequences in [`public/animations/character`](public/animations/character).

The portfolio also includes a [WhatsApp sharing image and metadata](docs/social-preview.md)
for link previews, matching the existing dark and pink design.

I'm a Software Developer passionate about building modern, user-friendly, and impactful applications. This portfolio showcases my projects, technical skills, certifications, and continuous learning journey as I work toward becoming a professional Full-Stack Developer.

## 🚀 About Me

I am a Software Development graduate focused on:

- Full-Stack Development
- Java Development
- Spring Boot
- REST APIs
- SQL & Database Design
- JavaScript
- Git & GitHub
- Agile Development

I enjoy creating real-world solutions that solve problems and improve user experiences.

---

## 🛠️ Technologies & Tools

### Frontend
- HTML5
- CSS3
- JavaScript
- React

### Backend
- Java
- Spring Boot
- REST APIs

### Databases
- MySQL
- PostgreSQL
- Firebase

### Tools
- Git
- GitHub
- VS Code
- IntelliJ IDEA
- Postman
- Jira

---

## 📂 Featured Projects

### 📊 Personal Finance Tracker
Track expenses, manage budgets, and analyze spending habits.

**Tech Stack:**
- Java
- Spring Boot
- PostgreSQL
- REST API

### ⚽ Football Club Management Platform
Manage teams, players, matches, attendance, and statistics.

**Tech Stack:**
- React
- Spring Boot
- MySQL

### 💳 Digital Wallet API
A fintech-style backend application supporting wallet accounts, transfers, deposits, withdrawals, and fraud detection.

**Tech Stack:**
- Java
- Spring Boot
- PostgreSQL

### 🎓 Learning Management System
A platform for course management, student enrollment, and progress tracking.

**Tech Stack:**
- React
- Spring Boot
- MySQL

---

## 🌱 Currently Learning

- Advanced Spring Boot
- System Design
- Microservices
- Testing & Automation
- Cloud Deployment
- Financial Systems Development

---

## 🎯 Career Goals

My goal is to become a highly skilled Full-Stack Software Developer building scalable applications in fintech, business systems, and enterprise 
