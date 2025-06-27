import { Globe, ShoppingCart, Plus } from "lucide-react";
import { authenticatedFetch } from "../utils/api";
import CartTab from "./CartTab";
import { useState, useEffect } from "react";
import * as Icons from "lucide-react";

const CartArea = ({ selectedCart, setSelectedCart }) => {
    const [ carts, setCarts ] = useState([]);
    const [ error, setError ] = useState(null);

    const fetchCarts = async () => {
        console.log("grabbing cart data");
        try {
            const response = await authenticatedFetch("http://localhost:3000/api/carts");
            if (!response.ok) {
                throw new Error("Failed to fetch carts");
            }
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error("Error fetching carts:", error);
        }
    }

    
    const getIconByName = (name, props) => {
        const LucideIcon = Icons[name];
        return LucideIcon ? <LucideIcon {...props} /> : <Icons.ShoppingCart {...props} />;
    }
    
    if (error) {
        return (
            <div className="w-full">
                <p className="w-full text-center text-red-500 font-bold">{error}</p>
            </div>
        );
    }
    
    useEffect(() => {
        fetchCarts();
    }, [fetchCarts]);

    return (
        <>
            {carts.map((cart) => (
                <CartTab 
                    key={cart.id}
                    cartId={cart.id} 
                    title={cart.name || "Unnamed Cart"}
                    icon={getIconByName(cart.icon, { className: "w-[28px] h-[28px]" }) || <ShoppingCart className="w-[28px] h-[28px]" />} 
                    selected={selectedCart === '0'}
                    handleCartSelect={setSelectedCart} 
                    color={`bg-${cart.color}`}
                />
            ))}

            <CartTab 
                    cartId='0' 
                    title="Everything!" 
                    icon={<Globe className="w-[28px] h-[28px]" />} 
                    selected={selectedCart === '0'}
                    handleCartSelect={setSelectedCart} 
                    color="bg-blue-500"
            />
            <CartTab 
                cartId='1' 
                title="My cart!" 
                icon={<ShoppingCart className="w-[28px] h-[28px]" />} 
                selected={selectedCart === '1'}
                handleCartSelect={setSelectedCart} 
                color="bg-green-400"
            />

            {/* -- Add Cart Button -- */}
            <CartTab 
                cartId='addCart' 
                title="add cart" 
                icon={<Plus className="w-[28px] h-[28px] text-black" />} 
                selected={selectedCart === 'addCart'}
                handleCartSelect={setSelectedCart} 
            />
        </>
    )
}

export default CartArea;