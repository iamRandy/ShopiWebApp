import { motion } from "framer-motion";
import ProductArea from "./ProductArea";
import CartTab from "./CartTab";
import { Globe, ShoppingCart, Plus } from "lucide-react";
import { useState } from "react";

const Dashboard = () => {
    const [ selectedCart, setSelectedCart ] = useState(0);

    const handleCartSelect = (cartId) => {
        if (cartId === 'addCart') {
            console.log("create cart");
        } else {
            setSelectedCart(cartId);
        }
    }

    return (
        <div className="p-9 mt-12 relative">
            {/* Navigation between carts */}
            <div className="grid grid-cols-6"> 
                <div className="flex flex-col col-span-1 gap-2">
                    <CartTab 
                        cartId='0' 
                        title="Everything!" 
                        icon={<Globe className="w-[28px] h-[28px]" />} 
                        selected={selectedCart === '0'}
                        handleCartSelect={handleCartSelect} 
                    />
                    <CartTab 
                        cartId='1' 
                        title="My cart!" 
                        icon={<ShoppingCart className="w-[28px] h-[28px]" />} 
                        selected={selectedCart === '1'}
                        handleCartSelect={handleCartSelect} 
                    />
                    <CartTab 
                        cartId='addCart' 
                        title="add cart" 
                        icon={<Plus className="w-[28px] h-[28px] text-black" />} 
                        selected={selectedCart === 'addCart'}
                        handleCartSelect={handleCartSelect} 
                    />
                </div>


                <div className="col-span-5">
                    <ProductArea />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;