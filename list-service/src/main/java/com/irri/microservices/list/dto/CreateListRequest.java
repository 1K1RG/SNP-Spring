package com.irri.microservices.list.dto;

import java.util.List;

public record CreateListRequest(String name, String description, String varietySet, String snpSet, String userId, String type, List<String> content) {
}
