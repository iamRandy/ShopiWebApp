import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { authenticatedFetch } from '../utils/api';

const ProductArea = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collapsed, setCollapsed] = useState({}); // track collapsed state per retailer

    const fetchProducts = async () => {
        try {
            const response = await authenticatedFetch('http://localhost:3000/api/products');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            
            const data = await response.json();
            setProducts(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleProductDelete = () => {
        // Refresh the products list after deletion
        setLoading(true);
        fetchProducts();
    };

    // group products by retailer hostname
    const groupedProducts = products.reduce((acc, product) => {
        const retailer = product.hostname || new URL(product.url).hostname || 'Unknown Retailer';
        if (!acc[retailer]) acc[retailer] = [];
        acc[retailer].push(product);
        return acc;
    }, {});

    const toggleCollapse = (retailer) => {
        setCollapsed(prev => ({
            ...prev,
            [retailer]: !prev[retailer]
        }));
    };

    if (loading) {
        return (
            <div className="p-3 flex justify-center items-center h-64">
                <div className="text-lg">Loading products...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-3 flex justify-center items-center h-64">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="p-3 flex justify-center items-center h-64">
                <div className="text-gray-500">No products saved yet. Use the extension to save some products!</div>
            </div>
        );
    }

    return (
        <div className="p-3 space-y-4">
            {Object.entries(groupedProducts).map(([retailer, items]) => (
                <div key={retailer} className="border rounded-lg overflow-hidden bg-stone-50 text-stone-950">
                    {/* Header button */}
                    <button
                        onClick={() => toggleCollapse(retailer)}
                        className="w-full flex items-center justify-between px-4 py-2 bg-stone-100 hover:bg-stone-200 transition-colors"
                    >
                        <span className="font-semibold text-lg">{retailer} ({items.length})</span>
                        {/* Simple chevron icon */}
                        <svg
                            className={`w-4 h-4 transform transition-transform ${collapsed[retailer] ? 'rotate-90' : 'rotate-0'}`}
                            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    {/* Product grid */}
                    {!collapsed[retailer] && (
                        <div className="p-3 grid gap-3" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(208px, 208px))'}}>
                            {items.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    productName={product.title || 'Unknown Product'}
                                    productImg={product.image || 'https://via.placeholder.com/300x300?text=No+Image'}
                                    productPrice={product.price ? `${product.currency || '$'}${product.price}` : 'Price not available'}
                                    productId={product.id}
                                    productUrl={product.url}
                                    onDelete={handleProductDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ProductArea;