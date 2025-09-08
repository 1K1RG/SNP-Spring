package com.irri.mircroservices.variety.repository;

import com.irri.mircroservices.variety.dto.UtilsResponse;
import com.irri.mircroservices.variety.model.Util;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Map;

public interface UtilRepository extends MongoRepository<Util, String> {
    // Fetches the utilities
    @Aggregation(pipeline = {
            "{ $project: { varietySet: 1, snpSets: 1, subpopulations:1 , _id: 0 } }"
    })
    List<UtilsResponse> getAllSnpSetAndVarietySet();
}
