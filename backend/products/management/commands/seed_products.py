from django.core.management.base import BaseCommand
from vendors.models import Tenant
from products.models import Product

ITEMS = [
    ("Wireless Headphones", "Electronics", "79.99", 40, "photo-1505740420928-5e560c06d30e"),
    ("Smart Watch", "Electronics", "129.00", 25, "photo-1523275335684-37898b6baf30"),
    ("Bluetooth Speaker", "Electronics", "49.50", 60, "photo-1608043152269-423dbba4e7e1"),
    ("Mechanical Keyboard", "Electronics", "89.00", 30, "photo-1587829741301-dc798b83add3"),
    ("Running Shoes", "Footwear", "95.00", 50, "photo-1542291026-7eec264c27ff"),
    ("Leather Boots", "Footwear", "140.00", 18, "photo-1608256246200-53e635b5b65f"),
    ("Cotton T-Shirt", "Clothing", "19.99", 120, "photo-1521572163474-6864f9cf17ab"),
    ("Denim Jacket", "Clothing", "65.00", 35, "photo-1551028719-00167b16eac5"),
    ("Backpack", "Accessories", "54.00", 45, "photo-1553062407-98eeb64c6a62"),
    ("Sunglasses", "Accessories", "34.99", 70, "photo-1572635196237-14b3f281503f"),
    ("Ceramic Mug", "Home", "12.50", 150, "photo-1514228742587-6b1558fcca3d"),
    ("Desk Lamp", "Home", "28.00", 4, "photo-1507473885765-e6ed057f782c"),
    ("Scented Candle", "Home", "16.00", 90, "photo-1603006905003-be475563bc59"),
    ("Yoga Mat", "Sports", "24.99", 55, "photo-1601925260368-ae2f83cf8b7f"),
    ("Water Bottle", "Sports", "18.00", 0, "photo-1602143407151-7111542de6e8"),
]


class Command(BaseCommand):
    help = "Seed sample products. Usage: seed_products [tenant_id]"

    def add_arguments(self, parser):
        parser.add_argument("tenant_id", nargs="?", type=int)

    def handle(self, *args, **o):
        tenants = Tenant.objects.filter(id=o["tenant_id"]) if o["tenant_id"] else Tenant.objects.all()
        created = 0
        for t in tenants:
            for i, (name, cat, price, stock, img) in enumerate(ITEMS, 1):
                _, new = Product.objects.get_or_create(
                    tenant=t, sku=f"T{t.id}-{i:03d}",
                    defaults=dict(name=name, category=cat, price=price, stock_quantity=stock,
                                  description=f"{name} from {t.name}.", created_by=t.owner,
                                  image_url=f"https://images.unsplash.com/{img}?w=600&q=70"))
                created += new
        self.stdout.write(self.style.SUCCESS(f"Created {created} products across {tenants.count()} store(s)"))
