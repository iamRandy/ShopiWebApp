// Landing Page
import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';

export default function Landing() {

    return (
        <div className="bg-primary text-black">
            <NavBar isLanding={true} />
            
            <main className="md:mt-0">
                <Hero />
                <Features />
                <HowItWorks />
            </main>
            
            <Footer />
        </div>
    );
}