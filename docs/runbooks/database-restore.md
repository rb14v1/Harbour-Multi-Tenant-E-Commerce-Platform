# Database Restore Runbook

## Backup configuration

The PostgreSQL server is defined in `infra/main.tf` (`azurerm_postgresql_flexible_server.postgresql`):

| Setting | Value | Purpose |
|---------|-------|---------|
| `backup_retention_days` | 35 | Automated backups kept for 35 days (minimum required: 30) |
| `geo_redundant_backup_enabled` | true | Backups replicated to the paired Azure region, separate from the primary |

Automated backups and point-in-time restore (PITR) are provided by Azure Database for PostgreSQL Flexible Server within the retention window. No separate backup job is needed.

Server: `psql-mul-tent-ecom`
Resource group: `mul-tent-ecom`

## Restore procedure

### Option A: Point-in-time restore (data corruption, accidental delete or update)

1. Pick the restore time (UTC, ISO 8601), just before the incident.
2. Restore to a new server. The original server is not overwritten.

   ```bash
   az postgres flexible-server restore \
     --resource-group mul-tent-ecom \
     --name psql-mul-tent-ecom-restored \
     --source-server psql-mul-tent-ecom \
     --restore-time "2026-11-12T10:00:00Z"
   ```

3. Verify the data on the restored server (row counts, the affected tables, recent orders).
4. Point the application at the restored server by updating `DB_HOST` (and `DB_USER`/`DB_PASSWORD` if they differ). Restart the app.
5. Once the restored server is confirmed, decide whether to keep it or migrate data back. Record the decision in the incident notes.

### Option B: Geo-restore (paired region outage or loss of the primary region)

1. Run `az postgres flexible-server geo-restore` from the paired region against the source server. Check the Azure CLI help for the flags for your CLI version.
2. Verify the data, then point `DB_HOST` at the restored server as in Option A.

### After any restore

- The restored server is not in Terraform state. Import it, or record it as an out-of-state resource.
- The restored server needs its own private endpoint in the subnet and a DNS record in the `privatelink.postgres.database.azure.com` zone in the hub resource group. Without these the app cannot connect.
- Check the `DB_*` values in the app configuration (see `backend/.env.example`).

## Restore drill (required before go-live)

A restore must be tested at least once before go-live. Run Option A against a non-production copy, then record the result here.

| Date | Performed by | Restore time used | Restored server | Result | Notes |
|------|--------------|-------------------|-----------------|--------|-------|
|      |              |                   |                 |        |       |
