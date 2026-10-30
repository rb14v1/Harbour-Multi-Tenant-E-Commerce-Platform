from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from users.models import User
from vendors.models import Tenant, TenantUser


class TenantMiddlewareTests(TestCase):
    def _make_tenant(self, name, owner):
        return Tenant.objects.create(
            name=name,
            domain=f"{name.lower()}.example.com",
            subdomain=name.lower(),
            contact_email=f"{name.lower()}@example.com",
            contact_phone="0000000000",
            address="1 Example St",
            owner=owner,
        )

    def test_tenant_id_claim_without_membership_is_rejected(self):
        owner = User.objects.create_user(email="owner@example.com", password="pw")
        user = User.objects.create_user(email="u1@example.com", password="pw")
        own_tenant = self._make_tenant("OwnCo", owner)
        other_tenant = self._make_tenant("OtherCo", owner)
        TenantUser.objects.create(user=user, tenant=own_tenant, role=TenantUser.Role.STAFF)

        token = AccessToken.for_user(user)
        token["tenant_id"] = other_tenant.id  # forged/stale claim: user has no membership here

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/products/")

        self.assertEqual(response.status_code, 403)

    def test_tenant_id_claim_with_membership_is_accepted(self):
        owner = User.objects.create_user(email="owner2@example.com", password="pw")
        user = User.objects.create_user(email="u2@example.com", password="pw")
        tenant = self._make_tenant("MemberCo", owner)
        TenantUser.objects.create(user=user, tenant=tenant, role=TenantUser.Role.STAFF)

        token = AccessToken.for_user(user)
        token["tenant_id"] = tenant.id

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = client.get("/api/products/")

        self.assertNotEqual(response.status_code, 403)
