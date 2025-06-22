import { User, Blocks, BadgeQuestionMark, Cog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const NavBar = ({ isLanding }) => {
    const navigate = useNavigate();
    const authToken = localStorage.getItem('authToken');
    const isAuthenticated = !!authToken;

    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userSub = localStorage.getItem('userSub') || '';
    const [isScrolled, setIsScrolled] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const clearExtensionStorage = () => {
        const EXT_ID = import.meta.env.VITE_EXTENSION_ID;
        console.log("Clearing extension storage");
        
        if (window.chrome?.runtime?.sendMessage && EXT_ID) {
            window.chrome.runtime.sendMessage(
                EXT_ID,
                { type: "CLEAR_STORAGE" },
                (response) => {
                    console.log("Extension storage clear response:", response);
                    if (chrome.runtime.lastError) {
                        console.error("Extension storage clear error:", chrome.runtime.lastError);
                    } else {
                        console.log("Extension storage cleared successfully");
                    }
                }
            );
        } else {
            console.error("Cannot clear extension storage:", {
                chrome: !!window.chrome,
                runtime: !!window.chrome?.runtime,
                sendMessage: !!window.chrome?.runtime?.sendMessage,
                EXT_ID: EXT_ID
            });
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleLogout = () => {
        // Clear extension storage first
        clearExtensionStorage();
        
        // Clear web app localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userSub');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        
        // Navigate to login page
        navigate('/login');
    };

    const testExtensionCommunication = () => {
        const EXT_ID = import.meta.env.VITE_EXTENSION_ID;
        console.log("Testing extension communication with userSub:", userSub);
        console.log("Extension ID:", EXT_ID);
        
        if (window.chrome?.runtime?.sendMessage && EXT_ID && userSub) {
            console.log("Sending test message to extension");
            window.chrome.runtime.sendMessage(
                EXT_ID,
                { type: "SET_SUB", sub: userSub },
                (response) => {
                    console.log("Extension test response:", response);
                    if (chrome.runtime.lastError) {
                        console.error("Extension test error:", chrome.runtime.lastError);
                    } else {
                        console.log("Test message sent successfully to extension");
                    }
                }
            );
        } else {
            console.error("Cannot test extension communication:", {
                chrome: !!window.chrome,
                runtime: !!window.chrome?.runtime,
                sendMessage: !!window.chrome?.runtime?.sendMessage,
                EXT_ID: EXT_ID,
                userSub: userSub
            });
        }
    };

    return (
        <>
            <motion.nav 
                className="text-black fixed top-3 left-0 right-0 z-50 h-fit mx-auto"
                animate={{ width: isScrolled ? '140px' : '95%' }}
                transition={{ duration: .8, ease: "easeInOut" }}
            >
                <div
                    className="flex w-full items-center justify-between rounded-full 
                border border-stone-500/20 bg-white/10 p-4 px-10 backdrop-blur-lg shadow-lg gap-10">
                    
                    {/* Left side */}
                    <div className="flex items-center gap-3 w-fit">
                        <a href="#" className="text-2xl font-bold">shopi</a>
                    </div>

                    <AnimatePresence>
                        {!isScrolled && (
                            <>
                                <motion.div 
                                    className="flex flex-1 justify-center md:gap-10 sm:gap-5 lg:gap-10 items-center whitespace-nowrap"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: 0.2 }}
                                >
                                    <a href="#" className="text-lg flex gap-1 items-center special_links">
                                        <Blocks className="w-5 h-5" />
                                        Integrations
                                    </a>
                                    <a href="#features" className="text-lg flex gap-1 items-center special_links">
                                        <Cog className="w-5 h-5" />
                                        How it works
                                    </a>
                                    <a href="#how-it-works" className="text-lg flex gap-1 items-center special_links">
                                        <BadgeQuestionMark className="w-5 h-5" />
                                        FAQs
                                    </a>
                                </motion.div>

                                <motion.div
                                    className="w-fit flex justify-end whitespace-nowrap"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: 0.2 }}
                                >
                                    <div className="flex gap-3 items-center">
                                        <User className="w-5 h-5" />
                                        {isAuthenticated &&
                                        <div className="text-sm">
                                            <div className="font-medium">{userName}</div>
                                            <div className="text-xs text-gray-500">{userEmail}</div>
                                        </div>}
                                        {(
                                        <>
                                            {/* <button 
                                                onClick={testExtensionCommunication}
                                                className="text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
                                            >
                                                Test Extension
                                            </button> */}
                                            {( isAuthenticated ? <button 
                                                onClick={handleLogout}
                                                className="text-sm bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                                            >
                                                Logout
                                            </button> : <button 
                                                onClick={handleLogin}
                                                className="text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
                                            >
                                                Login
                                            </button>)}
                                        </>
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </motion.nav>
        </>
    )
}

export default NavBar;