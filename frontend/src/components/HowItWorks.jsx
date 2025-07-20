import { CirclePlay } from "lucide-react";
import { easeInOut, motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

export default function HowItWorks() {
    
    const VideoPiece = ({ videoSrc, title, description }) => {
        const videoRef = useRef(null);
        // const [playing, setPlaying] = useState(playOnStart);
    
        // const playVideo = () => {
        //     setPlaying(true);
        //     videoRef.current.play();
        // };
    
        // const pauseVideo = () => {
        //     setPlaying(false);
        //     videoRef.current.pause();
        // };
        
        return (
            <div className="rounded-xl bg-stone-200 flex justify-center p-8">
                <div>
                    <motion.div 
                    initial={{ translateY: 20, opacity: 0 }}
                    whileInView={{ translateY: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="relative flex">

                        {/* {!playing && (
                            <>
                                <div className="absolute w-full h-full rounded-xl bg-black opacity-50 z-10" />
                                <button className="flex justify-center items-center absolute w-full h-full rounded-full z-20 text-white" onClick={playVideo}><CirclePlay className="w-[40px] h-[40px]" /></button>
                            </>
                        )} */}
                        <img
                        // autoPlay={playOnStart}
                        // ref={videoRef}
                        className="rounded-xl"
                        src={videoSrc} alt="demo video" loop muted playsInline
                        // onClick={pauseVideo} 
                        />

                    </motion.div>
                    <p className="font-bold py-2 pt-6 text-stone-700">{title}</p>
                    <p className="text-sm text-stone-500">{description}</p>
                </div>
            </div>
        );
    };

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
        <section ref={ref} id="how-it-works" className="mt-20 min-h-screen flex items-center justify-center">
            <motion.div
                className="w-full flex justify-center flex-col"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <h2 className="text-4xl font-bold">Organize Your Stuff</h2>
                    <p className="text-stone-400 mt-4">Chaos can help you make even the most complex shopping decisions, easier.</p>
                </motion.div>
                <div className="w-full grid md:grid-cols-2 gap-10 px-20">
                    {/* Demo Video - Save and view carts from the extension */}
                    <div className="relative w-full" style={{ paddingBottom: "100%" }}>
                        <iframe 
                        className="absolute top-0 left-0 w-full h-full border border-stone-300 rounded-xl z-10"
                        src="https://www.youtube-nocookie.com/embed/YqYcIHZ3Egs?autoplay=1&mute=1&controls=0&rel=0&loop=1&playlist=YqYcIHZ3Egs"
                        title="YouTube video player" 
                        allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin" 
                        ></iframe>
                    </div>

                    <VideoPiece videoSrc="/videos/CreateAndDeleteCart.gif" 
                    title="Create and Delete Carts" 
                    description="Organize your saved products into custom carts—whether 
                    it's for gifting, wishlists, or future buys. Your shopping, your system." 
                    />
                </div>
            </motion.div>
        </section>
    );
} 