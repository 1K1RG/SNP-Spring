package com.irri.mircroservices.variety.dto;

import java.util.List;

public record UtilsResponse(String id, String varietySet, List<String> snpSets, List<String> subpopulations) {
}
