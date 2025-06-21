export default function Footer() {
    return (
        <footer className="border-t border-gray-300 mt-20">
            <div className="container mx-auto px-6 py-8 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} Shopi. All Rights Reserved.</p>
                <div className="flex justify-center gap-6 mt-4">
                    <a href="#" className="hover:text-white">Privacy Policy</a>
                    <a href="#" className="hover:text-white">Terms of Service</a>
                    <a href="#" className="hover:text-white">Contact Us</a>
                </div>
            </div>
        </footer>
    );
} 