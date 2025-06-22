import { motion, useInView } from "framer-motion";
import { useRef } from "react";

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

    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
            },
        },
    };

    return (
        <section ref={ref} id="how-it-works" className="min-h-screen flex items-center justify-center">
            <motion.div
                className="container mx-auto px-6"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <h2 className="text-4xl font-bold">How Avee Works</h2>
                    <p className="text-gray-500 mt-4">Avee can help you make even the most complex shopping decisions, easier.</p>
                </motion.div>
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                    <motion.div variants={itemVariants}>
                        <Step number="1" title="Install the Extension" description="Click the 'Add to Chrome' button to install from the Chrome Web Store." />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <Step number="2" title="Start Shopping" description="After installing, Avee will pop up on all your favorite retail sites automatically!" />
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
} 