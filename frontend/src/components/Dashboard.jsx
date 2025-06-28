import ProductArea from "./ProductArea";
import CartArea from "./CartArea";
import { SlidersHorizontal, Search, ShoppingCart } from "lucide-react";
import * as Icons from "lucide-react";
import { useState, useEffect } from "react";
import { authenticatedFetch } from "../utils/api";

const Dashboard = () => {
    const [carts, setCarts] = useState([]);
    const [selectedCart, setSelectedCart] = useState(null);
    const [selectedCartObj, setSelectedCartObj] = useState(null);
    const [selectedCartProducts, setSelectedCartProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // const selectedCartObj = carts.find(cart => cart.id === selectedCart);
    // const selectedCartProducts = selectedCartObj?.products || [];
    // console.log("selectedCartProducts", selectedCartProducts);
    useEffect(() => {
        const fetchCarts = async () => {
            setLoading(true);
            const response = await authenticatedFetch("http://localhost:3000/api/carts");
            const data = await response.json();
            setCarts(data);
            setSelectedCart(data?.[0]?.id || null); // Select first cart by default
            setSelectedCartObj(data?.[0] || null);
            setSelectedCartProducts(data?.[0]?.products || []);
            setLoading(false);
        };
        fetchCarts();
    }, []);

    // Swap between carts and their products
    const cartSelected = async (cartId) => {
        setSelectedCart(cartId);
        const response = await authenticatedFetch("http://localhost:3000/api/carts/selectCart", {
            method: "POST",
            body: JSON.stringify({ cartId })
        });
        const data = await response.json();
        setSelectedCartObj(data);
        setSelectedCartProducts(data?.products || []);
        console.log("cartSelected: new products", data?.products);
    }


    const getIconByName = (name, props) => {
        const LucideIcon = Icons[name];
        return LucideIcon ? <LucideIcon {...props} /> : <Icons.ShoppingCart {...props} />;
    }

    return (
        <div className="p-9 mt-12 relative">
            <div className="grid grid-cols-6 text-black">
                <div className="col-span-1 flex items-end pb-1">
                    <p className="text-2xl font-bold">Your Carts</p>
                </div>
                <div className="col-span-5 pb-1 h-[60px]">
                    <div
                        style={{ backgroundColor: `${selectedCartObj?.color}` }}
                        className="relative h-full w-full flex items-center rounded-lg text-white p-3">
                        {/* Left buttons */}
                        <div className="flex gap-2">
                            <button className="bg-transparent p-1">
                                <SlidersHorizontal className="w-[24px] h-[24px] scale-100 hover:scale-110 transition-all duration-200" />
                            </button>
                            <button className="bg-transparent p-1">
                                <Search className="w-[24px] h-[24px] scale-100 hover:scale-110 transition-all duration-200" />
                            </button>
                        </div>
                        {/* Centered title */}
                        <div className="tracking-wide absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl whitespace-nowrap flex items-center gap-4">
                            {getIconByName(selectedCartObj?.icon, { className: "w-[32px] h-[32px]" }) || <ShoppingCart className="w-[28px] h-[28px]" />}
                            <p>{selectedCartObj?.name || "Unnamed Cart"}</p>
                        </div>
                        {/* Right spacer to balance the left buttons */}
                        <div className="flex gap-2 opacity-0">
                            <button className="bg-transparent">
                                <SlidersHorizontal className="w-[20px] h-[20px]" />
                            </button>
                            <button className="bg-transparent">
                                <Search className="w-[20px] h-[20px]" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
            <div className="grid grid-cols-6"> 
                
                <div className="flex flex-col col-span-1 gap-2">
                    {!loading && (
                        <CartArea
                            carts={carts}
                            selectedCart={selectedCart}
                            cartSelected={cartSelected}
                        />
                    )}
                </div>

                <div className="col-span-5">
                    {loading ? (
                        <div className="flex justify-center items-center h-64 text-lg text-black">Loading products...</div>
                    ) : (
                        selectedCartProducts && <ProductArea productIds={selectedCartProducts} />
                    )}
                </div>

            </div>
        </div>
    );
}

export default Dashboard;