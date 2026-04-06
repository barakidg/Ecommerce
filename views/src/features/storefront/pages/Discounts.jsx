import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Tag, Timer } from 'lucide-react';
import './Discounts.css';
import { fetchProductsOnSale } from '../api/productApi';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { unitProductPrice, avgRatingFromReviews } from '../../../utils/unitProductPrice.js';

const DiscountsPage = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['productsOnSale'],
        queryFn: () => fetchProductsOnSale(24),
        staleTime: 30_000
    });
    const { addToCart, isAdding } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const products = data?.products ?? [];

    return (
        <div className="discounts-page">

            <div className="discount-grid">
                {isLoading && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#64748b' }}>
                        Loading deals…
                    </div>
                )}
                {isError && !isLoading && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#ef4444' }}>
                        Could not load sale items. Please try again later.
                    </div>
                )}
                {!isLoading && !isError && products.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#64748b' }}>
                        No active product sales right now. Check back soon.
                    </div>
                )}
                {!isLoading && !isError && products.map((product) => {
                    const originalPrice = Number(product.price);
                    const currentPrice = unitProductPrice(product);
                    const discount = originalPrice > 0
                        ? Math.max(0, Math.round((1 - currentPrice / originalPrice) * 100))
                        : 0;
                    const rating = avgRatingFromReviews(product.reviews);
                    const img = product.productImages?.[0]?.url

                    return (
                        <div key={product.id} className="discount-card">
                            <div className="discount-img-wrapper">
                                <Link to={`/product/${product.id}`}>
                                    <img src={img} alt={product.name} />
                                </Link>
                                <div className="off-badge">-{discount}%</div>
                                <button
                                    type="button"
                                    className="discount-wishlist-btn"
                                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleWishlist(product.id);
                                    }}
                                >
                                    <Heart
                                        size={16}
                                        fill={isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                        color={isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                                    />
                                </button>
                            </div>

                            <div className="discount-card-content">
                                <div className="discount-rating">
                                    <Star size={10} fill="#ff9900" color="#ff9900" />
                                    <span>{rating}</span>
                                </div>

                                <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 className="discount-item-name">{product.name}</h3>
                                </Link>

                                <div className="discount-footer">
                                    <div className="price-stack">
                                        <span className="old-price">{originalPrice.toLocaleString()} ETB</span>
                                        <span className="new-price">{currentPrice.toLocaleString()} ETB</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="discount-cart-btn"
                                        disabled={isAdding}
                                        onClick={() => addToCart({ productId: product.id, quantity: 1 })}
                                    >
                                        <ShoppingCart size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DiscountsPage;
