import React, { useState } from "react";
import { Menu, Search, PanelTopDashed, TableProperties } from "lucide-react";
import SidebarItem from "../molecules/SidebarItem";
import SidebarSubItem from "../atoms/SidebarSubItem";
export default function GuestSideBar({ setResults, setSelectedFeature, selectedFeature }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleSelect = (feature) => {
    if (selectedFeature !== feature) {
      setResults([]);
      setSelectedFeature(feature);
    }
  };

  return (
    <div
      className={`mt-[90px] h-screen bg-green-2 text-white fixed top-0 left-0 transition-all duration-300 ease-in-out z-50
                  ${isCollapsed ? "w-20" : "w-64"}`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Sidebar Content */}
      <div className="p-4 flex flex-col gap-6">
        {/* Menu Button */}
        <div className="flex gap-3 p-2 items-center">
          <Menu
            size={20}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="cursor-pointer text-white transition-transform"
          />
          <span
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`cursor-pointer font-['Lato-Regular'] text-xl font-semibold transition-all duration-300 ease-in-out 
                        ${isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}
          >
            Dashboard
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <SidebarItem icon={Search} text="Search" isCollapsed={isCollapsed}>
            <SidebarSubItem
              text="By Genotype"
              icon={PanelTopDashed}
              isSelected={selectedFeature === "genotype"}
              onClick={() => handleSelect("genotype")}
            />
            <SidebarSubItem
              text="By Gene Loci"
              icon={TableProperties}
              isSelected={selectedFeature === "geneLoci"}
              onClick={() => handleSelect("geneLoci")}
            />
          </SidebarItem>
        </nav>
      </div>
    </div>
  );
}
