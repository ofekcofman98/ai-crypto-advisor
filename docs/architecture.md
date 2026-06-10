# System Architecture — Moveo AI Crypto Advisor

This document describes the structural design and execution flow of the application. The architecture is intentionally kept clean and pragmatic, avoiding over-engineering while maintaining a strict separation of concerns.

---

## Table of Contents

1. [Directory Structure](#1-directory-structure)
2. [Execution Flow](#2-execution-flow)
3. [Error Handling Architecture](#3-error-handling-architecture)


---

## 1. Directory Structure

The project is structured as a monorepo, separating the frontend client from the backend server environment.

### Backend (`apps/backend`)


src/
├── config/             # Environment variable parsing and validation
├── modules/            # Feature-based modules
│   └── auth/
│       ├── auth.router.ts   # Express routes and request handling
│       └── auth.service.ts  # Business logic and direct database mutations
├── shared/             # Shared custom error handling utilities
├── app.ts              # Express application configuration and middleware configuration
└── server.ts           # Application bootstrap and port listener


---

### Frontend (`apps/frontend`)


src/
├── components/         # Reusable UI components and layout blocks
├── hooks/              # Custom React hooks for API state management (TanStack Query)
├── store/              # Zustand global store for authentication state
└── utils/              # Client-side formatters and helpers

---

## 2. Execution Flow

To make the application predictable and easy to debug, data flows through a straightforward asynchronous sequence:

[HTTP Request] ──► Router (Input Parsing) ──► Service (Logic & Prisma Query) ──► [Database]

1. **Router Layer:** Listens to incoming HTTP requests, captures variables from the request body or parameters, performs basic input validation, and invokes the appropriate service function.
2. **Service Layer:** Houses the core business logic (e.g., hashing passwords with bcrypt or calculating timestamps) and queries the PostgreSQL database directly using the standard Prisma Client.

---

## 3. Error Handling Architecture

The application uses an explicit, centralized try/catch pattern across all HTTP route handlers. 

* **Expected Errors:** Business logic failures (such as entering an incorrect password or attempting to register an existing email) are caught, mapped to specific HTTP status codes (400, 401, 409), and returned as clean JSON error messages.
* **Unexpected Errors:** Any unhandled system or database exception triggers a 500 Internal Server Error response, keeping internal stack traces hidden from the client for security.