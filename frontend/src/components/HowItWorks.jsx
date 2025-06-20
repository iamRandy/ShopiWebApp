export default function HowItWorks() {
    const Step = ({ number, title, description }) => (
        <div className="flex items-start">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 border border-white/20">
                    <span className="text-xl font-bold">{number}</span>
                </div>
            </div>
            <div className="ml-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-gray-400">{description}</p>
            </div>
        </div>
    );

    return (
        <section className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold">Get Started in Seconds</h2>
                    <p className="text-gray-400 mt-4">The hardest part is choosing your favorite store! We got you covered with the rest.</p>
                </div>
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                    <Step number="1" title="Install the Extension" description="Click the 'Add to Chrome' button to install from the Chrome Web Store." />
                    <Step number="2" title="Start Shopping" description="After installing, Avee will pop up on all your favorite retail sites automatically!" />
                </div>
            </div>
        </section>
    );
} 