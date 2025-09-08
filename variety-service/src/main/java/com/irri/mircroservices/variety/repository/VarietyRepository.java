package com.irri.mircroservices.variety.repository;

import com.irri.mircroservices.variety.model.Variety;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface VarietyRepository extends MongoRepository<Variety, String> {

    // Check if any of the provided list items exist (name, irisId, or accession)
    @Query("{ $and: [ { $or: [ {'name': { $in: ?0 }}, {'irisId': { $in: ?0 }}, {'accession': { $in: ?0 }} ] }, { 'varietySet': ?1 } ] }")
    public List<Variety> findByNameOrIrisIdOrAccessionIn(List<String> items, String varietySet);

    // Finds Varieties by their unique IDs
    List<Variety> findByIdIn(List<String> ids);

    // Finds Varieties by their unique IDs
    List<Variety> findByIdIn(Set<String> ids);

    // Finds varieties by their snpSet and varietySet
    @Query(value = "{ 'snpSet': ?0, 'varietySet': ?1 }",
            fields = "{ '_id': 1 }")                    // Only fetch _id field
    Page<Variety> findVarietyIdsBySnpAndVarietySet(String snpSet, String varietySet, Pageable pageable);

    // Finds varieties by their snpSet, varietySet, and subpopulation
    @Query(value = "{ 'snpSet': ?0, 'varietySet': ?1, 'subpopulation': ?2 }",
            fields = "{ '_id': 1 }")                    // Only fetch _id field
    Page<Variety> findVarietyIdsBySnpAndVarietySetAndSubpopulation(String snpSet, String varietySet, String subpopulation, Pageable pageable);

    // Gets the count of varieties by their snpSet and varietySet
    @Query(value = "{ 'snpSet': ?0, 'varietySet': ?1 }", count = true)
    Optional<Integer> countVarietyIdsBySnpAndVarietySet(String snpSet, String varietySet);

    // Gets the count of varieties by their snpSet, varietySet, and subpopulation
    @Query(value = "{ 'snpSet': ?0, 'varietySet': ?1, 'subpopulation': ?2 }", count = true)
    Optional<Integer> countVarietyIdsBySnpAndVarietySetAndSubpopulation(String snpSet, String varietySet, String subpopulation);


}
