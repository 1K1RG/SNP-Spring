package com.irri.microservices.geneloci_service.dto;

public record SearchResponse(String geneName, String referenceGenome, Integer start, Integer end, String contig, String strand, String description) {
}
