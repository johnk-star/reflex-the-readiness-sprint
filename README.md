# Reflex: The Readiness Sprint

Reflex is a delivery management system for retailers, dispatchers, and riders.

## Project areas

- `database/` contains the MySQL schema and sample data.
- `docs/ERD.md` contains the entity relationship diagram.
- `docs/database-design.md` contains the field reference, design decisions, and API contract.
- `server/` contains the Node.js/Express API that connects the frontend to MySQL.
- `pages/` contains the HTML page areas for retailer, dispatcher, and rider workflows.

## Database setup

Run `database/schema.sql` first, followed by `database/seed.sql`, in MySQL Workbench.

## API setup

```powershell
cd server
copy .env.example .env
npm install
npm start
```

The API health check is available at `http://localhost:3000/api/health`.

Never commit `server/.env`; it contains local database configuration.
