package com.irri.microservices.geneloci_service.repository;

import com.irri.microservices.geneloci_service.model.GeneLoci;
import com.irri.microservices.geneloci_service.model.Trait;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface TraitRepository extends MongoRepository<Trait, String> {
    // Find traits by trait name
    @Query("{ 'traitName': { '$regex': ?0, '$options': 'i' } }")
    Trait findGeneIdsByTraitName(String traitName);
    // Find traits by category
    @Query( "{ 'category': ?0 }")
    List<Trait> findTraitsByCategory(String category);




}
