import { AnimatePresence, motion } from "framer-motion";

const Loading = ({ message }) => {

  return (
    <div className="flex items-center flex-col">
      <motion.img
        animate={{ rotateZ: [0,360] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        className="object-cover h-20 w-20"
        src="/images/Avee.png">
      </motion.img>
      <div className="text-blue-500">
        {message}
      </div>
    </div>
  );
}

export default Loading;
