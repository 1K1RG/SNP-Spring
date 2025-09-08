import { useNavigate } from "react-router-dom";

export default function UnderlineButton({ route, children, text, external = false }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col group">
      {external ? (
        <a
          href={route}
          target="_blank"
          rel="noopener noreferrer"
          className="text-md font-['Open-Sans'] text-white cursor-pointer transition-all duration-300 ease-in-out group-hover:text-yellow-1"
        >
          {children || text}
        </a>
      ) : (
        <a
          onClick={() => navigate(route || "/")}
          className="text-md font-['Open-Sans'] text-white cursor-pointer transition-all duration-300 ease-in-out group-hover:text-yellow-1"
        >
            {children || text}
        </a>
      )}
      <div className="border-t-4 border-green-5 transition-all duration-300 ease-in-out rounded-md w-0 group-hover:w-full"></div>
    </div>
  );
}
