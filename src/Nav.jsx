import React from "react";
const Logo = "/assets/kongunadulogo.png";

const Nav=()=>{
    return(
        <>
         <nav className="bg-white shadow-sm border-b border-gray-200">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 sm:flex-row">
                                <img src={Logo} alt="KNCET Logo" className="h-12 w-auto" />
                                <h1 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight text-center">
                                    Kongunadu College of Engineering and Technology
                                </h1>
                            </div>
                        </nav>
        </>
    )
}
export default Nav;