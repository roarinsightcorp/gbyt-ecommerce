from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.catalog.models import ProductVariant


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    @property
    def subtotal(self):
        return sum(
            item.line_total
            for item in self.items.select_related("variant").all()
        )

    @property
    def item_count(self):
        return sum(
            item.quantity
            for item in self.items.all()
        )

    def __str__(self):
        return f"Cart - {self.user.email}"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "variant"],
                name="unique_cart_item_per_variant",
            ),
        ]
        indexes = [
            models.Index(fields=["cart", "created_at"]),
            models.Index(fields=["variant"]),
        ]

    @property
    def line_total(self):
        return self.variant.price * self.quantity

    def __str__(self):
        return f"{self.cart.user.email} - {self.variant.sku} x {self.quantity}"


class Wishlist(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Wishlist - {self.user.email}"


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name="items",
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        related_name="wishlist_items",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["wishlist", "variant"],
                name="unique_wishlist_item_per_variant",
            ),
        ]
        indexes = [
            models.Index(fields=["wishlist", "created_at"]),
            models.Index(fields=["variant"]),
        ]

    def __str__(self):
        return f"{self.wishlist.user.email} - {self.variant.sku}"