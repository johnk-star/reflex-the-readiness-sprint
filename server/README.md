# Reflex API

## Setup

1. Install Node.js LTS and MySQL.
2. From this directory, install dependencies:

   ```powershell
   npm install
   ```

3. Copy `.env.example` to `.env` and set the MySQL password.
4. Run `database/schema.sql`, then `database/seed.sql` from the repository root in MySQL Workbench.
5. Start the API:

   ```powershell
   npm start
   ```

The health check is available at `http://localhost:3000/api/health`.

The API uses transactions and row locking when assigning deliveries. Browser code should call this API and must never contain MySQL credentials.