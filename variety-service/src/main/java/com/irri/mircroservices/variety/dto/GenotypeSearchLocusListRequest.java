package com.irri.mircroservices.variety.dto;

import java.util.List;

public record GenotypeSearchLocusListRequest(
        String referenceGenome,
        String varietySet,
        String snpSet,
        String subpopulation,
        List<String> varietyList,
        List<String> snpList,
        List<String> locusList,
        List<String> contigs,
        List<Integer> starts,
        List<Integer> ends,
        Integer page,
        Boolean askTotalPages,
        Boolean askReferenceGenome
) {
}
