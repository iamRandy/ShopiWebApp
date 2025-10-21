import { CirclePlay, Video } from "lucide-react";
import { easeInOut, motion, useInView } from "framer-motion";
import { useState } from "react";

export default function HowItWorks() {
    const [canHover, setCanHover] = useState(false);

    const VideoPiece = ({ id, title, description }) => {
        return (
            <motion.div
            whileHover={ canHover ? {
                scale: 1.5, 
                translateY: 80,
                z: 100,
                transition: { delay: 0.3, duration: 0.1 }
            } : {}}
            transition={{ duration: 0.3 }}
            >
                <div id={id} className="rounded-md bg-stone-200 flex justify-center h-100 w-100 mb-3 border-2 border-black">
                    <div>
                        <p className="font-bold py-2 pt-6 text-stone-700">{title}</p>
                        <p className="text-sm text-stone-500">{description}</p>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <section id="how-it-works" className="h-[200vh] md:h-screen flex items-center justify-center">
            <motion.div
                className="w-full flex justify-center flex-col"
                initial={{ opacity: 0}}
                whileInView={{ opacity: 1}}
                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.2 }}
            
            >
                <div className="text-center">
                    {/* Sentence */}
                    <motion.div
                    initial={{ translateY: 80 }}
                    whileInView={{ translateY: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut", delay: 1.2}}
                    className="mb-5"
                    >
                        <h2 className="text-4xl font-bold">Why choose Chaos?</h2>
                        <p className="text-stone-400 mt-2">Chaos is built to make even the most complex shopping decisions, easier.</p>
                    </motion.div>
                    
                    {/* Selling points */}
                    <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeInOut", delay: 1.5 }}
                    onAnimationComplete={() => setCanHover(true)}
                    className="flex md:flex-row flex-col justify-center items-center gap-5"
                    >
                        <VideoPiece id={1} title="Any Store" description="Go to any website and save!" />
                        <VideoPiece id={2} title="One Place" description="The internet is your oyster!" />
                        <VideoPiece id={3} title="Super Easy" description="Skill requirement: NONE!" />
                    </motion.div>
                </div>
                
            </motion.div>
        </section>
    );
} 