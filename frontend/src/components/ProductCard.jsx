import React from 'react';

const ProductCard = ({ productName, productImg, productPrice, productId, onDelete }) => {

    const handleDelete = async () => {
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

    return (
        <>
            <div className="aspect-square w-full">
                <div className="relative border w-full h-full flex justify-center items-center">
                    
                    {/* Delete button in top right */}
                    <button
                        onClick={handleDelete}
                        className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors duration-200"
                        title="Delete product"
                    >
                        ×
                    </button>
                    
                    <img alt="product image" src={productImg} className="w-full h-full object-cover" />

                    <div className="absolute w-full h-full flex items-end">
                        <div className="bg-stone-950 w-full h-1/6 flex gap-2 justify-end items-end p-2">
                            <span className="font-bold">{productName}</span>
                            <span>{productPrice}</span>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}

export default ProductCard;