import React from "react";
const Logo = "/assets/kongunadulogo.png";
import { useLocation, useNavigate } from "react-router-dom";
import Nav from "../Nav";

const Sucess = () => {
    const location = useLocation();
    const { applicationId } = location.state || {}; // Destructure applicationId from state
    const navigate = useNavigate();
    const handleNav = () => {
        navigate('/admin');
    }
    return (
        <>
            <div>
                <Nav />
            </div>
            <div className="grid justify-center gap-5 text-center py-9">
                <div>
                    <img src={Logo} className="ml-30" alt="Logo" />
                </div>
                <h1 className="text-3xl font-bold">Submitted Successfully!</h1>
                <h1>Your admission details have been recorded</h1>
                <h1 className="text-2xl font-bold">Admission ID</h1>
                <input
                    type="text"
                    value={applicationId || ""}
                    readOnly
                    placeholder="Application ID"
                    className="p-1 border font-bold text-2xl text-center"
                />
                <div>
                    <div className="flex justify-center gap-5">
                        {/* <button type="submit" className="bg-blue-500 p-2 rounded text-white font-semibold">Download Receipt</button> */}
                        <button type="button" onClick={handleNav} className="bg-blue-500 p-2 rounded text-white font-semibold">Go to Dashboard</button>
                    </div>
                </div>

            </div>
        </>
    )
}
export default Sucess;