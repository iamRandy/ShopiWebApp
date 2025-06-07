const NavBar = () => {
    return (
        <>
            <nav className="h-fit w-screen">
                <div className="w-full bg-stone-50 p-4 px-10 flex justify-between items-end text-stone-950">
                    
                    {/* Left side */}
                    <div className="flex gap-3 items-center">
                        <p className="font-bold text-xl">Shopi</p>

                        <div className="links">
                            {/* <div className="text-sm">testing</div> */}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="w-full flex justify-end">
                        <div className="flex gap-3">
                            <div className="text-sm">Account</div>
                            <div className="text-sm">Menu</div>
                        </div>
                    </div>

                </div>
            </nav>
        </>
    )
}

export default NavBar;