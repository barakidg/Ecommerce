import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, Package, Plus, X, UploadCloud, MoreVertical } from "lucide-react";
import {
    useSellerInventoryProducts,
    useDeleteSellerProduct,
    useUpdateSellerProduct
} from "../hooks/useSellerInventory";
import { useRequestProductFeature } from "../hooks/useRequestProductFeature";
import { unitProductPrice } from "../../../utils/unitProductPrice.js";
import { formatEtb } from "../../../utils/formatEtb.js";
import "./SellerInventory.css";

const FEATURE_DURATION_CHOICES = [
    { days: 7, label: "7 days" },
    { days: 14, label: "14 days" },
    { days: 30, label: "30 days" }
];

const CATEGORIES = [
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Beauty & Personal Care",
    "Sports & Outdoors",
    "Toys & Games",
    "Books & Media",
    "Automotive",
    "Health & Wellness",
    "Food & Beverages",
    "Jewelry & Accessories",
    "Musical Instruments",
    "Office Supplies",
    "Arts & Crafts",
    "Baby & Toddler",
    "Luggage & Travel",
    "Furniture"
];

const emptySpecRow = { key: "", value: "" };

const attrsToRows = (attrs) => {
    if (!attrs || typeof attrs !== "object") return [{ ...emptySpecRow }];
    const entries = Object.entries(attrs).filter(([k]) => k);
    return entries.length ? entries.map(([key, value]) => ({ key, value: String(value) })) : [{ ...emptySpecRow }];
};

const rowsToAttrs = (rows) => {
    return rows.reduce((acc, r) => {
        if (r.key.trim()) acc[r.key.trim()] = r.value;
        return acc;
    }, {});
};

const MAX_IMAGES = 10;

