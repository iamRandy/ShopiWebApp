const NavBar = () => {
    return (
        <>
            <nav className="h-fit w-screen">
                <div className="w-full bg-stone-50 p-4 flex justify-between items-end">
                    
                    {/* Left side */}
                    <div className="text-stone-950 flex gap-3 items-center">
                        <p className="font-bold text-xl">Shopi</p>

                        <div className="links">
                            <div className="text-sm">testing</div>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="navbar-right">
                        {/* Right content here */}
                    </div>

                </div>
            </nav>

        </>
    )
}

export default NavBar;