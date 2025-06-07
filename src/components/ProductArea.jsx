import ProductCard from './ProductCard';

const ProductArea = () => {
    return (
        <>
            <div className="p-3 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3" id="product-canvas">
                <ProductCard />
                <ProductCard />
                <ProductCard />
                <ProductCard />
                <ProductCard />
                <ProductCard />
                <ProductCard />
                <ProductCard />
            </div>
        </>
    )
}

export default ProductArea;