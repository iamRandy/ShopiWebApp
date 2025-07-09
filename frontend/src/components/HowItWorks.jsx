import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function HowItWorks() {
    const Piece = ({ videoSrc, title, description, alt }) => (
        <div className="w-full rounded-xl bg-slate-300 flex justify-center p-8">
            <div>
                <video
                className="rounded-xl mb-2"
                src={videoSrc} alt={alt || "demo video"} autoPlay loop muted playsInline />
                <p className="font-bold py-1">{title}</p>
                <p className="text-sm">{description}</p>
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
                className="w-full flex justify-center flex-col"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <h2 className="text-4xl font-bold">How Chaos Works</h2>
                    <p className="text-gray-500 mt-4">Chaos can help you make even the most complex shopping decisions, easier.</p>
                </motion.div>
                <div className="w-full grid md:grid-cols-2 gap-10 px-20">
                    <Piece videoSrc="/videos/SaveAndViewCart.mp4" 
                    title="All Your Carts in One Place" 
                    description="Keep track of every item you save—no matter the store. 
                    Seamlessly view and manage products from across the web in one 
                    convenient space." />
                </div>
            </motion.div>
        </section>
    );
} 