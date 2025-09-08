import React, {useState} from "react";
import {motion} from 'framer-motion'
import HomeNavBar from "../organism/HomeNavBar";
import RegistrationForm from "../molecules/RegistrationForm";
const Register = () => {	
    return(
        <div className="bg-white home h-screen w-full flex flex-col items-center self-stretch">
        <HomeNavBar/>
        <div className="flex gap-[5%] h-full  w-full max-w-[1400px]"> 
            {/* Text Section */}
            <div className="flex flex-col p-5 pb-0 gap-[5%] w-[50%] overflow-auto scrollbar-hide">
                <motion.h1 
                        className="text-5xl text-green-2 font-['Poppins-Bold'] mt-[125px]"
                        initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                    Registration 
                </motion.h1>

                <motion.div 
                    className="flex flex-col pb-10 gap-[5%]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                >
                    <RegistrationForm/>
                </motion.div>
                
         
            </div>

            <div 
                className="relative flex items-center justify-center h-screen flex-col bg-green-2 gap-[10%] w-[50%] overflow-hidden"
            >
                <div 
                    className="bg-green-2 absolute inset-0 bg-cover bg-center opacity-30" 
                    style={{ backgroundImage: "url('./images/research.jpg')" }}
                ></div>
                <motion.div 
                    className="relative z-10 p-10 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <h1 className="text-white text-4xl font-['Montserrat-Regular']">
						Unlock Genomic Insights, Drive Innovation in Rice Research
                    </h1>
                </motion.div>
            </div>
        </div>
    </div>
    );
}

export default Register