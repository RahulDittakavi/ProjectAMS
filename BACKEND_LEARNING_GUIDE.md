# Backend Development — A Complete Study Guide

*Built around the Project AMS codebase (Apartment Management System), but designed to make you a backend developer anywhere.*

---

## How to use this guide

- **14 modules**, ordered so each builds on the last. Don't skip Module 3 (SQL) — it's the one most self-taught developers regret skipping.
- Every module has: **Concepts** (what to understand), **In Project AMS** (where to see it live), **Beyond AMS** (how the rest of the industry does it), **Exercises** (do these — reading alone teaches ~20%), and a **Checkpoint** (questions you should be able to answer from memory before moving on).
- Exercise difficulty: 🟢 easy · 🟡 medium · 🔴 hard.
- Suggested pace: 1 module per week alongside practice = ~3–4 months to solid junior-backend level.
- Keep a **learning journal**: after each module write 5 sentences explaining the topic as if to a friend. If you can't, re-read.

**File paths in this guide** are relative to the Project AMS root (`C:\ProjectAMS-main`).

---

## Module 1 — HTTP and REST fundamentals

### Concepts
1. **HTTP is a text protocol.** A request = method + path + headers + optional body. A response = status code + headers + body. Everything in web backends is built on this.
2. **Methods and their meaning (semantics):**
   - `GET` — read, must not change state, safe to retry/cache
   - `POST` — create / trigger an action, not safe to blindly retry
   - `PUT` — replace a resource entirely (idempotent: doing it twice = doing it once)
   - `PATCH` — partial update
   - `DELETE` — remove (idempotent)
3. **Status code families:** `2xx` success, `3xx` redirect, `4xx` *client's* fault, `5xx` *server's* fault. Memorize: 200, 201 (created), 204 (no content), 400 (bad request), 401 (unauthenticated), 403 (forbidden), 404, 409 (conflict), 422 (validation, some APIs), 429 (rate-limited), 500, 503.
4. **Headers that matter:** `Content-Type` (what format the body is), `Authorization` (credentials), `Accept`, `Cache-Control`, `Location` (where the new resource lives after a 201).
5. **REST** = model your API as *resources* (nouns) manipulated by HTTP verbs. `POST /api/complaints`, not `POST /api/createComplaint`.
6. **Statelessness:** each request must carry everything the server needs. The server keeps no memory of "the previous request". This is what lets you run 10 copies of a server behind a load balancer.
7. **HTTPS/TLS:** encryption in transit. Know that terminating TLS usually happens at the load balancer / gateway, not in your app.

### In Project AMS
- `backend/src/main/java/com/apartmentapp/complaint/ComplaintController.java` — four endpoints, clean verb/noun mapping.
- `backend/src/main/java/com/apartmentapp/config/ApiResponse.java` — a consistent `{success, message, data}` envelope on every response.
- Notice AMS returns `200` for creations. A stricter API would return `201 Created` with a `Location: /api/complaints/42` header — good exercise below.

### Beyond AMS
- Study the **Stripe API docs** (stripe.com/docs/api) — widely considered the gold standard of REST design: consistent nouns, cursor pagination, idempotency keys, expandable objects.
- Study the **GitHub REST API** for how versioning and pagination headers (`Link`) work.
- Know that REST has siblings: **GraphQL** (client asks for exactly the fields it wants — one endpoint, typed schema) and **gRPC** (binary, contract-first, service-to-service). You don't need to master them yet; you need to know *when* they're chosen: GraphQL for flexible frontends, gRPC for fast internal service calls.

### Exercises
1. 🟢 Using `curl` or Postman against a running AMS: register, log in, create a complaint, list complaints. Write down for each call: method, path, headers you sent, status you got.
2. 🟢 Trigger each of these on purpose and note the status code: missing token, wrong-role token, empty title, non-existent id, wrong HTTP verb on a valid path.
3. 🟡 Change AMS complaint creation to return `201` with a `Location` header (`ResponseEntity.created(uri).body(...)`). Verify with curl `-i`.
4. 🟡 Design on paper (no code) a REST API for a library: books, members, loans. Every endpoint, verb, status codes, and error cases. Include "member borrows a book" — is that a `POST /loans` or `POST /books/{id}/borrow`? Argue for one.
5. 🔴 Read about idempotency keys in Stripe's docs, then explain in your journal: why can a client safely retry `PUT` but not `POST`, and how does an `Idempotency-Key` header fix that for `POST`?

### Checkpoint
- Why is `GET /users/delete?id=5` a terrible API? (Two reasons.)
- What's the difference between 401 and 403?
- Why does statelessness matter for horizontal scaling?

---

## Module 2 — Layered architecture and separation of concerns

### Concepts
1. **The three layers:** Controller (HTTP in/out) → Service (business rules) → Repository (data access). Each layer only talks to the one below it.
2. **Why:** testability (test business logic without HTTP or a DB), replaceability (swap Postgres for MySQL touching one layer), readability (you always know where to look).
3. **The dependency rule:** business logic must not depend on infrastructure details. `ComplaintService` doesn't know JSON or HTTP exist.
4. **Package by feature, not by layer.** AMS puts `Complaint`, `ComplaintController`, `ComplaintService`, `ComplaintRepository` in one `complaint/` folder — better than giant `controllers/`, `services/` folders because a feature's code lives together.
5. **Dependency Injection (DI):** classes *declare* what they need (constructor parameters); the framework constructs and wires them. Enables swapping real implementations for mocks in tests.
6. Vocabulary you'll meet later: *hexagonal / ports-and-adapters architecture*, *clean architecture* — stricter versions of the same idea: keep the core logic pure, push I/O to the edges.

### In Project AMS
- Any feature folder, e.g. `backend/.../complaint/` — the pattern repeated ~8 times.
- `@RequiredArgsConstructor` + `private final` fields = constructor injection (the preferred style; avoid field injection with `@Autowired` on fields).
- `backend/src/test/java/.../complaint/ComplaintServiceTest.java` — the payoff: service tested with a mocked repository.

### Beyond AMS
- Express.js equivalent: `router → controller → service → repository` is the same idea; the framework doesn't enforce it, so junior Node codebases often smear SQL into route handlers. Recognize and avoid that smell in any language.
- Read: "The Clean Architecture" blog post by Robert C. Martin (one page, famous concentric-circles diagram). You don't need to adopt it fully; you need the vocabulary.

