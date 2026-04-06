import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCategoryProducts } from '../hooks/useCategoryProducts';
import { useSearchProducts } from '../hooks/useSearchProducts';
import { fetchCategoryProductCounts } from '../api/productApi';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useScrollRestore } from '../../../hooks/useScrollRestore.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import {
    ShoppingCart, Star, Plus, ArrowRight, Zap, Shirt, Home, Dumbbell,
    Smile, Gamepad2, BookOpen, Car, HeartPulse, Coffee, Gem,
    Music, Paperclip, Scissors, Baby, Briefcase, Armchair, Heart,
    SlidersHorizontal, X
} from 'lucide-react';
import './Categories.css';
import { unitProductPrice } from '../../../utils/unitProductPrice.js';
import { formatEtb } from '../../../utils/formatEtb.js';

const allCategories = [
    { id: 1, name: "Electronics", icon: <Zap size={20} />, text: "Explored curated items in Electronics" },
    { id: 2, name: "Fashion", icon: <Shirt size={20} />, text: "Explored curated items in Fashion" },
    { id: 3, name: "Home & Garden", icon: <Home size={20} />, text: "Explored curated items in Home & Garden" },
    { id: 4, name: "Beauty & Personal Care", icon: <Smile size={20} />, text: "Explored curated items in Beauty & Personal Care" },
    { id: 5, name: "Sports & Outdoors", icon: <Dumbbell size={20} />, text: "Explored curated items in Sports & Outdoors" },
    { id: 6, name: "Toys & Games", icon: <Gamepad2 size={20} />, text: "Explored curated items in Toys & Games" },
    { id: 7, name: "Books & Media", icon: <BookOpen size={20} />, text: "Explored curated items in Books & Media" },
    { id: 8, name: "Automotive", icon: <Car size={20} />, text: "Explored curated items in Automotive" },
    { id: 9, name: "Health & Wellness", icon: <HeartPulse size={20} />, text: "Explored curated items in Health & Wellness" },
    { id: 10, name: "Food & Beverages", icon: <Coffee size={20} />, text: "Explored curated items in Food & Beverages" },
    { id: 11, name: "Jewelry & Accessories", icon: <Gem size={20} />, text: "Explored curated items in Jewelry & Accessories" },
    { id: 12, name: "Musical Instruments", icon: <Music size={20} />, text: "Explored curated items in Musical Instruments" },
    { id: 13, name: "Office Supplies", icon: <Paperclip size={20} />, text: "Explored curated items in Office Supplies" },
    { id: 14, name: "Arts & Crafts", icon: <Scissors size={20} />, text: "Explored curated items in Arts & Crafts" },
    { id: 15, name: "Baby & Toddler", icon: <Baby size={20} />, text: "Explored curated items in Baby & Toddler" },
    { id: 16, name: "Luggage & Travel", icon: <Briefcase size={20} />, text: "Explored curated items in Luggage & Travel" },
    { id: 17, name: "Furniture", icon: <Armchair size={20} />, text: "Explored curated items in Furniture" }
];

