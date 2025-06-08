import React from 'react';

const ProductCard = ({ productName, productImg, productPrice }) => {

    return (
        <>
            <div className="aspect-square w-full">
                <div className="relative border w-full h-full flex justify-center items-center">
                    
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