package com.irri.microservices.geneloci_service.dto;

public record ExportExcelRequest(
        String searchMethod,
        String searchQuery,
        String referenceGenome,
        String searchBy,
        String contig,
        Integer start,
        Integer end,
        String traitName
        ) {
}
