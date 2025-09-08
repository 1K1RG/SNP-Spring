package com.irri.microservices.geneloci_service.dto;

import java.util.List;

public record PagedSearchResponse(List<SearchResponse> results, int totalPages) {
}