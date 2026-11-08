from django.db import transaction
from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Category,
    Product,
    ProductMedia,
    ProductOption,
    ProductOptionValue,
    ProductRelationship,
    ProductVariant,
    VariantOptionValue,
)

from .pagination import CatalogPagination

from .serializers import (
    AdminProductDetailSerializer,
    AdminProductListSerializer,
    AdminProductOptionValueWriteSerializer,
    AdminProductOptionWriteSerializer,
    AdminProductRelationshipWriteSerializer,
    AdminProductVariantWriteSerializer,
    AdminProductWriteSerializer,
    AdminVariantOptionValueWriteSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductMediaSerializer,
    ProductMediaUploadSerializer,
)


# ============================================================
# PERMISSIONS
# ============================================================


class IsCatalogAdmin(BasePermission):
    """
    Allows access only to authenticated staff users who are
    explicitly marked as administrators.

    Admin is intentionally represented by:
        role = STAFF
        is_admin = True

    This keeps the application's STAFF/ADMIN distinction
    consistent with the existing authentication architecture.
    """

    message = "Administrator access is required."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            getattr(user, "role", None) == "STAFF"
            and getattr(user, "is_staff", False) is True
            and (
                getattr(user, "is_admin", False) is True
                or getattr(user, "is_superuser", False) is True
            )
        )


# ============================================================
# PUBLIC CATEGORY API
# ============================================================


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


class CategoryDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        category = get_object_or_404(
            Category.objects.select_related("parent"),
            slug=slug,
            is_active=True,
        )

        return Response(
            CategorySerializer(category).data
        )


# ============================================================
# PUBLIC PRODUCT API
# ============================================================


