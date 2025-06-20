import { Download, CheckCircle, Group } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
    <div className="flex flex-col items-center p-6 text-center bg-white/5 rounded-lg shadow-md">
        <div className="p-4 bg-white/10 rounded-full mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

export default function Features() {
    return (
        <section className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold">Why You'll Love It</h2>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                        We can help you make even the most complex shopping decisions easier.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Group className="w-8 h-8 text-yellow-400" />}
                        title="Your cart, in one place"
                        description="Have multiple carts from different stores in one place. No more switching between tabs to check your cart."
                    />
                    <FeatureCard
                        icon={<CheckCircle className="w-8 h-8 text-green-400" />}
                        title="Easy to Use"
                        description="A simple and intuitive interface that gets you started in seconds. No complicated setup required."
                    />
                    <FeatureCard
                        icon={<Download className="w-8 h-8 text-blue-400" />}
                        title="One-Click Install"
                        description="Get up and running with a single click from the Chrome Web Store. It's that simple."
                    />
                </div>
            </div>
        </section>
    );
} 