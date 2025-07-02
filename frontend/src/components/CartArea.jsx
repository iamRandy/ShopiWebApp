import { Globe, ShoppingCart, Plus } from "lucide-react";
import CartTab from "./CartTab";
import CartModal from "./CartModal";
import { useState } from "react";
import * as Icons from "lucide-react";

const CartArea = ({ carts, selectedCart, cartSelected }) => {
    const [ error, setError ] = useState(null);
    const [ isCartModalOpen, setIsCartModalOpen ] = useState(false);
    
    const handleCartSelect = (cartId) => {
        if (cartId === 'addCart') {
            console.log("create cart");
            setIsCartModalOpen(true);
        } else {
            console.log("cart selected:", cartId);
            cartSelected(cartId);
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
    
    return (
        <>
            {/* first cart is selected by default */}
            {carts.map((cart) => (
                <CartTab 
                    key={cart.id}
                    cartId={cart.id} 
                    title={cart.name || "Unnamed Cart"}
                    icon={getIconByName(cart.icon, { className: "w-[28px] h-[28px]" }) || <ShoppingCart className="w-[28px] h-[28px]" />} 
                    selected={selectedCart === cart.id}
                    handleCartSelect={handleCartSelect} 
                />
            ))}

            {/* -- Add Cart Button -- */}
            <CartTab 
                cartId='addCart' 
                title="add cart" 
                icon={<Plus className="w-[28px] h-[28px]" color="#57382a" />} 
                selected={selectedCart === 'addCart'}
                handleCartSelect={handleCartSelect} 
            />

            {isCartModalOpen && <CartModal getIconByName={getIconByName} isOpen={isCartModalOpen} onClose={() => setIsCartModalOpen(false)} />}
        </>
    )
}

export default CartArea;