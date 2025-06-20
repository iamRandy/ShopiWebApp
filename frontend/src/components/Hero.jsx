import { ChromeIcon } from 'lucide-react';

export default function Hero() {
    return (
        <section className="text-center py-20">
            <div className="container mx-auto px-6">
                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4">
                    The Ultimate Browser Companion
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                    Elevate your browsing experience with our powerful and easy-to-use Chrome extension. Save time, stay organized, and work smarter.
                </p>
                <a 
                    href="https://chrome.google.com/webstore" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-lg transition-transform transform hover:scale-105 shadow-lg"
                >
                    <ChromeIcon className="w-6 h-6 mr-3" />
                    Add to Chrome - It's Free!
                </a>
            </div>
        </section>
    );
} 