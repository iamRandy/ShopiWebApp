import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

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
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                console.error('Error trying to fetch login data:', error);
            });

        } catch(e) {
            console.error("Error during login success", e);
        }
    }

    return (
        <>
            <div className="w-full h-screen flex text-center justify-center items-center">
                <div className="border w-1/2 h-1/3 rounded-lg p-8 flex flex-col gap-3">
                    <h3 className="text-2xl font-bold">Sign in</h3>
                    <div className="flex justify-center" style={{ colorScheme: "light" }}>
                        <GoogleLogin
                        onSuccess = {(credentialResponse) => {
                            console.log(credentialResponse);
                            console.log(jwtDecode(credentialResponse.credential));
                            loginSuccess(credentialResponse);
                            navigate("home");
                        }}
                        onError = {() => console.log("login failed")}
                        auto_select = {true}
                        shape="rectangular"
                        logo_alignment="center" />
                    </div>
                </div>
            </div>
        </>
    )
};

export default Login;