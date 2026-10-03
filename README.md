# ⚡ ProjectFlow - Collaborative MERN Project Management Tool

A full-stack collaborative project management platform (Trello/Asana style) built with the **MERN Stack** and real-time WebSockets using **Socket.io**.

---

## 🚀 Key Features

- **🔐 Authentication & Security:** JWT-based user authentication with encrypted password storage (`bcryptjs`).
- **📋 Project Boards:** Create, manage, and customize team project boards.
- **👥 Team Collaboration:** Invite registered users via email to collaborate on shared boards.
- **🎯 Kanban Board with Drag & Drop:** Move task cards across columns (*To Do*, *In Progress*, *Review*, *Done*) seamlessly using `@hello-pangea/dnd`.
- **💬 Task Discussion Threads:** Interactive task card details drawer with live comments.
- **🔔 Real-Time Notifications:** Instant socket alerts for card updates, mentions, and project invites.

---

## 🛠️ Tech Stack

### **Backend**
- **Node.js** & **Express.js** — REST API architecture
- **MongoDB** & **Mongoose** — Database and data modeling
- **Socket.io** — Real-time bidirectional event communication
- **JWT (JSON Web Tokens)** — Secure request authorization

### **Frontend**
- **React.js** (Vite) — UI framework
- **Tailwind CSS** — Modern utility-first styling
- **Axios** — API HTTP requests
- **@hello-pangea/dnd** — Drag-and-drop Kanban functionality
- **React Router v6** — Navigation and route protection

---

## 📂 Project Structure

```text
project-manager/
├── client/          # React + Vite Frontend
│   ├── src/
│   │   ├── api/          # Axios instance
│   │   ├── components/   # Common, Notification, Task components
│   │   ├── context/      # Auth & Socket providers
│   │   ├── pages/        # Login, Register, Dashboard, ProjectBoard
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── server/          # Node.js + Express Backend
    ├── config/           # Database configuration
    ├── controllers/      # Route controllers (Auth, Project, Task, Comment, Notification)
    ├── models/           # Mongoose schemas
    ├── routes/           # Express API endpoints
    ├── server.js         # Entry point & Socket.io setup
    └── package.json
