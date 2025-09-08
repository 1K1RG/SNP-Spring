import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search} from "lucide-react"; // Ensure Lucide React is installed
import PageButtons from "../molecules/PageButtons";
import GeneLociSearchForm from "../molecules/GeneLociSearchForm";
import api from "../../services/api";
import { Toaster, toast } from 'sonner';
import { useAuth } from "../../services/AuthContext";
import FloatingButton from "../atoms/FloatingButton";
import PageTitle from "../atoms/PageTitle";
const GeneLociSearch = ({ results, setResults }) => {

  const {role} = useAuth()
  const [formOpen, setFormOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGene, setSelectedGene] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false)

   const [submittedFormData, setSubmittedFormData] = useState({
      referenceGenome: "",
      searchBy: "",
      geneModel: "All",
    });
  
    const [submittedWordSearch, setSubmittedWordSearch] = useState({
      searchMethod: "",
      searchQuery: "",
    });
  
    const [submittedTraitSearch, setSubmittedTraitSearch] = useState({
      traitCategory: "",
      traitName: "",
    });
  
    const [submittedRegionSearch, setSubmittedRegionSearch] = useState({
      contig: "",
      start: "",
      end: "",
    });

  const handlePageChange = async (pageNumber) =>{
    setCurrentPage(pageNumber)

    if (submittedFormData.searchBy == "Gene Name/Symbol/Function") {
      const response = await api.post(`api/geneloci/searchByGeneName`, {
       referenceGenome: submittedFormData.referenceGenome,
       searchMethod: submittedWordSearch.searchMethod,
       searchQuery: submittedWordSearch.searchQuery.trim(),
       pageNumber: pageNumber
      });
      
      setResults(response.data.results);


    }

    if (submittedFormData.searchBy == "Region") {
      const response = await api.post(`api/geneloci/searchByRegion`, {
        referenceGenome: submittedFormData.referenceGenome,
        contig: submittedRegionSearch.contig.trim().toLowerCase(),
        start: submittedRegionSearch.start.trim(),
        end: submittedRegionSearch.end.trim(),
        pageNumber: pageNumber
      });

      setResults(response.data.results);
     
    }

    if (submittedFormData.searchBy == "Annotation (by Source)") {
      const response = await api.post(`api/geneloci/searchByAnnotation`, {
        referenceGenome: submittedFormData.referenceGenome,
        searchMethod: submittedWordSearch.searchMethod,
        searchQuery: submittedWordSearch.searchQuery.trim(),
        pageNumber: pageNumber
      });

      setResults(response.data.results);

      
    }


    if (submittedFormData.searchBy == "Trait") {
      const response = await api.post(`api/geneloci/searchByTrait`, {
        referenceGenome: submittedFormData.referenceGenome,
        traitName: submittedTraitSearch.traitName,
        pageNumber: pageNumber
      });

      setResults(response.data.results);
     
    }

  }

  const handleDownload = async () => {  
    setIsDownloading(true)
    try {
      const response = await api.post(
        `/api/geneloci/general/generateExcel`,
        {
          searchMethod: submittedWordSearch.searchMethod,
          searchQuery: submittedWordSearch.searchQuery.trim(),
          referenceGenome: submittedFormData.referenceGenome,
          searchBy: submittedFormData.searchBy,
          contig: submittedRegionSearch.contig,
          start: submittedRegionSearch.start,
          end: submittedRegionSearch.end,
          traitName: submittedTraitSearch.traitName,
        },
        {
          responseType: "blob", 
        }
      );
  
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
  
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gene_loci.xlsx"; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
  
      toast.success("Results Downloaded");
    } catch (error) {
      toast.warning("Failed to Download");
      console.error("Download error:", error);
    }finally{
      setIsDownloading(false)
    }
  };
  
  



  return (
    <div className="flex ml-20 flex-col gap-3 w-full ">
      <Toaster/>
      {/* Floating Form */}
      <div
        className={`h-full z-50 fixed right-6 bottom-28 w-[50%] bg-white p-6 shadow-lg rounded-lg border border-gray-200 max-h-[65vh] overflow-y-auto transition-all duration-300 ${formOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: formOpen ? 1 : 0, x: formOpen ? 0 : 20 }} 
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-['Poppins-Bold']">Enter Search Details</h2>
            <button onClick={() => setFormOpen(false)} className="text-gray-500">✕</button>
          </div>
          <GeneLociSearchForm 
          setSubmittedFormData = {setSubmittedFormData}
          setSubmittedWordSearch = {setSubmittedWordSearch}
          setSubmittedTraitSearch = {setSubmittedTraitSearch}
          setSubmittedRegionSearch = {setSubmittedRegionSearch}
          setCurrentPage = {setCurrentPage}
          setTotalPages = {setTotalPages}
          setResults={setResults} />
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <FloatingButton icon={Search} setter={setFormOpen} value={!formOpen}/>
      

      {/* Page Title */}
      <div className="flex">
        <PageTitle text={"Gene Loci Search"} />
        {results.length > 0 && role !== "GUEST" &&(
        <button
          onClick={()=>handleDownload()}
          disabled={isDownloading}
          className={` font-["Lato-Regular"]  h-fit ml-auto py-2 px-6 text-md font-bold text-white bg-green-2 rounded transition-colors duration-300 hover:text-yellow-1`}
          >
              Download Results
            
        </button>
        )}

      </div>
      

     

      {/* Table */}
      {results.length > 0 && (
      <>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-300">
            <thead className="text-xs text-white uppercase bg-green-1 font-['Poppins-Bold']">
              <tr>
                <th scope="col" className="px-6 py-3 w-[16%]">Locus</th>
                <th scope="col" className="px-6 py-3 w-[8%]">Contig</th>
                <th scope="col" className="px-6 py-3 w-[14%]">Start</th>
                <th scope="col" className="px-6 py-3 w-[14%]">Stop</th>
                <th scope="col" className="px-6 py-3 w-[8%]">Strand</th>
                <th scope="col" className="px-6 py-3 w-[40%]">Description</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={index} onClick={()=>{setSelectedGene(item); setIsModalOpen(true)}}className="border-b bg-gray-800 border-gray-700 hover:bg-gray-600">
                  <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap text-white">
                    {item.geneName}
                  </th>
                  <td className="px-6 py-4">{item.contig}</td>
                  <td className="px-6 py-4">{item.start}</td>
                  <td className="px-6 py-4">{item.end}</td>
                  <td className="px-6 py-4">{item.strand}</td>
                  <td className="px-6 py-4">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 ease-out animate-fadeIn">
            <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            transition={{ duration: 0.2, ease: "linear" }}
            className="relative flex flex-col bg-white p-6 rounded-lg shadow-lg h-[90%] w-[90%] max-w-[1500px] overflow-hidden  transform transition-all duration-300 scale-95 animate-scaleUp">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition duration-200 "
              >
                ✕
              </button>

              <h2 className="text-xl font-['Poppins-Bold'] text-green-2 mb-4">Gene Details</h2>

              <div className="bg-gray-100 p-4 rounded-lg shadow-md space-y-2">

                <div className="grid grid-cols-2 gap-4 text-sm ">
                  <span className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">Locus:</strong> {selectedGene?.geneName}</span>
                  <span className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">Contig:</strong> {selectedGene?.contig}</span>
                  <span className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">Start:</strong> {selectedGene?.start}</span>
                  <span className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">Stop:</strong> {selectedGene?.end}</span>
                  <span className="font-['Lato-Regular'] text-gray-700"><strong className="text-green-1">Strand:</strong> {selectedGene?.strand}</span>
                  <span className="font-['Lato-Regular'] text-gray-700 col-span-2"><strong className="text-gray-900">Description:</strong> {selectedGene?.description}</span>
                </div>
              </div>

              {/* Skeleton Loader */}
              <div id="skeleton" className="relative h-full animate-pulse space-y-4 mt-4">
                <div className="h-6 bg-gray-300 rounded"></div>
                <div className="h-[90%] bg-gray-200 rounded"></div>
              </div>

              {/* iFrame for JBrowse */}
              <iframe 
                id="snpIframe"
                src={`https://snp-seek.irri.org/jbrowse/?loc=${selectedGene?.contig}%3A${selectedGene?.start}..${selectedGene?.end}&tracks=DNA%2Cmsu7gff%2Cmsu7snpsv2%2Cmsu7indelsv2&highlight=`}
                width="100%" 
                height="100%" 
                className="hidden mt-4 rounded-md shadow"
                onLoad={() => {
                  setTimeout(() => {
                    const skeleton = document.getElementById('skeleton');
                    const iframe = document.getElementById('snpIframe');
              
                    if (skeleton) skeleton.style.display = 'none';
                    if (iframe) iframe.classList.remove('hidden');
                  }, 500); // Delay of 500ms
                }}

                
              />
            </motion.div>
          </div>
        )}

        <PageButtons 
          handlePageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
          isOneIndexed={true} 
        />
      </>
      )}
    
    </div>
  );
};

export default GeneLociSearch;
