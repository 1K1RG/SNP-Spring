import React, { useRef, useEffect , useState } from "react";
import { Toaster, toast } from 'sonner';
import api from "../../services/api";
import ChevronIcon from "../atoms/ChevronIcon";
import { motion } from "framer-motion";
import { useAuth } from "../../services/AuthContext";
import { ExternalLink } from "lucide-react";


function GenotypeSearchForm({
    setSubmittedRegionMethod,
    setSubmittedFormData, 
    setSubmittedRegionSearch, 
    setSubmittedVarietyListId,
    setSubmittedSnpListContent,
    setSubmittedContigsStartsEnds,
    setCurrentPage,
    setTotalPages,
    setResults}) { 


    
  const { role  } = useAuth();


  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };
  
  const [formData, setFormData] = useState({
    referenceGenome: "Japonica Nipponbare",
    varietySet:"",
    snpSet: "",
    subpopulation:"",
    varietylist:"",
    geneLocus:"",
    snpList:"",
    locusList:"",
  });

   const [regionSearch, setRegionSearch] = useState({
      contig: "",
      start: "",
      end: "",
    });
  
  const contigs = [
    "chr1", "chr2", "chr3", "chr4", "chr5", "chr6",
    "chr7", "chr8", "chr9", "chr10", "chr11", "chr12"
  ];

  const [activeTab, setActiveTab] = useState("Dataset");
  const [filteredContigs, setFilteredContigs] = useState([]);
  const contigDropdownRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableReferenceGenomes, setAvailableReferenceGenomes]= useState([])
  const [availableSets, setAvailableSets] = useState([])
  const [varietyLists, setVarietyLists] = useState([]);
  const [snpLists, setSnpLists] = useState([]);
  const [locusLists, setLocusLists] = useState([]);
  const [regionMethod, setRegionMethod] = useState("Range");
  const [isAvailableOpen, setIsAvailableOpen] = useState(false);
  

  const handleRegionSearchChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
        ...prevData,
        snpList: "",
        locusList: "",
    }));

    setRegionSearch({ ...regionSearch, [name]: value });

    if (name=="contig" && value ) {
      setFilteredContigs(contigs.filter(contig => contig.includes(value.toLowerCase())));
    } else if(name=="contig" && !value) {
      setFilteredContigs([]);
    }
  };

  const handleSelectContig = (contigValue) => {
    setRegionSearch((prev) => ({
      ...prev, // Keep other properties unchanged
      contig: contigValue, // Update only the contig field
    }));
    setFilteredContigs([]); // Hide dropdown after selection
  };

