import { useNavigate } from "react-router-dom";

export default function Logo({image, route}) {
  const navigate = useNavigate();
  
  return (
    <img
      onClick={() => navigate(route)}
      src={image}
      className="h-[50px] w-[120px] cursor-pointer"
      alt="Logo"
    />
  );
}
