# Reflex: The Readiness Sprint

Reflex is a delivery management system for retailers, dispatchers, and riders.

## Project areas

- `database/` contains the MySQL schema and sample data.
- `docs/ERD.md` contains the entity relationship diagram.
- `docs/database-design.md` contains the field reference, design decisions, and API contract.
- `server/` contains the Node.js/Express API that connects the frontend to MySQL.
- `pages/` contains the HTML page areas for retailer, dispatcher, and rider workflows.

## Database setup

Run `database/schema.sql` first, followed by `database/seed.sql`, in
MySQL Workbench (or the `mysql` CLI).

**Important:** MySQL/MariaDB's default `root` account is often
restricted to local-socket logins only. The API connects over TCP, so
using `root` directly in `.env` will fail with `Access denied for user
'root'`. Create a dedicated application user first:

```sql
CREATE USER 'reflex_app'@'127.0.0.1' IDENTIFIED BY 'your-password-here';
GRANT ALL PRIVILEGES ON reflex_db.* TO 'reflex_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Then use `reflex_app` (not `root`) as `DB_USER` in `server/.env`.

## API setup

```powershell
cd server
copy .env.example .env
npm install
npm start
```

Set `DB_USER` and `DB_PASSWORD` in `.env` to match the `reflex_app` user
created above. The API health check is available at
`http://localhost:3000/api/health` — it should return
`{"status":"ok","database":"connected"}` once the database is reachable.

Never commit `server/.env`; it contains local database configuration.

## Testing

See `docs/TESTING_EVIDENCE.md` for a full record of the end-to-end
workflow test (retailer request → dispatcher assignment → rider status
update → confirmation) and edge-case tests (duplicate assignment,
invalid status transitions), all run against a live database and API.

## Demo

See `docs/DEMO_SCRIPT.md` for the walkthrough used in the live
presentation.

This project currently runs locally (see setup instructions above) and
has been fully tested end-to-end against a real database and API — see
`docs/TESTING_EVIDENCE.md` for the complete test log. A live public
deployment was not completed in time for this submission; the fastest
path identified was a free-tier MySQL host (Aiven) paired with a free
Node host (Render), which is planned as the next step rather than a
blocker to demonstrating the working system.
