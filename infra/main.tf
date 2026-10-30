# Serves components: backend, frontend
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  # Backend config supplied at init time via -backend-config flags (storage account/container/key
  # are resolved per app+environment by DEPLOY, not hardcoded here) — see lib/terraform-apply.ts.
  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}

# TLS 1.2 minimum is enforced through server parameters (Flexible Server has no
# ssl_minimal_tls_version_enforced argument): see the require_secure_transport and
# ssl_min_protocol_version (TLSv1.2) configuration resources below.
#trivy:ignore:AZU-0026
resource "azurerm_postgresql_flexible_server" "postgresql" {
  name                   = "psql-ecom-test-6"
  resource_group_name    = "ecom-test-6"
  location               = "uksouth"
  version                = "16"
  sku_name               = "B_Standard_B1ms"
  storage_mb             = 32768
  administrator_login    = "psqladmin"
  administrator_password = random_password.postgresql_admin.result
  public_network_access_enabled = false

  # Automated backups (rel.backup_configured): 35 days is the Azure maximum (>= 30-day requirement).
  # Point-in-time restore is available anywhere inside this window. Geo-redundant backup copies
  # backups to the paired region (uksouth -> ukwest), separate from the primary.
  # NOTE: geo_redundant_backup_enabled is ForceNew in azurerm — enabling it on an existing server
  # makes Terraform replace that server. Take a backup or migrate the data before applying.
  #
  # Restore procedure (test at least once before go-live):
  #   PITR (same region):
  #     az postgres flexible-server restore -g ecom-test-6 --name psql-ecom-test-6-restored \
  #       --source-server psql-ecom-test-6 --restore-time "<UTC ISO-8601 timestamp>"
  #   Geo-restore (to ukwest):
  #     az postgres flexible-server geo-restore -g ecom-test-6 --name psql-ecom-test-6-geo \
  #       --source-server psql-ecom-test-6 --location ukwest
  #   Then check the restored data, point the backend's DB host setting at the restored server
  #   (or swap names), and delete the old server once the restore is confirmed.
  backup_retention_days        = 35
  geo_redundant_backup_enabled = true

  # Azure assigns an availability zone on creation since none is declared here — a later apply
  # then sees that as drift and tries to reset it, which the provider rejects outright:
  # "zone can only be changed when exchanged with the zone specified in
  # high_availability.0.standby_availability_zone". Observed on prompt-lib-test-10, blocking every
  # apply after the first. Ignoring drift on the attribute this config never set an opinion on is
  # correct, not a workaround — the alternative is declaring an explicit zone, which would make a
  # dev-tier single-app server fail to provision at all if that zone has no capacity.
  lifecycle {
    ignore_changes = [zone]
  }
}

# Enforce encrypted connections with a minimum of TLS 1.2 (AZU-0026).
resource "azurerm_postgresql_flexible_server_configuration" "require_secure_transport" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_configuration" "ssl_min_protocol_version" {
  name      = "ssl_min_protocol_version"
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  value     = "TLSv1.2"
}

# Log checkpoints (AZU-0024).
resource "azurerm_postgresql_flexible_server_configuration" "log_checkpoints" {
  name      = "log_checkpoints"
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  value     = "on"
}

# Log connections (AZU-0019).
resource "azurerm_postgresql_flexible_server_configuration" "log_connections" {
  name      = "log_connections"
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  value     = "on"
}

resource "random_password" "postgresql_admin" {
  length  = 24
  special = true
}

# --- Secrets (sec.no_hardcoded_secrets) ---------------------------------------------------------
# Every backend secret lives in Key Vault. The backend Container App
# (e-com-har-backend-api) reads them through its managed identity, using Key Vault references
# for SECRET_KEY, JWT_SIGNING_KEY, DB_USER and DB_PASSWORD. backend/ecommerce/settings.py only
# reads environment variables, so no secret is ever in source control. The values are generated
# here, so applying this config replaces any value that was committed before.

