// Landing Page
import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';

export default function Landing() {
    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <NavBar isLanding={true} />
            
            <main>
                <Hero />
                <Features />
                <HowItWorks />
            </main>
            
            <Footer />
        </div>
    );
}