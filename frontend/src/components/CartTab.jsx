import { motion } from "framer-motion";

const CartTab = ({ cartId, title, icon, selected, handleCartSelect, color }) => {

    return (
        <>
            {(cartId === "addCart") ? (
                <motion.div
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.1, ease: "easeInOut" }}
                id={cartId}
                onClick={() => handleCartSelect(cartId)}
                className="w-[150px] flex justify-center items-center gap-2
                top-0 left-0 h-[60px] bg-transparent rounded-r-lg -ml-9 px-4
                border-2 border-dotted border-black border-l-0 cursor-pointer">
                    <motion.div 
                    initial={{rotate: 0}}
                    whileHover={{rotate: 180}}
                    transition={{ duration: .2, ease: "linear" }}
                    className="flex-shrink-0">
                        {icon}
                    </motion.div>
                </motion.div>
            ) : (!selected &&
                <motion.div 
                    id={cartId}
                    initial={{ translateX: 0, border: "0px" }}
                    whileHover= {{ border: !selected ? "1px solid white" : "0px" }}
                    whileTap={{ translateX: !selected ? -10 : 0, border: "0px" }}
                    transition={{ duration: 0.1, ease: "easeInOut" }}
                    onClick={() => handleCartSelect(cartId)}
                    style={{ backgroundColor: color }}
                    className={`w-[150px] justify-start flex items-center 
                    gap-2 top-0 left-0 h-[60px] rounded-r-lg -ml-9 px-4 cursor-pointer`}>
                    <div className="flex-shrink-0">
                        {icon}
                    </div>
                    <span className="text-white text-xl font-bold truncate">{title}</span>
                </motion.div>
            )}
        </>
    )
}

export default CartTab;