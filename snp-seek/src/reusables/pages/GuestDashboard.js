import React, {useState, useEffect} from "react";
import { motion } from "framer-motion";
import HomeNavBar from "../organism/HomeNavBar";
import GuestSideBar from "../organism/GuestSideBar";
import GeneLociSearch from "../organism/GeneLociSearch";
import GenotypeSearch from "../organism/GenotypeSearch";
import { useAuth } from "../../services/AuthContext";

const GuestDashboard = () => {
  const {logout} = useAuth()
  const [selectedFeature, setSelectedFeature] = useState("");
  const [results, setResults] = useState([]);

  useEffect(()=>{
    logout()
  },[])
  return (
    <div className="relative h-full min-h-screen w-full flex flex-col items-center self-stretch ">
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 `}
        style={{ backgroundImage: "url('/images/irri_base.jpg')" }}
      ></div>

      <HomeNavBar />

     
      <div className=" flex-1 flex p-5 py-0 gap-[5%]  mt-[125px] w-full max-w-[1500px] relative">
        <GuestSideBar 
        setResults={setResults}
        setSelectedFeature={setSelectedFeature}
        selectedFeature={selectedFeature}
        />

        {/* Animated Introduction */}
        {  selectedFeature === "" && (
          <div className="flex flex-col gap-5 items-center justify-center w-full text-center">
          {/* Animated Heading */}
          <motion.h1
            className="text-7xl font-bold text-green-2 font-['Poppins-Bold']"
            initial={{ opacity: 0, y: 30 }} // Start hidden and move up
            animate={{ opacity: 1, y: 0 }} // Fade in and move to position
            transition={{ duration: 0.5, ease: "easeOut" }} // Smooth effect
          >
            Welcome to SNP-Spring
          </motion.h1>

          {/* Animated Paragraph */}
          <motion.p
            className="text-lg mt-2 max-w-xl font-['Lato-Regular']"
            initial={{ opacity: 0, y: 20 }} // Start hidden and lower
            animate={{ opacity: 1, y: 0 }} // Fade in and move to position
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }} // Delayed for natural flow
          >
            SNP-Spring is an advanced platform for exploring rice genetic data,  
            helping researchers and breeders analyze genetic variations effectively.
          </motion.p>
        </div>
        )}

        {/* GeneLoci Search */}
        {selectedFeature === "geneLoci" && (
          <GeneLociSearch results={results} setResults={setResults} />
        )}

        {/* GeneLoci Search */}
        {selectedFeature === "genotype" && (
          <GenotypeSearch results={results} setResults={setResults} />
        )}




        
        
      </div>
    </div>
  );
};

export default GuestDashboard;
