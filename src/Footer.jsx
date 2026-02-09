import React from "react";

const openVishor = () => {
    window.open("https://vishor-portfolio.netlify.app/", "_blank", "noopener,noreferrer");
};
const openPradeep = () => {
     window.open("https://pradeepkumark.netlify.app/", "_blank", "noopener,noreferrer");
};
const openSoundar = () => {
     window.open("https://soundararajant.netlify.app/", "_blank", "noopener,noreferrer");
};
const openSachinn = () => {
     window.open("https://sachinnp.netlify.app/", "_blank", "noopener,noreferrer");
};


const Footer = () => {
    return (
        <footer className="bg-white text-gray-800 border-t border-gray-200 sticky bottom-0 w-full shadow-sm">
            <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-gray-600">
                    {/* builder */}
                    <span className="font-semibold text-gray-800">Developed by</span>
                    <button type="button" onClick={openPradeep} className="hover:text-blue-600 transition cursor-pointer">Pradeepkumar K</button>
                    <span aria-hidden className="text-gray-400">•</span>
                    <button type="button" onClick={openSachinn} className="hover:text-blue-600 transition cursor-pointer">Sachinn P</button>
                    <span aria-hidden className="text-gray-400">•</span>
                    <button type="button" onClick={openSoundar} className="hover:text-blue-600 transition cursor-pointer">Soundararajan T</button>
                    <span aria-hidden className="text-gray-400">•</span>
                    <button type="button" onClick={openVishor} className="hover:text-blue-600 transition cursor-pointer">Vishor G</button>
                    
                    {/* batch */}
                    <span aria-hidden className="text-gray-900">|</span>
                    <span className="text-gray-500">CSE - Batch 2022-2026</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;