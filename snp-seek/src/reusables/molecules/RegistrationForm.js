import React, { useState } from "react";
import { Toaster, toast } from 'sonner';
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function RegistrationForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    middleName: "",
    password: "",
    email:"",
    confirmPassword: "",
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

    // Validate Username
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    }else if (formData.username.length < 6) {
      newErrors.username = "Username must be at least 6 characters long";
      isValid = false;
    }

    // Validate First Name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First Name is required";
      isValid = false;
    }

    // Validate Last Name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last Name is required";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    }

    // Validate Password
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
      isValid = false;
    }
    
    

    // Validate Confirm Password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
          const response = await api.post(`/api/user/register`, {
            username: formData.username.trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            middleName: formData.middleName.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(),
          });
  
          toast.success("Registration successful!");

          //add a delay before redirecting
          setTimeout(() => {
            navigate("/signin"); // Redirect user to sign-in page
          }, 2000);

        } catch (error) {
            // Handle network or other errors
      
            toast.error(error.response?.data?.message || "Registration failed");
            setIsSubmitting(false);
        }
    } else {
        // Show warning if validation fails
        toast.warning('Please validate your inputs');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto p-4 bg-gray-100 rounded shadow-md">
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

      {/* First Name Field */}
      <div className="mb-4">
        <label htmlFor="firstName" className="block text-md font-['Poppins-Bold'] text-gray-700">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="Enter your first name"
        />
        {errors.firstName && <span className="text-red-500 text-sm p-1 font-['Lato-Regular']">{errors.firstName}</span>}
      </div>

      {/* Last Name Field */}
      <div className="mb-4">
        <label htmlFor="lastName" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="Enter your last name"
        />
        {errors.lastName && <span className="text-red-500 text-sm p-1 font-['Lato-Regular']">{errors.lastName}</span>}
      </div>

      {/* Middle Name Field (Optional) */}
      <div className="mb-4">
        <label htmlFor="middleName" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Middle Name (Optional)
        </label>
        <input
          type="text"
          id="middleName"
          name="middleName"
          value={formData.middleName}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="Enter your middle name"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="example@irri.org"
        />
        {errors.email && <span className="text-red-500 text-sm p-1 font-['Lato-Regular']">{errors.email}</span>}
      </div>

      {/* Password Fields */}
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

      <div className="mb-4">
        <label htmlFor="confirmPassword" className="block text-md font-['Poppins-Bold'] text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="mt-1 p-2 w-full border rounded font-['Lato-Regular']"
          placeholder="Re-enter your password"
        />
        {errors.confirmPassword && <span className="text-red-500 text-sm p-1 font-['Lato-Regular']">{errors.confirmPassword}</span>}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center p-1">
        <button
          type="submit"
          className="font-['Open-Sans'] w-[300px] border-2 font-semibold border-green-2 bg-green-2 py-2.5 px-5 text-white transition-all ease-out duration-300 hover:text-yellow-1 "
          disabled={isSubmitting}
        >
          Register
        </button>
      </div>
    </form>
  );
}

export default RegistrationForm;
