package com.irri.mircroservices.variety.dto;

import java.util.List;

public record ExcelRequest(
        GenotypeSearchRequest genotypeSearchRequest,
        List<String> varietyListIds
) {
}
