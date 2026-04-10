# System Architecture

High-level architecture diagrams and component descriptions for the Loreum platform.

---

## 1. System Context Diagram

External actors and how they interact with Loreum as a whole.

```mermaid
C4Context
    title System Context — Loreum

    Person(author, "Author", "Worldbuilder, writer, game designer")
    Person(reader, "Public Reader", "Views published world wikis")
    Person(ai, "AI Assistant", "Claude, ChatGPT, etc. via MCP")

    System(loreum, "Loreum", "Worldbuilding & story planning platform")

    System_Ext(google, "Google OAuth", "Authentication provider")
    System_Ext(cloudflare, "Cloudflare", "CDN, DNS, tunnel, R2 storage")
    System_Ext(resend, "Resend", "Transactional email")
    System_Ext(stripe, "Stripe", "Subscription billing")

    Rel(author, loreum, "Creates worlds, entities, stories", "HTTPS")
    Rel(reader, loreum, "Reads public wikis", "HTTPS")
    Rel(ai, loreum, "Queries/mutates world data", "MCP over stdio")
    Rel(loreum, google, "OAuth2 login", "HTTPS")
    Rel(loreum, cloudflare, "CDN, file storage, DNS", "HTTPS")
    Rel(loreum, resend, "Sends email", "HTTPS")
    Rel(loreum, stripe, "Manages subscriptions", "HTTPS")
```

---

## 2. Component Diagram

Internal services and how they communicate.

```mermaid
graph TB
    subgraph Client
        WEB["Next.js Frontend<br/>(port 3020)"]
    end

    subgraph Application
        API["NestJS API<br/>(port 3021)"]
        WS["WebSocket Gateway<br/>(NestJS, same process)"]
        WORKERS["BullMQ Workers<br/>(same process)"]
        MCP["MCP Server<br/>(stdio transport)"]
    end

    subgraph Data
        PG[(PostgreSQL 18)]
        REDIS[(Redis 7)]
        OS[(OpenSearch 2.14)]
    end

    subgraph External
        R2["Cloudflare R2"]
        CF["Cloudflare CDN/Tunnel"]
        RESEND["Resend"]
        STRIPE["Stripe"]
        GOOGLE["Google OAuth"]
    end

    WEB -- "REST API" --> API
    WEB -- "Notifications (push)" --> WS
    WEB -. "Yjs CRDT sync (planned)" .-> WS
    MCP -- "REST API (bearer auth)" --> API

    API --> PG
    API --> REDIS
    API --> OS
    API -- "Enqueue jobs" --> REDIS
    WORKERS -- "Process jobs" --> REDIS
    WORKERS -- "Call domain services" --> PG

    API --> R2
    API --> RESEND
    API --> STRIPE
    API --> GOOGLE

    CF --> WEB
    CF --> API
```

### Component Responsibilities

| Component             | Role                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js Frontend**  | SSR/CSR web app. Auth UI, project workspace, entity editor, relationship graph, timeline, storyboard.                                                                              |
| **NestJS API**        | REST API. Auth (Google OAuth + JWT), CRUD for all domain models, Swagger docs at `/docs`.                                                                                          |
| **WebSocket Gateway** | **Current:** one-way push notifications (entity/storyboard update events). **Planned:** bidirectional collaborative editing via Yjs CRDT provider. Runs inside the NestJS process. |
| **BullMQ Workers**    | Async job processing — search indexing, email dispatch, AI tasks. Centralized QueueModule; domain modules emit events, processors call domain services.                            |
| **MCP Server**        | Model Context Protocol server for AI assistants. Exposes tools (`search_project`, `get_entity`, `create_entity`, etc.) over stdio, proxying to the REST API with bearer auth.      |
| **PostgreSQL**        | Primary data store. Prisma ORM with migrations.                                                                                                                                    |
| **Redis**             | BullMQ job queue, session cache, rate limiting.                                                                                                                                    |
| **OpenSearch**        | Full-text search across entities, lore articles, timeline events.                                                                                                                  |

---

## 3. Data Flow Diagrams

### 3a. Entity Creation

```mermaid
sequenceDiagram
    actor Author
    participant Web as Next.js
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Queue as Redis/BullMQ
    participant Worker as Worker
    participant OS as OpenSearch
    participant WS as WebSocket

    Author->>Web: Fill entity form, submit
    Web->>API: POST /api/v1/projects/:slug/entities
    API->>API: Validate JWT, check project ownership
    API->>DB: Insert entity + generate slug
    DB-->>API: Entity created
    API->>Queue: Enqueue search index job
    API-->>Web: 201 Created (entity JSON)
    Web-->>Author: Entity page rendered

    Queue-->>Worker: Pick up index job
    Worker->>OS: Index entity document
    API->>WS: Broadcast entity:updated
```

### 3b. Real-Time Collaboration (Planned — Yjs)

Collaborative editing uses Yjs CRDTs over WebSocket. The Yjs document state lives in memory on the server while a session is active, and persists to PostgreSQL when the last client disconnects (or periodically). This is a separate concern from the notification events — both run over the same WebSocket connection but serve different purposes.

