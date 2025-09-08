import React, { useRef, useEffect , useState } from "react";
import { Toaster, toast } from 'sonner';
import api from "../../services/api";
import ChevronIcon from "../atoms/ChevronIcon";

function GeneLociSearchForm({
  setSubmittedFormData,
  setSubmittedWordSearch,
  setSubmittedTraitSearch,
  setSubmittedRegionSearch,
  setCurrentPage,
  setTotalPages,
  setResults,
}) {
  
  const [formData, setFormData] = useState({
    referenceGenome: "",
    searchBy: "",
    geneModel: "All",
  });

  const [wordSearch, setWordSearch] = useState({
    searchMethod: "",
    searchQuery: "",
  });

  const [traitSearch, setTraitSearch] = useState({
    traitCategory: "",
    traitName: "",
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
  const [filteredContigs, setFilteredContigs] = useState([]);

  const contigDropdownRef = useRef(null);

  const [traits, setTraits] = useState([])

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableReferenceGenomes, setAvailableReferenceGenomes] = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleWordSearchChange = (e) => {
    const { name, value } = e.target;
    setWordSearch({ ...wordSearch, [name]: value });
  };

  const handleRegionSearchChange = (e) => {
    const { name, value } = e.target;
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

  const handleTraitSearchChange = async (e) => {
    try {
        const { name, value } = e.target;
        if (name == "traitCategory") {
            // Call API to set the traits
            const response = await api.post(`api/geneloci/getTraitNames`, {
                category: value
            });
            setTraits(response.data);

            // If category is changed, reset traitName
            setTraitSearch((prev) => ({
                ...prev,
                traitCategory: value,
                traitName: prev.traitCategory !== value ? "" : prev.traitName
            }));

            return; // Exit early to prevent duplicate state update
        }
        setTraitSearch({ ...traitSearch, [name]: value });
    } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred");
    }
  };


  const validate = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.referenceGenome) {
      newErrors.referenceGenome = "Reference Genome is required";
      isValid = false;
    }

    if (!formData.searchBy) {
      newErrors.searchBy = "Search By option is required";
      isValid = false;
    }

    //If searchBy is "Annotation (by Source)" or "Gene Name/Symbol/Function" 
    if (["Annotation (by Source)", "Gene Name/Symbol/Function"].includes(formData?.searchBy)) {
      if (!wordSearch.searchMethod) {
        newErrors.searchMethod = "Search Method is required";
        isValid = false;
      }
      if (!wordSearch.searchQuery) {
        newErrors.searchQuery = "Search Query is required";
        isValid = false;
        }
    }

    //If searchBy is "Region"
    if (formData.searchBy == "Region") {
      const regex = /^chr([1-9]|1[0-2])$/;

      if (!regionSearch.contig) {
        newErrors.contig = "Contig is required";
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

    //If searchBy is "Trait"
    if (formData.searchBy == "Trait") {
      if (!traitSearch.traitCategory) {
        newErrors.traitCategory = "Trait Category is required";
        isValid = false;
      }
      if (!traitSearch.traitName) {
        newErrors.traitName = "Trait name is required";
        isValid = false;
      }
     
    }
    

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    const fetchReferenceGenomes = async()=>{
      try{
        const response = await api.post(`api/geneloci/getAllReferenceGenomes`, {
         }); 
        
         if(response.data){
          setAvailableReferenceGenomes(response.data)
         }else{
          setAvailableReferenceGenomes([])
         }
         
      }catch(error){
        toast.error("Failed to fetch Reference Genomes")
      }
    }

    fetchReferenceGenomes()

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setSubmittedFormData(formData);
      setSubmittedWordSearch(wordSearch);
      setSubmittedTraitSearch(traitSearch);
      setSubmittedRegionSearch(regionSearch);
    
      try {
        if (formData.searchBy == "Gene Name/Symbol/Function") {
           const response = await api.post(`api/geneloci/searchByGeneName`, {
            referenceGenome: formData.referenceGenome,
            searchMethod: wordSearch.searchMethod,
            searchQuery: wordSearch.searchQuery.trim(),
            pageNumber: 1
           }); 


          setResults(response.data.results);
          setTotalPages(response.data.totalPages);
          setCurrentPage(1);
          if(response.data.results.length == 0){
            toast.warning("No results found");
          }else{
            toast.success("Results Loaded")
          }
        }
        
        if (formData.searchBy == "Region") {
          const response = await api.post(`api/geneloci/searchByRegion`, {
            referenceGenome: formData.referenceGenome,
            contig: regionSearch.contig.trim().toLowerCase(),
            start: regionSearch.start.trim(),
            end: regionSearch.end.trim(),
            pageNumber: 1
          });

          setResults(response.data.results);
          setTotalPages(response.data.totalPages);
          setCurrentPage(1);
          if(response.data.results.length == 0){
            toast.warning("No results found");
          }else{
            toast.success("Results Loaded")
          }
        }

        if (formData.searchBy == "Annotation (by Source)") {
          const response = await api.post(`api/geneloci/searchByAnnotation`, {
            referenceGenome: formData.referenceGenome,
            searchMethod: wordSearch.searchMethod,
            searchQuery: wordSearch.searchQuery.trim(),
            pageNumber: 1
          });

          setResults(response.data.results);
          setTotalPages(response.data.totalPages);
          setCurrentPage(1);
          if(response.data.results.length == 0){
            toast.warning("No results found");
          }else{
            toast.success("Results Loaded")
          }
        }

        if (formData.searchBy == "Trait") {
          const response = await api.post(`api/geneloci/searchByTrait`, {
            referenceGenome: formData.referenceGenome,
            traitName: traitSearch.traitName,
            pageNumber: 1
          });

          setResults(response.data.results);
          setTotalPages(response.data.totalPages);
          setCurrentPage(1);
          if(response.data.results.length == 0){
            toast.warning("No results found");
          }else{
            toast.success("Results Loaded")
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


  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto p-4 bg-gray-100 rounded shadow-md">
      <Toaster />

      {/* Reference Genome Dropdown */}
      <div className="mb-4 relative ">
        <label htmlFor="referenceGenome" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Reference Genome
        </label>
        <div className="relative">
          <select
            id="referenceGenome"
            name="referenceGenome"
            value={formData.referenceGenome}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
          >
            <option value="">Select Reference Genome</option>
            {availableReferenceGenomes.map((refGenome) => (
              <option key={refGenome} value={refGenome}>{refGenome}</option>
            ))}
            <option value="All">All</option>
          </select>
          <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
        </div>
        {errors.referenceGenome && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.referenceGenome}</span>}
      </div>

      {/* Search By Dropdown */}
      <div className="mb-4 relative">
        <label htmlFor="searchBy" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Search By
        </label>
        <div className="relative">
          <select
            id="searchBy"
            name="searchBy"
            value={formData.searchBy}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
          >
            <option value="">Select Search Criteria</option>
            <option value="Annotation (by Source)">Annotation (by Source)</option>
            <option value="Gene Name/Symbol/Function">Gene Name/Symbol/Function</option>
            <option value="Trait">Trait</option>
            <option value="Region">Region</option>
          </select>
          <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
        </div>
        {errors.searchBy && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.searchBy}</span>}
      </div>

      {/* Gene Model Dropdown (Always 'All') */}
      <div className="mb-4 relative">
        <label htmlFor="geneModel" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Gene Model
        </label>
        <div className="relative">
          <select
            id="geneModel"
            name="geneModel"
            value={formData.geneModel}
            disabled
            className="mt-1 p-2 w-full border rounded bg-gray-200 cursor-not-allowed font-['Lato-Regular'] appearance-none"
          >
            <option value="All">All</option>
          </select>
          <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
        </div>
      </div>
      
      {/* If  <option value="Annotation (by Source)">Annotation (by Source)</option> or 
          <option value="Gene Name/Symbol/Function">Gene Name/Symbol/Function</option> then add a row  wit a dropwdown (dropdown options: Whole word only, Substring, Exact Match, RegEx) and textarea*/}
      {["Annotation (by Source)", "Gene Name/Symbol/Function"].includes(formData?.searchBy) && (
        <div className="mb-4 flex gap-4">
            <div className="w-1/2">
                <label htmlFor="searchMethod" className="block text-md font-['Poppins-Bold'] text-gray-700">
                    Search Method
                </label>
                <div className="relative">
                  <select
                      id="searchMethod"
                      name="searchMethod"
                      value={wordSearch.searchMethod}
                      onChange={handleWordSearchChange}
                      className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
                  >   
                      <option value="">Select Search Method</option>
                      <option value="Whole word only">Whole word only</option>
                      <option value="Substring">Substring</option>
                      <option value="Exact Match">Exact Match</option>
                      <option value="RegEx">RegEx</option>
                  </select>
                  <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
                </div>
                {errors.searchMethod && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.searchMethod}</span>}

            </div>
            <div className="w-1/2">
                <label htmlFor="searchQuery" className="block text-md font-['Poppins-Bold'] text-gray-700">
                    Search Query
                </label>
                <textarea
                    id="searchQuery"
                    name="searchQuery"
                    value={wordSearch.searchQuery}
                    onChange={handleWordSearchChange}
                    className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
                    placeholder="Enter your search term"
                ></textarea>
                {errors.searchString && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.searchString}</span>}
            </div>
        </div>
    )}

    {formData.searchBy == "Trait" && (
      <div className="mb-4 flex gap-4">
        <div className="w-1/2">
            <label htmlFor="traitCategory" className="block text-md font-['Poppins-Bold'] text-gray-700">
                Trait Category
            </label>
            <div className="relative">

              <select
                  id="traitCategory"
                  name="traitCategory"
                  value={traitSearch.traitCategory}
                  onChange={handleTraitSearchChange}
                  className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
              >   
                  <option value="">Select Trait Category</option>
                  <option value="Q-Taro Traits">Q-Taro Traits</option>
                  <option value="TO Plant Trait Ontology">TO Plant Trait Ontology</option>
                  <option value="PO Plant Anatomy">PO Plant Anatomy</option>
                  <option value="PO Development Stage">PO Development Stage</option>
              </select>
              <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />

            </div>
            {errors.traitCategory && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.traitCategory}</span>}

        </div>
        <div className="w-1/2">
            <label htmlFor="traitName" className="block text-md font-['Poppins-Bold'] text-gray-700">
                Trait Name
            </label>
            <div className="relative">
              <select
                  id="traitName"
                  name="traitName"
                  value={traitSearch.traitName}
                  onChange={handleTraitSearchChange}
                  className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
              >   
                <option value="">Select Trait Name</option>
                {traits.map((trait, index) => (
                  <option key={index} value={trait}>
                    {trait}
                  </option>
                ))}
              </select>
              <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />

            </div>
            {errors.traitName && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.traitName}</span>}
        </div>
    </div>

  )}


    {formData.searchBy == "Region" && (
            <div className="mb-4 flex gap-4">
                <div className="w-1/3 relative" ref={contigDropdownRef}>
                    <label htmlFor="contig" className="block text-md font-['Poppins-Bold'] text-gray-700">
                        Contig
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
                            onClick={() => handleSelectContig(contig)} 
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


      {/* Submit Button */}
      <div className="flex justify-center p-1">
        <button
          type="submit"
					className="mx-auto w-[300px] border-2 font-semibold border-green-2 bg-green-2 py-2.5 px-5  font-['Open-Sans'] text-white transition-all ease-out duration-300 hover:text-yellow-1"
          disabled={isSubmitting}
        >
          Search
        </button>
      </div>
    </form>
  );
}

export default GeneLociSearchForm;
