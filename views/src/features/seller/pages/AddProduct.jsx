import { useState, useRef } from 'react';
import './AddProduct.css';
import { useAddProduct } from '../hooks/useAddProduct';
import {
    Package,
    Plus,
    X,
    UploadCloud,
    Trash2
} from 'lucide-react';

const MAX_IMAGES = 10;

const AddProduct = () => {
    const [images, setImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const dragDepth = useRef(0);
    const [imageError, setImageError] = useState(null);
    const [properties, setProperties] = useState([{ key: '', value: '' }]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: '',
        productDiscountAmount: '',
        saleEndsAt: ''
    });

    const { addProduct, isAdding } = useAddProduct();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addProperty = () => {
        if (properties.length < 10) {
            setProperties([...properties, { key: '', value: '' }]);
        }
    };

    const removeProperty = (index) => {
        const values = [...properties];
        values.splice(index, 1);
        setProperties(values);
    };

    const handlePropertyChange = (index, event) => {
        const values = [...properties];
        values[index][event.target.name] = event.target.value;
        setProperties(values);
    };

    const addImageFiles = (fileList) => {
        const incoming = Array.from(fileList || []).filter((f) =>
            f.type.startsWith("image/")
        );
        if (!incoming.length) return;
        const room = MAX_IMAGES - imageFiles.length;
        if (room <= 0) return;
        const take = incoming.slice(0, room);
        const previewUrls = take.map((file) => URL.createObjectURL(file));
        setImages((prev) => [...prev, ...previewUrls]);
        setImageFiles((prev) => [...prev, ...take]);
        setImageError(null);
    };

    const handleImageChange = (e) => {
        addImageFiles(e.target.files);
        e.target.value = "";
    };

    const removeImage = (index) => {
        const url = images[index];
        if (url?.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(url);
            } catch {
                void 0;
            }
        }
        setImages(images.filter((_, idx) => idx !== index));
        setImageFiles(imageFiles.filter((_, idx) => idx !== index));
    };

    const onDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current += 1;
        setDragActive(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragActive(false);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current = 0;
        setDragActive(false);
        addImageFiles(e.dataTransfer.files);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setImageError(null);

        if (imageFiles.length < 1) {
            setImageError("Add at least one product image.");
            return;
        }

        const specsJson = properties.reduce((acc, curr) => {
            if (curr.key) acc[curr.key] = curr.value;
            return acc;
        }, {});

        const data = new FormData();
        data.append("name", formData.name);
        data.append("description", formData.description);
        data.append("category", formData.category);
        data.append("price", formData.price);
        data.append("stock", formData.stock);
        data.append("attributes", JSON.stringify(specsJson));
        data.append(
            "productDiscountAmount",
            String(formData.productDiscountAmount ?? "").trim()
        );
        data.append("saleEndsAt", String(formData.saleEndsAt ?? "").trim());

        imageFiles.forEach(file => {
            data.append("images", file);
        });

        addProduct(data, {
            onSuccess: () => {
                setFormData({
                    name: '',
                    description: '',
                    category: '',
                    price: '',
                    stock: '',
                    productDiscountAmount: '',
                    saleEndsAt: ''
                });
                setImages([]);
                setImageFiles([]);
                setProperties([{ key: '', value: '' }]);
            }
        });
    };

    return (
        <div className="add-product-container">
            <header className="page-header">
                <div className="header-title">
                    <Package size={28} className="icon-accent" />
                    <h1>List New Product</h1>
                </div>
                <p>Fill in the details below to list your item on B-Mart.</p>
            </header>

            <form onSubmit={handleSubmit} className="product-form-grid">
                <div className="form-card main-info">
                    <div className="input-group">
                        <label>Product Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. MacBook Pro M3 2026" required />
                    </div>

                    <div className="input-group">
                        <label>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Tell customers about your product..." rows="6" required></textarea>
                    </div>

                    <div className="row-inputs">
                        <div className="input-group">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} required>
                                <option value="">Select Category</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Home & Garden">Home & Garden</option>
                                <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                                <option value="Sports & Outdoors">Sports & Outdoors</option>
                                <option value="Toys & Games">Toys & Games</option>
                                <option value="Books & Media">Books & Media</option>
                                <option value="Automotive">Automotive</option>
                                <option value="Health & Wellness">Health & Wellness</option>
                                <option value="Food & Beverages">Food & Beverages</option>
                                <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                                <option value="Musical Instruments">Musical Instruments</option>
                                <option value="Office Supplies">Office Supplies</option>
                                <option value="Arts & Crafts">Arts & Crafts</option>
                                <option value="Baby & Toddler">Baby</option>
                                <option value="Luggage & Travel">Luggage & Travel</option>
                                <option value="Furniture">Furniture</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Base price (ETB)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" required />
                        </div>
                        <div className="input-group">
                            <label>Stock Quantity</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="e.g. 50" required />
                        </div>
                    </div>
                    <p style={{ margin: '12px 0 8px', fontSize: 13, color: '#64748b', lineHeight: 1.45 }}>
                        Optional discount sale
                    </p>
                    <div className="row-inputs">
                        <div className="input-group amount-off">
                            <label>Amount off (ETB)</label>
                            <input type="number" name="productDiscountAmount" value={formData.productDiscountAmount} onChange={handleChange} placeholder="Optional" step="0.01" min="0" />
                        </div>
                        <div className="input-group">
                            <label>Sale ends</label>
                            <input type="datetime-local" name="saleEndsAt" value={formData.saleEndsAt} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="form-sidebar">
                    <div className="form-card image-section">
                        <label>Product images (required)</label>
                        <div
                            className={`upload-zone${dragActive ? " upload-zone--drag" : ""}`}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                id="file-input"
                                hidden
                            />
                            <label htmlFor="file-input" className="upload-label">
                                <UploadCloud size={32} />
                                <span>Click to upload or drag & drop</span>
                                <small>At least one image · up to {MAX_IMAGES} · PNG, JPG (max 5MB)</small>
                            </label>
                        </div>
                        {imageError && (
                            <p className="image-section-error">{imageError}</p>
                        )}
                        <div className="image-previews">
                            {images.map((url, i) => (
                                <div key={i} className="preview-item">
                                    <img src={url} alt="preview" />
                                    <button type="button" onClick={() => removeImage(i)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-card specs-section">
                        <div className="specs-header">
                            <label>Product Specifications</label>
                            <span className="count-tag">{properties.length}/10</span>
                        </div>
                        <p className="helper-text">Add details like Size, Color, RAM, or Material.</p>

                        <div className="specs-list">
                            {properties.map((prop, index) => (
                                <div key={index} className="spec-row">
                                    <input
                                        name="key"
                                        placeholder="Feature (e.g. RAM)"
                                        value={prop.key}
                                        onChange={e => handlePropertyChange(index, e)}
                                    />
                                    <input
                                        name="value"
                                        placeholder="Value (e.g. 16GB)"
                                        value={prop.value}
                                        onChange={e => handlePropertyChange(index, e)}
                                    />
                                    {properties.length > 1 && (
                                        <button type="button" className="remove-spec" onClick={() => removeProperty(index)}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="add-spec-btn"
                            onClick={addProperty}
                            disabled={properties.length >= 10}
                        >
                            <Plus size={18} /> Add Property
                        </button>
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={isAdding} className="btn-publish">{isAdding ? "Publishing..." : "Publish Product"}</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;