import React, { useEffect, useRef, useState } from "react";
import CarouselImage from "../atoms/CarouselImage";

export default function ImageCarousel() {
    const [currentSlide, setCurrentSlide] = useState(1);
    const totalSlides = 5; 
    const intervalRef = useRef(null);

    const goToSlide = (slideId) => {
        const slide = document.getElementById(slideId);
        if (slide) {
            slide.scrollIntoView({ behavior: 'smooth' });
        }
        setCurrentSlide(Number(slideId.replace('slide', '')));
    };

    const nextSlide = () => {
        const next = currentSlide === totalSlides ? 1 : currentSlide + 1;
        goToSlide(`slide${next}`);
    };

    const prevSlide = () => {
        const prev = currentSlide === 1 ? totalSlides : currentSlide - 1;
        goToSlide(`slide${prev}`);
    };

    useEffect(() => {
        // Start auto-sliding
        intervalRef.current = setInterval(nextSlide, 3000); // Change slide every 3 seconds

        // Clean up the interval on component unmount
        return () => {
            clearInterval(intervalRef.current);
        };
    }, [currentSlide]);

    return (
        <div className="carousel w-[100%] h-[600px]">
            <CarouselImage slideNumber={"slide1"} image="/images/genotype.jpg" mainText="Genotypes" subtext="Query for SNPs from the 3000 genome project" prevSlide={prevSlide} nextSlide={nextSlide}/>
            <CarouselImage slideNumber={"slide2"} image="/images/varieties.jpg" mainText="Varieties" subtext="Query for Variety passport and phenotypes" prevSlide={prevSlide} nextSlide={nextSlide}/>
            <CarouselImage slideNumber={"slide3"} image="/images/genome.jpg" mainText="Jbrowse" subtext="Rice Genome Browser" prevSlide={prevSlide} nextSlide={nextSlide}/>
            <CarouselImage slideNumber={"slide4"} image="/images/gwas.png" mainText="GWAS" subtext="GWAS Results and tools" prevSlide={prevSlide} nextSlide={nextSlide}/>
            <CarouselImage slideNumber={"slide5"} image="/images/phg.png" mainText="Practical Haplotype Graph" subtext="PHG Visualization Tool" prevSlide={prevSlide} nextSlide={nextSlide}/>
        </div>
    );
}
