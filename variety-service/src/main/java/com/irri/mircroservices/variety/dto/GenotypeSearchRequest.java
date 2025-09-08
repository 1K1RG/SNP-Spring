package com.irri.mircroservices.variety.dto;

import java.util.List;

public record GenotypeSearchRequest(
        String referenceGenome,
        String varietySet,
        String snpSet,
        String subpopulation,
        List<String> varietyList,
        List<String> snpList,
        List<String> locusList,
        String contig,
        Integer start,
        Integer end,
        Integer page,
        Boolean askTotalPages,
        Boolean askReferenceGenome
) {
}
