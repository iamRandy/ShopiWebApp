import { Download, CheckCircle, Group } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeatureCard = ({ icon, title, description, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: delay }}
        className="flex flex-col items-center p-6 text-center bg-white/5 rounded-lg shadow-md">
        <div className="p-4 bg-gray-300/5 rounded-full border border-stone-500/20 mb-4">
            {icon}
        </div>
        <h3 
            className="text-xl font-semibold mb-2"
        >
            {title}
        </h3>
        <p className="text-gray-500">{description}</p>
    </motion.div>
);

export default function Features() {
    return (
        <section id="features" className="min-h-screen flex items-center justify-center text-center">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold">Why You'll Love It</h2>
                    <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
                        We can help you make even the most complex shopping decisions easier.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Group className="w-8 h-8 text-yellow-400" />}
                        title="Your cart, in one place"
                        description="Have multiple carts from different stores in one place. No more switching between tabs to check your cart."
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={<CheckCircle className="w-8 h-8 text-green-400" />}
                        title="Easy to Use"
                        description="A simple and intuitive interface that gets you started in seconds. No complicated setup required."
                        delay={0.6}
                    />
                    <FeatureCard
                        icon={<Download className="w-8 h-8 text-blue-400" />}
                        title="One-Click Install"
                        description="Get up and running with a single click from the Chrome Web Store. It's that simple."
                        delay={1}
                    />
                </div>
            </div>
        </section>
    );
} 