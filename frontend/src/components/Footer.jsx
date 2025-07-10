export default function Footer() {
    return (
        <footer id="footer" className="border-t border-gray-300 mt-20">
            <div className="container mx-auto px-6 py-8 text-center text-gray-400">
                <p>&copy; {new Date().getFullYear()} Chaos. All Rights Reserved.</p>
                <div className="flex justify-center gap-6 mt-4">
                    {/* <a href="#" className="special_links">Privacy Policy</a>
                    <a href="#" className="special_links">Terms of Service</a>
                    <a href="#" className="special_links">Contact Us</a> */}
                </div>
            </div>
        </footer>
    );
} 