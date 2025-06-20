import { useNavigate } from 'react-router-dom';

// Navbar will be different on the landing page
const NavBar = ({ isLanding }) => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userSub = localStorage.getItem('userSub') || '';

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
            <nav className="fixed top-3 left-0 right-0 z-50 h-fit w-[95%] mx-auto">
                <div className="flex w-full items-center justify-between rounded-full 
                border border-white/20 bg-white/10 p-4 px-10 text-white backdrop-blur-lg shadow-lg gap-10">
                    
                    {/* Left side */}
                    <div className="flex items-center gap-3 w-fit">
                        <p className="text-2xl font-bold">shopi</p>
                    </div>

                    <div className="flex w-full justify-center items-center gap-3">
                        <div className="text-lg">Integrations</div>
                        <div className="text-lg">How it works</div>
                        <div className="text-lg">FAQs</div>
                    </div>

                    {/* Right side */}
                    <div className="w-fit flex justify-end">
                        <div className="flex gap-3 items-center">
                            <div className="text-sm">
                                <div className="font-medium">{userName}</div>
                                <div className="text-xs text-gray-500">{userEmail}</div>
                            </div>
                            {!isLanding && (
                            <>
                                <button 
                                    onClick={testExtensionCommunication}
                                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                                >
                                    Test Extension
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                >
                                    Logout
                                </button>
                            </>
                            )}
                        </div>
                    </div>

                </div>
            </nav>
        </>
    )
}

export default NavBar;