# High-Performance TypeScript API with Redis Caching

## A fully functional example code written in TypeScript showing how to create a RESTful API

This project is a code test demonstration built with Next.js, MySQL, and Redis, showcasing how to design and implement a custom, production-ready RESTful API in TypeScript with high performance and reliable multi-tiered data fallback.
Every part of this project demonstrates best practices for the following:

* **Multi-Tiered Data Fallback**: Seamlessly query Redis cache first, fall back to MySQL via Prisma ORM on cache miss, and dynamically create records when no entry exists.
* **Request Validation**: Enforce strict payload and type checks to reject malformed JSON or missing required fields with standardized responses.
* **OpenAPI/Swagger Documentation**: Generate interactive API documentation accessible via `/swagger` using OpenAPI specs.
* **Automated Unit Testing**: Implement a complete Jest test suite covering all validation edge cases and business logic paths using full mock dependencies (`redis`, `prisma`).

## Architecture & Data Flow

The API follows a multi-tiered data retrieval strategy:

### Purpose of Redis
Redis is integrated as an in-memory caching layer to optimize query performance and reduce database load by eliminating repetitive API requests:

* **High-Throughput Caching**: Storing frequently accessed records in cache reduces access latency, as serving data directly from memory is significantly faster than querying the database.
* **Database Offloading**: Intercepts repetitive queries to prevent unnecessary read operations on MySQL, effectively reducing database load.
* **Cache Lifetime**: Implements a 1-hour TTL (Time-To-Live) to ensure data freshness while preventing memory overload.

### Data Flow
1. **Validation**: Check incoming JSON syntax and data types.
2. **Cache Check**: Query Redis key `test_record:{id1}_{id2}`.
   * **Cache Hit**: Return response directly from Redis.
3. **Database Fallback**: On cache miss, query MySQL via Prisma.
   * **DB Hit**: Write result back to Redis with 1-hour TTL and return response.
4. **Record Creation**: If neither exists, generate UUID, save to MySQL, populate Redis cache, and return response.

![alt text](SequenceDiagram.png)

---

## Tech Stack

* **Framework**: Next.js 14+
* **Language**: TypeScript
* **Database & ORM**: MySQL with Prisma ORM
* **Caching**: Redis (ioredis)
* **Containerization**: Docker & Docker Compose
* **API Documentation**: OpenAPI 3.0 / Swagger UI (`next-swagger-doc`)
* **Testing**: Jest with module mocking (`jest.config.ts`)

### Prerequisites

* **Node.js**: 18+ (Node.js 20+ recommended)
* **npm**: `>=10.0.0`
* **Docker & Docker Compose**: Installed and active locally

---

## Getting Started

### 1. Start Infrastructure Services (Docker)

Spin up MySQL and Redis containers using Docker Compose:

```bash
docker-compose up -d
```

### 2. Environment Variables

Create a `.env` file in the root directory matching your container configurations:

```env
DATABASE_URL="mysql://root:password@localhost:3306/api_demo"
REDIS_URL="redis://localhost:6379"
```

### 3. Installation & Setup

```bash
npm install

npx prisma migrate dev --name init
```

### 4. Run Development Server

```bash
npm run dev

```

## 📡 API Endpoint & Example Request

### POST `/api/test`

Description: This endpoint accepts `id1` and `id2` to process a request and returns a unique user ID upon success.

### 📋 Request Details
* **Method:** `POST`
* **URL:** `http://localhost:3000/api/test`
* **Headers:**
  * `Content-Type: application/json`

---

## Success Case (200 OK)

When both `id1` and `id2` are successfully provided in the request body.

### Request Body
```json
{
  "id1": "123",
  "id2": "456"
}
```

### Example Request (cURL)
```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"id1": "123", "id2": "456"}'
```

### Response (200 OK)
```json
{
  "success": true,
  "userID": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Error Case (400 Bad Request)

When one or both of the required fields (`id1` or `id2`) are missing.

### Request Body
```json
{
  "id1": "123"
}
```

### Example Request (cURL)
```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"id1": "123"}'
```

### Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Both id1 and id2 are required"
}
```

## API Documentation
Interactive Swagger API documentation is integrated into the project.

Swagger UI Endpoint: http://localhost:3000/swagger

## Testing
The unit test suite covers all input validation error cases (400 Bad Request) and business flow scenarios (200 OK: Cache Hit, DB Hit, and First-time Creation).

Run tests:
```bash
npm test
```
