# Database restore runbook (rel.backup_configured)

Server: `psql-ecom-test-6` (resource group `ecom-test-6`, region `uksouth`), defined in `infra/main.tf`.

Backup posture (set in Terraform):
- `backup_retention_days = 35` (Azure maximum; requirement is at least 30 days).
- `geo_redundant_backup_enabled = true`, so backup copies are kept in the paired region `ukwest`, separate from the primary.
- Point-in-time restore (PITR) is available for any time inside the 35-day window.

Note: `geo_redundant_backup_enabled` is ForceNew in the azurerm provider. Enabling it on an existing server makes Terraform replace that server, so take a backup or migrate the data before applying.

## Restore procedures

### Point-in-time restore (same region)

```sh
az postgres flexible-server restore \
  -g ecom-test-6 \
  --name psql-ecom-test-6-restored \
  --source-server psql-ecom-test-6 \
  --restore-time "<UTC ISO-8601 timestamp>"
```

### Geo-restore (to ukwest)

```sh
az postgres flexible-server geo-restore \
  -g ecom-test-6 \
  --name psql-ecom-test-6-geo \
  --source-server psql-ecom-test-6 \
  --location ukwest
```

### After either restore

1. Check the restored data (row counts and key tables against the source).
2. Point the backend's DB host setting at the restored server, or swap server names.
3. Delete the old server only after the restore is confirmed.

## Restore test (required before go-live)

Run a PITR restore to a new server name at least once, then:

- [ ] Record the date, the restore timestamp used, and the operator.
- [ ] Confirm the restored server reaches `Ready` state.
- [ ] Connect over TLS to the restored server and confirm the expected data is present.
- [ ] Delete the test server after the check.
- [ ] Record the outcome here: ______________________
