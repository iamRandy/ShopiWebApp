import { ChromeIcon } from 'lucide-react';
import { motion, easeInOut } from "motion/react";

export default function Hero() {
    const transition = {
        duration: 0.8,
        delay: 0.1,
        ease: [0, 0.71, 0.2, 1.01],
        type: "spring",
        stiffness: 100,
        damping: 10,
      };

    return (
        <section className="min-h-screen flex items-center justify-center text-center py-32">
            <div className="container mx-auto px-6">
                <motion.h1 initial={{ scale: 0 }} animate={{ scale: 1 }} transition={transition} className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                    Meet Avee, your shopping assistant :)
                </motion.h1>
                <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={transition} className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                    Save time, stay organized, and shop smarter.
                </motion.p>
                <a 
                    href="https://chrome.google.com/webstore" //temp link for now
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-lg transition-transform transform hover:scale-105 shadow-lg"
                >
                    <ChromeIcon className="w-6 h-6 mr-3" />
                    Add to Chrome - It's Free!
                </a>
            </div>
        </section>
    );
} 