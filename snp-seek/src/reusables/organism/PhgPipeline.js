import React, { useState, useEffect } from "react";
import PageTitle from "../atoms/PageTitle";
import PipelineForm from "../molecules/PipelineForm";
import { toast } from "sonner";
import api from "../../services/api";
import { saveAs } from 'file-saver'; // install this if you don't have it: npm install file-saver

const PhgPipeline = ({ }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProject, setSelectedProject] = useState("");
    const [projects, setProjects] = useState([]);
    const [projectName, setProjectName] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);

    const createProject = async (e) => {
        e.preventDefault();
        if (projectName.trim() !== "") {
          setIsSubmitting(true);
          
          try {
            // Call the API for authentication
            const res = await api.post(
                `/PHG/pipeline/create-project`,
                {
                    Project_Name: projectName.trim(),
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            // Save the token in local storage
            if(res.data.message!=="Project Name Already Used"){
                setIsSubmitting(true);
                toast.success("Project Created Successfully");
                setProjectName("");
            }else{
              toast.warning(res.data.message)
              setIsSubmitting(false);
            }
            
          } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
            setIsSubmitting(false);
          }finally{
            setIsSubmitting(false);
          }
        } else {
          toast.warning("Please validate your inputs");
        }
      };

      const DownloadMetrics = async (e) => {
        e.preventDefault();

        if (selectedProject.trim() === "") {
          toast.warning("Please select a project");
          return;
        } 

        setIsDownloading(true);      
        try {
        const res = await api.post(
            `/PHG/pipeline/get-vcf-metrics`,
            {
                Project_Name: selectedProject.trim(),
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                responseType: 'blob', 
            }
        );

      
          // Create a URL for the blob content
          const url = window.URL.createObjectURL(res.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'VCFMetrics.tsv'; // Correct file extension
          document.body.appendChild(a);
          a.click();
          a.remove();
  
          // Clean up the object URL
          window.URL.revokeObjectURL(url);
        toast.success("File downloaded successfully");
        } catch (error) {
            console.log(error)
        toast.error(error.response?.data?.message || "An error occurred");
        }finally{
         setIsDownloading(false);
        }
        
      };

      const DownloadPlot = async (e) => {
        e.preventDefault();

        if (selectedProject.trim() === "") {
          toast.warning("Please select a project");
          return;
        } 

        setIsDownloading(true);      
        try {
        const res = await api.post(
            `/PHG/pipeline/get-dot-plots`,
            {
                Project_Name: selectedProject.trim(),
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                responseType: 'blob', 
            }
        );

      
          // Create a URL for the blob content
          const url = window.URL.createObjectURL(res.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'DotPlot.zip'; // Correct file extension
          document.body.appendChild(a);
          a.click();
          a.remove();
  
          // Clean up the object URL
          window.URL.revokeObjectURL(url);
        toast.success("File downloaded successfully");
        } catch (error) {
            console.log(error)
        toast.error(error.response?.data?.message || "An error occurred");
        }finally{
         setIsDownloading(false);
        }
        
      };
   
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
      }, [isSubmitting]);

 

  return (
    <div className="flex ml-20 flex-col gap-3 w-full ">
      {/* Page Title */}
      <div className="flex">
        <PageTitle text={"RicePHG"} />
        <div className="ml-auto flex gap-5">
          {/* Create Project Section */}
          <div className="flex gap-2">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              type="text"
              placeholder="Enter Project Name"
              className="p-2 border rounded font-['Lato-Regular']"
            />
            <button
              disabled={isSubmitting}
              onClick={createProject}
              className="p-2 bg-green-2 text-white rounded font-['Lato-Regular'] transition-all ease-out duration-300 hover:text-yellow-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Creating...
                </div>
              ) : (
                "Create Project"
              )}
            </button>
          </div>

          {/* Download Metrics Section */}
          <div className="flex gap-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="p-2 border rounded font-['Lato-Regular']"
            >
              <option value="">Select a project</option>
              {projects.map((project, idx) => (
                <option key={idx} value={project}>
                  {project}
                </option>
              ))}
            </select>
            <button
              disabled={isDownloading}
              onClick={DownloadMetrics}
              className="p-2 bg-green-2 text-white rounded font-['Lato-Regular'] transition-all ease-out duration-300 hover:text-yellow-1"
            >
              {isDownloading ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Downloading...
                </div>
              ) : (
                "Download QC Metrics"
              )}
            </button>

            <button
              disabled={isDownloading}
              onClick={DownloadPlot}
              className="p-2 bg-green-2 text-white rounded font-['Lato-Regular'] transition-all ease-out duration-300 hover:text-yellow-1"
            >
              {isDownloading ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Downloading...
                </div>
              ) : (
                "Download Dot Plot"
              )}
            </button>
          </div>
        </div>
      </div>

      <PipelineForm isSubmittingProject={isSubmitting} />
    </div>
  );
};

export default PhgPipeline;
