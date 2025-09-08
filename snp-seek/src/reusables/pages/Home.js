import React, {useState} from "react";
import ImageCarousel from "../molecules/ImageCarousel";
import HomeNavBar from "../organism/HomeNavBar";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FillButton from "../atoms/FillButton";

const Home = () => {		
	const navigate = useNavigate();
	
	
	return (
		<div className="bg-white home h-screen w-full flex flex-col items-center self-stretch">
			{/* nav bar */}
			<HomeNavBar/>
			
			
			<div className="flex p-5 pb-0  gap-[5%] h-full  w-full max-w-[1400px]"> 
				{/* Text Section */}
				<div className="flex flex-col gap-[5%] w-[50%] mt-[150px]">
					<motion.h1 
							className="text-5xl font-['Poppins-Bold']"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, ease: "easeOut" }}
						>
						Rice SNP-Spring <br/>
						<span className="text-green-2">Database</span>   
					</motion.h1>

					<motion.p 
						className="self-stretch sm:text-justify text-base font-['Lato-Regular']"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
					>
						This site provides Genotype, Phenotype, and Variety Information for rice (Oryza sativa L.). SNP genotyping data 
						(called against Nipponbare reference Os-Nipponbare-Reference-IRGSP-1.0) came from 3,000 Rice Genomes Project. 
						Phenotype and passport data for the 3,000 rice varieties came from the International Rice Genebank Collection Information System (IRGCIS). 
						We are a part of an ongoing effort by the International Rice Informatics Consortium (IRIC) to centralize information access to rice research data
						and provide computational tools to facilitate rice improvement via discovery of new gene-trait associations and accelerated breeding.
					</motion.p>

					<motion.button
					onClick={() => {
						navigate("/dashboard");
					}}
					className="mx-auto w-[300px] border-2 font-semibold border-green-2 bg-green-2 py-2.5 px-5  font-['Open-Sans'] text-white transition-all ease-out duration-300 hover:text-yellow-1"
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					whileHover={{ scale: 1.1 }}
					transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
					>
						Enter as Guest
					</motion.button>
				</div>

				{/* Carousel */}
				<div className="flex items-center justify-center flex-col bg-green-2 gap-[10%] mt-[70px] w-[50%]">
					<ImageCarousel/>
				</div>
			</div>
		</div>
	);
};

export default Home;
