package com.irri.microservices.geneloci_service.repository;
import com.irri.microservices.geneloci_service.model.Util;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface UtilRepository extends MongoRepository<Util, String> {
    // Find all reference genomes
    @Aggregation(pipeline = {
            "{ $project: { referenceGenomes: 1, _id: 0 } }"
    })
    List<Util> findAllReferenceGenomes();
}
