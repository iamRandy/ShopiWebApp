import ProductArea from "./ProductArea";
import CartTab from "./CartTab";
import { Globe, ShoppingCart, Plus, SlidersHorizontal, Search } from "lucide-react";
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
            <div className="grid grid-cols-6 text-black">
                <div className="col-span-1"></div>
                <div className="col-span-5 pb-1">
                    <div className="relative w-full flex items-center">
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
                        <p className="tracking-wider absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold whitespace-nowrap">
                            Your Carts
                        </p>
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

            {/* Navigation between carts */}
            <div className="grid grid-cols-6"> 
                <div className="flex flex-col col-span-1 gap-2">
                    <CartTab 
                        cartId='0' 
                        title="Everything!" 
                        icon={<Globe className="w-[28px] h-[28px]" />} 
                        selected={selectedCart === '0'}
                        handleCartSelect={handleCartSelect} 
                        color="bg-blue-500"
                    />
                    <CartTab 
                        cartId='1' 
                        title="My cart!" 
                        icon={<ShoppingCart className="w-[28px] h-[28px]" />} 
                        selected={selectedCart === '1'}
                        handleCartSelect={handleCartSelect} 
                        color="bg-green-400"
                    />
                    {/* add cart button */}
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