```mermaid
sequenceDiagram
    actor Author1 as Author A
    actor Author2 as Author B
    participant Web1 as Browser A (Yjs)
    participant Web2 as Browser B (Yjs)
    participant WS as WebSocket Gateway<br/>(y-websocket provider)
    participant DB as PostgreSQL

    Note over Web1,DB: Session start — load document
    Web1->>WS: Connect to doc room
    WS->>DB: Load Yjs document state
    DB-->>WS: Stored CRDT snapshot
    WS-->>Web1: Sync initial state

    Web2->>WS: Connect to doc room
    WS-->>Web2: Sync initial state

    Note over Web1,Web2: Concurrent editing
    Author1->>Web1: Type in description field
    Web1->>WS: Yjs update (binary diff)
    WS-->>Web2: Broadcast update
    Web2-->>Author2: Field updates live

    Author2->>Web2: Edit a different field
    Web2->>WS: Yjs update (binary diff)
    WS-->>Web1: Broadcast update
    Web1-->>Author1: Field updates live

    Note over WS,DB: Periodic + on disconnect
    WS->>DB: Persist merged CRDT state
```

**Key design decisions:**

- **Yjs** handles conflict resolution — no OT server logic needed
- **y-websocket** provider on the NestJS gateway manages document rooms
- Each entity/lore article/scene is a separate Yjs document
- Rich text fields use Yjs bindings for the editor (TipTap + `y-prosemirror` or similar)
- Simple fields (name, tags) use `Y.Map` — last-write-wins is fine at field granularity
- Notification events (`entity:updated`, etc.) still fire for clients not in the editing session (dashboards, entity lists)

### 3c. AI Query via MCP

```mermaid
sequenceDiagram
    actor User
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant API as NestJS API
    participant DB as PostgreSQL

    User->>AI: "Tell me about the elven kingdoms"
    AI->>MCP: tools/call search_project
    MCP->>API: GET /api/v1/projects/:slug/search?q=elven+kingdoms
    API->>DB: Full-text search query
    DB-->>API: Matching entities + lore
    API-->>MCP: Search results JSON
    MCP-->>AI: Tool result
    AI-->>User: Summarized answer with world context
```

### 3d. Subscription Checkout (Planned)

```mermaid
sequenceDiagram
    actor Author
    participant Web as Next.js
    participant API as NestJS API
    participant Stripe as Stripe
    participant DB as PostgreSQL

    Author->>Web: Click "Upgrade to Pro"
    Web->>API: POST /api/v1/billing/checkout
    API->>Stripe: Create Checkout Session
    Stripe-->>API: Session URL
    API-->>Web: Redirect URL
    Web-->>Author: Redirect to Stripe Checkout

    Stripe->>API: Webhook: checkout.session.completed
    API->>DB: Update user tier to Pro
    API-->>Author: Pro features unlocked
```

---

## 4. Deployment Diagram

```mermaid
graph TB
    subgraph Internet
        USER["Users / Browsers"]
        AI_CLIENT["AI Assistants"]
    end

    subgraph Cloudflare
        DNS["DNS<br/>loreum.app"]
        CDN["CDN / Tunnel"]
    end

    subgraph "Application Server"
        NEXT["Next.js<br/>SSR + Static"]
        NEST["NestJS API<br/>+ WebSocket<br/>+ Workers"]
        MCP_SRV["MCP Server<br/>(stdio)"]
    end

    subgraph "Managed Services"
        PG[(PostgreSQL 18<br/>+ Backups)]
        REDIS[(Redis 7)]
        OS[(OpenSearch 2.14)]
        R2["Cloudflare R2<br/>File Storage"]
        RESEND_SVC["Resend<br/>Email"]
        STRIPE_SVC["Stripe<br/>Billing"]
    end

    USER --> DNS --> CDN
    CDN --> NEXT
    CDN --> NEST
    AI_CLIENT --> MCP_SRV --> NEST

    NEST --> PG
    NEST --> REDIS
    NEST --> OS
    NEST --> R2
    NEST --> RESEND_SVC
    NEST --> STRIPE_SVC
```

### Infrastructure Summary

| Layer           | Technology                | Notes                                                |
| --------------- | ------------------------- | ---------------------------------------------------- |
| **DNS + CDN**   | Cloudflare                | Tunnel for origin protection, R2 for file uploads    |
| **Frontend**    | Next.js 16                | Server-rendered, port 3020                           |
| **API**         | NestJS                    | REST + WebSocket + BullMQ workers, port 3021         |
| **MCP**         | @modelcontextprotocol/sdk | stdio transport, separate process                    |
| **Database**    | PostgreSQL 18             | Prisma ORM, single migration-managed schema          |
| **Cache/Queue** | Redis 7                   | BullMQ jobs, session store, rate limiting            |
| **Search**      | OpenSearch 2.14           | Full-text indexing of all content                    |
| **Storage**     | Cloudflare R2             | Entity images, file uploads                          |
| **Email**       | Resend                    | Invitations, notifications                           |
| **Billing**     | Stripe                    | Checkout sessions, webhooks, subscription management |

### Local Development

```sh
# Start infrastructure
docker compose up -d

# Start all apps
pnpm dev
```

This runs PostgreSQL, Redis, and OpenSearch in Docker. The API (3021), web app (3020), and MCP server run natively via Turborepo.
