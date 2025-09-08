import React, { useState, useEffect } from "react";
import { Toaster, toast } from 'sonner';
import ChevronIcon from "../atoms/ChevronIcon";
import { ExternalLink, Trash2 } from "lucide-react";
import api from "../../services/api";
import { motion } from "framer-motion";

function EditVarietyListForm({handleUpdateSuccess, listDetails, selectedListContent, varietySets, varietyListsNames}) {

  const [formData, setFormData] = useState({
    name: listDetails.name,
    description: listDetails.description,
    varietySet: listDetails.varietySet,
    snpSet:"",
    userId: listDetails.userId,
    type: "variety",
    content: [],
  });

  const [textAreaData, setTextAreaData] = useState({
    content: "",
  });

  const [storedLines, setStoredLines] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAvailableOpen, setIsAvailableOpen] = useState(false);
  const [varietiesNotFound, setVarietiesNotFound] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get list content
        let response = await api.post("/api/list/general/getListAllContent", {
          id: listDetails.id
        });
  
        if (response.data) {
          // Convert ids to names
          let fetchVarietyNames = await api.post(`/api/variety/getVarietyNamesByIds`, {
            ids: response.data
          });
  
          if (fetchVarietyNames.data) {
            // Store it
            setStoredLines(fetchVarietyNames.data)
          }
        }
      } catch (error) {
        toast.error("Failed to fetch resources");
      }
    };
  
    fetchData(); // Call the async function
  
  }, []);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const inputText = textAreaData.content.trim();
      if (inputText !== "") {
        addLinesToStorage(inputText);
      }
      setTextAreaData({ ...textAreaData, content: "" });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    setTextAreaData(prevState => ({
      ...prevState,
      content: prevState.content + pastedText
    }));
  };



  

  const addLinesToStorage = (inputText) => {
    // Split the input into lines based on newlines, and trim each line to avoid leading/trailing spaces
    const lines = inputText.split("\n")
    .map(line => line.trim().toUpperCase())  // Convert each line to uppercase
    .filter(line => line !== "");  // Remove empty lines

    // Remove duplicate lines
    const uniqueLines = Array.from(new Set(lines));

    // Convert stored lines to lowercase for case-insensitive comparison
    const storedLinesLowerCase = storedLines.map(line => line.toUpperCase());

    // Filter out lines that already exist in the storedLines (case-insensitive)
    const newLines = uniqueLines.filter(line => 
      !storedLinesLowerCase.includes(line)
    );

    // If there are new lines to add, update the state
    if (newLines.length > 0) {
      setStoredLines([...storedLines, ...newLines]);      
    }
  };

  const removeLine = (index) => {
    setStoredLines(storedLines.filter((_, i) => i !== index));
  };

  const validate = () => {
    const validNames = varietyListsNames.filter(name => name !== listDetails.name)
    let isValid = true;
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "List Name is required";
      isValid = false;
    }

    if(formData.name.trim() && validNames.includes(formData.name.trim())){
      newErrors.name = "List Name already exists";
      isValid = false;
    }

    if (formData.description.trim().length > 250) {  
      newErrors.description = "Maximum of 250 characters only";  
      isValid = false;  

    }

    if (!formData.varietySet) {
      newErrors.varietySet = "Variety Set is required";
      isValid = false;
    }

    if (formData.content.length === 0) {
      newErrors.content = "Enter at least one variety";
      isValid = false;

    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    formData.content = storedLines;
    if (validate()) {
      setIsSubmitting(true);
      try {
       
        const response = await api.post("/api/variety/general/checkItemsExistence", 
          {
            items: formData.content,
            varietySet: formData.varietySet
          }
        );
        
        if(response.data.nonExisting.length > 0){
          toast.error(`${response.data.nonExisting.length} Varieties not found out of ${response.data.existing.length + response.data.nonExisting.length}`);
          setVarietiesNotFound(response.data.nonExisting);
          setIsModalOpen(true);
        }else{
          //get the ids of the existing varieties
          const ids = response.data.existing.map((item) => item.id);
          formData.content = ids;
          try {
            const response = await api.post("/api/list/general/updateList", 
              {
                "id": listDetails.id,
                "name": formData.name,
                "description": formData.description,
                "varietySet": formData.varietySet,
                "snpSet": formData.snpSet,
                "userId": formData.userId,
                "type": formData.type,
                "content": formData.content
              }
            );
            

            if(response.data === "List updated successfully!"){
              //clear form data
              setFormData((prevState) => ({
                name: "",
                description: "",
                varietySet: "",
                snpSet: "",
                userId: prevState.userId, // Retaining the value of userId
                type: prevState.type, // Retaining the value of type
                content: []
              }));
      
              setStoredLines([]);
              handleUpdateSuccess()
            }else{
               toast.error(response.data);
            }
              
          } catch (error) {
            toast.error("Error updating list");
          }
        }
        
      } catch (error) {
        toast.error("Error updating list");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.warning('Please validate your inputs');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto p-4 bg-gray-100 rounded shadow-md">
      <Toaster />

      {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 ease-out animate-fadeIn">
            <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            transition={{ duration: 0.2, ease: "linear" }}
            className="relative flex flex-col bg-white p-6 rounded-lg shadow-lg h-[60%] w-[60%] max-w-[1500px] overflow-hidden  transform transition-all duration-300 scale-95 animate-scaleUp">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition duration-200 "
              >
                ✕
              </button>

              <h2 className="text-xl font-['Poppins-Bold'] text-green-2 mb-4">Varieties not found</h2>

              <div className="bg-gray-100 p-4 rounded-lg shadow-md space-y-2">

              <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                  {varietiesNotFound.map((varieties, index) => (
                    <div key={index} className="border p-2 rounded bg-gray-100 flex justify-between items-center">
                      <span>{varieties}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="my-auto mx-auto w-[300px] border-2 font-semibold border-green-2 bg-green-2 py-2.5 px-5 font-['Open-Sans'] text-white transition-all ease-out duration-300 hover:text-yellow-1"
                onClick={()=>setIsModalOpen(false)}
              >
                Got It
              </button>

            </motion.div>
          </div>
        )}

      <div className="mb-4 relative">
        <label htmlFor="name" className="block text-md font-['Poppins-Bold'] text-gray-700">
          List Name
        </label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="Enter list name"
        />
        {errors.name && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.name}</span>}
      </div>

      <div className="mb-4 relative">
        <label htmlFor="name" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Description (Optional)
        </label>
        <input
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="Enter Description"
        />
        {errors.description && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.description}</span>}
      </div>

      <div className="mb-4 relative">
        <label htmlFor="varietySet" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Variety Set
        </label>
        <div className="relative">
          <select
            id="varietySet"
            name="varietySet"
            value={formData.varietySet}
            onChange={handleChange}
            className="mt-1 p-2 w-full border rounded font-['Lato-Regular'] appearance-none"
          >
            <option value="">Select Variety</option>
            {varietySets.map((variety, index) => (
              <option key={index} value={variety}>
                {variety}
              </option>
            ))}
          </select>
          <ChevronIcon className="w-5 h-5 text-gray-500 absolute right-1 top-1/2 -translate-y-1/3" />
        </div>
        {errors.varietySet && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.varietySet}</span>}
      </div>

      <div className="mb-4 relative flex flex-col">
        <label htmlFor="content" className="flex block text-md font-['Poppins-Bold'] text-gray-700">
            Varieties
            <a 
              className="ml-auto font-['Open-Sans'] cursor-pointer font-bold text-yellow-1 hover:text-green-2 underline duration-300 ease-in-out" 
              onClick={() => setIsAvailableOpen(true)}
            >
              Available Varieties
            </a>
        </label>
        <textarea
          id="content"
          name="content"
          className="border border-gray-300 rounded p-2 w-full"
          rows="3"
          value={textAreaData.content}
          onChange={(e) => setTextAreaData({ ...textAreaData, content: e.target.value })}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Type name/iris_id/accession, then press ENTER to store"
        />
        <div className="flex">
          {errors.content && <span className="font-['Lato-Regular'] text-red-500 text-sm p-1">{errors.content} and Press ENTER to store</span>}
          <button
              type="button"
              onClick={()=>setStoredLines([])}
              className="flex  items-center justify-center gap-2 w-fit ml-auto mt-2 border-2 font-semibold border-green-2 bg-green-2  px-4 py-2 font-['Open-Sans'] text-white transition-all ease-out duration-300 hover:text-yellow-1 group"
            >
              <Trash2 className=" text-white transition-all ease-out duration-300 group-hover:text-yellow-1" />
              Clear All
          </button>

        </div>
         
        {/* Display Entered Lines */}
        <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
          {storedLines?.map((line, index) => (
            <div key={index} className="border p-2 rounded bg-gray-100 flex justify-between items-center">
              <span>{line}</span>
              <button
                type="button"
                className="ml-2 text-red-500 hover:text-red-700"
                onClick={() => removeLine(index)}
              >
                ✖
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* Submit Button */}
      <div className="flex justify-center p-1">
        <button
          type="submit"
          className="mx-auto w-[300px] border-2 font-semibold border-green-2 bg-green-2 py-2.5 px-5 font-['Open-Sans'] text-white transition-all ease-out duration-300 hover:text-yellow-1"
          disabled={isSubmitting}
        >
          Save Changes
        </button>
      </div>

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
              <h2 className="text-xl font-['Poppins-Bold'] text-green-2 mb-2">Available Varieties</h2>

              <a 
                href="https://docs.google.com/document/d/1bDRp-BR4W4iVyBbRS-59h-JRht1YcmJ3GgUdz22_40w/preview" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mb-2"
              >
                <ExternalLink className="text-gray-500 hover:text-gray-700 transition duration-200" />
              </a>
            </div>

            <iframe 
              id="availableVarieties"
              src="https://docs.google.com/document/d/1bDRp-BR4W4iVyBbRS-59h-JRht1YcmJ3GgUdz22_40w/preview" 
              width="100%" 
              height="100%" 
              className="mt-4 rounded-md shadow" 
            />
            
            
          </motion.div>
        </div>
      )}
    </form>
  );
}

export default EditVarietyListForm;
