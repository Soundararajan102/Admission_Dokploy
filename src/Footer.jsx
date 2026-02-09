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

const gradientStyle = {
    background: 'linear-gradient(90deg, #374151 0%, #2563eb 50%, #374151 100%)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'gradient-flow 2s ease-in-out infinite'
};


const Footer = () => {
    return (
        <>
            <style>{`
                @keyframes gradient-flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>
        <footer className="bg-white text-gray-800 border-t border-gray-200 fixed bottom-0 w-full shadow-sm z-10">
            <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4">

                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-600">
                    {/* builder */}
                    <span className="font-semibold text-gray-800">Developed by</span>
                    <button type="button" onClick={openPradeep} className="transition cursor-pointer hover:font-semibold" onMouseEnter={(e) => Object.assign(e.target.style, gradientStyle)} onMouseLeave={(e) => { e.target.style.background = ''; e.target.style.WebkitTextFillColor = ''; }}>Pradeepkumar K</button>
                    <span aria-hidden className="text-gray-400">•</span>
                    <button type="button" onClick={openSachinn} className="transition cursor-pointer hover:font-semibold" onMouseEnter={(e) => Object.assign(e.target.style, gradientStyle)} onMouseLeave={(e) => { e.target.style.background = ''; e.target.style.WebkitTextFillColor = ''; }}>Sachinn P</button>
                    <span aria-hidden className="text-gray-400">•</span>
                    <button type="button" onClick={openSoundar} className="transition cursor-pointer hover:font-semibold" onMouseEnter={(e) => Object.assign(e.target.style, gradientStyle)} onMouseLeave={(e) => { e.target.style.background = ''; e.target.style.WebkitTextFillColor = ''; }}>Soundararajan T</button>
                    <span aria-hidden className="text-gray-400">•</span>
                    <button type="button" onClick={openVishor} className="transition cursor-pointer hover:font-semibold" onMouseEnter={(e) => Object.assign(e.target.style, gradientStyle)} onMouseLeave={(e) => { e.target.style.background = ''; e.target.style.WebkitTextFillColor = ''; }}>Vishor G</button>
                    
                    {/* batch */}
                    <span aria-hidden className="text-gray-900">|</span>
                    <span className="text-gray-500">CSE - Batch 2022-2026</span>
                </div>
            </div>
        </footer>
        </>
    );
};

export default Footer;