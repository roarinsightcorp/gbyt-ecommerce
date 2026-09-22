from pathlib import Path

# Root directory
root = Path("frontend/src")

# Directories to create
directories = [
    "app",
    "app/login",
    "app/register",
    "app/products",
    "app/cart",
    "app/checkout",
    "app/orders",
    "app/payment",
    "app/payment/callback",

    "components",
    "components/layout",
    "components/navigation",
    "components/products",
    "components/cart",
    "components/checkout",
    "components/ui",

    "lib",
    "lib/api",
    "lib/auth",
    "lib/utils",
    "lib/constants",

    "hooks",
    "types",
    "providers",
]

# Create directories
for directory in directories:
    path = root / directory
    path.mkdir(parents=True, exist_ok=True)

# Files to create
files = [
    "app/page.tsx",
]

for file in files:
    path = root / file
    path.parent.mkdir(parents=True, exist_ok=True)

    if not path.exists():
        path.write_text("", encoding="utf-8")

print("✅ Frontend structure created successfully!")
print(f"📁 Location: {root.resolve()}")