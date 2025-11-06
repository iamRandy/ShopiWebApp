import { motion } from "framer-motion";
import { useState } from "react";


export default function HowItWorks() {
    const [canHover, setCanHover] = useState(false);
    
    const container = {
        hidden: {
            opacity: 0
        },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: .5,
                delayChildren: 2,
            }
        }
    };
    
    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <section id="how-it-works" className="h-[200vh] md:h-screen flex items-center justify-center bg-secondary">
            <div className="w-full flex justify-center flex-col">
                <div className="text-center">
                    {/* Sentence */}
                    <motion.div
                    initial={{ translateY: 80 }}
                    whileInView={{ translateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: 1.2}}
                    className="mb-5"
                    >
                        <h2 className="text-4xl font-bold">Why choose Chaos?</h2>
                        <p className="text-primary-dark mt-2">Chaos is built to make even the most complex shopping decisions, easier.</p>
                    </motion.div>
                    
                    {/* Selling points */}
                    {/* Side note: I tried to make each point here into a component but the staggering effect didn't work. Maybe investigate another time. */}
                    <motion.div
                        variants={ container } 
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        onAnimationComplete={() => setCanHover(true)}
                        className="flex md:flex-row flex-col justify-center items-center gap-5"
                    >
                        <motion.div
                            variants={ item }
                            whileHover={ canHover ? {
                                scale: 1.5, 
                                translateY: 80,
                                zIndex: 100,
                                transition: { delay: 0.3, duration: 0.1 }
                            } : {}}
                        >
                            <div id={1} className="rounded-md bg-primary flex justify-center h-100 w-100 mb-3 border-2 border-black">
                                <div>
                                    <p className="font-bold py-2 pt-6">Any Store</p>
                                    <p className="text-sm text-primary-dark">Go to any website and save!</p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            variants={ item }
                            whileHover={ canHover ? {
                                scale: 1.5, 
                                translateY: 80,
                                zIndex: 100,
                                transition: { delay: 0.3, duration: 0.1 }
                            } : {}}
                        >
                            <div id={2} className="rounded-md bg-primary flex justify-center h-100 w-100 mb-3 border-2 border-black">
                                <div>
                                    <p className="font-bold py-2 pt-6">One Place</p>
                                    <p className="text-sm text-primary-dark">The internet is your oyster!</p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            variants={ item }
                            whileHover={ canHover ? {
                                scale: 1.5, 
                                translateY: 80,
                                zIndex: 100,
                                transition: { delay: 0.3, duration: 0.1 }
                            } : {}}
                        >
                            <div id={3} className="rounded-md bg-primary flex justify-center h-100 w-100 mb-3 border-2 border-black">
                                <div>
                                    <p className="font-bold py-2 pt-6">Super Easy</p>
                                    <p className="text-sm text-primary-dark">Skill requirement: NONE!</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
                
            </div>
        </section>
    );
} 