import { motion } from "framer-motion";

export default function PageTitle({text}) {
  
    return (
        <motion.h1
        className="pl-2 text-4xl font-bold text-green-2 font-['Poppins-Bold'] "
        initial={{ opacity: 0, y: 20 }} // Start hidden and lower
        animate={{ opacity: 1, y: 0 }} // Fade in and move to position
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }} // Delayed for natural flow
      >
        {text}
      </motion.h1>
    );
  }