import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import SidebarButton from "../atoms/SidbarButton";

export default function SidebarItem({ icon, text, children, isCollapsed }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <SidebarButton
        icon={icon}
        text={text}
        onClick={() => setIsOpen(!isOpen)}
        isCollapsed={isCollapsed}
        chevron={<ChevronDown isOpen={isOpen} />}

      />
      {!isCollapsed && (
        <div
          className={`ml-8 mt-2 space-y-2 transition-all duration-300 ease-in-out 
                     ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none  max-h-0"}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
