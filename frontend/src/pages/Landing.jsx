// Landing Page
import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import LandingEnd from '../components/LandingEnd';

export default function Landing() {

    return (
        <div className="overflow-hidden bg-primary text-black">
            <NavBar isLanding={true} />
            <main className="md:mt-0">
                <Hero />
                <Features />    {/* Renamed to "Save" in nav */}
                <HowItWorks />  {/* Renamed to "Organize" in nav */}
                <LandingEnd />
            </main>
            <Footer />
        </div>
    );
}