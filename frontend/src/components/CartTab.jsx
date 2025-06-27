import { motion } from "framer-motion";

const CartTab = ({ cartId, title, icon, selected, handleCartSelect }) => {
    const handleClick = () => {
        handleCartSelect(cartId);
    }
    
    return (
        <motion.div 
            id={cartId}
            initial={{ translateX: 0, border: "0px" }}
            whileHover= {{ border: !selected ? "1px solid white" : "0px" }}
            whileTap={{ translateX: !selected ? -10 : 0, border: "0px" }}
            transition={{ duration: 0.1, ease: "easeInOut" }}
            onClick={handleClick}
            className={`${selected ? "w-full justify-end" : "w-[150px] justify-start"} flex items-center gap-2 top-0 left-0 
            h-[60px] bg-blue-500 rounded-r-lg -ml-9 px-4 overflow-hidden`}>
            <div className="flex-shrink-0">
                {icon}
            </div>
            <span className="text-white text-xl font-bold truncate">{title}</span>
        </motion.div>
    )
}

export default CartTab;