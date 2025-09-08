import React from "react";
import { useNavigate } from "react-router-dom";

export default function FillButton({ route, text, onClick }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick(); 
        }
        if (route) {
            navigate(route); 
        }
    };

    return (
        <button
            onClick={handleClick}
            className="text-white relative w-[130px] border-2 uppercase border-green-5 bg-transparent py-2.5 px-5 font-['Montserrat-Regular'] hover:bg-green-2 transition ease-in duration-200"
        >
            {text}
        </button>
    );
}