const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prevData) => ({
        ...prevData,
        [name]: value,
        ...(name === "subpopulation" ? { varietylist: "" } : {}),
        ...(name === "varietylist" ? { subpopulation: "" } : {}),
    }));
    
};


  const validate = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.referenceGenome) {
      newErrors.referenceGenome = "Reference Genome is required";
      isValid = false;
    }

    if (!formData.varietySet) {
      newErrors.varietySet = "Variety Set is required";
      isValid = false;
    }

    if (!formData.snpSet) {
        newErrors.snpSet = "SNP Set is required";
        isValid = false;
    }

    if (!formData.subpopulation && !formData.varietylist) {
        newErrors.both = "Please Select a Subpopulation or Variety List";
        toast.warning("Please Select a Subpopulation or Variety List")
        isValid = false;
    }

    if(regionMethod === "Range"){
        const regex = /^chr([1-9]|1[0-2])$/;

        if(!regionSearch.contig){
            newErrors.contig = "Chromosome is required";
            isValid = false;
        }

        if(regionSearch.contig && !regex.test(regionSearch.contig)){
            newErrors.contig = "chr1 to chr12 only";
            isValid = false;
        }

        if (!regionSearch.start) {
            newErrors.start = "Start position is required";
            isValid = false;
          }
          if (!regionSearch.end) {
            newErrors.end = "End position is required";
            isValid = false;
          }
    
          if (regionSearch.start && regionSearch.end && Number(regionSearch.start) > Number(regionSearch.end)) {
            newErrors.start = "Start position must be less than end position";
            isValid = false;
          }
    }

    if(regionMethod === "Gene Locus"){
        if(!formData.geneLocus){
            newErrors.geneLocus = "Gene Locus is required";
            isValid = false;
        }
    }

    if(regionMethod === "SNP List"){
        if(!formData.snpList){
            newErrors.snpList = "SNP List is required";
            isValid = false;
        }
    }

    if(regionMethod === "Locus List"){
        if(!formData.locusList){
            newErrors.locusList = "Locus List is required";
            isValid = false;
        }
    }


    setErrors(newErrors);
    return isValid;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      //Clear previous search results
      setCurrentPage(0)
      setTotalPages(0)
      setIsSubmitting(true);
     
      try {
        let fetchedContent = []

        if(formData.varietylist !== ""){   // Using Variety List
            const varietyList = varietyLists.find((item) => item.name === formData.varietylist);
            
            const varietyListId = varietyList.id
            let response = await api.post(`/api/list/general/getListContent`,{
                id: varietyListId,
                pageNumber: 0
              })
        
            if (response.data) {
                fetchedContent = response.data.content
                setCurrentPage(0)
                setTotalPages(response.data.totalPages-1) //To even things out
                setSubmittedVarietyListId(varietyListId)
            }
        }


        if (formData.geneLocus.trim() !== ""){ // Get the Contig, Start, and end of the passed gene locus
            let  response = await api.post(`api/geneloci/getContigStartEndOfGene`, {
                geneName: formData.geneLocus.trim()
            }); 
            if (response.data && response.data.length > 0) {
                let geneData = response.data[0];  // Extract first object
                regionSearch.contig = geneData.contig
                regionSearch.start = geneData.start
                regionSearch.end = geneData.end
            } else {
                setIsSubmitting(false);
                toast.warning("Gene Locus not existing")
                return
            }
        }

        if(regionMethod === "Range" || regionMethod === "Gene Locus"){

            try{
                let response = await api.post("/api/variety/genotypeSearchRange",{
                    "referenceGenome": "Japonica Nipponbare",
                    "varietySet": formData.varietySet,
                    "snpSet": formData.snpSet,
                    "subpopulation": formData.subpopulation,
                    "varietyList": fetchedContent,
                    "snpList":[],
                    "locusList":[],
                    "contig": regionSearch.contig,
                    "start": regionSearch.start,
                    "end": regionSearch.end,
                    "page":0,
                    "askTotalPages": formData.varietylist == "" ? true : false,          //don't ask for pages if using variety list
                    "askReferenceGenome": true
                })

                if(response.data){
                    if(Object.keys(response.data.referenceGenomePositions).length === 0){
                        toast.warning("No Results Found!")
                        setResults([])
                    }else if(Object.keys(response.data.referenceGenomePositions).length > 10000){
                        toast.error("More than 10,000 positions, please narrow down your search")
                        setResults([])
                    }else{
                        setResults(response.data)
                        setSubmittedRegionSearch(regionSearch)
                        setSubmittedFormData(formData)
                        setSubmittedRegionMethod(regionMethod)

                        setSubmittedSnpListContent([])                                  //Just to remove unused data
                        setSubmittedContigsStartsEnds({})

                       
                        toast.success("Results Loaded")

                      
                        if(formData.varietylist == ""){
                            setCurrentPage(0)
                            setTotalPages(response.data.totalPages-1)
                        }
                    }
            
                }

            }catch(error){
                toast.error("Failed to get Range results")
            }
        }

        if(regionMethod === "SNP List"){
            let snpListContent = []
            try{
                
                const snpList = snpLists.find((item) => item.name === formData.snpList);
                const snpListId = snpList.id

                let response = await api.post(`/api/list/general/getListAllContent`,{
                    id: snpListId,
                  })
            
                if (response.data) {
                    snpListContent = response.data
                }

                 response = await api.post("/api/variety/general/genotypeSearchSnpList",{
                    "referenceGenome": "Japonica Nipponbare",
                    "varietySet": formData.varietySet,
                    "snpSet": formData.snpSet,
                    "subpopulation": formData.subpopulation,
                    "varietyList": fetchedContent,
                    "snpList": snpListContent,
                    "locusList":[],
                    "contig": "",
                    "start": "",
                    "end": "",
                    "page":0,
                    "askTotalPages": formData.varietylist == "" ? true : false,          //don't ask for pages if using variety list
                    "askReferenceGenome": true
                })

                if(response.data){
                    if(Object.keys(response.data.referenceGenomePositions).length === 0){
                        toast.warning("No Results Found!")
                        setResults([])
                    }else if(Object.keys(response.data.referenceGenomePositions).length > 10000){
                        toast.error("More than 10,000 positions, please narrow down your search")
                        setResults([])
                    }
                    else{
                        setResults(response.data)
                        setSubmittedRegionSearch(regionSearch)
                        setSubmittedFormData(formData)
                        setSubmittedRegionMethod(regionMethod)
                        setSubmittedSnpListContent(snpListContent)
                        setSubmittedContigsStartsEnds({})
                        
                        toast.success("Results Loaded")
             
                        
                        if(formData.varietylist == ""){
                            setCurrentPage(0)
                            setTotalPages(response.data.totalPages-1)
                        }

                    }
                  
                }

            }catch(error){
                toast.error("Failed to get SNP Lists results")
            }
        }

        if(regionMethod === "Locus List"){
            let locusListContent = []
            let contigsStartsEnds = {}
            try{
                
                const locusList = locusLists.find((item) => item.name === formData.locusList);
                const locusListId = locusList.id

                let response = await api.post(`/api/list/general/getListAllContent`,{
                    id: locusListId,
                  })
            
                if (response.data) {
                    locusListContent = response.data
                }

                response = await api.post(`/api/geneloci/general/getContigsStartsEndsOfGenesById`,{
                    items: locusListContent,
                  })
            
                if (response.data) {
                    contigsStartsEnds = response.data
                }

                 response = await api.post("/api/variety/general/genotypeSearchLocusList",{
                    "referenceGenome": "Japonica Nipponbare",
                    "varietySet": formData.varietySet,
                    "snpSet": formData.snpSet,
                    "subpopulation": formData.subpopulation,
                    "varietyList": fetchedContent,
                    "snpList": [],
                    "locusList":[],
                    "contigs": contigsStartsEnds.contigs,
                    "starts": contigsStartsEnds.starts,
                    "ends": contigsStartsEnds.ends,
                    "page":0,
                    "askTotalPages": formData.varietylist == "" ? true : false,          //don't ask for pages if using variety list
                    "askReferenceGenome": true
                })

                if(response.data){
                    if(Object.keys(response.data.referenceGenomePositions).length === 0){
                        toast.warning("No Results Found!")
                        setResults([])

                    }else if(Object.keys(response.data.referenceGenomePositions).length > 10000){
                        toast.error("More than 10,000 positions, please narrow down your search")
                        setResults([])
                    }else{
                        setResults(response.data)
                        setSubmittedRegionSearch(regionSearch)
                        setSubmittedFormData(formData)
                        setSubmittedRegionMethod(regionMethod)
                        setSubmittedContigsStartsEnds(contigsStartsEnds)

                        setSubmittedSnpListContent([]) 
                        
                        
                        toast.success("Results Loaded")

                        
                        
                        if(formData.varietylist == ""){
                            setCurrentPage(0)
                            setTotalPages(response.data.totalPages-1)
                        }

                    }
                  
                }

            }catch(error){
                toast.error("Failed to get Locus List Content")
            }
        }
        
      } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred");
        setIsSubmitting(false);
      }
    } else {
      toast.warning('Please validate your inputs');
    }
  setIsSubmitting(false);

  };
  
  
   useEffect(() => {
    const fetchResources = async()=>{
        try{
           let  response = await api.post(`api/variety/getAllReferenceGenomeNames`, {
           }); 
          
           if(response.data){
            setAvailableReferenceGenomes(response.data)
           }else{
            setAvailableReferenceGenomes([])
           }

            response = await api.post(`api/variety/getAllSnpSetAndVarietySet`, {
            });
            
            if(response.data){
                setAvailableSets(response.data)
            }else{
                setAvailableSets([])
            }
            
            if(JSON.parse(localStorage.getItem("userDetails")) == null){
                return
            }
            response = await api.post(`/api/list/general/getList`, {
                "userId": JSON.parse(localStorage.getItem("userDetails")).id
            });
    
            if(response.data){
                setVarietyLists(response.data.variety || []);
                setSnpLists(response.data.snp || []);
                setLocusLists(response.data.locus || []);
            }
            
           
        }catch(error){
          toast.error("Failed to fetch resources")
        }
      }
  
      fetchResources()
    
      const handleClickOutside = (event) => {
        if (contigDropdownRef.current && !contigDropdownRef.current.contains(event.target)) {
          setFilteredContigs([]); // Hide dropdown when clicking outside
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  useEffect(() => {
    let updatedFormData = { ...formData }; // Copy existing form data

    if (regionMethod === "Range") {
        updatedFormData = { ...updatedFormData, geneLocus: "", snpList: "", locusList: "" };
    } 
    else if (regionMethod === "Gene Locus") {
        updatedFormData = { ...updatedFormData, snpList: "", locusList: "" };
        setRegionSearch({ contig: "", start: "", end: "" });
    } 
    else if (regionMethod === "SNP List") {
        updatedFormData = { ...updatedFormData, geneLocus: "", locusList: "" };
        setRegionSearch({ contig: "", start: "", end: "" });
    } 
    else if (regionMethod === "Locus List") {
        updatedFormData = { ...updatedFormData, snpList: "", geneLocus: "" };
        setRegionSearch({ contig: "", start: "", end: "" });
    }

    setFormData(updatedFormData); 
}, [regionMethod]);




  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto p-4 bg-gray-100 rounded shadow-md">
       <div className="flex border-b items-center">
            {["Dataset", "Region"].map((tab) => (
                <button
                type="button"
                key={tab}
                className={`py-2 px-4 text-md font-['Lato-Regular'] font-bold transition-colors duration-500 ${
                    activeTab === tab ? "border-b-2 border-green-2 text-green-2" : "text-gray-400"
                }`}
                onClick={() => setActiveTab(tab)}
                >
                {tab}
                </button>
            ))}

            <button
            type="submit"
            className={` font-["Lato-Regular"]  h-fit ml-auto py-2 px-6 text-md font-bold text-white bg-green-2 rounded transition-colors duration-300 hover:text-yellow-1`}
            disabled={isSubmitting}
            >
                Search
            </button>
       </div>

      

      {/* Reference Genome Dropdown */}
    {activeTab === "Dataset" && (
        <motion.div 
        key="Dataset"
        variants={tabVariants}
        initial="hidden"
        animate="visible"
        exit="hidden">
            <div className="my-4 relative ">
                <label htmlFor="referenceGenome" className="block text-md font-['Poppins-Bold'] text-gray-700">
                Reference Genome
                </label>
                <div className="relative">

                <select
                id="referenceGenome"
                name="referenceGenome"
                value={formData.referenceGenome}
                onChange={handleChange}
                disabled={true}
                className=" mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                >
                {availableReferenceGenomes.map((refGenome) => (
                <option key={refGenome} value={refGenome}>{refGenome}</option>
                ))}
                </select>
                <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
                </div>

                {errors.referenceGenome && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.referenceGenome}</span>}

            </div>

            <div className="my-4 relative ">
                <label htmlFor="varietySet" className="block text-md font-['Poppins-Bold'] text-gray-700">
                 Variety Set
                </label>
                <div className="relative">

                <select
                id="varietySet"
                name="varietySet"
                value={formData.varietySet}
                onChange={handleChange}
                className=" mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                >
                <option value="" disabled>Select Variety Set</option> {/* Default placeholder */}
                {availableSets.map((set) => (
                    <option key={set.varietySet} value={set.varietySet}>{set.varietySet}</option>
                ))}
                </select>
                <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
                </div>
                {errors.varietySet && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.varietySet}</span>}

            </div>

           

            {/* Snp Set */}
            <div className="mb-4 relative ">
                <label htmlFor="snpSet" className="block text-md font-['Poppins-Bold'] text-gray-700">
                SNP Set
                </label>
                <div className="relative">
                    <select
                    id="snpSet"
                    name="snpSet"
                    value={formData.snpSet}
                    onChange={handleChange}
                    className=" mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                    >
                    
                    <option value="" disabled>Select SNP Set</option> {/* Default placeholder */}
                    {availableSets.find(set => set.varietySet === formData.varietySet)?.snpSets?.map((snpSet) => (
                        <option key={snpSet} value={snpSet}>{snpSet}</option>
                    ))}

                    </select>
                    <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
                </div>

                {errors.snpSet && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.snpSet}</span>}
            </div>

            {/* Snp Set */}
            <div className="mb-4 relative ">
                <label htmlFor="subpopulation" className="block text-md font-['Poppins-Bold'] text-gray-700">
                Subpopulation
                </label>
                <div className="relative">
                    <select
                    id="subpopulation"
                    name="subpopulation"
                    value={formData.subpopulation}
                    onChange={handleChange}
                    className=" mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                    >
                    {/* OPTIONS */}
                    <option value="">Select Subpopulation</option>
                    <option value="All">All</option>
                    {availableSets.find(set => set.varietySet === formData.varietySet)?.subpopulations?.map((subpopulation) => (
                        <option key={subpopulation} value={subpopulation}>{subpopulation}</option>
                    ))}
                    </select>
                    <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
                </div>

                {errors.both && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.both}</span>}
            </div>
            {role !== "GUEST" && (
            <div className="mb-4 relative ">
                <label htmlFor="varietylist" className="block text-md font-['Poppins-Bold'] text-gray-700">
                Variety List
                </label>
                <div className="relative">
                    <select
                    id="varietylist"
                    name="varietylist"
                    value={formData.varietylist}
                    onChange={handleChange}
                    className=" mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                    >
                    {/* OPTIONS */}
                    <option value="">Select Variety List</option>
                    {varietyLists
                        .filter(list => list.varietySet === formData.varietySet) // Get matching varietySet
                        .map(item => item.name) // Extract names
                        .map(name => (
                            <option key={name} value={name}>{name}</option>
                    ))}
                    </select>
                    <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
                </div>

                {errors.both && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.both}</span>}
            </div>
             )} 
        </motion.div>
    )}

    {activeTab === "Region" && (
         <motion.div 
         key="Dataset"
         variants={tabVariants}
         initial="hidden"
         animate="visible"
         exit="hidden">


        <div className="my-4 relative ">
            <label htmlFor="regionMethod" className="block text-md font-['Poppins-Bold'] text-gray-700">
            Region Method
            </label>
            <div className="relative">
                <select
                id="regionMethod"
                name="regionMethod"
                value={regionMethod}
                onChange={(e) => setRegionMethod(e.target.value)}  
                className=" mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                >
                {/* OPTIONS */}
                    <option className="text-gray-700" value="Range">Range</option>
                    <option className="text-gray-700" value="Gene Locus">Gene Locus</option>

                    {role !== "GUEST" && (
                        <>
                        <option className="text-gray-700" value="SNP List">SNP List</option>
                        <option className="text-gray-700" value="Locus List">Locus List</option>
                        </>
                     )} 
                                     
                </select>
                <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
            </div>
        </div>
        {regionMethod === "Range" &&(
            <div className="my-4 flex gap-4">
                <div className="w-1/3 relative" ref={contigDropdownRef}>
                    <label htmlFor="contig" className="block text-md font-['Poppins-Bold'] text-gray-700">
                        Chromosome
                    </label>
                    <input
                        type="text"
                        id="contig"
                        name="contig"
                        value={regionSearch.contig}
                        onChange={handleRegionSearchChange}
                        className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
                        placeholder="(ex. chr1)"
                    />
                    {errors.contig && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.contig}</span>}
                    {/* Dropdown Suggestions */}
                    {filteredContigs.length > 0 && (
                        <ul className="absolute w-full left-0 right-0 bg-white border border-gray-300 mt-1 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredContigs.map((contig) => (
                            <li 
                            key={contig} 
                            onMouseDown={()=>handleSelectContig(contig)}
                            className="p-2 hover:bg-gray-200 cursor-pointer text-gray-700"
                            >
                            {contig}
                            </li>
                        ))}
                        </ul>
                    )}
                </div>
                <div className="w-1/3">
                    <label htmlFor="start" className="block text-md font-['Poppins-Bold'] text-gray-700">
                        Start
                    </label>
                    <input
                        type="number"
                        id="start"
                        name="start"
                        value={regionSearch.start}
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= 1) {
                                handleRegionSearchChange(e);
                            }
                        }}
                        min="1"
                        className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
                        placeholder="Enter start position"
                    />
                    {errors.start && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.start}</span>}
                </div>
                <div className="w-1/3">
                    <label htmlFor="end" className="block text-md font-['Poppins-Bold'] text-gray-700">
                        End
                    </label>
                    <input
                        type="number"
                        id="end"
                        name="end"
                        value={regionSearch.end}
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            if (value >= 1 ) {
                                handleRegionSearchChange(e);
                            }
                        }}
                        min={1} 
                        className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
                        placeholder="Enter end position"
                    />
                    {errors.end && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.end}</span>}
                </div>
            </div>

        )}
        
        {regionMethod === "Gene Locus" &&(
            <div className="mb-4 flex ">
                <div className="w-full relative" >
                    <label htmlFor="geneLocus" className="flex block text-md font-['Poppins-Bold'] text-gray-700">
                        Gene Locus
                        <a 
                            className="ml-auto font-['Open-Sans'] cursor-pointer font-bold text-yellow-1 hover:text-green-2 underline duration-300 ease-in-out" 
                            onClick={() => setIsAvailableOpen(true)}
                        >
                            Available Loci
                        </a>
                    </label>
                    <input
                        type="text"
                        id="geneLocus"
                        name="geneLocus"
                        value={formData.geneLocus}
                        onChange={handleChange}
                        className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
                        placeholder="(ex. loc_os01g01010)"
                    />
                    {errors.geneLocus && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.geneLocus}</span>}
                </div>
            </div>
        )}


        {regionMethod === "SNP List" &&(
            <div className="mb-4 relative ">
                <label htmlFor="snpList" className="block text-md font-['Poppins-Bold'] text-gray-700">
                SNP List
                </label>
                <div className="relative">
                    <select
                    id="snpList"
                    name="snpList"
                    value={formData.snpList}
                    onChange={handleChange}
                    className=" mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                    >
                    {/* OPTIONS */}
                        <option className="text-gray-400" value="">Select SNP List</option>
                        {snpLists
                            .filter(list => list.snpSet === formData.snpSet) // Get matching varietySet
                            .map(item => item.name) // Extract names
                            .map(name => (
                                <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
                </div>
    
                {errors.snpList && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.snpList}</span>}
            </div>
        )}
        
       
        {regionMethod === "Locus List" &&(
            <div className="mb-4 relative ">
                <label htmlFor="locusList" className="block text-md font-['Poppins-Bold'] text-gray-700">
                Locus List
                </label>
                <div className="relative">
                    <select
                    id="locusList"
                    name="locusList"
                    value={formData.locusList}
                    onChange={handleChange}
                    className=" mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                    >
                    {/* OPTIONS */}
                        <option className="text-gray-400" value="">Select Locus List</option>
                        {locusLists
                            .map(item => item.name) // Extract names
                            .map(name => (
                                <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
                </div>

                {errors.locusList && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.locusList}</span>}
            </div>
        )}

        {isAvailableOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 ease-out animate-fadeIn">
                <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                transition={{ duration: 0.2, ease: "linear" }}
                className="relative flex flex-col bg-white p-6 rounded-lg shadow-lg h-[90%] w-[90%] max-w-[1500px] overflow-hidden transform transition-all duration-300 scale-95 animate-scaleUp"
                >
                <button 
                    onClick={() => setIsAvailableOpen(false)} 
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition duration-200 "
                >
                    ✕
                </button>
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-['Poppins-Bold'] text-green-2 mb-2">Available Loci</h2>

                    <a 
                    href="https://docs.google.com/document/d/1maHElO6s4w0SZDRIAnd6qCkBHnWApHE45tZto1gYqCc/preview" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mb-2"
                    >
                    <ExternalLink className="text-gray-500 hover:text-gray-700 transition duration-200" />
                    </a>
                </div>

                <iframe 
                    id="availableLocus"
                    src="https://docs.google.com/document/d/1maHElO6s4w0SZDRIAnd6qCkBHnWApHE45tZto1gYqCc/preview" 
                    width="100%" 
                    height="100%" 
                    className="mt-4 rounded-md shadow" 
                />
                </motion.div>
            </div>
        )}
        

        </motion.div>
    )}

  


      

      
      
    </form>
  );
}

export default GenotypeSearchForm;
