import { motion } from "framer-motion";

const CartTab = ({ cartId, title, icon, handleCartSelect, selected }) => {

    return (
        <>
            {(cartId === "addCart") ? (
                <motion.div
                    initial={{ translateX: 0 }}
                    whileHover={{ translateX: -5 }}
                    transition={{ duration: 0.1, ease: "easeInOut" }}
                    id={cartId}
                    onClick={() => handleCartSelect(cartId)}
                    style={{ borderColor: "#57382a" }}
                    className="w-full flex justify-center items-center gap-2
                    top-0 left-0 h-[60px] bg-transparent rounded-r-lg -ml-9 px-4
                    border-2 border-dotted border-l-0 cursor-pointer">
                    <motion.div 
                    initial={{rotate: 0}}
                    whileHover={{rotate: 180}}
                    transition={{ duration: .2, ease: "linear" }}
                    className="flex-shrink-0">
                        {/* make icon #6b4736 */}
                        {icon}
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div 
                    id={cartId}
                    initial={false}
                    animate={{ translateX: selected ? -10 : 0 }}
                    whileHover={{ translateX: selected ? -15 : -5 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onClick={() => handleCartSelect(cartId)}
                    className={`w-full border-r-4 hover:border-r-8 justify-end flex items-center gap-2 top-0 
                    left-0 h-[60px] rounded-r-lg -ml-9 px-4 cursor-pointer text-black 
                    ${selected ? "opacity-100 border-[#FFBC42]" : "opacity-25 border-black"}`}>
                    <div className="flex-shrink-0">
                        {icon}
                    </div>
                    <span className="text-xl font-bold truncate">{title}</span>
                </motion.div>
            )}
        </>
    )
}

export default CartTab;