### Exercises
1. 🟢 In your journal, list every responsibility of `ComplaintController` and every responsibility of `ComplaintService`. There should be zero overlap.
2. 🟡 Find the layering violation: `AuthService.register` throws `RuntimeException("Email already registered")`, and `GlobalExceptionHandler` maps *all* `RuntimeException` to 400. Why is that fragile? (Hint: what happens when a genuine bug throws `IllegalStateException`?) Fix it by creating a `DuplicateResourceException` mapped to `409 Conflict`.
3. 🟡 Add a full new feature to AMS end-to-end: **Parking slot allocation**. Entity (`slotNumber`, `resident`, `vehicleNumber`, timestamps), repository, service (rule: one slot per resident), controller (resident requests, admin assigns), DTOs. Follow the existing folder pattern exactly.
4. 🔴 Write the same feature as a tiny Node.js/Express app with the same three layers, using plain objects and an in-memory array as the "repository". The point: the architecture is language-independent.

### Checkpoint
- Why should a service never return an entity directly to the controller for serialization?
- What breaks if repositories are called directly from controllers?
- What is constructor injection and why is it preferred over field injection?

---

## Module 3 — Databases and SQL (do not skip)

ORMs write SQL *for* you, which means when something is slow or wrong you must read SQL to debug it. Every strong backend developer is comfortable in raw SQL.

### Concepts
1. **Relational model:** tables, rows, columns, primary keys, foreign keys. Data is linked by keys, not duplicated.
2. **Core SQL:** `SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN` (inner vs left), `GROUP BY` + aggregates (`COUNT`, `SUM`, `AVG`), subqueries.
3. **Constraints as guardrails:** `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`. Push integrity into the database — application checks alone can be bypassed by a second app, a manual script, or a race condition.
4. **Indexes:** a sorted lookup structure (B-tree) that turns a full-table scan into a fast seek. Rule of thumb: index columns that appear in `WHERE`, `JOIN ... ON`, and `ORDER BY` of frequent queries. Cost: slower writes, more storage. Learn to read `EXPLAIN ANALYZE`.
5. **Transactions and ACID:** Atomicity (all-or-nothing), Consistency (constraints hold), Isolation (concurrent transactions don't see each other's half-done work), Durability (committed = survives crash).
6. **Isolation levels** (know they exist and the default): read uncommitted → read committed (Postgres default) → repeatable read → serializable. Higher = safer = slower.
7. **Normalization** (roughly): don't store the same fact twice. Then know when to deliberately denormalize for read speed.
8. **NoSQL landscape** (awareness level): document stores (MongoDB — flexible schema, nested docs), key-value (Redis), wide-column (Cassandra), search (Elasticsearch). Default to relational unless you have a specific reason not to.

### In Project AMS
- `docker/init-databases.sql` — two databases created (`apartmentdb`, `paymentdb`): one DB per service, a core microservice principle.
- Set `spring.jpa.show-sql=true` (already on) and watch the SQL Hibernate generates for every API call you make. This is the single best ORM-learning trick.
- Connect directly: `docker exec -it <postgres-container> psql -U postgres -d apartmentdb`, then `\dt` to list tables, `\d complaints` to describe one.

### Beyond AMS
- Interactive practice: **pgexercises.com** (free, excellent, Postgres-flavored) and **sqlbolt.com** (gentler start).
- Read: *"Use The Index, Luke"* (use-the-index-luke.com) — free book on indexing that will put you ahead of most working developers.

