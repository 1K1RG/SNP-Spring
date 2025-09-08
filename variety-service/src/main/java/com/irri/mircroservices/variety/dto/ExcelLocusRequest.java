package com.irri.mircroservices.variety.dto;
import java.util.List;

public record ExcelLocusRequest(
        GenotypeSearchLocusListRequest genotypeSearchLocusListRequest,
        List<String> varietyListIds
) {
}
