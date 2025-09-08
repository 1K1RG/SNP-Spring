package com.irri.mircroservices.variety.dto;

import java.util.List;

public record PositionsRequest(List<String> chromosomePositions, String referenceName, String snpSet) {
}
