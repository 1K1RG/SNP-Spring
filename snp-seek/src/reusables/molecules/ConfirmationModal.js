import { motion } from "framer-motion";

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }} 
        transition={{ duration: 0.2 }}
        className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center"
      >
        <h2 className="text-lg font-bold text-gray-800 font-['Poppins-Bold']">{title}</h2>
        <p className="text-gray-600 mt-2 text-sm font-['Open-Sans']">{message}</p>
        
        <div className="flex justify-center gap-4 mt-10">
          <button
            onClick={onClose}
            className="font-['Open-Sans'] font-bold px-5 py-2 bg-green-2 text-white  hover:text-yellow-1 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="font-['Open-Sans'] font-bold px-5 py-2 bg-red-800 text-white  hover:text-yellow-1 transition"
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmationModal;
