import React from "react";
import { useAuth } from "../../services/AuthContext";
import Logo from "../atoms/Logo";
import Title from "../molecules/Title";
import UnderlineButton from "../atoms/UderlineButton";
import FillButton from "../atoms/FillButton";

function LoggedInNavBar({name}) {
  const { logout } = useAuth();

  return (
    <div className="bg-green-1 flex justify-center fixed w-full h-[90px] z-50 shadow-md">
      <div className="w-full max-w-[1400px] px-5 flex flex-row items-center justify-between">
        {/* Logo */}
        
        <div className="h-[60px] w-[600px] flex items-center justify-start">
          <Logo image={"/images/iric_logo.png"} route={"/user/dashboard"}/>
          <Title mainText="SNP-Spring" subtext="The International Rice Informatics Consortium" />
        </div>
        {/* Buttons */}

        <div className="flex h-[65px] justify-end w-[50%] items-center gap-[10%]">
            <div className="flex h-[65px] justify-end w-[70%] items-center gap-[10%]">
                <UnderlineButton route={"/user/dashboard"} >
                  Hello, <span className="ml-2 font-bold">{name.toUpperCase()}!</span>
                </UnderlineButton>
                <FillButton text={"Sign Out"} route={"/"} onClick={()=>logout()} />
            </div>
        </div>
      </div>
    </div>
  );
}

export default LoggedInNavBar;
