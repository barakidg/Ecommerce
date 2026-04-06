export function unitProductPrice(product) {
    if (!product) return 0;
    const e = product.effectivePrice;
    if (e != null && e !== "" && !Number.isNaN(Number(e))) return Number(e);
    return Number(product.price ?? 0);
}

export function avgRatingFromReviews(reviews) {
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
}
