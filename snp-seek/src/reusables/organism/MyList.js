import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react"; // Ensure Lucide React is installed
import VarietyListForm from "../molecules/VarietyListForm";
import api from "../../services/api";
import { toast } from "sonner";
import SnpListForm from "../molecules/SnpListFrom";
import VarietyListModal from "./VarietyListModal";
import SnpListModal from "./SnpListModal";
import LocusListForm from "../molecules/LocusListForm";
import LocusListModal from "./LocusListModal";
import FloatingButton from "../atoms/FloatingButton";
import PageTitle from "../atoms/PageTitle";

const MyList = ({}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Variety");
  const [varietySets, setVarietySets] = useState([]);
  const [snpSets, setSnpSets] = useState([]);
  
  const [varietyLists, setVarietyLists] = useState([]);
  const [snpLists, setSnpLists] = useState([]);
  const [locusLists, setLocusLists] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVarietyEditForm, setShowVarietyEditForm] = useState(false);
  const [showSnpEditForm, setsShowSnpEditForm] = useState(false);
  const [showLocusEditForm, setsShowLocusEditForm] = useState(false);
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)


  const tabData = {
    Variety: varietyLists,
    SNP: snpLists,
    Locus: locusLists,
  };
  
  //pop-up modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedListContent, setSelectedListContent] = useState([]);

  const fetchLists = async () => {
    try{

      const response = await api.post(`/api/list/general/getList`, {
        "userId": JSON.parse(localStorage.getItem("userDetails")).id
      });

      if(response.data){
        setVarietyLists(response.data.variety || []);
        setSnpLists(response.data.snp || []);
        setLocusLists(response.data.locus || []);
      }
      
      
    }catch(error){
      toast.error("Error fetching Lists");
    }
  };

  const handleDelete = async (id) => {
    try{

      const response = await api.post(`/api/list/general/deleteList`, {
        id:id 
      });

      if(response.data === "List deleted successfully!"){
        setIsModalOpen(false)
        setSelectedList(null)
        toast.success(response.data)
        fetchLists()
      }else{
        toast.success(response.data)
      }
      
    }catch(error){
      toast.error("Error deleting Lists");
    }
  };

  useEffect(() => {
    const fetchVarietySetAndSnpSet = async () => {
      try{

        const response = await api.post(`/api/variety/getAllSnpSetAndVarietySet`, {
        });
        const varietySetValues = response.data.map((item) => item.varietySet);
        const snpSetValues = response.data.flatMap((item) => item.snpSets || []);
        
        setVarietySets(varietySetValues);
        setSnpSets(snpSetValues);

      }catch(error){
        toast.error("Error fetching Variety and SNP set");
      }
    };

    fetchVarietySetAndSnpSet();
    fetchLists();

  }, []);

  const handleUpdateSuccess = () => {
    toast.success("List updated successfully!");
    fetchLists();  // Refresh the lists after updating
    setTimeout(() => {

      setShowVarietyEditForm(false);  // Close the edit form
      setsShowSnpEditForm(false);  // Close the edit form
      setsShowLocusEditForm(false);
      setIsModalOpen(false);  // Close the modal

    }, 1500);  // 1.5 seconds delay (adjust as needed)
  
  };

  
  const handleListClick = async (list) => {

    if(activeTab === "Variety"){
      try {

        let fetchedContent = []

        let response = await api.post(`/api/list/general/getListContent`,{
          id: list.id,
          pageNumber: 0
        })
        
        setSelectedList(list);
        setIsModalOpen(true);
        
        if(response.data){
          fetchedContent = response.data.content
          setCurrentPage(0)
          setTotalPages(response.data.totalPages-1) //To even things out
        }
        
         response = await api.post(`/api/variety/getVarietiesByIds`, {
          ids: fetchedContent
        });
    
        if (response.data) {
          setSelectedListContent(response.data);
        } else {
          setSelectedListContent([]); // Set empty array if response data is null or undefined
        }
      } catch (error) {
        toast.error("Failed to fetch list content. Please try again.");
        setSelectedListContent([]); // Ensure the state does not remain undefined
      }

    }else if(activeTab === "SNP"){

      let fetchedContent = []

      let response = await api.post(`/api/list/general/getListContent`,{
        id: list.id,
        pageNumber: 0
      })

      if (response.data) {
        fetchedContent = response.data.content
        setCurrentPage(0)
        setTotalPages(response.data.totalPages-1) //To even things out
        setSelectedListContent(fetchedContent); // Update state with fetched data
      }else{
        setSelectedListContent([]); 
      }
      
      setSelectedList(list);
      setIsModalOpen(true);
      
    }else if(activeTab === "Locus"){
      try {
        let fetchedContent = []

        let response = await api.post(`/api/list/general/getListContent`,{
          id: list.id,
          pageNumber: 0
        })

        if(response.data){
          fetchedContent = response.data.content
          setCurrentPage(0)
          setTotalPages(response.data.totalPages-1) //To even things out
        }
        setSelectedList(list);
        setIsModalOpen(true);
    
        response = await api.post(`/api/geneloci/getGenesByIds`, {
          items: fetchedContent
        });
    
        if (response.data) {
          setSelectedListContent(response.data);
        } else {
          setSelectedListContent([]); // Set empty array if response data is null or undefined
        }
      } catch (error) {
        toast.error("Failed to fetch list content. Please try again.");
        setSelectedListContent([]); // Ensure the state does not remain undefined
      }

    }
    
  };

  

  const renderListItems = (listItems) => {
    return listItems.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listItems.map((list) => (
          <motion.div
            key={list.id}
            className="cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleListClick(list)}
          >
            <div className="flex flex-col p-4 gap-2 bg-white shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-all max-h-50 h-full">
              <h2 className="text-xl font-['Poppins-Bold'] text-green-2 truncate max-w-full">
                {list.name}
              </h2>
              <span className="text-gray-500 line-clamp-2 text-sm font-['Lato-Regular']">
                {list.description || "No description provided"}
              </span>
                <span className="mt-auto text-sm text-gray-400 truncate block">
                  {activeTab === 'Variety' && `Variety Set: ${list.varietySet}`}
                  {activeTab === 'SNP' && `SNP Set: ${list.snpSet}`}
                </span>
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <span className="mx-auto my-auto  text-green-2 text-center font-['Poppins-Bold'] text-3xl ">No {activeTab} lists found.</span>
    );
  };



 
  return (
    <div className="flex ml-20 flex-col gap-3 w-full ">
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
            <h2 className="text-lg font-['Poppins-Bold']">Enter {activeTab} List Details</h2>
            <button onClick={() => setFormOpen(false)} className="text-gray-500">✕</button>
          </div>
          {/*Add List Form*/}
          {activeTab === "Variety"  && (
            <VarietyListForm varietySets={varietySets} varietyListsNames={varietyLists.map(list => list.name)} fetchLists={fetchLists} />
          )}
          {activeTab === "SNP" && (
            <SnpListForm snpSets={snpSets} snpListsNames={snpLists.map(list=>list.name)} fetchLists={fetchLists}/>

          )}
          {activeTab === "Locus" && (
            <LocusListForm locusListsNames={locusLists.map(list=>list.name)} fetchLists={fetchLists}/>
          )}
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <FloatingButton icon={Plus} setter={setFormOpen} value={!formOpen}/>


      {/* Page Title */}
      <PageTitle text={"My List"}/>

      {/* Tab Buttons */}
      <div className="flex border-b items-center">
            {Object.keys(tabData).map((tab) => (
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

       </div>
        

     
      {/* List Content */}
      {activeTab === "Variety" && renderListItems(varietyLists)}
      {activeTab === "SNP" && renderListItems(snpLists)}
      {activeTab === "Locus" && renderListItems(locusLists)} 

      <VarietyListModal
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isModalOpen={isModalOpen}
        selectedList={selectedList}
        activeTab={activeTab}
        showVarietyEditForm={showVarietyEditForm}
        setIsModalOpen={setIsModalOpen}
        setShowVarietyEditForm={setShowVarietyEditForm}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDelete={handleDelete}
        handleUpdateSuccess={handleUpdateSuccess}
        setSelectedListContent={setSelectedListContent}
        selectedListContent={selectedListContent}
        varietySets={varietySets}
        varietyLists={varietyLists}
      />

     <SnpListModal
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isModalOpen={isModalOpen}
        selectedList={selectedList}
        activeTab={activeTab}
        showSnpEditForm={showSnpEditForm}
        setIsModalOpen={setIsModalOpen}
        setsShowSnpEditForm={setsShowSnpEditForm}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDelete={handleDelete}
        handleUpdateSuccess={handleUpdateSuccess}
        setSelectedListContent={setSelectedListContent}
        selectedListContent={selectedListContent}
        snpSets={snpSets}
        snpLists={snpLists}
    />

    <LocusListModal
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isModalOpen={isModalOpen}
        selectedList={selectedList}
        activeTab={activeTab}
        showLocusEditForm={showLocusEditForm}
        setIsModalOpen={setIsModalOpen}
        setsShowLocusEditForm={setsShowLocusEditForm}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDelete={handleDelete}
        handleUpdateSuccess={handleUpdateSuccess}
        setSelectedListContent={setSelectedListContent}
        selectedListContent={selectedListContent}
        locusLists={locusLists}
    />


     

    
    </div>
  );
};

export default MyList;

