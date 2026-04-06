export function isSaleScheduleActive(product) {
    if (!product?.saleEndsAt) return false;
    return new Date(product.saleEndsAt) > new Date();
}

export function getEffectiveUnitPrice(product) {
    const list = Number(product?.price ?? 0);
    if (!isSaleScheduleActive(product)) return list;

    const salePrice =
        product?.salePrice != null && product.salePrice !== ""
            ? Number(product.salePrice)
            : null;
    const discountAmt =
        product?.productDiscountAmount != null && product.productDiscountAmount !== ""
            ? Number(product.productDiscountAmount)
            : null;

    if (salePrice != null && !Number.isNaN(salePrice) && salePrice > 0) {
        return Math.min(list, Math.max(0, salePrice));
    }
    if (discountAmt != null && !Number.isNaN(discountAmt) && discountAmt > 0) {
        return Math.max(0, list - discountAmt);
    }
    return list;
}

export function attachEffectivePrice(product) {
    if (!product || typeof product !== "object") return product;
    return {
        ...product,
        effectivePrice: getEffectiveUnitPrice(product)
    };
}

export function mapProductsWithEffectivePrice(products) {
    if (!Array.isArray(products)) return products;
    return products.map((p) => attachEffectivePrice(p));
}

export function buildSellerSaleFields(listPrice, rawBody) {
    const list = Number(listPrice);
    if (Number.isNaN(list) || list <= 0) {
        return { error: "Invalid base price" };
    }

    const pdRaw = rawBody.productDiscountAmount;
    const endRaw = rawBody.saleEndsAt;

    const pd =
        pdRaw === undefined || pdRaw === null || String(pdRaw).trim() === ""
            ? null
            : Number(pdRaw);
    const ends =
        endRaw === undefined || endRaw === null || String(endRaw).trim() === ""
            ? null
            : new Date(endRaw);

    const hasPd = pd != null && !Number.isNaN(pd) && pd > 0;

    if (!hasPd) {
        return {
            data: {
                productDiscountAmount: null,
                saleEndsAt: null
            }
        };
    }

    if (!ends || Number.isNaN(ends.getTime())) {
        return { error: "Sale end date is required for a timed discount." };
    }

    if (ends <= new Date()) {
        return { error: "Sale end date must be in the future." };
    }

    const salePrice = list - pd

    if (salePrice && salePrice < 0) {
        return { error: "Sale price must be less than base price." };
    }

    if (hasPd && pd >= list) {
        return { error: "Discount amount must be less than base price." };
    }

    return {
        data: {
            salePrice: salePrice ? salePrice : null,
            productDiscountAmount: hasPd ? pd : null,
            saleEndsAt: ends
        }
    };
}
