# Docker Setup

This project runs with three containers:

- `db` (PostgreSQL)
- `services` (Node.js + Express API + Prisma)
- `views` (React app built and served by Nginx)

## Run

1) Update backend env in `services/.env` (including `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`).

2) Update frontend env in `views/.env`.

3) From the project root, run:

```bash
docker compose up --build
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- Postgres: `localhost:5432`

## Stop

```bash
docker compose down
```

To remove DB data volume too:

```bash
docker compose down -v
```

## Notes

- Backend runs `prisma migrate deploy` on container start.
- Backend + DB use values from `services/.env`.
- Frontend build reads values from `views/.env`.
- Compose sets backend `DATABASE_URL` at container start to use Docker DB host `db`.
