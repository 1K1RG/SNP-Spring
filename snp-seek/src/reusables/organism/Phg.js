import { motion } from "framer-motion";
import PHGVisualization from "../../components/PHGVisualization.tsx";
import PageTitle from "../atoms/PageTitle.js";

const Phg = ({ }) => {
  return (
    <div className="flex ml-20 flex-col gap-3 w-full  ">
      
      {/* Page Title */}
      <PageTitle text={"Haplotrail"} />
      <PHGVisualization/>


      
      </div>
  );
};

export default Phg;
