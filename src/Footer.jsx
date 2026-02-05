import React from "react";

const openVishor = () => {
    window.open("https://vishor-portfolio.netlify.app/", "_blank", "noopener,noreferrer");
};
const openPradeep = () => {
     window.open("", "_blank", "noopener,noreferrer");
};
const openSoundar = () => {
     window.open("", "_blank", "noopener,noreferrer");
};
const openSachinn = () => {
     window.open("https://sachinnp.netlify.app/", "_blank", "noopener,noreferrer");
};


const Footer = () => {
    return (
        <footer className="bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 border-t border-slate-800 sticky bottom-0 w-full">
            <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-400 text-center sm:text-left">
                        (2022-2026) batch — KNCET Admissions
                    </p>
                    <nav className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-300" aria-label="Developer navigation">
                        <span className="font-semibold text-slate-100">Developed by</span>
                        <button type="button" onClick={openSachinn} className="hover:text-emerald-300 transition cursor-pointer">Sachinn P</button>
                        <span aria-hidden className="text-slate-600">•</span>
                        <button type="button" onClick={openSoundar} className="hover:text-emerald-300 transition cursor-pointer">Soundarajan S</button>
                        <span aria-hidden className="text-slate-600">•</span>
                        <button type="button" onClick={openPradeep} className="hover:text-emerald-300 transition cursor-pointer">Pradeepkumar R</button>
                        <span aria-hidden className="text-slate-600">•</span>
                        <button type="button" onClick={openVishor} className="hover:text-emerald-300 transition cursor-pointer">Vishor G</button>
                    </nav>
                </div>
            </div>
        </footer>
    );
};

export default Footer;