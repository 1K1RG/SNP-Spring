package com.irri.mircroservices.variety.dto;

import java.util.List;

public record ItemsRequest(List<String> items, String varietySet) {
}