class ProductListView(ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = CatalogPagination

    def get_queryset(self):
        primary_images = (
            ProductMedia.objects
            .filter(
                media_type=ProductMedia.MediaType.IMAGE,
                is_primary=True,
                is_active=True,
            )
            .order_by(
                "sort_order",
                "-created_at",
            )
        )

        fallback_images = (
            ProductMedia.objects
            .filter(
                media_type=ProductMedia.MediaType.IMAGE,
                is_active=True,
            )
            .order_by(
                "sort_order",
                "-created_at",
            )
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

        category = self.request.query_params.get("category")
        product_type = self.request.query_params.get("product_type")
        featured = self.request.query_params.get("featured")
        search = self.request.query_params.get("search")
        brand = self.request.query_params.get("brand")

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

        if featured and featured.lower() in {
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
                | Q(variants__sku__icontains=search)
                | Q(variants__barcode__icontains=search)
                | Q(variants__name__icontains=search)
            ).distinct()

        return queryset


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(
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
                        .filter(is_active=True)
                        .prefetch_related("values")
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
                        .filter(is_active=True)
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
                Prefetch(
                    "outgoing_relationships",
                    queryset=(
                        ProductRelationship.objects
                        .filter(
                            is_active=True,
                            target_product__is_active=True,
                            target_product__status=(
                                Product.Status.ACTIVE
                            ),
                        )
                        .select_related(
                            "target_product",
                        )
                        .order_by(
                            "relationship_type",
                            "sort_order",
                            "-created_at",
                        )
                    ),
                ),
                "media",
            ),
            slug=slug,
        )

        return Response(
            ProductDetailSerializer(product).data
        )


# ============================================================
# ADMIN PRODUCT QUERYSET
# ============================================================


def admin_product_queryset():
    return (
        Product.objects
        .select_related(
            "category",
            "category__parent",
        )
        .annotate(
            variant_count=Count(
                "variants",
                distinct=True,
            )
        )
        .prefetch_related(
            Prefetch(
                "options",
                queryset=(
                    ProductOption.objects
                    .prefetch_related("values")
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
            Prefetch(
                "media",
                queryset=(
                    ProductMedia.objects
                    .order_by(
                        "sort_order",
                        "-created_at",
                    )
                ),
            ),
            Prefetch(
                "outgoing_relationships",
                queryset=(
                    ProductRelationship.objects
                    .select_related("target_product")
                    .order_by(
                        "relationship_type",
                        "sort_order",
                        "-created_at",
                    )
                ),
            ),
        )
    )


# ============================================================
# ADMIN PRODUCT LIST + CREATE
# ============================================================


class AdminProductListCreateView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get(self, request):
        queryset = admin_product_queryset()

        search = request.query_params.get(
            "search",
            "",
        ).strip()

        status_filter = request.query_params.get(
            "status"
        )

        product_type = request.query_params.get(
            "product_type"
        )

        category = request.query_params.get(
            "category"
        )

        featured = request.query_params.get(
            "featured"
        )

        active = request.query_params.get(
            "active"
        )

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(slug__icontains=search)
                | Q(brand__icontains=search)
                | Q(description__icontains=search)
                | Q(short_description__icontains=search)
                | Q(variants__sku__icontains=search)
                | Q(variants__barcode__icontains=search)
                | Q(variants__name__icontains=search)
            ).distinct()

        if status_filter:
            valid_statuses = {
                value
                for value, _ in Product.Status.choices
            }

            if status_filter.upper() in valid_statuses:
                queryset = queryset.filter(
                    status=status_filter.upper()
                )

        if product_type:
            valid_types = {
                value
                for value, _ in Product.ProductType.choices
            }

            if product_type.upper() in valid_types:
                queryset = queryset.filter(
                    product_type=product_type.upper()
                )

        if category:
            queryset = queryset.filter(
                category_id=category
            )

        if featured is not None:
            if featured.lower() in {
                "true",
                "1",
                "yes",
            }:
                queryset = queryset.filter(
                    is_featured=True
                )

            elif featured.lower() in {
                "false",
                "0",
                "no",
            }:
                queryset = queryset.filter(
                    is_featured=False
                )

        if active is not None:
            if active.lower() in {
                "true",
                "1",
                "yes",
            }:
                queryset = queryset.filter(
                    is_active=True
                )

            elif active.lower() in {
                "false",
                "0",
                "no",
            }:
                queryset = queryset.filter(
                    is_active=False
                )

        ordering = request.query_params.get(
            "ordering",
            "-created_at",
        )

        allowed_orderings = {
            "-created_at": "-created_at",
            "created_at": "created_at",
            "name": "name",
            "-name": "-name",
            "status": "status",
            "-status": "-status",
        }

        queryset = queryset.order_by(
            allowed_orderings.get(
                ordering,
                "-created_at",
            )
        )

        paginator = CatalogPagination()

        page = paginator.paginate_queryset(
            queryset,
            request,
            view=self,
        )

        serializer = AdminProductListSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    def post(self, request):
        serializer = AdminProductWriteSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        with transaction.atomic():
            product = serializer.save()

        product = admin_product_queryset().get(
            pk=product.pk
        )

        return Response(
            AdminProductDetailSerializer(
                product
            ).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADMIN PRODUCT DETAIL / UPDATE / ARCHIVE
# ============================================================


class AdminProductDetailView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_product(self, slug):
        return get_object_or_404(
            admin_product_queryset(),
            slug=slug,
        )

    def get(self, request, slug):
        product = self.get_product(slug)

        return Response(
            AdminProductDetailSerializer(
                product
            ).data
        )

    def patch(self, request, slug):
        product = self.get_product(slug)

        serializer = AdminProductWriteSerializer(
            product,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        with transaction.atomic():
            serializer.save()

        product = admin_product_queryset().get(
            pk=product.pk
        )

        return Response(
            AdminProductDetailSerializer(
                product
            ).data
        )

    def delete(self, request, slug):
        """
        Products are archived instead of physically deleted.

        This protects historical order references and preserves
        catalogue integrity.
        """

        product = self.get_product(slug)

        product.status = Product.Status.ARCHIVED
        product.is_active = False
        product.save(
            update_fields=[
                "status",
                "is_active",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail": "Product archived successfully."
            }
        )


# ============================================================
# ADMIN PRODUCT OPTIONS
# ============================================================


class AdminProductOptionListCreateView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_product(self, slug):
        return get_object_or_404(
            Product,
            slug=slug,
        )

    def get(self, request, slug):
        product = self.get_product(slug)

        options = (
            ProductOption.objects
            .filter(product=product)
            .prefetch_related("values")
            .order_by(
                "sort_order",
                "name",
            )
        )

        return Response(
            ProductOptionSerializer(
                options,
                many=True,
            ).data
        )

    def post(self, request, slug):
        product = self.get_product(slug)

        serializer = AdminProductOptionWriteSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        option = serializer.save(
            product=product
        )

        return Response(
            ProductOptionSerializer(option).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductOptionDetailView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_option(self, slug, option_id):
        return get_object_or_404(
            ProductOption,
            pk=option_id,
            product__slug=slug,
        )

    def patch(self, request, slug, option_id):
        option = self.get_option(
            slug,
            option_id,
        )

        serializer = AdminProductOptionWriteSerializer(
            option,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        option = serializer.save()

        return Response(
            ProductOptionSerializer(option).data
        )

    def delete(self, request, slug, option_id):
        option = self.get_option(
            slug,
            option_id,
        )

        option.is_active = False
        option.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail": "Product option deactivated."
            }
        )


# ============================================================
# ADMIN OPTION VALUES
# ============================================================


class AdminProductOptionValueListCreateView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_option(self, slug, option_id):
        return get_object_or_404(
            ProductOption,
            pk=option_id,
            product__slug=slug,
        )

    def get(self, request, slug, option_id):
        option = self.get_option(
            slug,
            option_id,
        )

        values = (
            ProductOptionValue.objects
            .filter(option=option)
            .order_by(
                "sort_order",
                "value",
            )
        )

        return Response(
            ProductOptionValueSerializer(
                values,
                many=True,
            ).data
        )

    def post(self, request, slug, option_id):
        option = self.get_option(
            slug,
            option_id,
        )

        serializer = (
            AdminProductOptionValueWriteSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        value = serializer.save(
            option=option
        )

        return Response(
            ProductOptionValueSerializer(value).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductOptionValueDetailView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_value(
        self,
        slug,
        option_id,
        value_id,
    ):
        return get_object_or_404(
            ProductOptionValue,
            pk=value_id,
            option_id=option_id,
            option__product__slug=slug,
        )

    def patch(
        self,
        request,
        slug,
        option_id,
        value_id,
    ):
        value = self.get_value(
            slug,
            option_id,
            value_id,
        )

        serializer = (
            AdminProductOptionValueWriteSerializer(
                value,
                data=request.data,
                partial=True,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        value = serializer.save()

        return Response(
            ProductOptionValueSerializer(value).data
        )

    def delete(
        self,
        request,
        slug,
        option_id,
        value_id,
    ):
        value = self.get_value(
            slug,
            option_id,
            value_id,
        )

        value.is_active = False
        value.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail": "Product option value deactivated."
            }
        )


# ============================================================
# ADMIN PRODUCT VARIANTS
# ============================================================


class AdminProductVariantListCreateView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_product(self, slug):
        return get_object_or_404(
            Product,
            slug=slug,
        )

    def get(self, request, slug):
        product = self.get_product(slug)

        variants = (
            ProductVariant.objects
            .filter(product=product)
            .prefetch_related(
                "option_values__option",
                "option_values__value",
            )
            .order_by(
                "-is_default",
                "name",
            )
        )

        return Response(
            ProductVariantSerializer(
                variants,
                many=True,
            ).data
        )

    def post(self, request, slug):
        product = self.get_product(slug)

        serializer = AdminProductVariantWriteSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        with transaction.atomic():
            if serializer.validated_data.get(
                "is_default",
                False,
            ):
                ProductVariant.objects.filter(
                    product=product,
                    is_default=True,
                ).update(
                    is_default=False
                )

            variant = serializer.save(
                product=product
            )

        return Response(
            ProductVariantSerializer(
                variant
            ).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductVariantDetailView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_variant(self, slug, variant_id):
        return get_object_or_404(
            ProductVariant.objects.prefetch_related(
                "option_values__option",
                "option_values__value",
            ),
            pk=variant_id,
            product__slug=slug,
        )

    def patch(self, request, slug, variant_id):
        variant = self.get_variant(
            slug,
            variant_id,
        )

        serializer = AdminProductVariantWriteSerializer(
            variant,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        with transaction.atomic():
            if serializer.validated_data.get(
                "is_default",
                False,
            ):
                ProductVariant.objects.filter(
                    product=variant.product,
                    is_default=True,
                ).exclude(
                    pk=variant.pk
                ).update(
                    is_default=False
                )

            variant = serializer.save()

        return Response(
            ProductVariantSerializer(
                variant
            ).data
        )

    def delete(self, request, slug, variant_id):
        variant = self.get_variant(
            slug,
            variant_id,
        )

        variant.is_active = False
        variant.save(
            update_fields=[
                "is_active",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail": "Product variant deactivated."
            }
        )


# ============================================================
# ADMIN VARIANT OPTION VALUES
# ============================================================


class AdminVariantOptionValueListCreateView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_variant(self, slug, variant_id):
        return get_object_or_404(
            ProductVariant,
            pk=variant_id,
            product__slug=slug,
        )

    def get(self, request, slug, variant_id):
        variant = self.get_variant(
            slug,
            variant_id,
        )

        assignments = (
            VariantOptionValue.objects
            .filter(variant=variant)
            .select_related(
                "option",
                "value",
            )
        )

        return Response(
            VariantOptionValueSerializer(
                assignments,
                many=True,
            ).data
        )

    def post(self, request, slug, variant_id):
        variant = self.get_variant(
            slug,
            variant_id,
        )

        serializer = AdminVariantOptionValueWriteSerializer(
            data=request.data,
            context={
                "variant": variant,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        assignment = serializer.save(
            variant=variant
        )

        return Response(
            VariantOptionValueSerializer(
                assignment
            ).data,
            status=status.HTTP_201_CREATED,
        )


class AdminVariantOptionValueDetailView(APIView):
    permission_classes = [IsCatalogAdmin]

    def delete(
        self,
        request,
        slug,
        variant_id,
        assignment_id,
    ):
        assignment = get_object_or_404(
            VariantOptionValue,
            pk=assignment_id,
            variant__pk=variant_id,
            variant__product__slug=slug,
        )

        assignment.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


# ============================================================
# ADMIN PRODUCT RELATIONSHIPS
# ============================================================


class AdminProductRelationshipListCreateView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_product(self, slug):
        return get_object_or_404(
            Product,
            slug=slug,
        )

    def get(self, request, slug):
        product = self.get_product(slug)

        relationships = (
            ProductRelationship.objects
            .filter(source_product=product)
            .select_related("target_product")
            .order_by(
                "relationship_type",
                "sort_order",
                "-created_at",
            )
        )

        return Response(
            ProductRelationshipSerializer(
                relationships,
                many=True,
            ).data
        )

    def post(self, request, slug):
        product = self.get_product(slug)

        serializer = (
            AdminProductRelationshipWriteSerializer(
                data=request.data,
                context={
                    "source_product": product,
                },
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        relationship = serializer.save(
            source_product=product
        )

        return Response(
            ProductRelationshipSerializer(
                relationship
            ).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductRelationshipDetailView(APIView):
    permission_classes = [IsCatalogAdmin]

    def get_relationship(
        self,
        slug,
        relationship_id,
    ):
        return get_object_or_404(
            ProductRelationship,
            pk=relationship_id,
            source_product__slug=slug,
        )

    def patch(
        self,
        request,
        slug,
        relationship_id,
    ):
        relationship = self.get_relationship(
            slug,
            relationship_id,
        )

        serializer = (
            AdminProductRelationshipWriteSerializer(
                relationship,
                data=request.data,
                partial=True,
                context={
                    "source_product": relationship.source_product,
                },
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        relationship = serializer.save()

        return Response(
            ProductRelationshipSerializer(
                relationship
            ).data
        )

    def delete(
        self,
        request,
        slug,
        relationship_id,
    ):
        relationship = self.get_relationship(
            slug,
            relationship_id,
        )

        relationship.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


# ============================================================
# ADMIN MEDIA UPLOAD
# ============================================================


class ProductMediaUploadView(APIView):
    """
    Staff-admin product media upload endpoint.

    Uploads the file to Bunny Storage first, then creates
    the corresponding ProductMedia database record.
    """

    permission_classes = [IsCatalogAdmin]
    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def post(self, request, slug):
        product = get_object_or_404(
            Product,
            slug=slug,
        )

        serializer = ProductMediaUploadSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        validated_data = serializer.validated_data

        uploaded_file = validated_data["file"]

        media_type = validated_data.get(
            "media_type",
            ProductMedia.MediaType.IMAGE,
        )

        variant_id = validated_data.get(
            "variant_id"
        )

        variant = None

        if variant_id is not None:
            variant = get_object_or_404(
                ProductVariant,
                id=variant_id,
                product=product,
            )

        is_primary = validated_data.get(
            "is_primary",
            False,
        )

        from .services.bunny import (
            BunnyStorageError,
            bunny_storage,
        )

        object_key = bunny_storage.build_object_key(
            product_id=product.id,
            filename=uploaded_file.name,
            directory="products",
        )

        try:
            content = uploaded_file.read()

            cdn_url = bunny_storage.upload(
                object_key=object_key,
                content=content,
                content_type=uploaded_file.content_type,
            )

        except BunnyStorageError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            with transaction.atomic():

                if is_primary:
                    ProductMedia.objects.filter(
                        product=product,
                        media_type=ProductMedia.MediaType.IMAGE,
                        is_primary=True,
                    ).update(
                        is_primary=False
                    )

                media = ProductMedia.objects.create(
                    product=product,
                    variant=variant,
                    media_type=media_type,
                    url=cdn_url,
                    storage_key=object_key,
                    alt_text=validated_data.get(
                        "alt_text",
                        "",
                    ),
                    title=validated_data.get(
                        "title",
                        "",
                    ),
                    sort_order=validated_data.get(
                        "sort_order",
                        0,
                    ),
                    is_primary=is_primary,
                    is_active=True,
                )

        except Exception:
            try:
                bunny_storage.delete(object_key)
            except BunnyStorageError:
                pass

            raise

        return Response(
            ProductMediaSerializer(media).data,
            status=status.HTTP_201_CREATED,
        )