const CategorySection = ({ category }) => {
    const { name, icon, text } = category;
    const { addToCart, isAdding } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useCategoryProducts(name, {});

    const saveScroll = useScrollRestore(status === 'success');

    if (status === 'pending') {
        return (
            <section className="category-section">
                <div className="category-header">
                    <div className="title-wrapper">
                        <div className="icon-box">{icon}</div>
                        <div>
                            <h2>{name}</h2>
                            <p>{text}</p>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading {name}...
                </div>
            </section>
        );
    }

    if (status === 'error') {
        return (
            <section className="category-section">
                <div className="category-header">
                    <div className="title-wrapper">
                        <div className="icon-box">{icon}</div>
                        <div>
                            <h2>{name}</h2>
                            <p>{text}</p>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                    Failed to load {name} products.
                </div>
            </section>
        );
    }

    const products = data?.pages?.flatMap(page => page?.products || []) || [];

    return (
        <section className="category-section">
            <div className="category-header">
                <div className="title-wrapper">
                    <div className="icon-box">{icon}</div>
                    <div>
                        <Link to={`/category-discovery?cat=${encodeURIComponent(name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h2 style={{ cursor: 'pointer' }}>{name}</h2>
                        </Link>
                        <p>{text}</p>
                    </div>
                </div>
                <Link to={`/category-discovery?cat=${encodeURIComponent(name)}`} className="expand-link" style={{ textDecoration: 'none' }}>
                    View All <ArrowRight size={16} />
                </Link>
            </div>

            <div className="product-shelf">
                {products.length > 0 ? (
                    products.map(product => {
                        const avgRating = product.reviews?.length
                            ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length).toFixed(1)
                            : '0.0';

                        return (
                            <div key={product.id} className="item-card">
                                <div className="image-wrapper">
                                    <Link to={`/product/${product.id}`} state={{ from: 'Categories' }} onClick={saveScroll}>
                                        <img src={product.productImages?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'} alt={product.name} />
                                    </Link>
                                    <button
                                        type="button"
                                        className="quick-add-btn"
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
                                <div className="item-info">
                                    <div className="info-top">
                                        <span className="rating"><Star size={12} fill="currentColor" /> {avgRating}</span>
                                        <span className="reviews">({product.reviews?.length || 0} reviews)</span>
                                    </div>
                                    <Link to={`/product/${product.id}`} state={{ from: 'Categories' }} onClick={saveScroll} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <h3 style={{ cursor: 'pointer' }}>{product.name}</h3>
                                    </Link>
                                    <p className="item-desc">{product.description}</p>
                                    <div className="info-bottom">
                                        <span className="price">{formatEtb(unitProductPrice(product))}</span>
                                        <button
                                            type="button"
                                            className="add-to-cart-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                addToCart({ productId: product.id, quantity: 1 });
                                            }}
                                            disabled={isAdding}
                                        >
                                            <ShoppingCart size={16} /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No products available in this category yet.
                    </div>
                )}
            </div>

            {hasNextPage && (
                <div className="load-more-area">
                    <button
                        type="button"
                        className="load-more-btn"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Loading more...' : 'Load more products'}
                    </button>
                </div>
            )}
        </section>
    );
};

const CategorySectionsFeed = () => {
    const [visibleCount, setVisibleCount] = useState(2);

    const { data: countsPayload, isLoading, isError } = useQuery({
        queryKey: ['categoryProductCounts'],
        queryFn: fetchCategoryProductCounts,
        staleTime: 60_000
    });

    const categoriesWithProducts = useMemo(() => {
        if (!countsPayload?.categories?.length) return [];
        const countByName = new Map(
            countsPayload.categories.map((c) => [c.name, c.count])
        );
        return allCategories.filter((c) => (countByName.get(c.name) ?? 0) > 0);
    }, [countsPayload]);

    const handleLoadMoreCategories = () => {
        setVisibleCount((prev) => Math.min(prev + 2, categoriesWithProducts.length));
    };

    const visibleCategories = useMemo(
        () => categoriesWithProducts.slice(0, visibleCount),
        [categoriesWithProducts, visibleCount]
    );

    const canLoadMore = visibleCount < categoriesWithProducts.length;

    if (isLoading) {
        return (
            <div className="categories-main-inner">
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
                    Loading categories…
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="categories-main-inner">
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ef4444' }}>
                    Could not load categories. Please try again later.
                </div>
            </div>
        );
    }

    if (categoriesWithProducts.length === 0) {
        return (
            <div className="categories-main-inner">
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
                    No products in any category yet.
                </div>
            </div>
        );
    }

    return (
        <div className="categories-main-inner feed-container categories-feed-flat">
            {visibleCategories.map((category) => (
                <CategorySection key={category.id} category={category} />
            ))}

            {canLoadMore && (
                <div className="load-more-area" style={{ marginTop: '0', paddingBottom: '40px' }}>
                    <button
                        type="button"
                        className="load-more-btn"
                        onClick={handleLoadMoreCategories}
                        style={{ background: 'var(--text-dark)', color: 'white', borderColor: 'var(--text-dark)' }}
                    >
                        More Categories
                    </button>
                </div>
            )}
        </div>
    );
};

const CategoriesFilteredGrid = ({ selectedCategory, maxPrice }) => {
    const { addToCart, isAdding } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useSearchProducts({
        categories: selectedCategory === 'all' ? undefined : selectedCategory,
        maxPrice,
        sort: 'relevance',
        limit: 16,
        enabled: true
    });

    const saveScroll = useScrollRestore(status === 'success');
    const products = data?.pages?.flatMap((page) => page?.products || []) || [];

    return (
        <div className="categories-main-inner categories-filtered-wrap">
            <header className="categories-filtered-header">
                <h1>
                    {selectedCategory === 'all' ? 'All products' : selectedCategory}
                    <span className="categories-filtered-count">({products.length})</span>
                </h1>
                <p className="categories-filtered-hint">
                    Sorted by popularity.
                    {maxPrice != null && ' Max price applied.'}
                </p>
            </header>

            <div className="product-shelf categories-filtered-grid">
                {status === 'pending' && products.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#64748b' }}>
                        Loading products…
                    </div>
                )}
                {status === 'error' && products.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#ef4444' }}>
                        Could not load products. Try adjusting filters.
                    </div>
                )}
                {status === 'success' && products.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: '#64748b' }}>
                        No products match these filters.
                    </div>
                )}
                {products.map((product) => {
                    const avgRating = product.reviews?.length
                        ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length).toFixed(1)
                        : '0.0';
                    return (
                        <div key={product.id} className="item-card">
                            <div className="image-wrapper">
                                <Link to={`/product/${product.id}`} state={{ from: 'Categories' }} onClick={saveScroll}>
                                    <img src={product.productImages?.[0]?.url} alt={product.name} />
                                </Link>
                                <button
                                    type="button"
                                    className="quick-add-btn"
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
                            <div className="item-info">
                                <div className="info-top">
                                    <span className="rating"><Star size={12} fill="currentColor" /> {avgRating}</span>
                                    <span className="reviews">({product.reviews?.length || 0} reviews)</span>
                                </div>
                                <Link to={`/product/${product.id}`} state={{ from: 'Categories' }} onClick={saveScroll} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 style={{ cursor: 'pointer' }}>{product.name}</h3>
                                </Link>
                                <p className="item-desc">{product.description}</p>
                                <div className="info-bottom">
                                    <span className="price">{formatEtb(unitProductPrice(product))}</span>
                                    <button
                                        type="button"
                                        className="add-to-cart-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            addToCart({ productId: product.id, quantity: 1 });
                                        }}
                                        disabled={isAdding}
                                    >
                                        <ShoppingCart size={16} /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {hasNextPage && status === 'success' && products.length > 0 && (
                <div className="load-more-area">
                    <button
                        type="button"
                        className="load-more-btn"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Loading more...' : 'Load more products'}
                    </button>
                </div>
            )}
        </div>
    );
};

const CategoriesPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [maxPrice, setMaxPrice] = useState('');

    const debouncedMax = useDebounce(maxPrice, 400);

    const parsedMax = debouncedMax.trim() === '' ? undefined : Number(debouncedMax);
    const maxP = parsedMax !== undefined && !Number.isNaN(parsedMax) ? parsedMax : undefined;

    const useGridMode = selectedCategory !== 'all' || maxP !== undefined;

    const resetFilters = () => {
        setSelectedCategory('all');
        setMaxPrice('');
    };

    const hasActiveFilters =
        selectedCategory !== 'all' ||
        maxP !== undefined;

    return (
        <div className="categories-page-layout">
            <aside className="cat-filters-sidebar" aria-label="Product filters">
                <div className="cat-filters-card">
                    <div className="cat-filters-card-head">
                        <SlidersHorizontal size={18} strokeWidth={2.25} />
                        <h2>Filters</h2>
                    </div>

                    <div className="cat-filter-block">
                        <h3>Category</h3>
                        <div className="cat-select-wrap">
                            <select
                                className="cat-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">All categories</option>
                                {allCategories.map((c) => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="cat-filter-block">
                        <h3>Price</h3>
                        <div className="cat-price-inputs">
                            <label className="cat-price-field">
                                <span>Max</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    placeholder="Any"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button type="button" className="cat-filters-reset" onClick={resetFilters}>
                            <X size={18} />
                            Clear all
                        </button>
                    )}
                </div>
            </aside>

            <div className="categories-main">
                {useGridMode ? (
                    <CategoriesFilteredGrid
                        selectedCategory={selectedCategory}
                        maxPrice={maxP}
                    />
                ) : (
                    <CategorySectionsFeed />
                )}
            </div>
        </div>
    );
};

export default CategoriesPage;
