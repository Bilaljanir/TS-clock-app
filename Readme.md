### Prerequisites
- Docker installed on your system

### Running PostgreSQL

```bash
docker compose up -d
```

This will start PostgreSQL on `localhost:5432`.

### Verify the connection

```bash
psql -h localhost -U postgres -d clock_app
# Password: postgres
```

To stop the database:

```bash
docker compose down
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=clock_app
DB_PORT=5432
DB_HOST=localhost
```