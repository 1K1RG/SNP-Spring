import React, {useState} from "react";
import {motion} from 'framer-motion'
import HomeNavBar from "../organism/HomeNavBar";
import SignInForm from "../molecules/SigninForm";

const Signin = () => {	
    return(
        <div className="bg-white home h-screen w-full flex flex-col items-center self-stretch">
        <HomeNavBar/>
        <div className="flex p-5 pb-0  gap-[5%] h-full  w-full max-w-[1400px]"> 
           

            <div 
                className="relative flex items-center justify-center h-full flex-col bg-green-2 gap-[10%] w-[50%] overflow-hidden"
            >
                <div 
                    className="bg-green-2 absolute inset-0 bg-cover bg-center opacity-30" 
                    style={{ backgroundImage: "url('./images/irri_base.jpg')" }}
                ></div>
                <motion.div 
                    className="relative z-10 p-10 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <h1 className="text-white text-4xl font-['Montserrat-Regular']">
                        Advancing Rice Innovation, Cultivating a Better Future.
                    </h1>
                </motion.div>
            </div>

             {/* Text Section */}
             <div className="flex flex-col gap-[5%]  w-[50%] mt-[135px]">
                <motion.h1 
                        className="text-5xl text-green-2 font-['Poppins-Bold']"
                        initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                    Sign In 
                </motion.h1>

                <motion.p 
                    className="self-stretch sm:text-justify text-base font-['Helvetica']"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                >
                    <SignInForm/>
                </motion.p>
                
         
            </div>
        </div>
    </div>
    );
}

export default Signin