function toSaleEndsLocalValue(iso) {
    if (!iso) return "";
    const x = new Date(iso);
    if (Number.isNaN(x.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

const SellerInventory = () => {
    const { data: products, isLoading, isError } = useSellerInventoryProducts();
    const delProduct = useDeleteSellerProduct();
    const updateProduct = useUpdateSellerProduct();
    const requestFeature = useRequestProductFeature();

    const [modalProduct, setModalProduct] = useState(null);
    const [promoteMenuForId, setPromoteMenuForId] = useState(null);
    const promoteMenuRef = useRef(null);
    const [draft, setDraft] = useState(null);
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const dragDepth = useRef(0);

    useEffect(() => {
        if (!promoteMenuForId) return;
        const onDocClick = (e) => {
            const el = promoteMenuRef.current;
            if (el && !el.contains(e.target)) setPromoteMenuForId(null);
        };
        const t = setTimeout(() => document.addEventListener("click", onDocClick), 0);
        return () => {
            clearTimeout(t);
            document.removeEventListener("click", onDocClick);
        };
    }, [promoteMenuForId]);

    useEffect(() => {
        if (!modalProduct) {
            setDraft(null);
            setNewImageFiles([]);
            setNewImagePreviews([]);
            dragDepth.current = 0;
            setDragActive(false);
            return;
        }
        setDraft({
            name: modalProduct.name ?? "",
            description: modalProduct.description ?? "",
            category: modalProduct.category ?? "",
            price: String(modalProduct.price ?? ""),
            stock: String(modalProduct.stock ?? "0"),
            salePrice:
                modalProduct.salePrice != null && modalProduct.salePrice !== ""
                    ? String(modalProduct.salePrice)
                    : "",
            productDiscountAmount:
                modalProduct.productDiscountAmount != null &&
                    modalProduct.productDiscountAmount !== ""
                    ? String(modalProduct.productDiscountAmount)
                    : "",
            saleEndsAt: toSaleEndsLocalValue(modalProduct.saleEndsAt),
            specRows: attrsToRows(modalProduct.attributes)
        });
        setNewImageFiles([]);
        setNewImagePreviews([]);
        dragDepth.current = 0;
        setDragActive(false);
    }, [modalProduct]);

    const closeModal = () => {
        setNewImagePreviews((prev) => {
            prev.forEach((u) => {
                if (String(u).startsWith("blob:")) URL.revokeObjectURL(u);
            });
            return [];
        });
        setNewImageFiles([]);
        setModalProduct(null);
    };

    const addNewImageFiles = (fileList) => {
        const incoming = Array.from(fileList || []).filter((f) =>
            f.type.startsWith("image/")
        );
        if (!incoming.length) return;
        const room = MAX_IMAGES - newImageFiles.length;
        if (room <= 0) return;
        const take = incoming.slice(0, room);
        const urls = take.map((f) => URL.createObjectURL(f));
        setNewImageFiles((prev) => [...prev, ...take]);
        setNewImagePreviews((prev) => [...prev, ...urls]);
    };

    const handleNewImagesInput = (e) => {
        addNewImageFiles(e.target.files);
        e.target.value = "";
    };

    const removeNewImage = (index) => {
        setNewImagePreviews((prev) => {
            const u = prev[index];
            if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
            return prev.filter((_, i) => i !== index);
        });
        setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const onInvDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current += 1;
        setDragActive(true);
    };

    const onInvDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragActive(false);
        }
    };

    const onInvDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onInvDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDepth.current = 0;
        setDragActive(false);
        addNewImageFiles(e.dataTransfer.files);
    };

    const handleDraftChange = (e) => {
        const { name, value } = e.target;
        setDraft((d) => ({ ...d, [name]: value }));
    };

    const handleSpecChange = (index, field, value) => {
        setDraft((d) => {
            const rows = [...d.specRows];
            rows[index] = { ...rows[index], [field]: value };
            return { ...d, specRows: rows };
        });
    };

    const addSpecRow = () => {
        setDraft((d) =>
            d.specRows.length >= 10
                ? d
                : { ...d, specRows: [...d.specRows, { ...emptySpecRow }] }
        );
    };

    const removeSpecRow = (index) => {
        setDraft((d) => ({
            ...d,
            specRows:
                d.specRows.length <= 1
                    ? [{ ...emptySpecRow }]
                    : d.specRows.filter((_, i) => i !== index)
        }));
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        if (!modalProduct || !draft) return;
        const attributes = rowsToAttrs(draft.specRows);
        const hasKeys = Object.keys(attributes).length > 0;

        const fd = new FormData();
        fd.append("name", draft.name.trim());
        fd.append("description", draft.description.trim());
        fd.append("category", draft.category);
        fd.append("price", String(draft.price));
        fd.append("stock", String(parseInt(draft.stock, 10)));
        fd.append("attributes", JSON.stringify(hasKeys ? attributes : {}));
        fd.append("salePrice", String(draft.salePrice ?? "").trim());
        fd.append(
            "productDiscountAmount",
            String(draft.productDiscountAmount ?? "").trim()
        );
        fd.append("saleEndsAt", String(draft.saleEndsAt ?? "").trim());
        newImageFiles.forEach((file) => fd.append("images", file));

        updateProduct.mutate(
            { id: modalProduct.id, body: fd },
            { onSuccess: () => closeModal() }
        );
    };

    const handleDelete = (p) => {
        if (
            !window.confirm(
                `Remove "${p.name}" from your catalog? Buyers will no longer see it.`
            )
        )
            return;
        delProduct.mutate(p.id);
    };

    const productSpotlightStatus = (p) => {
        const now = new Date();
        const until = p.featuredUntil ? new Date(p.featuredUntil) : null;
        const live =
            p.isFeatured && (!until || until > now);
        const pending = Array.isArray(p.featuredProductRequests) && p.featuredProductRequests.length > 0;
        return { live, pending, until };
    };

    return (
        <div className="seller-inventory-page">
            <header className="seller-inventory-header">
                <div>
                    <span className="seller-inventory-eyebrow">
                        <Package size={16} /> Catalog
                    </span>
                    <h1>Inventory</h1>
                </div>
            </header>

            {isLoading && <p className="seller-inventory-muted">Loading products…</p>}
            {isError && (
                <p className="seller-inventory-error">Could not load inventory.</p>
            )}

            {!isLoading && !isError && (
                <div className="seller-inventory-grid">
                    {(products ?? []).map((p) => (
                        <article
                            key={p.id}
                            className={`seller-inventory-card${promoteMenuForId === p.id ? " seller-inventory-card--menu-open" : ""}`}
                        >
                            <div className="seller-inventory-card-img">
                                <div className="seller-inventory-card-img-inner" aria-hidden>
                                    {p.productImages?.[0]?.url ? (
                                        <img src={p.productImages[0].url} alt="" />
                                    ) : (
                                        <Package size={32} />
                                    )}
                                </div>
                                <div className="seller-inventory-menu-wrap" ref={promoteMenuForId === p.id ? promoteMenuRef : null}>
                                    <button
                                        type="button"
                                        className="seller-inventory-more-btn"
                                        aria-expanded={promoteMenuForId === p.id}
                                        aria-haspopup="menu"
                                        aria-label="Product actions"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPromoteMenuForId((id) => (id === p.id ? null : p.id));
                                        }}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {promoteMenuForId === p.id && (
                                        <div className="seller-inventory-dropdown" role="menu">
                                            <div className="seller-inventory-dropdown-label">Request homepage spotlight</div>
                                            {(() => {
                                                const { live, pending } = productSpotlightStatus(p);
                                                if (live) {
                                                    return (
                                                        <p className="seller-inventory-dropdown-muted">
                                                            This listing is currently featured.
                                                        </p>
                                                    );
                                                }
                                                if (pending) {
                                                    return (
                                                        <p className="seller-inventory-dropdown-muted">
                                                            A request is pending admin review.
                                                        </p>
                                                    );
                                                }
                                                return FEATURE_DURATION_CHOICES.map(({ days, label }) => (
                                                    <button
                                                        key={days}
                                                        type="button"
                                                        role="menuitem"
                                                        className="seller-inventory-dropdown-item"
                                                        disabled={requestFeature.isPending}
                                                        onClick={() => {
                                                            requestFeature.mutate(
                                                                { productId: p.id, durationDays: days },
                                                                {
                                                                    onSettled: () => setPromoteMenuForId(null)
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="seller-inventory-card-body">
                                <div className="seller-inventory-card-title-row">
                                    <h2>{p.name}</h2>
                                </div>
                                <div className="seller-inventory-meta">
                                    <span>{formatEtb(unitProductPrice(p))}</span>
                                    <span>{p.stock} in stock</span>
                                </div>
                                <div className="seller-inventory-actions">
                                    <button
                                        type="button"
                                        className="seller-inventory-btn seller-inventory-btn--edit"
                                        onClick={() => setModalProduct(p)}
                                    >
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="seller-inventory-btn seller-inventory-btn--delete"
                                        onClick={() => handleDelete(p)}
                                        disabled={delProduct.isPending}
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {!isLoading && !isError && products?.length === 0 && (
                <p className="seller-inventory-muted">No products yet. Add one first.</p>
            )}

            {modalProduct && draft && (
                <div
                    className="seller-inventory-modal-backdrop"
                    role="presentation"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div
                        className="seller-inventory-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-product-title"
                    >
                        <div className="seller-inventory-modal-head">
                            <h2 id="edit-product-title">Edit product</h2>
                            <button
                                type="button"
                                className="seller-inventory-modal-close"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="seller-inventory-modal-form">
                            <label>
                                Name
                                <input
                                    name="name"
                                    value={draft.name}
                                    onChange={handleDraftChange}
                                    required
                                />
                            </label>
                            <label>
                                Description
                                <textarea
                                    name="description"
                                    value={draft.description}
                                    onChange={handleDraftChange}
                                    rows={4}
                                    required
                                />
                            </label>
                            <label>
                                Category
                                <select
                                    name="category"
                                    value={draft.category}
                                    onChange={handleDraftChange}
                                    required
                                >
                                    <option value="">Select</option>
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="seller-inventory-modal-row">
                                <label>
                                    Price
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={draft.price}
                                        onChange={handleDraftChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Stock
                                    <input
                                        name="stock"
                                        type="number"
                                        min="0"
                                        value={draft.stock}
                                        onChange={handleDraftChange}
                                        required
                                    />
                                </label>
                            </div>
                            <p className="seller-inventory-muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
                                Optional timed sale: use either sale price or amount off base (not both). End date required when a sale is set. Leave all three empty to remove a sale.
                            </p>
                            <div className="seller-inventory-modal-row">
                                <label>
                                    Sale price (ETB)
                                    <input
                                        name="salePrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={draft.salePrice}
                                        onChange={handleDraftChange}
                                        placeholder="Leave empty if using amount off"
                                    />
                                </label>
                                <label>
                                    Amount off (ETB)
                                    <input
                                        name="productDiscountAmount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={draft.productDiscountAmount}
                                        onChange={handleDraftChange}
                                        placeholder="Leave empty if using sale price"
                                    />
                                </label>
                            </div>
                            <label>
                                Sale ends
                                <input
                                    name="saleEndsAt"
                                    type="datetime-local"
                                    value={draft.saleEndsAt}
                                    onChange={handleDraftChange}
                                />
                            </label>

                            <div className="seller-inventory-images">
                                <span className="seller-inventory-specs-h">
                                    Photos
                                </span>
                                {modalProduct.productImages?.length > 0 && (
                                    <p className="seller-in-images-hint">
                                        Current images. Add new files below to replace all photos (optional).
                                    </p>
                                )}
                                <div className="seller-in-current-imgs">
                                    {(modalProduct.productImages ?? []).map((img) => (
                                        <img
                                            key={img.id}
                                            src={img.url}
                                            alt=""
                                            className="seller-in-current-thumb"
                                        />
                                    ))}
                                </div>
                                <div
                                    className={`seller-inventory-dropzone${dragActive ? " seller-inventory-dropzone--active" : ""}`}
                                    onDragEnter={onInvDragEnter}
                                    onDragLeave={onInvDragLeave}
                                    onDragOver={onInvDragOver}
                                    onDrop={onInvDrop}
                                >
                                    <input
                                        type="file"
                                        id="seller-edit-images"
                                        accept="image/*"
                                        multiple
                                        hidden
                                        onChange={handleNewImagesInput}
                                    />
                                    <label
                                        htmlFor="seller-edit-images"
                                        className="seller-inventory-dropzone-label"
                                    >
                                        <UploadCloud size={26} />
                                        <span>Drop images or click to add</span>
                                        <small>
                                            Replaces all photos when you save · max {MAX_IMAGES}
                                        </small>
                                    </label>
                                </div>
                                {newImagePreviews.length > 0 && (
                                    <div className="seller-in-new-previews">
                                        {newImagePreviews.map((url, i) => (
                                            <div key={`${url}-${i}`} className="seller-in-new-preview-wrap">
                                                <img src={url} alt="" />
                                                <button
                                                    type="button"
                                                    className="seller-in-new-preview-remove"
                                                    onClick={() => removeNewImage(i)}
                                                    aria-label="Remove new image"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="seller-inventory-specs">
                                <div className="seller-inventory-specs-h">
                                    <span>Specifications</span>
                                    <span className="seller-inventory-specs-count">
                                        {draft.specRows.length}/10
                                    </span>
                                </div>
                                {draft.specRows.map((row, index) => (
                                    <div key={index} className="seller-inventory-spec-row">
                                        <input
                                            placeholder="Feature"
                                            value={row.key}
                                            onChange={(e) =>
                                                handleSpecChange(
                                                    index,
                                                    "key",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <input
                                            placeholder="Value"
                                            value={row.value}
                                            onChange={(e) =>
                                                handleSpecChange(
                                                    index,
                                                    "value",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        {draft.specRows.length > 1 && (
                                            <button
                                                type="button"
                                                className="seller-inventory-spec-remove"
                                                onClick={() => removeSpecRow(index)}
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="seller-inventory-add-spec"
                                    onClick={addSpecRow}
                                    disabled={draft.specRows.length >= 10}
                                >
                                    <Plus size={16} /> Add property
                                </button>
                            </div>

                            <div className="seller-inventory-modal-footer">
                                <button
                                    type="button"
                                    className="seller-inventory-cancel"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="seller-inventory-save"
                                    disabled={updateProduct.isPending}
                                >
                                    {updateProduct.isPending
                                        ? "Saving…"
                                        : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerInventory;
