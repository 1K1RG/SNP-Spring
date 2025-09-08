import React, {useState, useEffect} from "react";
import { motion } from "framer-motion";
import GeneLociSearch from "../organism/GeneLociSearch";
import GenotypeSearch from "../organism/GenotypeSearch";
import LoggedInSideBar from "../organism/LoggedInSideBar";
import LoggedInNavBar from "../organism/LoggedInNavBar";
import { jwtDecode } from "jwt-decode";
import MyList from "../organism/MyList";
import api from "../../services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import JBrowse from "../organism/JBrowse";
import Phg from "../organism/Phg";
import PhgPipeline from "../organism/PhgPipeline";

const UserDashboard = () => {
  const [selectedFeature, setSelectedFeature] = useState("");
  const [results, setResults] = useState([]);
  const [name, setName] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("Token not found");
        navigate("/"); 
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const response = await api.post(`/api/user/general/getUser`, {
            username: decoded.sub 
        });

        // Store user details properly
        setName(`${response.data.firstName} ${response.data.lastName}`);
        localStorage.setItem("userDetails", JSON.stringify(response.data));

      } catch (error) {
        navigate("/"); 
        toast.error("Invalid token or request error");
      }
    };

    fetchUser(); 

  }, []); 

  return (
    <div className="relative h-full min-h-screen w-full flex flex-col items-center self-stretch ">
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 `}
        style={{ backgroundImage: "url('/images/irri_base.jpg')" }}
      ></div>

      <LoggedInNavBar name={name}/>

     
      <div className=" flex-1 flex p-5 py-0 gap-[5%]  mt-[125px] w-full max-w-[1500px] relative">
        <LoggedInSideBar 
        setResults={setResults}
        setSelectedFeature={setSelectedFeature}
        selectedFeature={selectedFeature}
        />

        {/* Animated Introduction */}
        { selectedFeature === "" && (
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

        {selectedFeature === "list" && (
          <MyList/>
        )}
        
        {selectedFeature === "jbrowse" && (
          <JBrowse/>
        )}

        {selectedFeature === "phg" && (
          <Phg/>
        )}

        {selectedFeature === "pipeline" && (
          <PhgPipeline/>
        )}



        
      </div>
    </div>
  );
};

export default UserDashboard;
