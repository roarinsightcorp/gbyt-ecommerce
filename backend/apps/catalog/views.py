from django.db.models import (
    Prefetch,
    Q,
)

from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
)

from rest_framework.permissions import AllowAny

from .models import (
    Category,
    Product,
    ProductMedia,
    ProductOption,
    ProductVariant,
)

from .pagination import CatalogPagination

from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class CategoryListView(ListAPIView):
    queryset = (
        Category.objects
        .filter(
            is_active=True,
        )
        .select_related(
            "parent",
        )
    )

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = CatalogPagination


class CategoryDetailView(RetrieveAPIView):
    queryset = (
        Category.objects
        .filter(
            is_active=True,
        )
        .select_related(
            "parent",
        )
    )

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    lookup_field = "slug"


class ProductListView(ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = CatalogPagination

    def get_queryset(self):
        primary_images = ProductMedia.objects.filter(
            media_type=ProductMedia.MediaType.IMAGE,
            is_primary=True,
            is_active=True,
        ).order_by(
            "sort_order",
            "-created_at",
        )

        fallback_images = ProductMedia.objects.filter(
            media_type=ProductMedia.MediaType.IMAGE,
            is_active=True,
        ).order_by(
            "sort_order",
            "-created_at",
        )

        queryset = (
            Product.objects
            .filter(
                is_active=True,
                status=Product.Status.ACTIVE,
            )
            .select_related(
                "category",
                "category__parent",
            )
            .prefetch_related(
                Prefetch(
                    "media",
                    queryset=primary_images,
                    to_attr="prefetched_primary_images",
                ),
                Prefetch(
                    "media",
                    queryset=fallback_images,
                    to_attr="prefetched_images",
                ),
            )
        )

        category = self.request.query_params.get(
            "category"
        )

        product_type = self.request.query_params.get(
            "product_type"
        )

        featured = self.request.query_params.get(
            "featured"
        )

        search = self.request.query_params.get(
            "search"
        )

        brand = self.request.query_params.get(
            "brand"
        )

        ordering = self.request.query_params.get(
            "ordering",
            "newest",
        )

        allowed_orderings = {
            "newest": "-created_at",
            "oldest": "created_at",
            "name": "name",
            "-name": "-name",
        }

        if ordering in allowed_orderings:
            queryset = queryset.order_by(
                allowed_orderings[ordering]
            )

        if category:
            queryset = queryset.filter(
                category__slug=category
            )

        if product_type:
            product_type = product_type.upper()

            valid_product_types = {
                value
                for value, _ in Product.ProductType.choices
            }

            if product_type in valid_product_types:
                queryset = queryset.filter(
                    product_type=product_type
                )

        if featured:
            if featured.lower() in {
                "true",
                "1",
                "yes",
            }:
                queryset = queryset.filter(
                    is_featured=True
                )

        if brand:
            queryset = queryset.filter(
                brand__iexact=brand
            )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(short_description__icontains=search)
                | Q(brand__icontains=search)
                | Q(
                    variants__sku__icontains=search
                )
                | Q(
                    variants__barcode__icontains=search
                )
                | Q(
                    variants__name__icontains=search
                )
            ).distinct()

        return queryset


class ProductDetailView(RetrieveAPIView):
    queryset = (
        Product.objects
        .filter(
            is_active=True,
            status=Product.Status.ACTIVE,
        )
        .select_related(
            "category",
            "category__parent",
        )
        .prefetch_related(
            Prefetch(
                "options",
                queryset=(
                    ProductOption.objects
                    .filter(
                        is_active=True,
                    )
                    .prefetch_related(
                        "values",
                    )
                    .order_by(
                        "sort_order",
                        "name",
                    )
                ),
            ),
            Prefetch(
                "variants",
                queryset=(
                    ProductVariant.objects
                    .filter(
                        is_active=True,
                    )
                    .prefetch_related(
                        "option_values__option",
                        "option_values__value",
                    )
                    .order_by(
                        "-is_default",
                        "name",
                    )
                ),
            ),
            "media",
        )
    )

    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]

    lookup_field = "slug"