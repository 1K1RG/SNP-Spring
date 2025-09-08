import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import ChevronIcon from "../atoms/ChevronIcon";
import api from "../../services/api";

function PipelineForm({isSubmittingProject}) {
  const [formData, setFormData] = useState({
    project: "",
    selectedSequences: [],
    gff: "",
    reference: "",
    boundary: "",
    minRangeSize: "",
    pad: "",

  });

  const pollLogStatus = async (endpoint, method, projectName, maxRetries = 10, delay = 10000) => {
    let retries = 0;
  
    while (retries < maxRetries) {
      let res;
      try {
        res = await api.post(endpoint, { Project_Name: projectName });
        
  
        const stat = res.data?.[2];
        console.log(stat["Exit status"])
        console.log("++++++++");
        if (stat && "Exit status" in stat) {
          const exitCode = stat["Exit status"];
          if (exitCode == "0") {
            return true; // Success
          }
        }
      } catch (error) {
        res = await api.post(endpoint, { Project_Name: projectName });
        console.log(error)
      }
      retries++;
      await new Promise((res) => setTimeout(res, delay)); // Wait before retry
    }
    
    toast.error(`${endpoint} timed out waiting for status.`);
    return false;
  };


  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    let isValid = true;
    const newErrors = {};
    
    if (!formData.project) {
      newErrors.project = "Select a Project";
      isValid = false;
    }

    if (formData.selectedSequences.length === 0) {
      newErrors.selectedSequences = "At least one sequence is required";
      isValid = false;
    }

    if (!formData.gff) {
      newErrors.gff = "Select a GFF File";
      isValid = false;
    }

    
    if (!formData.reference) {
        newErrors.reference = "Select a Reference File";
        isValid = false;
    }

    if (!formData.boundary) {
        newErrors.boundary = "Select a Boundary";
        isValid = false;
    }

    if (!formData.minRangeSize) {
        newErrors.minRangeSize = "Enter a Min Range Size";
        isValid = false;
    }

    if (!formData.pad) {
        newErrors.pad = "Enter a Pad Size";
        isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };



  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/PHG/pipeline/get-directory-projects');
        setProjects(res.data.Files);

      } catch (error) {
        toast.error("An error occurred while fetching projects");
      }
    };
  
    fetchProjects();
  }, [isSubmittingProject]);





  // Multi-select dropdown for Sequences
  const [showSequencesDropdown, setShowSequencesDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showGffDropdown, setShowGffDropdown] = useState(false);
  const [showReferenceDropdown, setShowReferenceDropdown] = useState(false);
  const [showBoundaryDropdown, setShowBoundaryDropdown] = useState(false);

  const sequenceOptions = [
    { value: "Ref.fa", label: "Ref.fa" },
    { value: "LineA.fa", label: "LineA.fa" },
    { value: "LineB.fa", label: "LineB.fa" },
  ];

  const toggleDropdown = (setDropdownState) => {
    setDropdownState((prev) => !prev);
  };
  const handleSelect = (field, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));
  };

  const handleSequenceSelect = (value) => {
    let newSequences;
    if (formData.selectedSequences.includes(value)) {
      newSequences = formData.selectedSequences.filter((seq) => seq !== value);
    } else {
      newSequences = [...formData.selectedSequences, value];
    }
    setFormData({ ...formData, selectedSequences: newSequences });
  };

  const handleDropdownBlur = (e, setDropdownState) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropdownState(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      const newNames = formData.selectedSequences.map(filename =>
        filename.replace(/\.[^/.]+$/, "")
      );
      try {
          // 1. Prepare Assembly
          const prepareRes  = await api.post(`/PHG/pipeline/prepare-assembly`, {
            sequences: formData.selectedSequences,
            new_names: newNames,
            Project_Name: formData.project,
            hvcf_anchorgap: 1000000, 
            gvcf_anchorgap: 1000
          });

          toast.info("Pipeline started, please wait...");

      
           if (!prepareRes.data) {
            toast.error("Failed to start Prepare Assembly.");
            return;
          } else if(prepareRes.data.detail === "Process already running.") {
            toast.error("Process is already running.");
            return;
          }
          // 2. Init DB (with log check)
          const initDbOK = await pollLogStatus("/PHG/pipeline/init-db-log-file", "post", formData.project);
          if (!initDbOK) return;
          
           // 🔁 Wait for prepare-assembly to complete
          const prepareOK = await pollLogStatus("/PHG/pipeline/prepare-assembly-log-file", "post", formData.project);
          if (!prepareOK) return;

          //remove the value in formdata.reference from the selected sequences
          const filteredSequences = formData.selectedSequences.filter(seq => seq !== formData.reference);
      

          // 3. Compress FASTA
          const compressRes = await api.post(`/PHG/pipeline/agc-compress`, {
            Project_Name: formData.project,
            sequences: filteredSequences,
            reference: formData.reference,
          });
          if (!compressRes.data) return toast.error("Compress FASTA failed");

          const compressOK = await pollLogStatus("/PHG/pipeline/agc-compress-log-file", "post", formData.project);
          if (!compressOK) return;

      
           // 4. Create Reference Ranges
            const rangeRes = await api.post(`/PHG/pipeline/create-reference-ranges`, {
              Project_Name: formData.project,
              gff_file: formData.gff,
              reference: formData.reference,
              boundary: formData.boundary,
              pad: Number(formData.pad),
              min_range_size: Number(formData.minRangeSize),
            });
            if (!rangeRes.data) return toast.error("Create reference ranges failed");

            const rangeOK = await pollLogStatus("/PHG/pipeline/create-reference-ranges-log-file", "post", formData.project);
            if (!rangeOK) return;
      
          // 5. Align Assemblies
          const alignRes = await api.post(`/PHG/pipeline/align-assemblies`, {
            Project_Name: formData.project,
            gff_file: formData.gff,
            reference: formData.reference,
            sequences: filteredSequences,
          });
          if (!alignRes.data) return toast.error("Align assemblies failed");

          const alignOK = await pollLogStatus("/PHG/pipeline/align-assemblies-log-file", "post", formData.project);
          if (!alignOK) return;

          // 6. Create VCF
          const vcfRes = await api.post(`/PHG/pipeline/create-vcf`, {
            reference: formData.reference,
            Project_Name: formData.project,
          });
          if (!vcfRes.data) return toast.error("Create VCF failed");


          // 7. Load VCF
          const loadRes = await api.post(`/PHG/pipeline/load-vcf`, {
            Project_Name: formData.project,
          });
          if (!loadRes.data) return toast.error("Load VCF failed");

          const loadOK = await pollLogStatus("/PHG/pipeline/load-vcf-log-file", "post", formData.project);
          if (!loadOK) return;
          
  
          toast.success("Pipeline completed successfully!");
          setIsSubmitting(false);
          setFormData({
            project: "",
            selectedSequences: [],
            gff: "",
            reference: "",
            boundary: "",
            minRangeSize: "",
            pad: "",
          });

      } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred");
        setIsSubmitting(false);
      }
    } else {
      toast.warning("Please validate your inputs");
    }
  };
  useEffect(() => {
   console.log(formData);
  }
  , [formData]);

  return (
    <form
      onSubmit={handleSubmit}
      className=" w-full mx-auto mb-4 p-4 bg-gray-100 rounded shadow-md relative z-0"
    >
      <Toaster />

      
     <div className="mb-4 relative" tabIndex={0} onBlur={(e) => handleDropdownBlur(e, setShowProjectDropdown)}>
        <label htmlFor="project" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Project
        </label>
        <div className="relative">
          <button
            type="button"
            id="project"
            name="project"
            onClick={()=>toggleDropdown(setShowProjectDropdown)}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] flex justify-between items-center bg-white"
          >
            <span className="font-['Lato-Regular']">
              {formData.project === ""
                ? "Select a Project"
                : formData.project}
            </span>
            <ChevronIcon className={`w-5 h-5 text-gray-500 transition-transform`} />
          </button>
          {showProjectDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-auto">
              {projects.map((project) => (
              <button
                key={project}
                type="button"
                onClick={() => {
                  handleSelect('project', project)
                  setShowProjectDropdown(false);
                }}
                className="font-['Lato-Regular'] flex w-full text-left items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {project}
              </button>
            ))}
            </div>
          )}
        </div>
        {errors.project && (
          <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.project}</span>
        )}
      </div>

      {/* Sequences Multi-select Dropdown */}
      <div className="mb-4 relative" tabIndex={0} onBlur={(e) => handleDropdownBlur(e, setShowSequencesDropdown)}>
        <label htmlFor="selectedSequences" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Sequences
        </label>
        <div className="relative">
          <button
            type="button"
            id="selectedSequences"
            name="selectedSequences"
            onClick={()=>toggleDropdown(setShowSequencesDropdown)}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] flex justify-between items-center bg-white"
          >
            <span className="font-['Lato-Regular']">
              {formData.selectedSequences.length === 0
                ? "Select a Sequence"
                : formData.selectedSequences.join(", ")}
            </span>
            <ChevronIcon className={`w-5 h-5 text-gray-500 transition-transform`} />
          </button>
          {showSequencesDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-auto">
              {sequenceOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedSequences.includes(option.value)}
                    onChange={() => handleSequenceSelect(option.value)}
                    className="mr-2 font-['Lato-Regular']"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          )}
        </div>
        {errors.selectedSequences && (
          <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.selectedSequences}</span>
        )}
      </div>

     <div className="mb-4 relative" tabIndex={0} onBlur={(e) => handleDropdownBlur(e, setShowGffDropdown)}>
        <label htmlFor="gff" className="block text-md font-['Poppins-Bold'] text-gray-700">
          GFF File 
        </label>
        <div className="relative">
          <button
            type="button"
            id="gff"
            name="gff"
            onClick={()=>toggleDropdown(setShowGffDropdown)}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] flex justify-between items-center bg-white"
          >
            <span className="font-['Lato-Regular']">
              {formData.gff === ""
                ? "Select a GFF File"
                : formData.gff}
            </span>
            <ChevronIcon className={`w-5 h-5 text-gray-500 transition-transform `} />
          </button>
          {showGffDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-auto">
       
              <button
                key={"anchors.gff"}
                type="button"
                onClick={() => {
                  handleSelect('gff', "anchors.gff")
                  setShowGffDropdown(false);
                }}
                className="font-['Lato-Regular'] flex w-full text-left items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                anchors.gff
              </button>
          
            </div>
          )}
        </div>
        {errors.gff && (
          <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.gff}</span>
        )}
      </div>

    
    <div className="mb-4 relative" tabIndex={0} onBlur={(e) => handleDropdownBlur(e, setShowReferenceDropdown)}>
        <label htmlFor="reference" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Reference File 
        </label>
        <div className="relative">
          <button
            type="button"
            id="reference"
            name="reference"
            onClick={()=>toggleDropdown(setShowReferenceDropdown)}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] flex justify-between items-center bg-white"
          >
            <span className="font-['Lato-Regular']">
              {formData.reference === ""
                ? "Select a Reference File"
                : formData.reference}
            </span>
            <ChevronIcon className={`w-5 h-5 text-gray-500 transition-transform`} />
          </button>
          {showReferenceDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-auto">
       
              <button
                key={"Ref.fa"}
                type="button"
                onClick={() => {
                  handleSelect('reference', "Ref.fa")
                  setShowReferenceDropdown(false);
                }}
                className="font-['Lato-Regular'] flex w-full text-left items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                Ref.fa
              </button>
              <button
                key={"LineA.fa"}
                type="button"
                onClick={() => {
                  handleSelect('reference', "LineA.fa")
                  setShowReferenceDropdown(false);
                }}
                className="font-['Lato-Regular'] flex w-full text-left items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                LineA.fa
              </button>

              <button
                key={"LineB.fa"}
                type="button"
                onClick={() => {
                  handleSelect('reference', "LineB.fa")
                  setShowReferenceDropdown(false);
                }}
                className="font-['Lato-Regular'] flex w-full text-left items-center px-3 py-2 hover:bg-gray-100 cursor-pointer" 
              >
                LineB.fa
              </button>
          
            </div>
          )}
        </div>
        {errors.reference && (
          <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.reference}</span>
        )}
      </div>

    <div className="mb-4 relative" tabIndex={0} onBlur={(e) => handleDropdownBlur(e, setShowBoundaryDropdown)}>
        <label htmlFor="boundary" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Boundary
        </label>
        <div className="relative">
          <button
            type="button"
            id="boundary"
            name="boundary"
            onClick={()=>toggleDropdown(setShowBoundaryDropdown)}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] flex justify-between items-center bg-white"
          >
            <span className="font-['Lato-Regular']">
              {formData.boundary === ""
                ? "Select a Boundary"
                : formData.boundary}
            </span>
            <ChevronIcon className={`w-5 h-5 text-gray-500 transition-transform`} />
          </button>
          {showBoundaryDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-auto">
       
              <button
                key={"gene"}
                type="button"
                onClick={() => {
                  handleSelect('boundary', "gene")
                  setShowBoundaryDropdown(false);
                }}
                className="font-['Lato-Regular'] flex w-full text-left items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                gene
              </button>
              <button
                key={"cds"}
                type="button"
                onClick={() => {
                  handleSelect('boundary', "cds")
                  setShowBoundaryDropdown(false);
                }}
                className="font-['Lato-Regular'] flex w-full text-left items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                cds
              </button>
      
            </div>
          )}
        </div>
        {errors.boundary && (
          <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.boundary}</span>
        )}
      </div>

     <div className="mb-4 relative">
        <label htmlFor="pad" className="block mt-4 text-md font-['Poppins-Bold'] text-gray-700">
            Pad
        </label>
        <input
            type="number"
            id="pad"
            name="pad"
            value={formData.pad}
            onChange={handleChange}
            min={500}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
        />
        {errors.pad && (
            <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.pad}</span>
        )}
    </div>
    <div className="mb-4 relative">
        <label htmlFor="minRangeSize" className="block mt-4 text-md font-['Poppins-Bold'] text-gray-700">
            Min Range Size
        </label>
        <input
            type="number"
            id="minRangeSize"
            name="minRangeSize"
            value={formData.minRangeSize}
            onChange={handleChange}
            min={500}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
        />
        {errors.minRangeSize && (
            <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.minRangeSize}</span>
        )}
    </div>

      {/* Submit Button */}
      <div className="flex justify-center p-1">
        <button
          type="submit"
          className="font-['Open-Sans'] w-[300px] border-2 font-semibold border-green-2 bg-green-2 py-2.5 px-5 text-white transition-all ease-out duration-300 hover:text-yellow-1 flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          )}
          {isSubmitting ? "Processing..." : "Submit"}
        </button>
      </div>
    </form>
  );
}

export default PipelineForm;
