import React from "react";

export default function SidebarSubItem({ text, icon: Icon, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer flex gap-3 items-center p-2 text-xs rounded-md 
                  ${isSelected ? "bg-green-1" : "hover:bg-green-1"} transition-colors duration-300`}
    >
      <Icon size={20} className="text-white" />
      {text}
    </div>
  );
}
