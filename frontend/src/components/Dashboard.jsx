import ProductArea from "./ProductArea";
import CartArea from "./CartArea";
import { ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";
import { authenticatedFetch } from "../utils/api";
import { AnimatePresence, motion } from "framer-motion";

const Dashboard = () => {

  console.log("DASHBOARD HIT");

  // const [carts, setCarts] = useState([]);
  // const [selectedCart, setSelectedCart] = useState(null); // cart id
  // const [selectedCartObj, setSelectedCartObj] = useState(null); // cart obj
  // const [selectedCartProducts, setSelectedCartProducts] = useState([]); // cart products
  // const [loading, setLoading] = useState(true);

  const { data: carts, isLoading } = useQuery({
    queryKey: ['carts'],
    queryFn: async () => {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await authenticatedFetch(`${API_URL}/api/carts`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
  });

  const [selectedCartId, setSelectedCartId] = useState(null);
  const [hideSidebar, setHideSidebar] = useState(false);

  const activeId = selectedCartId || carts?.[0]?.id;
  console.log("CONTROL: " + selectedCartId);
  const selectedCartObj = carts?.find(cart => cart.id === activeId);
  const selectedCartProducts = selectedCartObj?.products || [];

  if (isLoading && !carts) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading carts from storage...
      </div>
    );
  }

  // If we aren't loading but carts is still somehow null/empty
  if (!isLoading && (!carts || carts.length === 0)) {
    return <div>No carts found. Create your first one!</div>;
  }
  // useEffect(() => {
  //   const fetchCarts = async () => {
  //     setLoading(true);
  //     try {
  //       const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  //       const response = await authenticatedFetch(`${API_URL}/api/carts`);
  //       const data = await response.json();
  //       setCarts(data);
  //       setSelectedCart(data?.[0]?.id || null); // Select first cart by default
  //       setSelectedCartObj(data?.[0] || null);
  //       setSelectedCartProducts(data?.[0]?.products || []);
  //       setLoading(false);
  //     } catch (error) {
  //       console.error("Error fetching carts:", error);
  //       setLoading(false);
  //     }
  //   };
  //   fetchCarts();
  // }, []);

  // Swap between carts and their products
  // const cartSelected = async (cartId) => {
  //   setSelectedCartId(cartId);
    // try {
    //   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    //   const response = await authenticatedFetch(
    //     `${API_URL}/api/carts/selectCart`,
    //     {
    //       method: "POST",
    //       body: JSON.stringify({ cartId }),
    //     }
    //   );
    //   const data = await response.json();
    //   setSelectedCartObj(data);
    //   setSelectedCartProducts(data?.products || []);
    //   // console.log("cartSelected: new products", data?.products);
    // } catch (error) {
    //   console.error("Error selecting cart:", error);
    // }
  // };

  // const getIconByName = (name, props) => {
  //   const LucideIcon = Icons[name];
  //   return LucideIcon ? (
  //     <LucideIcon {...props} />
  //   ) : (
  //     <Icons.ShoppingCart {...props} />
  //   );
  // };

  return (
    <div className="p-9 mt-16 relative">
      <div className="relative text-black">
        <div className="absolute right-0 top-0 flex items-center justify-start h-[60px]">
          <motion.button
            className="m-0 p-0 bg-transparent"
            onClick={() => setHideSidebar((prev) => !prev)}
          >
            {/* Allows user to expand and minimize sidebar
                        <ChevronRight strokeWidth={3} className={`${hideSidebar ? "rotate-180 hover:rotate-0" : "hover:rotate-180"} transition-all ease-in-out duration-300`} />
                    */}
          </motion.button>
        </div>

        <div className="grid grid-cols-6 pb-8 text-black">
          {!hideSidebar && <div className="col-span-1"></div>}
          <div className="col-span-5 flex flex-col items-start gap-2">
            <p className="tracking-wide text-4xl whitespace-nowrap font-bold">
              Your Carts
            </p>
            {/* TODO: Implement description for each cart */}
            <p className="text-stone-400">See everything in one place.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6">
        {!hideSidebar && (
          <div className="flex flex-col col-span-1 gap-2">
            {!isLoading && (
              <CartArea
                carts={carts}
                selectedCart={activeId}
                cartSelected={setSelectedCartId}
              />
            )}
          </div>
        )}
        <div className={hideSidebar ? "col-span-6" : "col-span-5"}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64 text-lg text-black">
              Loading products...
            </div>
          ) : (
            selectedCartProducts && (
              <ProductArea
                products={selectedCartProducts}
                cartId={selectedCartId}
                hideSidebar={hideSidebar}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
