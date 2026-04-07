# BusTick Pro: Senior Engineering Edition 🚀

This project has been modernized to a **Senior Engineer level** with a focus on stateless security, observable architecture, and robust data integrity.

## 🏗️ Core Architecture
- **Layered Decoupling**: Pure separation between Presentation (Controllers), Business (Services), and Persistence (Repositories) using **DTOs** and **ModelMapper**.
- **Stateless Security**: Integrated **Spring Security** with **JWT (JSON Web Tokens)** for secure, session-less communication.
- **JPA Auditing**: Automatic tracking of entity lifecycles (`createdAt`, `updatedAt`) via `Auditable` base classes.
- **AOP Observability**: Automated performance logging and tracing using **Aspect-Oriented Programming**.

## 🔐 Security Handshake
- **Algorithms**: BCrypt (Password Hashing) + HS256 (JWT signing).
- **Default Credentials**: 
  - Admin: `admin` / `admin`
  - User: `john.doe` / `password123`
- **RBAC**: Implementation of Role-Based Access Control using `@PreAuthorize`.

## 🛠️ Operational Commands
Use the upgraded `run_project.bat` (v4.0) for:
1. **Launch**: Starts both Backend and Frontend in separate secure tunnels.
2. **Rebuild**: Performs a deep clean of Maven artifacts and NPM nodes.
3. **Health**: Comprehensive diagnostic of Java, Node, Maven, and Ports.
4. **Docs**: Instant access to OpenAPI 3.0 (Swagger) specifications.

## 📊 Standard API Responses
All exceptions are caught via the `GlobalExceptionHandler`, returning structured JSON:
```json
{
  "status": 401,
  "error": "Authentication Failed",
  "message": "Invalid username or password",
  "errorCode": "ERR_AUTH_INVALID_CREDS",
  "timestamp": "2024-..."
}
```

---
**Developed by Antigravity Senior Engineering Team**
