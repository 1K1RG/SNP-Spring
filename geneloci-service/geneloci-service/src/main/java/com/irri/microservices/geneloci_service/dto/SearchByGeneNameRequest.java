package com.irri.microservices.geneloci_service.dto;

public record SearchByGeneNameRequest(String referenceGenome, String searchMethod, String searchQuery, Integer pageNumber) {
}
