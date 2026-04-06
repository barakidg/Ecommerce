import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import './Home.css'
import {
    Zap, Smartphone, Shirt, Home as HomeIcon,
    Sparkles, Trophy, Apple, ChevronRight, ShoppingCart, ArrowRight, Heart
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useFeaturedHomeProducts } from '../hooks/useFeaturedHomeProducts';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { formatEtb } from '../../../utils/formatEtb.js';
import { fetchProductsOnSale } from '../api/productApi.js';

const Plus = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
)

const Home = () => {
    const [showAllProducts, setShowAllProducts] = useState(false);
    const { isSeller, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const { addToCart, isAdding } = useCart()
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { products: featuredProducts, isLoading: featuredLoading, isError: featuredError } = useFeaturedHomeProducts()

    const { data: saleData, isPending: flashLoading, isError: flashError } = useQuery({
        queryKey: ['homeFlashDeals'],
        queryFn: () => fetchProductsOnSale(48),
        staleTime: 30_000
    })

    const flashDeals = useMemo(() => {
        const list = saleData?.products ?? []
        const scored = list.map((product) => {
            const originalPrice = Number(product.price)
            const currentPrice = unitProductPrice(product)
            const discountPct = originalPrice > 0
                ? Math.max(0, Math.round((1 - currentPrice / originalPrice) * 100))
                : 0
            return { product, discountPct, originalPrice, currentPrice }
        })
        scored.sort((a, b) => b.discountPct - a.discountPct || b.originalPrice - a.originalPrice)
        return scored.slice(0, 4)
    }, [saleData])

    const categories = [
        { name: "Tech", searchQuery: "Electronics", icon: <Smartphone size={18} />, color: "#eef2ff" },
        { name: "Fashion", searchQuery: "Fashion", icon: <Shirt size={18} />, color: "#fff1f2" },
        { name: "Home", searchQuery: "Home & Garden", icon: <HomeIcon size={18} />, color: "#f0fdf4" },
        { name: "Beauty", searchQuery: "Beauty & Personal Care", icon: <Sparkles size={18} />, color: "#faf5ff" },
        { name: "Sports", searchQuery: "Sports", icon: <Trophy size={18} />, color: "#fff7ed" },
        { name: "Groceries", searchQuery: "Food & Beverages", icon: <Apple size={18} />, color: "#f0fdfa" },
    ]

    const visibleFeatured = showAllProducts ? featuredProducts.slice(0, 24) : featuredProducts.slice(0, 8)
    const canShowMore = featuredProducts.length > 8
    const showFeaturedSection =
        featuredLoading || featuredError || featuredProducts.length > 0

    return (
        <div className="home-container">
            <section className="hero-section-full">
                <div className="hero-overlay">
                    <div className="hero-text-box">
                        <span className="hero-tag">Summer Sale 2026</span>
                        <h1>Everything You Need <br /><span>In One Place</span></h1>
                        <p>Experience the fastest delivery in Addis Ababa.</p>
                        <button type="button" className="cta-button" onClick={() => navigate('/categories')}>
                            Explore Shop <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>

            <section className="flash-section">
                <div className="section-header">
                    <div className="flash-title">
                        <Zap size={24} fill="#ff9900" color="#ff9900" />
                        <h3>Flash Deals</h3>
                    </div>
                    <Link to="/discounts" className="view-all">
                        View All <ChevronRight size={16} />
                    </Link>
                </div>
                <div className="flash-scroll">
                    {flashLoading && (
                        <div className="flash-loading" style={{ gridColumn: '1 / -1' }}>Loading deals…</div>
                    )}
                    {flashError && !flashLoading && (
                        <div className="flash-loading flash-loading--error" style={{ gridColumn: '1 / -1' }}>
                            Could not load deals.
                        </div>
                    )}
                    {!flashLoading && !flashError && flashDeals.length === 0 && (
                        <div className="flash-loading" style={{ gridColumn: '1 / -1' }}>No sale items right now.</div>
                    )}
                    {!flashLoading && !flashError && flashDeals.map(({ product, discountPct, originalPrice, currentPrice }) => {
                        const img = product.productImages?.[0]?.url
                        return (
                            <div key={product.id} className="flash-item">
                                <div className="flash-badge">-{discountPct}%</div>
                                <div className="flash-img">
                                    <Link to={`/product/${product.id}`} style={{ display: 'block', height: '100%' }}>
                                        <img src={img} alt={product.name} />
                                    </Link>
                                    <button
                                        type="button"
                                        className="flash-wishlist-btn"
                                        aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleWishlist(product.id);
                                        }}
                                    >
                                        <Heart
                                            size={14}
                                            fill={isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                            color={isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                                        />
                                    </button>
                                </div>
                                <div className="flash-details">
                                    <h4>{product.name}</h4>
                                    <div className="flash-price-row">
                                        <p className="price">
                                            {currentPrice.toLocaleString()} ETB{' '}
                                            <span className="old-price">{originalPrice.toLocaleString()} ETB</span>
                                        </p>
                                        <button
                                            type="button"
                                            className="flash-cart-btn"
                                            aria-label="Add to cart"
                                            disabled={isAdding}
                                            onClick={() => addToCart({ productId: product.id, quantity: 1 })}
                                        >
                                            <ShoppingCart size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {!isSeller && (
                <section className="vendor-banner-cool">
                    <div className="vendor-content">
                        <h2>Grow Your Business Globally</h2>
                        <p>Open your store on B-Mart and start selling to millions of customers within minutes.</p>
                    </div>
                    <span onClick={() => {
                        if (isAuthenticated) {
                            navigate("/apply-to-sell")
                        } else {
                            navigate("/login", { state: { from: "/apply-to-sell" } })
                        }
                    }}><button type="button" className="vendor-btn">Start Selling</button></span>
                </section>)}

            <section className="categories-section">
                <div className="section-header">
                    <h3>Top Categories</h3>
                </div>
                <div className="categories-compact-flex">
                    {categories.map(cat => (
                        <div
                            key={cat.name}
                            className="cat-pill-item"
                            onClick={() => navigate(`/category-discovery?cat=${encodeURIComponent(cat.searchQuery)}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="cat-icon-box" style={{ backgroundColor: cat.color }}>
                                {cat.icon}
                            </div>
                            <span>{cat.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {showFeaturedSection && (
                <section className="featured-section">
                    <div className="section-header">
                        <h3>Featured Products</h3>
                    </div>

                    {featuredLoading && (
                        <div className="featured-loading">Loading featured products…</div>
                    )}

                    {featuredError && !featuredLoading && (
                        <div className="featured-loading featured-loading--error">Could not load featured products. Please try again later.</div>
                    )}

                    {!featuredLoading && !featuredError && visibleFeatured.length > 0 && (
                        <div className="products-grid-layout">
                            {visibleFeatured.map(product => {
                                const img = product.productImages?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
                                return (
                                    <div key={product.id} className="product-modern-card">
                                        <div className="prod-img-container">
                                            <Link to={`/product/${product.id}`} style={{ display: 'block', height: '100%' }}>
                                                <img src={img} alt={product.name} />
                                            </Link>
                                            {product.featuredTags?.length > 0 && (
                                                <div className="featured-tag-row">
                                                    {product.featuredTags.map((t) => (
                                                        <span key={t} className="featured-tag">{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className="prod-wishlist-fab"
                                                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleWishlist(product.id);
                                                }}
                                            >
                                                <Heart
                                                    size={20}
                                                    fill={isInWishlist(product.id) ? '#ff4d6d' : 'none'}
                                                    color={isInWishlist(product.id) ? '#ff4d6d' : 'currentColor'}
                                                />
                                            </button>
                                        </div>
                                        <div className="prod-meta">
                                            <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <h4>{product.name}</h4>
                                            </Link>
                                            <div className="prod-meta-bottom">
                                                <p className="prod-price-text">{formatEtb(unitProductPrice(product))}</p>
                                                <button
                                                    type="button"
                                                    className="prod-cart-btn"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        addToCart({ productId: product.id, quantity: 1 });
                                                    }}
                                                    disabled={isAdding}
                                                >
                                                    <ShoppingCart size={17} />
                                                    <span>Add to cart</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {!featuredLoading && !featuredError && canShowMore && !showAllProducts && (
                        <div className="load-more-wrapper">
                            <button type="button" className="modern-load-btn" onClick={() => setShowAllProducts(true)}>
                                <span>Explore More Items</span>
                                <Plus size={20} />
                            </button>
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}

export default Home;
