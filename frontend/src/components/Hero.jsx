import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';

export default function Hero() {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClick = (action) => {
        switch (action) {
            case 'getStarted':
                navigate('/login');
                break;
            case 'home':
                // Check if user is authenticated before navigating to home
                const token = localStorage.getItem('authToken');
                if (token) {
                    // Optionally, we could also verify if the token is still valid
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        const currentTime = Math.floor(Date.now() / 1000);
                        
                        if (payload.exp && payload.exp > currentTime) {
                            // Token is valid, navigate to home
                            navigate('/home');
                        } else {
                            // Token is expired, clear it and go to login
                            localStorage.removeItem('authToken');
                            localStorage.removeItem('userSub');
                            localStorage.removeItem('userEmail');
                            localStorage.removeItem('userName');
                            navigate('/login');
                        }
                    } catch (error) {
                        // Token is invalid, clear it and go to login
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userSub');
                        localStorage.removeItem('userEmail');
                        localStorage.removeItem('userName');
                        navigate('/login');
                    }
                } else {
                    // No token found, redirect to login
                    navigate('/login');
                }
                break;
            default:
                break;
        }
    }

    const transition = {
        duration: 1,
        ease: "easeInOut",
      };

    return (
        <section className="min-h-screen flex items-center justify-center text-center">
            <motion.div
            animate={{ 
                translateY: ["20px", "-20px", "20px"],
                rotate: [5, -5, 5],
             }}
             
            transition={{
                duration: 5,
                ease: "easeInOut",
                repeat: Infinity,
            }}
            className="container px-6 ml-20">
                <img src='/images/Avee.png' alt="Avee" className="w-1/2 h-1/2 mx-auto" />
            </motion.div>
        
            <div className="container px-6 mr-20">
                <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition} className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                    Meet Avee, your new online shopping assistant.
                </motion.h1>

                <div className="flex flex-col mt-10 gap-2">
                    <motion.button 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4, ease: "easeInOut", delay: 2 }}
                        onClick={() => handleClick('getStarted')}
                        className="w-2/3 mx-auto inline-flex items-center justify-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-3xl text-lg shadow-lg"
                    >
                        GET STARTED
                    </motion.button>
                    <motion.button 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4, ease: "easeInOut", delay: 3 }}
                        onClick={() => handleClick('home')}
                        className="w-2/3 mx-auto inline-flex items-center justify-center px-8 py-4 bg-transparent border-4 border-amber-500 hover:bg-amber-400 text-amber-500 hover:text-white font-bold rounded-3xl text-lg shadow-lg"
                    >
                        I ALREADY HAVE AN ACCOUNT
                    </motion.button>
                </div>
                {!isScrolled && <motion.div 
                    initial={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut", delay: 10 }}
                    className="absolute bottom-10 left-0 w-full text-center mt-12">
                    <p className="text-gray-500 font-bold">Wanna closer look?</p>
                </motion.div>}
            </div>
        </section>
    );
} 