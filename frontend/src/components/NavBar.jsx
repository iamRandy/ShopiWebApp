import { useNavigate } from 'react-router-dom';

const NavBar = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userSub = localStorage.getItem('userSub') || '';

    const handleLogout = () => {
        localStorage.removeItem('userSub');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        navigate('/');
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
            <nav className="h-fit w-screen">
                <div className="w-full bg-stone-50 p-4 px-10 flex justify-between items-end text-stone-950">
                    
                    {/* Left side */}
                    <div className="flex gap-3 items-center">
                        <p className="font-bold text-xl">Shopi</p>

                        <div className="links">
                            {/* <div className="text-sm">testing</div> */}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="w-full flex justify-end">
                        <div className="flex gap-3 items-center">
                            <div className="text-sm">
                                <div className="font-medium">{userName}</div>
                                <div className="text-xs text-gray-500">{userEmail}</div>
                            </div>
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
                        </div>
                    </div>

                </div>
            </nav>
        </>
    )
}

export default NavBar;