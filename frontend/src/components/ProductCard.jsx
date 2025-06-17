import React from 'react';
import { getAffiliateLink } from '../utils/affiliate';

const ProductCard = ({ productName, productImg, productPrice, productId, productUrl, onDelete }) => {

    const handleDelete = async (e) => {
        e.stopPropagation(); // Prevent triggering the product link
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const userSub = localStorage.getItem('userSub');
                const response = await fetch(`http://localhost:3000/api/products/${userSub}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productId }),
                });

                if (response.ok) {
                    // Call the parent component's onDelete callback to refresh the list
                    onDelete();
                } else {
                    const errorData = await response.json();
                    alert('Failed to delete product: ' + errorData.error);
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product. Please try again.');
            }
        }
    };

    const handleCardClick = () => {
        if (productUrl) {
            const affiliateUrl = getAffiliateLink(productUrl);
            window.open(affiliateUrl, '_blank');
        }
    };

    return (
        <>
            <div 
                className="w-52 h-64 flex flex-col border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={handleCardClick}
            >
                <div className="relative w-full h-52 flex justify-center items-center bg-white">
                    
                    {/* Delete button in top right */}
                    <button
                        onClick={handleDelete}
                        className="absolute top-1 right-1 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors duration-200 text-xs"
                        title="Delete product"
                    >
                        ×
                    </button>
                    
                    <img alt="product image" src={productImg} className="w-full h-full object-contain" />
                </div>

                {/* Separate bottom info bar */}
                <div className="bg-stone-950 w-full h-12 flex gap-2 justify-between items-center p-2">
                    <span className="font-bold text-white text-xs line-clamp-2">{productName}</span>
                    <span className="text-white text-xs whitespace-nowrap">{productPrice}</span>
                </div>
            </div>
        </>
    )
}

export default ProductCard;