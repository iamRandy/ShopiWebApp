import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const ProductArea = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const userSub = localStorage.getItem('userSub');
                if (!userSub) {
                    setError('No user found. Please log in again.');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`http://localhost:3000/api/products/${userSub}`);
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

        fetchProducts();
    }, []);

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
        <>
            <div className="p-3 grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3" id="product-canvas">
                {products.map((product, index) => (
                    <ProductCard 
                        key={index}
                        productName={product.title || 'Unknown Product'}
                        productImg={product.image || 'https://via.placeholder.com/300x300?text=No+Image'}
                        productPrice={product.price ? `${product.currency || '$'}${product.price}` : 'Price not available'}
                    />
                ))}
            </div>
        </>
    )
}

export default ProductArea;