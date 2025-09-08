import React, { useState } from "react";
import { Toaster, toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../services/AuthContext";

function SignInForm() {
  const { login  } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      
      try {
        // Call the API for authentication
        const response = await api.post(`/api/user/login`, {
          username: formData.username.trim(),
          password: formData.password,
        });

        // Save the token in local storage
        if(response.data){
          login(response.data)
          localStorage.setItem("token", response.data);
          navigate("/user/dashboard"); // Redirect after sign-in
        }else{
          toast.warning("Invalid Credentials")
          setIsSubmitting(false);
        }
        
      } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred");
        setIsSubmitting(false);
      }
    } else {
      toast.warning("Please validate your inputs");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full mx-auto p-4 bg-gray-100 rounded shadow-md"
    >
      <Toaster />

      {/* Username Field */}
      <div className="mb-4">
        <label htmlFor="username" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="Enter your username"
        />
        {errors.username && <span className="text-red-500 text-sm p-1 font-['Lato-Regular']">{errors.username}</span>}
      </div>

      {/* Password Field */}
      <div className="mb-4">
        <label htmlFor="password" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="Enter your password"
        />
        {errors.password && <span className="text-red-500 text-sm p-1 font-['Lato-Regular']">{errors.password}</span>}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center p-1">
        <button
          type="submit"
          className="font-['Open-Sans'] w-[300px] border-2 font-semibold border-green-2 bg-green-2 py-2.5 px-5 text-white transition-all ease-out duration-300 hover:text-yellow-1"
          disabled={isSubmitting}
        >
          Sign In
        </button>
      </div>
    </form>
  );
}

export default SignInForm;
