import React from 'react';
import { motion } from 'framer-motion';
import ConfirmationModal from '../molecules/ConfirmationModal';
import EditVarietyListForm from '../molecules/EditVarietyListForm';
import { Toaster, toast } from 'sonner';
import api from '../../services/api';
import PageButtons from '../molecules/PageButtons';

const VarietyListModal = ({
  totalPages,
  currentPage,
  setCurrentPage,
  isModalOpen,
  selectedList,
  activeTab,
  showVarietyEditForm,
  setIsModalOpen,
  setShowVarietyEditForm,
  showDeleteModal,
  setShowDeleteModal,
  handleDelete,
  handleUpdateSuccess,
  setSelectedListContent,
  selectedListContent,
  varietySets,
  varietyLists,
}) => {

  if (!isModalOpen || activeTab !== 'Variety' || !selectedList) return null;

  
  const handlePageChange = async (pageNumber) =>{
    setCurrentPage(pageNumber)
    let fetchedContent = []
      try{
        let response = await api.post(`/api/list/general/getListContent`,{
          id: selectedList.id,
          pageNumber: pageNumber
        })
                
        if(response.data){
          fetchedContent = response.data.content       
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
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300 ease-out animate-fadeIn">
      <Toaster/>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }} 
        transition={{ duration: 0.2, ease: "linear" }}
        className="relative flex flex-col bg-white p-6 rounded-lg shadow-lg h-[80%] w-[80%] max-w-[1500px] overflow-y-auto transform transition-all duration-300 scale-95 animate-scaleUp"
      >
        <button 
          onClick={() => {setIsModalOpen(false); setShowVarietyEditForm(false)}} 
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition duration-200 "
        >
          ✕
        </button>
        <div className="w-full flex items-center mb-2 ">
          <div className="w-1/2">
            <h2 className="text-xl font-['Poppins-Bold'] text-green-2 mb-4">List Details</h2>
          </div>
          <div className="flex w-1/2 items-center justify-end mr-10 gap-2">
            <button
              onClick={() => setShowVarietyEditForm((prev) => !prev)}
              className={`px-2 py-2 w-32  text-white  shadow-md hover:text-yellow-1 transition font-['Open-Sans'] duration-300 ${showVarietyEditForm ? "bg-red-800" : "bg-green-2 "}`}
            >
              {showVarietyEditForm ? "Cancel Edit" : "Edit"}
            </button>
            {!showVarietyEditForm && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-2 py-2 w-32 bg-red-800 text-white shadow-md hover:text-yellow-1 transition font-['Open-Sans'] duration-300"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {showVarietyEditForm && (
          <EditVarietyListForm
            handleUpdateSuccess={handleUpdateSuccess}
            listDetails={selectedList}
            selectedListContent={selectedListContent}
            varietySets={varietySets}
            varietyListsNames={varietyLists.map(list => list.name)}
          />
        )}

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            await handleDelete(selectedList.id);
            setShowDeleteModal(false);
          }}
          title="Confirm Deletion"
          message="Are you sure you want to delete this list?"
          confirmText="Delete"
          cancelText="Cancel"
        />

        {!showVarietyEditForm && (
          <>
            <div className="bg-gray-100 p-4 rounded-lg shadow-md space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <span className="font-['Lato-Regular'] text-gray-700">
                  <strong className="text-green-1">Name:</strong> {selectedList.name}
                </span>
                <span className="font-['Lato-Regular'] text-gray-700">
                  <strong className="text-green-1">Variety Set:</strong> {selectedList.varietySet}
                </span>
                <span className="font-['Lato-Regular'] text-gray-700">
                  <strong className="text-green-1">Description:</strong> {selectedList.description}
                </span>
              </div>
            </div>

            <div className="mt-2 relative overflow-auto shadow-md sm:rounded-lg max-h-[70%]">
              <table className="w-full text-sm text-left rtl:text-right text-gray-300">
                <thead className="text-xs text-white uppercase bg-green-1 font-['Poppins-Bold']">
                  <tr>
                    <th scope="col" className="px-6 py-3 w-[16%]">Name</th>
                    <th scope="col" className="px-6 py-3 w-[8%]">Iris ID</th>
                    <th scope="col" className="px-6 py-3 w-[14%]">Accession</th>
                    <th scope="col" className="px-6 py-3 w-[14%]">Subpopulation</th>
                    <th scope="col" className="px-6 py-3 w-[8%]">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedListContent?.map((item, index) => (
                    <tr key={index} className="border-b bg-gray-800 border-gray-700 hover:bg-gray-600">
                      <th scope="row" className="px-6 py-4 font-medium  whitespace-nowrap text-white">
                        {item.name}
                      </th>
                      <td className="px-6 py-4">{item.irisId}</td>
                      <td className="px-6 py-4">{item.accession}</td>
                      <td className="px-6 py-4">{item.subpopulation}</td>
                      <td className="px-6 py-4">{item.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PageButtons handlePageChange={handlePageChange} currentPage={currentPage} totalPages={totalPages}/>
            
      
            
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VarietyListModal;
