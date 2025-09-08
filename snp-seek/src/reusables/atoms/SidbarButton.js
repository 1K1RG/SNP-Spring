import React from "react";

export default function SidebarButton({ icon: Icon, text, onClick, isCollapsed, chevron, isSelected }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-2 ${isCollapsed ? "w-fit" : "w-full"} rounded-md ${isSelected ? "bg-green-1" : "hover:bg-green-1"} transition-all duration-300`}
    >
      <Icon size={20} className="text-white shrink-0 " />
      <span
        className={`font-['Lato-Regular'] transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap 
                   ${isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"}`}
      >
        {text}
      </span>
      {!isCollapsed && chevron && (
        <chevron.type
          size={16}
          className={`ml-auto transition-transform duration-300 ${chevron.props.isOpen ? "rotate-180" : "rotate-0"}`}
        />
      )}
    </button>
  );
}
