import { ChromeIcon } from 'lucide-react';
import { motion } from "framer-motion";

export default function Hero() {
    const transition = {
        duration: 1.5,
        ease: "easeInOut",
      };

    return (
        <section className="min-h-screen flex items-center justify-center text-center">
            <div className="container mx-auto px-6">
                <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition} className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
                    Meet Avee, your new online shopping assistant
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...transition, delay: 1 }} className="text-md md:text-lg text-gray-400 max-w-3xl mx-auto mb-8">
                    Save time, stay organized, and shop smarter.
                </motion.p>
                <a 
                    href="https://chrome.google.com/webstore" //temp link for now
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 bg-orange-400 hover:text-white text-white font-bold rounded-full text-lg transition-transform transform hover:scale-105 shadow-lg"
                >
                    <ChromeIcon className="w-6 h-6 mr-3" />
                    Add to Chrome - It's Free!
                </a>
            </div>
        </section>
    );
} 