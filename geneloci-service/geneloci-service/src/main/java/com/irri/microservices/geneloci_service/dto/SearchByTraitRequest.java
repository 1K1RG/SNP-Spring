package com.irri.microservices.geneloci_service.dto;

public record SearchByTraitRequest(String referenceGenome, String traitName, Integer pageNumber) {
}
