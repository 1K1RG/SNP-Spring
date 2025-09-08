package com.irri.microservices.geneloci_service.dto;

public record SearchByRegionRequest(String referenceGenome, String contig, Integer start, Integer end, Integer pageNumber) {
}
