# Smart Parking Lot System

A backend system for automated parking lot management. Handles real-time spot allocation, session tracking, fee calculation, and administrative analytics across a multi-floor parking facility with support for motorcycles, cars, and buses.

---

## Features

- Vehicle entry/exit with automatic spot allocation
- Real-time availability tracking via Redis cache
- Dynamic pricing per vehicle type
- Occupancy and revenue analytics
- Spot maintenance management
- Redis–DB reconciliation via a background cron job
- Request validation using Zod schemas
- Clean Architecture with layered separation of concerns

---

## Tech Stack

| Category   | Technology            |
| ---------- | --------------------- |
| Runtime    | Node.js               |
| Language   | TypeScript 5.4        |
| Framework  | Express.js 4.19       |
| Database   | PostgreSQL (via `pg`) |
| ORM        | Drizzle ORM           |
| Cache      | Redis (ioredis)       |
| Validation | Zod                   |
| Scheduler  | node-cron             |
| Testing    | Vitest + Supertest    |
| Dev Tool   | ts-node               |

---

## Project Structure

```
src/
├── app.ts                          # Express app setup (middleware, routes)
├── server.ts                       # Entry point (DB/Redis init, cron scheduling)
├── application/
│   ├── dto/
│   │   └── parking.dto.ts
│   └── use-cases/
│       ├── HandleEntry.ts          # Entry logic — spot allocation, session creation
│       └── HandleExit.ts          # Exit logic — fee calculation, session completion
├── domain/
│   ├── entities/
│   │   ├── ParkingSpot.ts
│   │   ├── ParkingSession.ts
│   │   └── PricingConfig.ts
│   ├── errors/
│   │   └── DomainError.ts         # Custom domain exceptions
│   └── services/
│       ├── AllocationService.ts   # Vehicle-to-spot-type mapping
│       └── FeeService.ts          # Fee calculation logic
├── infrastructure/
│   ├── db/
│   │   ├── db.ts                  # Drizzle ORM + connection pool
│   │   ├── schema.ts              # Database schema definitions
│   │   └── seed.ts                # Initial data seeding script
│   ├── redis/
│   │   └── redis.ts               # Redis client + key definitions
│   └── repositories/
│       ├── ParkingSpotRepository.ts
│       ├── ParkingSessionRepository.ts
│       └── PricingRepository.ts
├── interfaces/
│   └── http/
│       ├── controllers/
│       │   ├── parking.controller.ts
│       │   └── admin.controller.ts
│       ├── middleware/
│       │   ├── error.middleware.ts
│       │   └── validate.middleware.ts
│       ├── routes/
│       │   ├── parking.routes.ts
│       │   └── admin.routes.ts
│       ├── services/
│       │   └── admin.service.ts
│       └── validation/
│           └── parking.schema.ts
├── jobs/
│   └── redisReconciliation.job.ts # Cron job — syncs Redis counters with DB every 5 min
└── tests/
    └── integration/
        └── parking.test.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL instance
- Redis instance

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@localhost:5432/smart_parking
REDIS_URL=redis://localhost:6379
```

| Variable       | Required | Default                  | Description                                |
| -------------- | -------- | ------------------------ | ------------------------------------------ |
| `DATABASE_URL` | Yes      | —                        | PostgreSQL connection string               |
| `REDIS_URL`    | No       | `redis://localhost:6379` | Redis connection URL                       |
| `PORT`         | No       | `3000`                   | HTTP server port                           |
| `NODE_ENV`     | No       | —                        | Environment (`development` / `production`) |

### Database Setup

```bash
# Push schema to the database
npm run db:push

# Seed initial data (floors, spots, pricing)
npm run db:seed
```

### Run the Server

```bash
# Development (ts-node)
npm run dev

# Production
npm run build
npm start
```

### Run Tests

```bash
npm test
```

---

## API Reference

### Health Check

```
GET /health
```

**Response**

