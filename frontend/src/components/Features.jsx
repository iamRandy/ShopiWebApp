import { Download, CheckCircle, Group } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'react-lottie';
import { useState, useEffect } from 'react';

const FeatureCard = ({ icon, title, description, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: delay }}
        className="flex flex-col items-center p-6 text-center bg-gray-100 rounded-lg shadow-md">

        <div className="p-4 bg-gray-50 rounded-full border border-stone-500/20 mb-4">
            {icon}
        </div>
        <h3 
            className="text-xl font-semibold mb-2"
        >
            {title}
        </h3>
        {/* <p className="text-gray-500">{description}</p> */}
    </motion.div>
);

export default function Features() {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        fetch('/lotties/shoppingLottie.json')
            .then(response => response.json())
            .then(data => setAnimationData(data));
    }, []);

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    };

    return (
        <section id="features" className="min-h-screen flex items-center justify-center text-center">
            <div className="container h-full mx-auto px-6 flex items-center">
                <div className="text-center ml-20">
                    <h2 className="text-4xl font-bold">Key Features</h2>
                    <p className="text-gray-500 mb-4 max-w-2xl mx-auto">
                        Avee can help you make even the most complex shopping decisions, easier.
                    </p>
                    {animationData && <Lottie options={defaultOptions} height={400} width={400} />}
                </div>
                <div className="grid gap-8 mx-auto">
                    <FeatureCard
                        icon={<Group className="w-8 h-8 text-yellow-400" />}
                        title="Your carts, in one place"
                        description="Have multiple carts from different stores in one place. No more switching between tabs to check your cart."
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={<CheckCircle className="w-8 h-8 text-green-400" />}
                        title="Easy to Use"
                        description="Click and go. Avee can help you make decisions later."
                        delay={0.6}
                    />
                    <FeatureCard
                        icon={<Download className="w-8 h-8 text-blue-400" />}
                        title="No Setup Required"
                        description="After the installation, Avee will automatically start popping up on your favorite retail websites. No futher setup needed!"
                        delay={1}
                    />
                </div>
            </div>
        </section>
    );
} 