### Exercises (run these in psql against AMS data you created via the API)
1. 🟢 Write queries: all complaints with status `OPEN`; count of complaints per category; the 5 most recent complaints with the resident's *name* (requires a `JOIN` to `users`).
2. 🟢 Try to `INSERT` a complaint with a `resident_id` that doesn't exist. Read the error. That's a foreign key doing its job.
3. 🟡 `EXPLAIN ANALYZE SELECT * FROM complaints WHERE resident_id = 1;` — note the plan. Add an index (`CREATE INDEX idx_complaints_resident ON complaints(resident_id);`), run it again, compare. (With tiny data Postgres may still scan — read why: planner cost model.)
4. 🟡 The `users.email` column must be unique. Check whether the schema actually enforces it (`\d users`). If Hibernate only made it unique via the entity annotation, test the race: what if two registrations with the same email arrive simultaneously? Explain why a DB-level unique constraint is the only real fix.
5. 🟡 Write a query for a monthly admin report: for each block, number of residents, number of open complaints, and total maintenance bills collected (you'll need to think about the fact bills live in a *different database* — what are your options? This is the microservice data problem, revisited in Module 10).
6. 🔴 Simulate a transfer problem: open two `psql` sessions, `BEGIN` in both, update the same row in both, and watch one block until the other commits. Then read about deadlocks and how Postgres resolves them.
7. 🔴 Complete the first 30 exercises on pgexercises.com.

### Checkpoint
- What does a foreign key actually prevent?
- When does an index *not* help a query?
- What does `BEGIN ... COMMIT` guarantee that autocommit doesn't?
- Why is enforcing uniqueness in application code insufficient?

---

## Module 4 — ORM deep dive (JPA/Hibernate)

### Concepts
1. **Entity mapping:** `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`, `@Enumerated(EnumType.STRING)` (always STRING — ordinal breaks when you reorder the enum).
2. **Relationships:** `@ManyToOne` (the common one — owns the foreign key), `@OneToMany` (usually mapped by the many-side), `@ManyToMany` (join table; often better modeled as an explicit entity). Default fetch types: `@ManyToOne` is EAGER by default — AMS correctly overrides to `LAZY`.
3. **The N+1 problem** — the most common ORM performance bug in existence: load 100 complaints (1 query), then access `complaint.getResident().getName()` on each → 100 extra queries. Fixes: `JOIN FETCH` in JPQL, `@EntityGraph`, or a DTO projection query.
4. **The persistence context / first-level cache:** within a transaction, Hibernate tracks loaded entities and auto-flushes changes ("dirty checking") — this is why `updateStatus` in AMS would work even *without* calling `save()`.
5. **Derived queries** (`findByResidentIdOrderByCreatedAtDesc`) vs **JPQL** (`@Query("select c from Complaint c where ...")`) vs **native SQL** (`nativeQuery = true`). Use derived for trivial, JPQL for moderate, native for anything a DBA would raise an eyebrow at.
6. **Schema migrations:** AMS uses `ddl-auto=update` — fine for a demo, **never** for production (it can't rename, can't remove safely, no history, no review). Production uses **Flyway** or **Liquibase**: numbered SQL files (`V1__create_users.sql`, `V2__add_index.sql`) applied in order and recorded.
7. **Optimistic locking:** a `@Version` column; concurrent updates to the same row make the second one fail instead of silently overwriting ("lost update"). Pessimistic locking: `SELECT ... FOR UPDATE`.

### In Project AMS
- `backend/.../complaint/Complaint.java` — clean mapping with `LAZY`, `@CreationTimestamp`, enum-as-string, `@Builder.Default` for status.
- **Hunt the N+1:** `ComplaintService.getAllComplaints()` maps each complaint's `resident.getName()`. With `show-sql` on, create 5 complaints from different users, call `GET /api/complaints`, and count the queries in the log.

### Exercises
1. 🟢 Reproduce and observe the N+1 above. Write down the exact number of queries.
2. 🟡 Fix it: add `@Query("select c from Complaint c join fetch c.resident order by c.createdAt desc")` to the repository and confirm the log shows one query.
3. 🟡 Add pagination to `GET /api/complaints`: accept `page` and `size` params, use `Pageable`/`Page<T>`, return total count in the response envelope. (AMS currently loads *every* complaint — fatal at scale.)
4. 🟡 Convert AMS to Flyway: set `ddl-auto=validate`, write `V1__baseline.sql` from the current schema (`pg_dump --schema-only`), and prove the app still boots.
5. 🔴 Add `@Version` to `Complaint`, then write a test that loads the same complaint twice, updates both copies, and asserts the second save throws `OptimisticLockingFailureException`. Explain in your journal what real-world bug this prevents for the "admin updates status" endpoint.
6. 🔴 Write the same `Complaint` persistence with **no ORM** — plain JDBC (`PreparedStatement`, `ResultSet` mapping). Feel the boilerplate the ORM removes; understand what it costs you in control.

### Checkpoint
- Explain N+1 to a friend in three sentences, with the fix.
- Why is `ddl-auto=update` dangerous in production?
- What does `@Version` protect against, concretely?

---

## Module 5 — API design: DTOs, validation, versioning

### Concepts
1. **DTOs at every boundary.** Separate request DTOs (only fields a client may set), response DTOs (only fields a client may see), and entities (database shape). Three reasons: security (never leak `password` hashes), stability (table changes shouldn't break clients), and control (a `CreateRequest` without a `status` field means clients *can't* set status).
2. **Validate at the edge:** `@NotBlank`, `@NotNull`, `@Email`, `@Size`, `@Min/@Max`, `@Pattern` + `@Valid` in the controller → automatic 400 with field-level messages before your code runs. Golden rule: **never trust client input** — not types, not lengths, not "the frontend already checks it".
3. **Validation vs business rules:** "title must not be blank" = bean validation on the DTO. "resident can only book one amenity slot per day" = service-layer logic. Don't cram business rules into annotations.
4. **API versioning:** URL (`/api/v1/...`), header, or media-type versioning. Simplest and most common: URL. The deeper skill: design so you rarely need to break compatibility (add fields, never repurpose them; unknown fields are ignored).
5. **Pagination, filtering, sorting** conventions: `?page=0&size=20&sort=createdAt,desc&status=OPEN`. For very large/append-heavy data, cursor pagination (`?after=id_123`) beats offset (offset gets slower the deeper you page, and shifts when rows are inserted).
6. **Documentation:** OpenAPI/Swagger — machine-readable API contract, generates interactive docs. In Spring: `springdoc-openapi` dependency gives you `/swagger-ui.html` nearly for free.

### In Project AMS
- `backend/.../complaint/ComplaintDTO.java` — three nested DTOs, exactly the request/response split described above.
- `backend/.../config/GlobalExceptionHandler.java` — `handleValidation` collects per-field errors into the 400 body. Test it: POST a complaint with an empty title and read the response shape.
- Gap to notice: `AuthDTO.RegisterRequest` accepts a `role` field from the client — meaning anyone can register as ADMIN. This is a real vulnerability class ("mass assignment"). Exercise below.

### Exercises
1. 🟢 POST a registration with `"role": "ADMIN"` to AMS and confirm you become an admin. Congratulations, you found your first privilege-escalation bug.
2. 🟡 Fix it: remove `role` from the public register DTO; create a separate admin-only endpoint (`@PreAuthorize("hasRole('ADMIN')")`) for creating admins. Decide and document how the *first* admin gets created (seed data / one-time bootstrap).
3. 🟡 Add `springdoc-openapi` to AMS and browse your live API at `/swagger-ui.html`. Annotate two endpoints with descriptions and example values.
4. 🟡 Add filtering to `GET /api/complaints`: optional `status` and `category` query params, combinable. Keep the repository clean (look up JPA `Specification` or simply conditionals over derived queries).
5. 🔴 Design exercise (paper): you must add "complaint comments" (threaded discussion between resident and admin). Design the resource URLs, DTOs, and authorization matrix (who can post/read/delete). Then implement it.

### Checkpoint
- What is mass assignment and how do DTOs prevent it?
- Where does "email must be valid" belong vs "email must not already be registered"? Different layers — which and why?
- Why does offset pagination degrade on page 10,000?

---

## Module 6 — Security: authentication, authorization, and the OWASP mindset

### Concepts
1. **AuthN vs AuthZ:** authentication = who are you; authorization = what may you do. Different failures: 401 vs 403.
2. **Password storage:** only ever slow, salted, one-way hashes — BCrypt (used in AMS), scrypt, or Argon2. Never MD5/SHA-256 alone (too fast → brute-forceable), never reversible encryption, never plaintext.
3. **Sessions vs tokens:**
   - *Server-side sessions:* server stores state, client holds a cookie with a session id. Easy to revoke; needs sticky sessions or a shared session store to scale.
   - *JWT:* signed, self-contained token; any server with the secret can verify without a lookup. Scales beautifully; **cannot be revoked** before expiry without extra machinery (denylist, short expiry + refresh tokens).
4. **JWT anatomy:** `header.payload.signature`, base64-encoded. The payload is *readable by anyone* (paste one into jwt.io) — signing prevents tampering, not reading. Never put secrets in claims.
5. **Refresh-token pattern:** short-lived access token (5–15 min) + long-lived refresh token stored server-side (revocable). AMS uses a 24 h access token and no refresh token — meaning stolen tokens work for a day and logout is fake. Standard interview question.
6. **RBAC:** roles on users, checks at endpoints (`@PreAuthorize`). Next level: *ownership checks* — a resident may only see *their own* complaints; role alone doesn't express that.
7. **OWASP Top 10** — the canonical list of web vulnerabilities. Minimum literacy:
   - **Injection** (SQL injection: fixed by parameterized queries — which JPA uses — never string concatenation)
   - **Broken access control** (missing ownership checks, mass assignment — you found one in Module 5)
   - **Cryptographic failures** (plaintext secrets, weak hashing)
   - **Security misconfiguration** (default passwords, verbose errors, permissive CORS)
   - **SSRF, XSS, CSRF** — know what each is; XSS/CSRF are mostly frontend/cookie concerns, which is why token-in-header APIs disable CSRF protection (see AMS `SecurityConfig`).
8. **Secrets management:** never commit secrets. Environment variables at minimum; Vault/AWS Secrets Manager/parameter store in real deployments. **AMS commits a Gmail password, Razorpay keys, and the JWT secret in `application.properties` — treat this as the anti-example.** If those were ever pushed publicly, rotation (changing them) is the only fix; deleting the commit is not enough.
9. **CORS:** a *browser* protection controlling which web origins may call your API. It does not protect against curl/Postman — it is not an auth mechanism.
10. **Rate limiting & brute force:** login endpoints need attempt limits (by IP and by account). Token bucket is the classic algorithm; Redis is the classic store for it.

### In Project AMS
- `backend/.../auth/SecurityConfig.java` — filter chain, stateless sessions, CORS, BCrypt bean, route rules.
- `backend/.../auth/JwtAuthFilter.java` — reads `Authorization: Bearer`, validates, populates the security context. Read it line by line until every line makes sense.
- `backend/.../auth/JwtUtil.java` — token creation/parsing.
- `payment-service/.../security/` — a second copy of JWT verification: the payoff of stateless tokens across services (shared secret, no auth-server round-trip).
- `internal.service.secret` — service-to-service auth via shared secret header for `/api/users/internal/**`. Note that route is `permitAll` in `SecurityConfig` — verify for yourself where (or whether!) the secret is actually checked. If it isn't enforced, that's an unauthenticated internal API. Investigate and fix.

### Exercises
1. 🟢 Paste an AMS JWT into jwt.io. List every claim. Now explain why putting, say, a user's address in a JWT would be a bad idea.
2. 🟢 In psql, `SELECT email, password FROM users;` — observe BCrypt hashes. Register two users with the *same* password and observe the hashes differ. Explain why (salt).
3. 🟡 The ownership audit: go endpoint by endpoint through AMS controllers and build a table: endpoint / role required / ownership required / ownership actually enforced? Any row where the last two differ is a bug. (Check amenity booking cancellation especially.)
4. 🟡 Implement logout-that-works: add a Redis denylist — on logout, store the token's id/hash with TTL = remaining validity; check it in `JwtAuthFilter`. Measure the cost you just paid: JWTs are no longer verification-without-lookup. Discuss the trade in your journal.
5. 🔴 Implement the full refresh-token flow: 15-minute access tokens, 30-day refresh tokens persisted in a table (hashed), `/api/auth/refresh` endpoint, refresh-token rotation (each use issues a new one and invalidates the old).
6. 🔴 Add login rate limiting with Redis: max 5 failed attempts per email per 15 minutes → 429. Test it with a shell loop.
7. 🔴 Do the free labs for SQL injection and broken access control on **PortSwigger Web Security Academy** (portswigger.net/web-security) — the best free security training on the internet.

### Checkpoint
- Why can't the server "log out" a plain JWT?
- Salting: what attack does it defeat?
- A request has a valid token for RESIDENT Bob but fetches Alice's complaint by id and succeeds. Which OWASP category, and where's the fix?
- Why is CORS not a security boundary against attackers with curl?

---

## Module 7 — Errors, logging, and observability

### Concepts
1. **Centralized exception handling:** one place maps exception types → status codes + safe messages (`@RestControllerAdvice` in Spring). Services throw domain exceptions; controllers stay clean.
2. **Never leak internals:** stack traces, SQL, class names in error responses help attackers and confuse users. Generic 500 message outward; full detail into logs.
3. **Logging levels:** `ERROR` (broken, wake someone), `WARN` (suspicious, survivable), `INFO` (business events: "user registered", "payment completed"), `DEBUG` (developer detail). Log business events at INFO with identifiers (ids, not whole objects, never secrets/PII like passwords or full tokens).
4. **Structured logging:** logs as JSON key-value pairs (`userId=42 action=login`) so machines can search them. Aggregators: ELK stack (Elasticsearch-Logstash-Kibana), Grafana Loki, Datadog.
5. **Correlation ids:** one request touches gateway → core API → Kafka → notification service. A shared request id in logs (and an `X-Request-Id` header / MDC in Java) is the only way to trace it. Distributed tracing tools: OpenTelemetry, Jaeger, Zipkin.
6. **The three pillars of observability:** logs (what happened), metrics (numbers over time: request rate, error rate, latency p50/p95/p99), traces (one request's journey). Spring Boot Actuator + Micrometer + Prometheus + Grafana is the standard OSS stack.
7. **Health checks:** an endpoint (`/actuator/health`) that orchestrators (Docker, Kubernetes) poll to decide whether to route traffic or restart the container. AMS's docker-compose already health-checks Postgres and Redis; the Java services deserve the same.

### In Project AMS
- `backend/.../config/GlobalExceptionHandler.java` — the full mapping, including the deliberate generic 500 handler.
- `@Slf4j` + `log.info(...)` calls in every service — note they log *ids*, not entities.
- Gap: no correlation ids — a payment failure's trail through three services is currently unstitchable.

### Exercises
1. 🟢 Cause each handler in `GlobalExceptionHandler` to fire (validation, not-found, access-denied, bad-credentials, generic). Match each to the log line it produced.
2. 🟡 Add Spring Boot Actuator to core-api; expose `/actuator/health` and wire it into docker-compose as the health check for the `core-api` service.
3. 🟡 Add a correlation-id filter: read `X-Request-Id` (or generate a UUID), put it in the SLF4J MDC so every log line carries it, return it in the response header. Then propagate it: gateway → services (header) and producer → Kafka event (field) → notification-service logs.
4. 🔴 Stand up Prometheus + Grafana (two more docker-compose services), scrape Actuator's `/actuator/prometheus`, and build a dashboard: requests/sec, error rate, p95 latency per endpoint. Then load-test with `hey` or `ab` and watch it move.

### Checkpoint
- Why does the generic handler return "An unexpected error occurred" instead of `ex.getMessage()`?
- What's the difference between a metric and a log?
- You have a bug report: "payment succeeded but no email arrived, around 3 pm." Describe, step by step, how you'd investigate with and without correlation ids.

---

## Module 8 — Caching

### Concepts
1. **Why cache:** memory is ~100–1000× faster than a DB query over the network. Cache data that is read often and changed rarely.
2. **Cache-aside pattern** (what `@Cacheable` implements): on read — check cache; hit → return; miss → query DB, store in cache, return. On write — update DB, then **invalidate** the cache entry.
3. **Invalidation strategies:** explicit eviction (`@CacheEvict`), TTL (time-to-live — entries expire on their own; the safety net for missed evictions), and event-driven eviction (a message tells other services to evict — AMS does this!).
4. **What can go wrong:**
   - *Stale reads* — evicted too late or not at all.
   - *Stampede* — a hot key expires and 1,000 requests hit the DB simultaneously (fixes: locks, early refresh, jittered TTLs).
   - *Caching nulls* — negative lookups flooding the cache (AMS sets `cache-null-values=false`).
   - *Over-eviction* — `allEntries = true` nukes a whole cache region; simple and correct, but hurts hit rate. Trade-off to understand, not a sin.
5. **Redis beyond caching:** it's a data-structure server — strings, hashes, lists, sets, sorted sets (leaderboards), TTLs, pub/sub, streams. Rate limiters, distributed locks, session stores, and job queues are all built on it.
6. **Where else caching lives:** HTTP caching (`Cache-Control`, `ETag`) at the client/CDN, application-level (Redis), DB-level (buffer pool). Know all three exist; you control the middle one.

### In Project AMS
- `backend/.../amenity/AmenityService.java` — `@Cacheable` for the amenity list and per-day slots; `@CacheEvict` on writes. The slot cache key `#amenityId + ':' + #date` is a nice composite-key example.
- `backend/.../user/UserService.java` — caching user-by-email (hot: the JWT filter path can hit it every request).
- `payment-service/.../billing/BillService.java` — `allEntries = true` eviction; TTL 1 h in properties.
- `backend/.../kafka/CacheInvalidationListener.java` — **cross-service cache invalidation via Kafka events.** Rare to see in a learning project; understand it thoroughly: payment-service writes → publishes event → core-api evicts its own Redis entries.

### Exercises
1. 🟢 With Redis logging on (already DEBUG in properties), call `GET /api/amenities` twice. Confirm the second call produces no SQL. Then `docker exec -it redis-cache redis-cli -a redis_pass_123`, run `KEYS *` and `TTL <a key>` to see your cache entries and their countdown.
2. 🟢 Create an amenity (admin), then confirm the list cache was evicted (next GET runs SQL again).
3. 🟡 Break it on purpose: comment out one `@CacheEvict`, update data, and observe the API serving stale data until TTL expires. Restore it. Nothing teaches invalidation like being lied to by your own API.
4. 🟡 Cache the announcements list, with proper eviction on create. Decide the TTL and justify it in a comment.
5. 🔴 Implement a rate limiter as a servlet filter using Redis `INCR` + `EXPIRE` (fixed window): 100 requests/minute per user id → 429 with a `Retry-After` header. Then read about sliding-window and token-bucket and write down why fixed-window bursts at window edges.
6. 🔴 Design question (journal): your amenity-slots cache key includes the date. A booking is created for 2026-07-15. `@CacheEvict(value = "amenity_slots", allEntries = true)` clears *every* date. Design a targeted eviction. What information does the eviction site need, and where does it come from?

### Checkpoint
- Recite cache-aside from memory, both read and write paths.
- Why is TTL still needed when you have explicit eviction?
- What's a cache stampede and one fix?

---

## Module 9 — Asynchronous messaging and event-driven architecture

### Concepts
1. **Sync vs async:** a synchronous call (HTTP) makes the caller *wait* and couples uptime (if the email server is down, complaint creation fails?!). Async messaging decouples: publish an event, respond immediately, let consumers process on their own schedule.
2. **Message broker:** durable middleman. **Kafka** (a distributed *log*: events are appended, retained, re-readable; consumers track their own position/offset) vs **RabbitMQ** (a *queue*: messages delivered and gone). Kafka fits event streams and multiple independent readers; RabbitMQ fits task queues and routing.
3. **Kafka vocabulary:** *topic* (named stream, e.g. `ams.events`), *partition* (parallelism unit; ordering guaranteed only within a partition, by key), *producer*, *consumer*, *consumer group* (within a group, partitions are split among members = scaling; *different* groups each get every message = fan-out), *offset* (a group's bookmark).
4. **Events vs commands:** an event states a fact in past tense ("PaymentCompleted") and doesn't care who listens; a command orders a specific thing ("SendEmail"). Event-driven systems favor events — new consumers appear without touching producers.
5. **Delivery guarantees:** at-most-once (may lose), at-least-once (may duplicate — the practical default), exactly-once (expensive, rarely truly needed). Consequence: **consumers must be idempotent** — processing the same event twice must be harmless (dedupe by event id, or make the operation naturally idempotent).
6. **The dual-write problem:** service saves to DB *and* publishes to Kafka — if it crashes between the two, they disagree. Production fix: the **transactional outbox pattern** (write the event into an `outbox` table in the same DB transaction; a relay publishes from the table). Know the name and the shape.
7. **Failure handling for consumers:** retries with backoff, then a **dead-letter queue/topic** for poison messages, plus alerting.

### In Project AMS
- Producers: `backend/.../kafka/AnnouncementEventProducer.java`, `payment-service/.../kafka/PaymentEventProducer.java` — note `kafkaTemplate.send(TOPIC, key, event)`: the event type is the partition key.
- Consumers, two *different* group ids on the *same* topic — textbook fan-out:
  - `notification-service/.../kafka/NotificationListener.java` (`groupId = "notification-service"`) → emails
  - `backend/.../kafka/CacheInvalidationListener.java` (`groupId = "cache-invalidation-group"`) → Redis eviction
- Trace the full flow: admin posts announcement → 200 returns immediately → event lands in `ams.events` → notification-service picks it up → email. The user never waited for SMTP.

### Exercises
1. 🟢 Console-consume the live topic while clicking through the app: `docker exec -it <kafka-container> kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic ams.events --from-beginning`. Watch your own events as JSON.
2. 🟢 Stop notification-service, create an announcement (still succeeds — that's the decoupling), then start it and watch it catch up on the backlog. Explain what stored the message meanwhile and what "offset" had to do with the catch-up.
3. 🟡 Add a third consumer without touching any producer: an `AuditListener` (own groupId) in core-api that writes every event into an `audit_log` table (event type, payload JSON, timestamp).
4. 🟡 Duplicate-delivery drill: make `NotificationListener` throw an exception *after* "sending" (logging) the email, so the message is redelivered. Observe the double-send. Then implement idempotency: a `processed_events` store keyed by event id, checked before acting. (You'll need to add an event id to the event classes — good API-evolution practice.)
5. 🔴 Implement retry + dead letter: configure the listener so 3 failed attempts route the message to `ams.events.dlt`, and log/alert on DLT arrivals. (Spring Kafka: `DefaultErrorHandler` + `DeadLetterPublishingRecoverer`.)
6. 🔴 The dual-write hunt: find the exact lines in `BillService`/`PaymentService` where the DB save and the Kafka publish happen, and construct the crash scenario where they diverge. Then implement a minimal outbox: `outbox` table written in the same `@Transactional` method, plus a `@Scheduled` publisher that sends and marks rows. Compare before/after in your journal.

### Checkpoint
- Two consumer groups vs two consumers in one group — what's the difference in who gets what?
- Why must consumers be idempotent under at-least-once delivery?
- State the dual-write problem and the outbox fix in four sentences.

---

## Module 10 — Microservices, gateways, and distributed systems

### Concepts
1. **Monolith vs microservices — the honest version:** a well-structured monolith (like AMS's `backend` module alone) is the *right default* for small teams. Microservices buy independent deployment/scaling/failure at the cost of network calls, distributed data, and operational load. "Start monolith, extract services when pain is concrete" is mainstream advice.
2. **Service boundaries** follow business capabilities (payments, notifications), not technical layers. Each service owns its data — **database-per-service** — no reaching into another service's tables.
3. **API gateway:** single entry point handling routing, CORS, and often auth, rate limiting, and TLS. Clients know one address.
4. **Inter-service communication:** sync (REST/gRPC — simple, couples availability) vs async (events — resilient, eventually consistent). Real systems mix both; prefer async for anything that isn't "I need the answer to respond".
5. **Data across services:** no joins across databases. Options: API composition (call and combine — AMS's `CoreApiClient`), event-carried state (keep a local copy updated by events), or CQRS-style read models. Consequence: **eventual consistency** — data agrees *eventually*, and your design must tolerate the gap.
6. **Resilience patterns:** timeouts (always set one), retries with exponential backoff + jitter (only for idempotent calls!), **circuit breaker** (after N failures, fail fast instead of hammering a dying dependency; Resilience4j in Java), bulkheads, graceful degradation.
7. **Distributed transactions:** two-phase commit is mostly avoided; the **saga pattern** replaces it — a sequence of local transactions coordinated by events, with *compensating actions* for rollback (cancel payment → issue refund).
8. **CAP theorem** (interview staple): under a network partition, choose consistency or availability. Understand it as a trade-off lens, not a checkbox.
9. **Service discovery & orchestration awareness:** in production, services find each other via DNS/discovery (Kubernetes services, Consul, Eureka), get scheduled/restarted by an orchestrator (Kubernetes), and scale by replica count. Compose is the local-dev miniature of this.

### In Project AMS
- `gateway/src/main/resources/application.yml` — path-based routing; note the payment routes are declared *before* the `/api/**` catch-all. Order matters.
- `payment-service/.../config/CoreApiClient.java` — synchronous inter-service call with the internal secret. Ask: what happens to bill generation if core-api is down at 1 a.m.? (Follow the code and find out.)
- `docker-compose.yml` — the whole topology: two databases in one Postgres, `depends_on` with health conditions, env-var config, service names as hostnames.
- Failure worth noticing: notification-service has no database. Where do "sent notifications" live? Nowhere — is that acceptable? Design question below.

### Exercises
1. 🟢 Map every arrow: draw the full system yourself (don't copy) — every service, every sync call, every async flow, every datastore. Annotate each arrow sync/async.
2. 🟢 Kill payment-service (`docker compose stop payment-service`). Which user actions break? Which keep working? Verify by clicking, and explain why the blast radius is what it is.
3. 🟡 Add a timeout to `CoreApiClient` (it likely has none — check). Then simulate a slow core-api (add a `Thread.sleep` in a dev-only endpoint) and confirm payment-service fails fast instead of hanging.
4. 🟡 Add a circuit breaker (Resilience4j `@CircuitBreaker`) around the `CoreApiClient` call with a fallback. Trip it by stopping core-api and watch the state transitions in logs (CLOSED → OPEN → HALF_OPEN).
5. 🔴 Extract a service: pull *announcements* out of core-api into a new `announcement-service` with its own DB (add it to `init-databases.sql`), its own JWT verification, gateway route, and Kafka producer. Everything you've learned in one exercise.
6. 🔴 Saga on paper: design "resident books a *paid* amenity slot": reserve slot (core-api) → create payment order (payment-service) → confirm slot on `PaymentCompleted` / release slot on `PaymentFailed` or timeout. Draw the happy path and *every* failure path with its compensating action. Which steps must be idempotent, and why?

### Checkpoint
- Give two concrete costs and two concrete benefits of AMS being split into services rather than one app.
- Why must retries be paired with idempotency?
- What does a circuit breaker do that a timeout alone doesn't?
- Explain eventual consistency with the announcement-email flow.

---

## Module 11 — Testing

### Concepts
1. **The pyramid:** many fast **unit tests** (one class, dependencies mocked) → fewer **integration tests** (real DB/broker, real wiring) → few **end-to-end tests** (whole system over HTTP). Cost and flakiness rise as you go up.
2. **Unit testing services:** mock the repository (Mockito: `@Mock`, `when(...).thenReturn(...)`, `verify(...)`), construct the service, assert behavior — including the *unhappy paths* (not found, forbidden, duplicate).
3. **Integration testing with real infrastructure:** **Testcontainers** spins up throwaway Postgres/Redis/Kafka in Docker per test run — tests against the real thing, not an in-memory imitation (H2 lies to you about Postgres behavior).
4. **Web-layer tests:** `MockMvc`/`@WebMvcTest` — assert status codes, JSON shape, validation errors, and security rules (`@WithMockUser`) without a running server.
5. **What to test first** (highest value): business rules with branches, authorization/ownership rules, validation boundaries, and every bug you ever fix (regression test *before* the fix — watch it fail, then pass).
6. **Test structure:** Arrange-Act-Assert; one behavior per test; names that state the rule (`updateStatus_throwsNotFound_whenComplaintMissing`).
7. **CI:** tests run on every push (GitHub Actions). A test that only runs on your laptop protects nothing.

### In Project AMS
- `backend/src/test/java/.../complaint/ComplaintServiceTest.java` and `announcement/AnnouncementServiceTest.java` — read them as templates.
- Coverage is thin: no controller tests, no security tests, no integration tests, most services untested. That's your playground.

### Exercises
1. 🟢 Run the suite: `mvn test` in `backend/`. Read every test in `ComplaintServiceTest` and label its Arrange/Act/Assert lines.
2. 🟢 Write `VisitorServiceTest` by imitation: happy path + not-found path + (if the service has a rule like "only pending visitors can be approved") the rule's violation path.
3. 🟡 Web-layer: with `@WebMvcTest(ComplaintController.class)`, assert that POST with an empty title → 400 with the field error; that a RESIDENT calling `GET /api/complaints` → 403; that an ADMIN → 200. (You'll learn to import the security config into the slice — that struggle is the lesson.)
4. 🟡 Regression-test the mass-assignment bug from Module 5: a test that registers with `"role": "ADMIN"` and asserts the created user is RESIDENT. Write it against the *unfixed* code first and watch it fail.
5. 🔴 Testcontainers integration test: real Postgres, full Spring context, hit `/api/auth/register` then `/api/complaints` over `TestRestTemplate`, assert rows landed in the DB. Then add Kafka Testcontainer and assert an announcement really produces a consumable event.
6. 🔴 Set up GitHub Actions: on push, build all four services and run all tests; fail the build on any red test. Add a status badge to the README.

### Checkpoint
- Why mock the repository in a service test but use a real DB in an integration test? What does each level catch that the other can't?
- Why is H2-instead-of-Postgres a false sense of security? Name one behavioral difference.
- What's the first test you write when a bug is reported?

---

## Module 12 — Configuration, Docker, and deployment

### Concepts
1. **Config outside code** (the "12-factor" principle): same artifact runs in dev/staging/prod; only environment changes. Spring: `application.properties` defaults, overridden by env vars (`SPRING_DATASOURCE_URL` overrides `spring.datasource.url` — relaxed binding), or profiles (`application-prod.properties` + `SPRING_PROFILES_ACTIVE=prod`).
2. **Secrets are config with rules:** never in git; env vars / `.env` (git-ignored) locally, secret managers in prod; rotate anything ever leaked.
3. **Docker:** an image is a packaged filesystem + start command; a container is a running instance. Dockerfile stages: base image → copy build → run. **Multi-stage builds** keep images small (build with Maven+JDK image, run on slim JRE image).
4. **docker-compose:** declares the whole topology — services, networks (service names are DNS hostnames), volumes (data that survives container restarts), `depends_on` + health checks (start order ≠ readiness; health conditions fix that).
5. **The deployment ladder** (awareness): compose on a VM → managed containers (ECS/Cloud Run) → Kubernetes (declarative desired state, self-healing, scaling). Also know: reverse proxy (nginx), load balancers, blue-green & rolling deploys, and that databases in prod are usually *managed services* (RDS etc.), not containers.
6. **CI/CD:** pipeline = build → test → build image → push registry → deploy. Deploys should be boring, frequent, and reversible.

### In Project AMS
- `docker-compose.yml` — study every line; you now know what every service and env var is for. Note `JWT_SECRET: ${JWT_SECRET}` reads from your shell/`.env` — the *correct* pattern, undermined by the same secret also being hardcoded in `application.properties`.
- Each service's `Dockerfile` — check whether they're multi-stage; if not, that's an exercise.
- Postgres volume `postgres-data` — delete the container and your data survives; delete the volume and it doesn't. Try it (locally!).

### Exercises
1. 🟢 Bring the whole system up (`docker compose up -d`), then: `docker compose ps`, `docker compose logs -f core-api`, `docker stats`. Learn these three commands cold.
2. 🟢 Prove config override: change `SERVER_PORT` for core-api via compose env and confirm the app moved ports without a rebuild.
3. 🟡 Secret hygiene sweep: move every secret in the repo (mail password, Razorpay keys, JWT secret, Redis password, internal secret) into a git-ignored `.env` consumed by compose; replace values in `application.properties` with `${ENV_VAR:dev-default}` placeholders. Add `.env.example` with dummy values. Then — because the originals were committed — rotate them all.
4. 🟡 Convert one Dockerfile to a multi-stage build (Maven build stage → `eclipse-temurin:*-jre` run stage). Compare image sizes with `docker images`.
5. 🔴 Add profiles: `application-docker.properties` vs local dev, activated via `SPRING_PROFILES_ACTIVE`, and remove all duplicated env vars from compose that the profile now covers.
6. 🔴 Deploy AMS to a free-tier cloud VM (or Railway/Render): compose up remotely, nginx in front of the gateway, HTTPS via Let's Encrypt. Document every step you fumbled — that document *is* the learning.

### Checkpoint
- Why must the same image run in every environment?
- What's the difference between `depends_on` and `depends_on: condition: service_healthy` — and what failure does the second prevent?
- Where do secrets live at each rung of the deployment ladder?

---

## Module 13 — Performance and scalability

### Concepts
1. **Measure before optimizing.** Latency percentiles (p50/p95/p99 — averages hide pain), throughput (req/s), error rate. Load-test with `hey`, `k6`, or JMeter.
2. **The usual suspects, in order of likelihood:** missing index → N+1 queries → fetching unbounded result sets (no pagination) → chatty synchronous service calls → no caching → undersized connection pool.
3. **Connection pooling:** opening a DB connection is expensive; pools (HikariCP in Spring) keep warm connections. Pool exhausted = requests queue = latency cliff. Know the default size (10) and that it must be tuned with DB `max_connections` in mind.
4. **Horizontal vs vertical scaling:** bigger machine vs more machines. Stateless services scale horizontally trivially (this is why the JWT/stateless choices matter); databases don't — hence read replicas, sharding (last resort), and caching in front.
5. **Async offloading:** anything slow and not needed for the response (emails, reports, image processing) goes to a queue/topic — you built this muscle in Module 9.
6. **Big-O for backends:** mostly about queries and loops-over-queries. A loop that calls the DB per iteration is the crime scene 80% of the time.

### In Project AMS — a ready-made hit list
- `GET /api/complaints` returns *all* complaints, unpaginated, with an N+1 on residents (Modules 4–5 exercises fix both).
- `complaints.resident_id`, `bills.resident_id` etc. — check which foreign keys actually have indexes (`\di` in psql). Postgres does *not* auto-index FK columns.
- `BillService` monthly generation: does it insert bills one by one in a loop? Check, and consider batching.
- User-by-email runs on *every authenticated request* (JWT filter) — that's why `UserService` caches it. Measure the difference: disable the cache and load-test.

### Exercises
1. 🟢 Load-test one endpoint: `hey -n 2000 -c 50 -H "Authorization: Bearer <token>" http://localhost:8080/api/amenities`. Record p50/p95/p99. Repeat with Redis stopped. Numbers into the journal.
2. 🟡 Seed 100k complaints (write a quick SQL `generate_series` insert), then hit `GET /api/complaints` — enjoy the pain, then apply pagination + the JOIN FETCH fix + an index, re-measure after each change *separately* so you know what each bought you.
3. 🟡 Set Hikari pool size to 2 (`spring.datasource.hikari.maximum-pool-size=2`), load-test with concurrency 50, and observe the queue/timeouts. Restore and document the symptom pattern — you'll recognize it in production someday.
4. 🔴 Run two instances of core-api behind the gateway (compose `deploy.replicas` or duplicate service entries on different ports; add a gateway load-balanced route). Prove statelessness: log in via one instance, use the token via the other.

### Checkpoint
- Why p95 over average?
- Your API got slow after a data-growth milestone. Name the first three things you check, in order.
- Why do stateless services scale horizontally but databases resist?

---

## Module 14 — Professional habits and advanced patterns

### Concepts & habits
1. **Git discipline:** small commits with messages that say *why*; branches per feature; PRs reviewed before merge — even solo (review your own diff; you'll catch plenty).
2. **Code review checklist for backend PRs:** authorization on every new endpoint? input validated? N+1? transaction boundaries right? errors mapped? secrets? tests for the unhappy paths? logs at the right level?
3. **Idempotency as a design habit** — retries exist everywhere (clients, proxies, Kafka); design handlers so twice = once.
4. **Concurrency literacy:** race conditions (check-then-act like AMS's slot booking — two residents can pass the "is it free?" check simultaneously; DB unique constraints or `SELECT FOR UPDATE` fix it), optimistic vs pessimistic locking, and why "it works on my machine with one user" proves nothing.
5. **Patterns worth knowing by name** (so you recognize them and can study on demand): transactional outbox, saga, CQRS, event sourcing, circuit breaker, bulkhead, strangler fig (incremental migration), feature flags, webhooks + signature verification (how Razorpay/Stripe callbacks are secured).
6. **Read production code:** you learn taste from good codebases. Suggestions: `spring-projects/spring-petclinic` (canonical small Spring app), any popular open-source backend in your language.
7. **Write things down:** ADRs (architecture decision records) — one page: context, decision, consequences. Start doing this for your own projects now.

### Capstone projects (pick one, build it fully)
Each of these exercises *every* module. Build with the AMS stack or any language you like; apply everything: layered design, migrations, auth with refresh tokens, ownership checks, pagination, caching, events, tests, CI, Docker, docs.

**A. Clinic appointment system.** Patients, doctors, schedules, appointment booking (the race condition is the boss fight: two patients, one slot — solve it with a DB constraint and prove it with a concurrent test), reminders via events/email, admin reporting, payment for consultations.

**B. Food-delivery lite.** Restaurants, menus, carts, orders with a state machine (PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED, with legal-transition enforcement), order events driving notifications, delivery-agent assignment, idempotent payment webhook endpoint.

**C. Multi-tenant SaaS helpdesk.** Organizations sign up; users belong to orgs; *every* query must be tenant-scoped (a missed scope = data leak across companies — write the test that proves isolation), tickets with comments and SLAs (scheduled jobs), per-tenant rate limits, audit log via events.

For your capstone: write the API design doc first (Module 5 style), then the schema with migrations, then build feature-by-feature with tests. Deploy it. Put the repo + a README with architecture diagram on GitHub — this *is* your portfolio.

---

## Resources

**Books (in reading order):**
1. *Designing Data-Intensive Applications* — Martin Kleppmann. THE backend book. Read after Module 9; reread yearly.
2. *Release It!* (2nd ed.) — Michael Nygard. Resilience patterns, production war stories.
3. *Database Internals* — Alex Petrov (later, when curious what's under Postgres).
4. *Clean Code* / *A Philosophy of Software Design* (Ousterhout — arguably better) — code-level taste.

**Free online:**
- pgexercises.com, sqlbolt.com, use-the-index-luke.com — SQL & indexing
- PortSwigger Web Security Academy — security labs
- jwt.io — token inspection
- Stripe & GitHub API docs — API design taste
- roadmap.sh/backend — checklist-style map (use as inventory, not curriculum)
- Kafka: the free "Kafka 101" course on Confluent Developer
- 12factor.net — short, canonical, config/deploy principles
- github.com/donnemartin/system-design-primer — interview prep for Modules 10/13 topics

**Habits that compound:**
- Rebuild things at small scale: a rate limiter, a job queue, a URL shortener with caching.
- After every bug you fix (anywhere), write one sentence: root cause, and the test that would have caught it.
- Explain concepts out loud (rubber duck, blog posts, or notes). If you can't explain the outbox pattern simply, you don't own it yet.

---

*Generated 2026-07-03, grounded in the Project AMS codebase. Revisit modules 6, 9, and 10 after your first few months of building — they read differently once you've been burned.*