```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

### Parking

#### Register Vehicle Entry

```
POST /api/entry
```

**Request Body**

```json
{
  "vehicleNumber": "ABC123",
  "vehicleType": "CAR"
}
```

`vehicleType`: `"MOTORCYCLE"` | `"CAR"` | `"BUS"`

**Response** `201 Created`

```json
{
  "sessionId": "...",
  "spotId": "...",
  "spotNumber": "C1001",
  "entryTime": "2024-01-01T10:00:00.000Z"
}
```

---

#### Register Vehicle Exit

```
POST /api/exit
```

**Request Body**

```json
{
  "vehicleNumber": "ABC123"
}
```

**Response** `200 OK`

```json
{
  "sessionId": "...",
  "totalFee": 20.0,
  "entryTime": "2024-01-01T10:00:00.000Z",
  "exitTime": "2024-01-01T11:00:00.000Z",
  "durationMinutes": 60
}
```

---

### Admin

#### Get Occupancy by Floor

```
GET /api/admin/occupancy
```

**Response** `200 OK`

```json
[
  {
    "floorNumber": 1,
    "total": 60,
    "occupied": 12,
    "available": 46,
    "maintenance": 2
  }
]
```

---

#### Get Active Sessions

```
GET /api/admin/sessions/active
```

**Response** `200 OK` — list of all currently active parking sessions.

---

#### Get Availability

```
GET /api/admin/availability
```

**Response** `200 OK`

```json
{
  "db": { "MOTORCYCLE": 80, "CAR": 130, "BUS": 45 },
  "redis": { "MOTORCYCLE": 80, "CAR": 130, "BUS": 45 }
}
```

---

#### Get Pricing

```
GET /api/admin/pricing
```

**Response** `200 OK`

```json
[
  { "vehicleType": "MOTORCYCLE", "pricePerHour": 10.0, "minimumCharge": 10.0 },
  { "vehicleType": "CAR", "pricePerHour": 20.0, "minimumCharge": 20.0 },
  { "vehicleType": "BUS", "pricePerHour": 50.0, "minimumCharge": 50.0 }
]
```

---

#### Update Pricing

```
PUT /api/admin/pricing
```

**Request Body**

```json
{
  "vehicleType": "CAR",
  "pricePerHour": 25.0,
  "minimumCharge": 20.0
}
```

**Response** `200 OK` — updated pricing record.

---

#### Update Spot Status

```
PATCH /api/admin/spots/:spotId/status
```

**Request Body**

```json
{ "status": "MAINTENANCE" }
```

`status`: `"AVAILABLE"` | `"MAINTENANCE"`

**Response** `200 OK`

```json
{ "message": "Spot status updated" }
```

---

#### Get Daily Revenue Report

```
GET /api/admin/reports/revenue?date=2024-01-01
```

`date` is optional — defaults to today.

**Response** `200 OK`

```json
{ "date": "2024-01-01", "revenue": 340.0 }
```

---

## Database Schema

### Enums

```sql
CREATE TYPE vehicle_type   AS ENUM ('MOTORCYCLE', 'CAR', 'BUS');
CREATE TYPE spot_status    AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');
CREATE TYPE session_status AS ENUM ('ACTIVE', 'COMPLETED');
```

### Tables

**`parking_floors`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `floor_number` | INTEGER | Unique |

**`parking_spots`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `floor_id` | UUID | FK → parking_floors |
| `spot_number` | VARCHAR(20) | e.g. `C1001` |
| `spot_type` | vehicle_type | |
| `status` | spot_status | Default: `AVAILABLE` |

**`parking_sessions`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `vehicle_number` | VARCHAR(20) | |
| `vehicle_type` | vehicle_type | |
| `spot_id` | UUID | FK → parking_spots |
| `entry_time` | TIMESTAMP | Default: `now()` |
| `exit_time` | TIMESTAMP | Nullable |
| `total_fee` | NUMERIC(10,2) | Nullable |
| `status` | session_status | Default: `ACTIVE` |

**`pricing_configs`**
| Column | Type | Notes |
|---|---|---|
| `vehicle_type` | vehicle_type | Primary key |
| `price_per_hour` | NUMERIC(10,2) | |
| `minimum_charge` | NUMERIC(10,2) | |

### Seeded Data

- **5 floors**, each with **20 motorcycle**, **30 car**, and **10 bus** spots = **300 total spots**
- Spot numbering: `M1001–M1020`, `C1001–C1030`, `B1001–B1010` per floor

---

## Architecture

The project follows **Clean Architecture** with four layers:

```
┌──────────────────────────────────────┐
│  Interfaces Layer                    │
│  Controllers · Routes · Middleware   │
├──────────────────────────────────────┤
│  Application Layer                   │
│  Use Cases · DTOs                    │
├──────────────────────────────────────┤
│  Domain Layer                        │
│  Entities · Services · Errors        │
├──────────────────────────────────────┤
│  Infrastructure Layer                │
│  Repositories · DB · Redis           │
└──────────────────────────────────────┘
```

**Key design decisions:**

- **Pessimistic locking** (`FOR UPDATE SKIP LOCKED`) prevents double-allocation of spots under concurrent load
- **Redis counters** serve fast availability reads; a 5-minute cron job reconciles them against the DB
- **DB transactions** wrap entry/exit operations for atomicity
- **Zod validation** runs at the middleware boundary before any business logic executes

---

## Scripts Reference

| Script        | Command                                 | Description                   |
| ------------- | --------------------------------------- | ----------------------------- |
| `dev`         | `ts-node src/server.ts`                 | Start in development mode     |
| `build`       | `tsc`                                   | Compile TypeScript to `dist/` |
| `start`       | `node dist/server.js`                   | Run compiled production build |
| `db:generate` | `drizzle-kit generate`                  | Generate migration files      |
| `db:migrate`  | `drizzle-kit migrate`                   | Apply migrations              |
| `db:push`     | `drizzle-kit push`                      | Push schema directly (dev)    |
| `db:seed`     | `ts-node src/infrastructure/db/seed.ts` | Seed initial data             |
| `test`        | `vitest`                                | Run test suite                |
