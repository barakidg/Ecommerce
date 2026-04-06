import React, { useState } from 'react';
import { Heart, Star, ShoppingCart, Filter, Clock, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { useScrollRestore } from '../../../hooks/useScrollRestore.js';
import './NewReleases.css';

const NewReleases = () => {
    const [activeFilter, setActiveFilter] = useState('This Week');
    const { addToCart, isAdding } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const timeFilters = ['Last 1 hr', 'Today', 'This Week', 'This Month'];

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useProducts({ sort: 'new-releases', timeFilter: activeFilter });

    const saveScroll = useScrollRestore(status === 'success');

    return (
        <div className="new-releases-page">
            <header className="releases-header">
                <div className="title-area">
                    <p>Freshly dropped items</p>
                </div>

                <div className="time-filter-bar">
                    <Filter size={16} className="filter-icon" />
                    {timeFilters.map((time) => (
                        <label key={time} className="filter-checkbox">
                            <input
                                type="radio"
                                name="timeFilter"
                                checked={activeFilter === time}
                                onChange={() => setActiveFilter(time)}
                            />
                            <span className="custom-box">
                                {activeFilter === time && <Check size={10} />}
                            </span>
                            <span className="filter-label">{time}</span>
                        </label>
                    ))}
                </div>
            </header>

            {status === 'pending' ? (
                <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    Loading new releases...
                </div>
            ) : status === 'error' ? (
                <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    Failed to load new releases.
                </div>
            ) : (
                <>
                    <main className="product-grid">
                        {(data?.pages?.flatMap(p => p.products) || []).length > 0 ? (
                            (data?.pages?.flatMap(p => p.products) || []).map(product => {
                                const avgRating = product.reviews?.length
                                    ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length).toFixed(1)
                                    : '0.0';

                                return (
                                    <div key={product.id} className="new-item-card">
                                        <div className="image-container">
                                            <Link to={`/product/${product.id}`} state={{ from: 'New Releases' }} onClick={saveScroll}>
                                                <img src={product.productImages?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'} alt={product.name} />
                                            </Link>
                                            <button
                                                type="button"
                                                className="wishlist-btn"
                                                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleWishlist(product.id);
                                                }}
                                            >
                                                <Heart
                                                    size={18}
                                                    fill={isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                                    color={isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                                                />
                                            </button>
                                        </div>

                                        <div className="card-body">
                                            <div className="rating-row">
                                                <Star size={12} fill="#ff9900" color="#ff9900" />
                                                <span>{avgRating}</span>
                                            </div>

                                            <Link to={`/product/${product.id}`} state={{ from: 'New Releases' }} onClick={saveScroll} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <h3 className="product-name" style={{ cursor: 'pointer' }}>{product.name}</h3>
                                            </Link>

                                            <div className="card-footer">
                                                <span className="product-price">{unitProductPrice(product).toLocaleString()} ETB</span>
                                                <button
                                                    className="add-cart-btn"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        addToCart({ productId: product.id, quantity: 1 });
                                                    }}
                                                    disabled={isAdding}
                                                >
                                                    <ShoppingCart size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                No new releases found for this time period.
                            </div>
                        )}
                    </main>

                    {hasNextPage && (
                        <div className="load-more-area" style={{ marginTop: '30px', paddingBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                            <button
                                className="load-more-btn"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                style={{
                                    padding: '12px 24px',
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    color: '#475569'
                                }}
                            >
                                {isFetchingNextPage ? 'Loading more...' : 'Load more releases'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NewReleases;