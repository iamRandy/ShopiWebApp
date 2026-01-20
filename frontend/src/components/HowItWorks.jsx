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
                staggerChildren: .8,
                delayChildren: 1.5,
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <section id="how-it-works" className="h-[200vh] p-5 md:h-screen flex items-center justify-center bg-gradient-to-b to-[rgba(255,234,207,0)] from-[rgba(255,234,207,1)]">
            <div className="w-full">
                <div className="md:text-center">
                    {/* Sentence */}
                    <motion.div
                    initial={{ translateY: 80 }}
                    whileInView={{ translateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: .5}}
                    className="mb-5"
                    >
                        <h2 className="text-4xl font-bold">Why should I use Chaos?</h2>
                        <p className="text-primary-dark mt-2">Chaos is built to make even the most complex shopping decisions, easier.</p>
                    </motion.div>

                    {/* Selling points */}
                    {/* TODO: Get better images/gifs/videos for showcasing Shopi */}
                    <motion.div
                        variants={ container }
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        onAnimationComplete={() => setCanHover(true)}
                        className="grid place-items-center justify-center items-center max-[1210px]:grid-cols-2 min-[1210px]:grid-cols-3 max-[768px]:grid-cols-1"
                    >
                        <motion.div
                            variants={ item }
                            whileHover={ canHover ? {
                                scale: 1.2,
                                translateY: 30,
                                zIndex: 100,
                                transition: { delay: 0.3, duration: 0.1 }
                            } : {}}
                        >
                            <div id={1} className="rounded-md bg-[url('/images/createcart.png')] bg-cover bg-center flex justify-center h-100 w-100 mb-3 border-2 border-black">
                                <motion.div
                                    variants={ item }
                                    initial="hidden"
                                    whileHover="show"
                                    className="w-full h-full"
                                >
                                  <div className="bg-[rgba(255,255,255,1)] rounded-sm py-1">
                                    <p className="font-bold">Any Store</p>
                                    <p className="text-sm text-primary-dark">Go to any website and save!</p>
                                  </div>
                                </motion.div>
                            </div>
                        </motion.div>
                        <motion.div
                            variants={ item }
                            whileHover={ canHover ? {
                                scale: 1.2,
                                translateY: 30,
                                zIndex: 100,
                                transition: { delay: 0.3, duration: 0.1 }
                            } : {}}
                        >
                            <div id={2} className="rounded-md bg-[url('/images/yourcarts.png')] bg-cover bg-center flex justify-center h-100 w-100 mb-3 border-2 border-black">
                                <motion.div
                                    variants={ item }
                                    initial="hidden"
                                    whileHover="show"
                                    className="w-full h-full"
                                >
                                  <div className="bg-[rgba(255,255,255,1)] rounded-sm py-1">
                                    <p className="font-bold">One Place</p>
                                    <p className="text-sm text-primary-dark">Guranteed lost proof!</p>
                                  </div>
                                </motion.div>
                            </div>
                        </motion.div>
                        <motion.div
                            variants={ item }
                            whileHover={ canHover ? {
                                scale: 1.2,
                                translateY: 30,
                                zIndex: 100,
                                transition: { delay: 0.3, duration: 0.1 }
                            } : {}}
                        >
                            <div id={3} className="rounded-md bg-[url('/images/itemview.png')] bg-cover bg-center flex justify-center h-100 w-100 mb-3 border-2 border-black">
                                <motion.div
                                    variants={ item }
                                    initial="hidden"
                                    whileHover="show"
                                    className="w-full h-full"
                                >
                                  <div className="bg-[rgba(255,255,255,1)] rounded-sm py-1">
                                    <p className="font-bold">Super Easy</p>
                                    <p className="text-sm text-primary-dark">Skill requirement: NONE!</p>
                                  </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}
