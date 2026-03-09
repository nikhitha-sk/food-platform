## LinkedIn Post

---

Excited to share my latest full-stack project — **BiteRight**, a production-grade food ordering and delivery platform built from the ground up using a microservices architecture.

**What it does:**
BiteRight is a full-featured food delivery system similar to platforms like Zomato or DoorDash. It supports four distinct user roles — customers, restaurant owners, delivery drivers, and administrators — each with a dedicated interface and workflow. Customers can browse restaurants, place orders, and track deliveries in real time. Restaurant owners manage their menus and incoming orders. Drivers handle delivery assignments with live GPS tracking. Administrators oversee user management, restaurant approvals, and platform analytics.

**Architecture:**
The backend is composed of seven independent microservices, each with its own isolated PostgreSQL database, communicating asynchronously through RabbitMQ as the event bus. Redis is used for caching, session management, and rate limiting. The services implement patterns such as circuit breakers, idempotency keys, and an outbox pattern to ensure reliability and consistency at scale. The entire platform is containerized and orchestrated using Docker and Docker Compose.

**Key Technologies:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, TanStack React Query, React Router, React Leaflet (maps), Recharts, Zod, React Hook Form
- **Backend:** Go (Gin framework), GORM, JWT authentication, Uber Zap (structured logging)
- **Databases & Storage:** PostgreSQL 15, Redis 7
- **Messaging:** RabbitMQ 3
- **Payments:** Razorpay (payment processing and webhook verification)
- **DevOps:** Docker, Docker Compose, Go Workspaces (monorepo)

This project was a deep dive into distributed systems design, event-driven architecture, and building scalable full-stack applications. Happy to connect with anyone working on similar problems or interested in discussing the design decisions behind it.

\#FullStack #Microservices #Go #React #TypeScript #Docker #RabbitMQ #PostgreSQL #Redis #SoftwareEngineering #WebDevelopment

---

## Local Service URLs

- pgAdmin: http://localhost:5050
- RabbitMQ Management: http://localhost:15672