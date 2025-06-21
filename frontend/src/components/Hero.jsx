import { ChromeIcon } from 'lucide-react';
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';

export default function Hero() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const transition = {
        duration: 1,
        ease: "easeInOut",
      };

    return (
        <section className="min-h-screen flex items-center justify-center text-center">
            <div className="container mx-auto px-6">
                <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition} className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                    Meet Avee 🦆, your new online shopping assistant.
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...transition, delay: 1 }} className="text-md md:text-lg text-gray-500 max-w-3xl mx-auto mb-8">
                    Save time, stay organized, and shop smarter.
                </motion.p>
                <motion.a 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4, ease: "easeInOut", delay: 2 }}
                    href="https://chrome.google.com/webstore" //temp link for now
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-full text-lg shadow-lg"
                >
                    <ChromeIcon className="w-6 h-6 mr-3" />
                    Add to Chrome — It's Free!
                </motion.a>
                {!isScrolled && <motion.div 
                    initial={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut", delay: 5 }}
                    className="absolute bottom-10 left-0 w-full text-center mt-12">
                    <p className="text-gray-500">Still not convinced?</p>
                </motion.div>}
            </div>
        </section>
    );
} 