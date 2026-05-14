import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";

const CartTab = ({
  cartId,
  title,
  icon,
  handleCartSelect,
  handleCartEdit,
  selected,
}) => {
  return (
    <>
      {cartId === "addCart" ? (
        <motion.div
          initial={{ translateX: 0 }}
          whileHover={{ translateX: -5 }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
          id={cartId}
          onClick={() => handleCartSelect(cartId)}
          style={{ borderColor: "#57382a" }}
          className="flex h-[52px] w-full min-w-[5.5rem] shrink-0 cursor-pointer items-center
                    justify-center gap-2 rounded-xl border-2 border-dotted border-l-0
                    bg-transparent px-3 md:-ml-9 md:h-[60px] md:min-w-0 md:rounded-r-lg md:rounded-l-none md:px-4"
        >
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.2, ease: "linear" }}
            className="flex-shrink-0"
          >
            {/* make icon #6b4736 */}
            {icon}
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          id={cartId}
          initial={false}
          animate={{ translateX: 0 }}
          whileHover={{ translateX: -5 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          onClick={() => handleCartSelect(cartId)}
          className={`group relative flex h-[52px] w-full min-w-[10.5rem] shrink-0 cursor-pointer
                    items-center justify-end gap-2 rounded-xl border-r-4 pl-3 pr-6 text-black
                    hover:border-r-[6px] md:h-[60px] md:min-w-0 md:-ml-9 md:rounded-r-lg md:rounded-l-none
                    md:pl-4 md:pr-8 md:hover:border-r-8
                    ${
                      selected
                        ? "border-[#FFBC42] opacity-100"
                        : "border-black opacity-25"
                    }`}
        >
          <div className="flex-shrink-0">{icon}</div>
          <span className="mr-2 flex-1 truncate text-sm font-semibold md:text-xl md:font-bold">
            {title}
          </span>

          {/* 3-dot edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCartEdit(cartId);
            }}
            className={`absolute right-2 top-1/2 flex -translate-y-1/2 transform flex-shrink-0
                        rounded-full bg-gray-100 p-1 text-gray-600 transition-opacity duration-200
                        hover:bg-gray-200 hover:text-gray-800 max-md:opacity-100
                        ${
                          selected
                            ? "opacity-100"
                            : "opacity-0 md:group-hover:opacity-100"
                        }`}
            title="Edit cart"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </>
  );
};

export default CartTab;
