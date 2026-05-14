import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer id="footer" className="border-t border-gray-300">
            <div className="container mx-auto px-6 py-8 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} Chaos. All Rights Reserved.</p>
                <div className="flex justify-center gap-6 mt-2">
                    <Link to="/privacy" className="special_links">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    );
} 