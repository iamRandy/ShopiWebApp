import ProductArea from "./ProductArea";
import CartArea from "./CartArea";
import { SlidersHorizontal, Search, ShoppingCart } from "lucide-react";
import * as Icons from "lucide-react";
import { useState, useEffect } from "react";
import { authenticatedFetch } from "../utils/api";

const Dashboard = () => {
    const [carts, setCarts] = useState([]);
    const [selectedCart, setSelectedCart] = useState(null); // cart id
    const [selectedCartObj, setSelectedCartObj] = useState(null); // cart obj
    const [selectedCartProducts, setSelectedCartProducts] = useState([]); // cart products
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
        <div className="p-9 mt-16 relative">
            <div className="grid grid-cols-6 text-black p-4">
                <div className="col-span-1 flex items-end">
                </div>
                <div className="col-span-5 h-[60px]">
                    <div className="relative h-full w-full flex items-center justify-start rounded-lg">
                        {/* Centered title */}
                        <p className="tracking-wide text-4xl whitespace-nowrap flex items-center gap-4 font-bold">Your Carts</p>
                        {/* <p className="tracking-wide text-4xl whitespace-nowrap flex items-center gap-4 font-bold"> DESCRIPTION </p> */}
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