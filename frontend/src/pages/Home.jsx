// ShopiWebApp/frontend/src/pages/Home.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import ProductArea from '../components/ProductArea';

const Home = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);

    return (
        <>
            <div className="h-full overflow-hidden">
                <Navbar />
                <ProductArea />
            </div>
        </>
    )
}

export default Home;