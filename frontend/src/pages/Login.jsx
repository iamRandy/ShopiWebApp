// ShopiWebApp/frontend/src/pages/Login.jsx
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const EXT_ID = import.meta.env.VITE_EXTENSION_ID;

const Login = () => {
  // function handleLogout() {
  //     googleLogout(); << import this with GoogleLogin
  // }

  const navigate = useNavigate();

  function loginSuccess(cRes) {
    try {
      fetch("http://localhost:3000/api/login/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cRes.credential }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
        })
        .catch((error) => {
          console.error("Error trying to fetch login data:", error);
        });
    } catch (e) {
      console.error("Error during login success", e);
    }
  }

  const sendUserSubToExtension = (userSub) => {
    console.log("Sending userSub to extension:", userSub);
    console.log("Extension ID:", EXT_ID);
    
    // Send message to extension using chrome.runtime.sendMessage with extension ID
    if (window.chrome?.runtime?.sendMessage && EXT_ID) {
      console.log("Sending message to extension via chrome.runtime.sendMessage");
      window.chrome.runtime.sendMessage(
        EXT_ID,
        { type: "SET_SUB", sub: userSub },
        (response) => {
          console.log("Extension response:", response);
          if (chrome.runtime.lastError) {
            console.error("Extension communication error:", chrome.runtime.lastError);
          } else {
            console.log("Successfully sent userSub to extension");
          }
        }
      );
    } else {
      console.error("Cannot send message to extension:", {
        chrome: !!window.chrome,
        runtime: !!window.chrome?.runtime,
        sendMessage: !!window.chrome?.runtime?.sendMessage,
        EXT_ID: EXT_ID
      });
    }
  };

  return (
    <>
      <div className="w-full h-screen flex text-center justify-center items-center">
        <div className="border w-1/2 h-1/3 rounded-lg p-8 flex flex-col gap-3">
          <h3 className="text-2xl font-bold">Sign in</h3>
          <div className="flex justify-center" style={{ colorScheme: "light" }}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                console.log(credentialResponse);
                const decoded = jwtDecode(credentialResponse.credential);
                console.log("Decoded user data:", decoded);
                console.log("Extension ID:", EXT_ID);
                
                // Send userSub to extension
                sendUserSubToExtension(decoded.sub);
                
                // Store user sub in localStorage for use in other components
                localStorage.setItem('userSub', decoded.sub);
                localStorage.setItem('userEmail', decoded.email);
                localStorage.setItem('userName', decoded.name);
                console.log(decoded);
                loginSuccess(credentialResponse);
                navigate("home");
              }}
              onError={() => console.log("login failed")}
              auto_select={true}
              shape="rectangular"
              logo_alignment="center"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
