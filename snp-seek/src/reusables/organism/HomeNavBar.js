import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../atoms/Logo";
import Title from "../molecules/Title";
import UnderlineButton from "../atoms/UderlineButton";
import FillButton from "../atoms/FillButton";


function HomeNavBar() {
  return (
    <div className="bg-green-1 flex justify-center fixed w-full h-[90px] z-50 shadow-md">
      <div className="w-full max-w-[1400px] px-5 flex flex-row items-center justify-between">
        {/* Logo */}
        <div className="h-[60px] w-[600px] flex items-center justify-start">
          <Logo image={"/images/iric_logo.png"} route={"/"}/>
          <Title mainText="SNP-Spring" subtext="The International Rice Informatics Consortium" />
        </div>

        {/* Buttons */}
        <div className="flex h-[65px] justify-end w-[50%] items-center gap-[10%]">
            <div className="flex h-[65px] justify-end w-[100%] items-center gap-[8%]">
                <UnderlineButton text="IRRI" route={"https://irri.org/"} external/>
                <UnderlineButton text="IRRIC" route={"https://iric.irri.org/"} external/>
                <UnderlineButton text="Order Seeds" route={"https://www.irri.org/rice-seeds"} external/>
                <UnderlineButton text="Register" route={"/register"}/>
                <FillButton text="Sign In" route={"/signin"}/>
            </div>
        </div>
      </div>
    </div>
  );
}

export default HomeNavBar;
