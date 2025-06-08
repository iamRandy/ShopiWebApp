import ProductCard from './ProductCard';

const ProductArea = () => {
    return (
        <>
            <div className="p-3 grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3" id="product-canvas">
                <ProductCard 
                productName="Amazon_Product"
                productImg="https://avatars.githubusercontent.com/u/61592420?s=400&v=4"
                productPrice="$inf"
                />

                <ProductCard 
                productName="Amazon_Product"
                productImg="https://avatars.githubusercontent.com/u/61592420?s=400&v=4"
                productPrice="$inf"
                />
                <ProductCard 
                productName="Amazon_Product"
                productImg="https://avatars.githubusercontent.com/u/61592420?s=400&v=4"
                productPrice="$inf"
                />
                <ProductCard 
                productName="Amazon_Product"
                productImg="https://avatars.githubusercontent.com/u/61592420?s=400&v=4"
                productPrice="$inf"
                />
            </div>
        </>
    )
}

export default ProductArea;