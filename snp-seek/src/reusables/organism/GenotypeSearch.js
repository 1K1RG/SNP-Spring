import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"; // Ensure Lucide React is installed
import GenotypeSearchForm from "../molecules/GenotypeSearchForm";
import VarietyTable from "../molecules/VarietyTable";
import api from "../../services/api";
import { Toaster, toast } from "sonner";
import { useAuth } from "../../services/AuthContext";
import PageButtons from "../molecules/PageButtons";
import FloatingButton from "../atoms/FloatingButton";
import PageTitle from "../atoms/PageTitle";
const GenotypeSearch = ({ results, setResults }) => {
  const {role} = useAuth()
  const [formOpen, setFormOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [referenceGenomePositions, setReferenceGenomePositions] = useState({})
  const [isDownloading, setIsDownloading] = useState(false)


  const [submittedFormData, setSubmittedFormData] = useState({
    referenceGenome: "Japonica Nipponbare",
    varietySet:"",
    snpSet: "",
    subpopulation:"",
    varietylist:"",
    geneLocus:"",
    snpList:"",
    locusList:"",
  });

  const [submittedRegionSearch, setSubmittedRegionSearch] = useState({
    contig: "",
    start: "",
    end: "",
  });

  const [submittedRegionMethod, setSubmittedRegionMethod] = useState(null)

  const [submittedVarietyListId, setSubmittedVarietyListId] = useState("")
  const [submittedSnpListContent, setSubmittedSnpListContent] = useState([])
  const [submittedContigsStartsEnds, setSubmittedContigsStartsEnds] = useState({})

  useEffect(() => {
    if (results?.referenceGenomePositions) {
        setReferenceGenomePositions(results.referenceGenomePositions); // Update state

        // Ensure the update happens before passing to VarietyTable
        setResults(prevResults => {
            const updatedResults = { ...prevResults };
            delete updatedResults.referenceGenomePositions;
            return updatedResults;
        });

      }
  }, [results, setResults]);

  const handlePageChange = async (pageNumber) => {
    setCurrentPage(pageNumber)
    if(submittedRegionMethod === "Range" || submittedRegionMethod === "Gene Locus"){
        if(submittedFormData.varietylist == ""){
          try{
              let response = await api.post("/api/variety/genotypeSearchRange",{
                  "referenceGenome": "Japonica Nipponbare",
                  "varietySet": submittedFormData.varietySet,
                  "snpSet": submittedFormData.snpSet,
                  "subpopulation": submittedFormData.subpopulation,
                  "varietyList": [],
                  "snpList":[],
                  "locusList":[],
                  "contig": submittedRegionSearch.contig,
                  "start": submittedRegionSearch.start,
                  "end": submittedRegionSearch.end,
                  "page": pageNumber,
                  "askTotalPages": false,          
                  "askReferenceGenome": false
              })

              if(response.data){
                  setResults(response.data)
              }
          }catch(error){
              toast.error("Failed to get results")
          }
        }else{
          let fetchedContent = []
          try{
            let response = await api.post(`/api/list/general/getListContent`,{
              id: submittedVarietyListId,
              pageNumber: pageNumber
            })
        
            if (response.data) {
                fetchedContent = response.data.content
            }
            
            response = await api.post("/api/variety/genotypeSearchRange",{
                "referenceGenome": "Japonica Nipponbare",
                "varietySet": submittedFormData.varietySet,
                "snpSet": submittedFormData.snpSet,
                "subpopulation": submittedFormData.subpopulation,
                "varietyList": fetchedContent,
                "snpList":[],
                "locusList":[],
                "contig": submittedRegionSearch.contig,
                "start": submittedRegionSearch.start,
                "end": submittedRegionSearch.end,
                "page": 0,
                "askTotalPages": false,          
                "askReferenceGenome": false
            })

            if(response.data){
              setResults(response.data)
            }

          }catch(error){
            toast.error("Failed to get contents")
          }
              
        }
        
    }

    if(submittedRegionMethod === "SNP List"){
        if(submittedFormData.varietylist == ""){
          try{
              let response = await api.post("/api/variety/general/genotypeSearchSnpList",{
                  "referenceGenome": "Japonica Nipponbare",
                  "varietySet": submittedFormData.varietySet,
                  "snpSet": submittedFormData.snpSet,
                  "subpopulation": submittedFormData.subpopulation,
                  "varietyList": [],
                  "snpList": submittedSnpListContent,
                  "locusList":[],
                  "contig": "",
                  "start": "",
                  "end": "",
                  "page": pageNumber,
                  "askTotalPages": false,          
                  "askReferenceGenome": false
              })

              if(response.data){
                  setResults(response.data)
              }
          }catch(error){
              toast.error("Failed to get results")
          }
        }else{
          let fetchedContent = []
          try{
            let response = await api.post(`/api/list/general/getListContent`,{
              id: submittedVarietyListId,
              pageNumber: pageNumber
            })
        
            if (response.data) {
                fetchedContent = response.data.content
            }
            
            response = await api.post("/api/variety/general/genotypeSearchSnpList",{
                "referenceGenome": "Japonica Nipponbare",
                "varietySet": submittedFormData.varietySet,
                "snpSet": submittedFormData.snpSet,
                "subpopulation": submittedFormData.subpopulation,
                "varietyList": fetchedContent,
                "snpList": submittedSnpListContent,
                "locusList":[],
                "contig": "",
                "start": "",
                "end": "",
                "page": 0,
                "askTotalPages": false,          
                "askReferenceGenome": false
            })

            if(response.data){
              setResults(response.data)
            }

          }catch(error){
            toast.error("Failed to get contents")
          }
              
        }
        
    }
    if(submittedRegionMethod === "Locus List"){
        if(submittedFormData.varietylist == ""){
          try{
              let response = await api.post("/api/variety/general/genotypeSearchLocusList",{
                  "referenceGenome": "Japonica Nipponbare",
                  "varietySet": submittedFormData.varietySet,
                  "snpSet": submittedFormData.snpSet,
                  "subpopulation": submittedFormData.subpopulation,
                  "varietyList": [],
                  "snpList": [],
                  "locusList":[],
                  "contigs": submittedContigsStartsEnds.contigs,
                  "starts": submittedContigsStartsEnds.starts,
                  "ends": submittedContigsStartsEnds.ends,
                  "page": pageNumber,
                  "askTotalPages": false,          
                  "askReferenceGenome": false
              })

              if(response.data){
                  setResults(response.data)
              }
          }catch(error){
              toast.error("Failed to get results")
          }
        }else{
          let fetchedContent = []
          try{
            let response = await api.post(`/api/list/general/getListContent`,{
              id: submittedVarietyListId,
              pageNumber: pageNumber
            })
        
            if (response.data) {
                fetchedContent = response.data.content
            }
            
            response = await api.post("/api/variety/general/genotypeSearchLocusList",{
                "referenceGenome": "Japonica Nipponbare",
                "varietySet": submittedFormData.varietySet,
                "snpSet": submittedFormData.snpSet,
                "subpopulation": submittedFormData.subpopulation,
                "varietyList": fetchedContent,
                "snpList": [],
                "locusList":[],
                "contigs": submittedContigsStartsEnds.contigs,
                "starts": submittedContigsStartsEnds.starts,
                "ends": submittedContigsStartsEnds.ends,
                "page": 0,
                "askTotalPages": false,          
                "askReferenceGenome": false
            })

            if(response.data){
              setResults(response.data)
            }

          }catch(error){
            toast.error("Failed to get contents")
          }
              
        }
        
    }
  }

  const handleDownload = async () => {  
    setIsDownloading(true)
    try {

      let varietyIds = []
      if(!submittedFormData.varietylist == ""){
        let getAllContent = await api.post(`/api/list/general/getListAllContent`,{
          id: submittedVarietyListId,
        })

        if(getAllContent.data){
          varietyIds = getAllContent.data
        }
      }

      if(submittedRegionMethod === "Locus List"){
        const response = await api.post(
          `api/variety/general/generateExcelLocus`,
          {
           genotypeSearchLocusListRequest:{
            referenceGenome: submittedFormData.referenceGenome,
            varietySet: submittedFormData.varietySet,
            snpSet: submittedFormData.snpSet,
            subpopulation:submittedFormData.subpopulation,
            varietyList: [],
            snpList: [],
            locusList: [],
            contigs: submittedContigsStartsEnds.contigs,
            starts: submittedContigsStartsEnds.starts,
            ends: submittedContigsStartsEnds.ends,
            page:0,
            askTotalPages: true,
            askReferenceGenome: true,
           },
           varietyListIds:varietyIds
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
        a.download = "genotype.xlsx"; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }else{
        const response = await api.post(
          `api/variety/general/generateExcel`,
          {
            genotypeSearchRequest:{
            referenceGenome: submittedFormData.referenceGenome,
            varietySet: submittedFormData.varietySet,
            snpSet: submittedFormData.snpSet,
            subpopulation:submittedFormData.subpopulation,
            varietyList: [],
            snpList: submittedSnpListContent,                     
            locusList: [],                                            //assumed empty
            contig: submittedRegionSearch.contig,                     
            start:  submittedRegionSearch.start,
            end:  submittedRegionSearch.end,
            page:0,
            askTotalPages: true,
            askReferenceGenome: true,
           },
           varietyListIds:varietyIds
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
        a.download = "genotype.xlsx"; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast.success("Results Downloaded");
    } catch (error) {
      toast.warning("Failed to Download");
      console.error("Download error:", error);
    }finally{
      setIsDownloading(false)
    }
  };
  return (
    <div className="flex ml-20 flex-col gap-3 w-full overflow-hidden ">
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
          <GenotypeSearchForm 
          setSubmittedFormData = {setSubmittedFormData}
          setSubmittedRegionSearch = {setSubmittedRegionSearch}
          setSubmittedRegionMethod = {setSubmittedRegionMethod}
          setSubmittedVarietyListId ={setSubmittedVarietyListId}
          setSubmittedSnpListContent = {setSubmittedSnpListContent}
          setSubmittedContigsStartsEnds = {setSubmittedContigsStartsEnds}
          setCurrentPage ={setCurrentPage}
          setTotalPages = {setTotalPages}
          setResults={setResults} />
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <FloatingButton icon={Search} setter={setFormOpen} value={!formOpen}/>

      {/* Page Title */}
      <div className="flex">
      <PageTitle text={"Genotype Search"}/>
        {results?.varietyPositions && Object.keys(referenceGenomePositions).length > 0 && role !== "GUEST" &&(
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
      {results?.varietyPositions && Object.keys(referenceGenomePositions).length > 0 && (
      <> 
        
        <VarietyTable results={results} referenceGenomePositions={referenceGenomePositions} />
        <PageButtons handlePageChange={handlePageChange} currentPage={currentPage} totalPages={totalPages} />
      </>
      )}
    
    </div>
  );
};

export default GenotypeSearch;