variable "backend_identity_principal_id" {
  description = "Principal (object) ID of the e-com-har-backend-api managed identity, which gets read access to Key Vault secrets."
  type        = string
}

variable "key_vault_allowed_ip_rules" {
  description = "Public IPs/CIDRs allowed through the Key Vault firewall (e.g. the Terraform deployment runner's egress IP, which writes the secrets below)."
  type        = list(string)
  default     = []
}

variable "key_vault_allowed_subnet_ids" {
  description = "Subnet IDs (with the Microsoft.KeyVault service endpoint enabled) allowed through the Key Vault firewall, e.g. the Container Apps Environment subnet the backend runs in."
  type        = list(string)
  default     = []
}

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "kv" {
  name                       = "kv-e-com-har"
  resource_group_name        = "ecom-test-6"
  location                   = "uksouth"
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  enable_rbac_authorization  = true
  purge_protection_enabled   = true
  soft_delete_retention_days = 90

  # Block network access by default (AZU-0013). Only trusted Azure services and the
  # explicitly allowed IPs/subnets can reach the vault's data plane.
  network_acls {
    default_action             = "Deny"
    bypass                     = "AzureServices"
    ip_rules                   = var.key_vault_allowed_ip_rules
    virtual_network_subnet_ids = var.key_vault_allowed_subnet_ids
  }
}

# The identity running Terraform needs to write the secrets below.
resource "azurerm_role_assignment" "kv_deployer_secrets_officer" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# The backend's managed identity can only read secrets.
resource "azurerm_role_assignment" "kv_backend_secrets_user" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.backend_identity_principal_id
}

resource "random_password" "django_secret_key" {
  length  = 64
  special = true
}

resource "random_password" "jwt_signing_key" {
  length  = 64
  special = true
}

resource "azurerm_key_vault_secret" "django_secret_key" {
  name         = "django-secret-key"
  value        = random_password.django_secret_key.result
  key_vault_id = azurerm_key_vault.kv.id
  depends_on   = [azurerm_role_assignment.kv_deployer_secrets_officer]
}

resource "azurerm_key_vault_secret" "jwt_signing_key" {
  name         = "jwt-signing-key"
  value        = random_password.jwt_signing_key.result
  key_vault_id = azurerm_key_vault.kv.id
  depends_on   = [azurerm_role_assignment.kv_deployer_secrets_officer]
}

resource "azurerm_key_vault_secret" "db_user" {
  name         = "db-user"
  value        = azurerm_postgresql_flexible_server.postgresql.administrator_login
  key_vault_id = azurerm_key_vault.kv.id
  depends_on   = [azurerm_role_assignment.kv_deployer_secrets_officer]
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = random_password.postgresql_admin.result
  key_vault_id = azurerm_key_vault.kv.id
  depends_on   = [azurerm_role_assignment.kv_deployer_secrets_officer]
}

output "key_vault_uri" {
  description = "Key Vault URI used to build the backend's Key Vault secret references."
  value       = azurerm_key_vault.kv.vault_uri
}

data "azurerm_private_dns_zone" "postgresql_dns_zone" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.hub_resource_group
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgresql_dns_zone_link" {
  name                  = "link-ecom-test-6"
  resource_group_name   = var.hub_resource_group
  private_dns_zone_name = data.azurerm_private_dns_zone.postgresql_dns_zone.name
  virtual_network_id    = var.vnet_id
}

resource "azurerm_private_endpoint" "postgresql_pe" {
  name                = "pe-psql-ecom-test-6"
  resource_group_name = "ecom-test-6"
  location            = "uksouth"
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psql-privateserviceconnection"
    private_connection_resource_id = azurerm_postgresql_flexible_server.postgresql.id
    subresource_names              = ["postgresqlServer"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "psql-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.postgresql_dns_zone.id]
  }
}