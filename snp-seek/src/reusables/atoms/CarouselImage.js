import React from "react";

const CarouselImage = ({slideNumber, image, mainText, subtext, prevSlide, nextSlide }) => (
    <div id={slideNumber} className="carousel-item relative w-full">
        <img
            src= {image}
            className="w-full object-cover opacity-40 bg-green-1"
        />
        <div className="gap-10 flex flex-col items-center justify-center h-[300px] rounded-2xl bg-white bg-opacity-[80%] p-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <span className="font-['Montserrat-Bold'] text-5xl text-center text-green-2">
                {mainText}
                
            </span>
            <span className="text-center font-['Montserrat-Regular'] text-lg text-green-1">
                {subtext}
            </span>
        </div>
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <button onClick={prevSlide} className="btn btn-circle">❮</button>
            <button onClick={nextSlide} className="btn btn-circle">❯</button>
        </div>
    </div>
);

export default CarouselImage;
