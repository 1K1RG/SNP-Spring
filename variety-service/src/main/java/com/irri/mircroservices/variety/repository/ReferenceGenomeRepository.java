package com.irri.mircroservices.variety.repository;

import com.irri.mircroservices.variety.model.ReferenceGenome;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;


public interface ReferenceGenomeRepository extends MongoRepository<ReferenceGenome, String> {
    // Finds the reference genome by its name and snpSet
    Optional<ReferenceGenome> findByNameAndSnpSet(String name, String snpSet);

    // Finds all the reference genomes and gets only their names
    @Aggregation(pipeline = { "{$project: { name: 1, _id: 0 }}" })
    List<String> findAllReferenceGenomeNames();


}
