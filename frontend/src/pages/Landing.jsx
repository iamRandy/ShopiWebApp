// Landing Page
import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import LandingEnd from '../components/LandingEnd';

export default function Landing() {

    return (
        <div className="bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
            <NavBar isLanding={true} />
            <main className="md:mt-0">
                <Hero />
                <Features />
                <HowItWorks />
                <LandingEnd />
            </main>
            <Footer />
        </div>
    );
}