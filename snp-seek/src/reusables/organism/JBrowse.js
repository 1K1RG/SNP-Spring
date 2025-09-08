import PageTitle from "../atoms/PageTitle";
const JBrowse = ({ }) => {
  return (
    <div className="flex ml-20 flex-col gap-3 w-full ">
      
      {/* Page Title */}
      <PageTitle text={"JBrowse"} />
      

      {/* Skeleton Loader */}
       <div id="skeleton" className="mx-auto w-[100%] h-[85%] animate-pulse space-y-2 mt-4">
            <div className="h-[20%] w-full bg-gray-200 rounded-md mb-3"></div>
            <div className="h-[80%] w-full bg-gray-200 rounded-md "></div>
       </div>

        {/* iFrame for JBrowse */}
        <iframe 
            id="snpIframe"
            src={`https://snp-seek.irri.org/jbrowse/`}
            width="100%" 
            height="85%" 
            className="mx-auto bg-white hidden rounded-md shadow"
            onLoad={() => {
              setTimeout(() => {
                  const skeleton = document.getElementById('skeleton');
                  const iframe = document.getElementById('snpIframe');
      
                  if (skeleton) skeleton.style.display = 'none';
                  if (iframe) iframe.classList.remove('hidden');
              }, 500); // Delay of 500ms
            }}
        />
      </div>
  );
};

export default JBrowse;
