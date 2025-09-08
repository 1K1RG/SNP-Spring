package com.irri.microservices.geneloci_service.repository;

import com.irri.microservices.geneloci_service.model.GeneLoci;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Map;

public interface GeneLociRepository extends MongoRepository<GeneLoci, String> {
    // Search within a specific reference genome
    // Checks the Gene Name and the Description
        //Whole word only
        @Query("{ 'referenceGenome': ?0, '$or': [ { 'geneName': { $regex: ?1, '$options': 'i' } }, { 'description': { $regex: ?1, '$options': 'i' } } ] }")
        Page<GeneLoci> findByReferenceGenomeAndGeneName(String referenceGenome, String searchQuery, Pageable pageable);

        //Substring
        @Query("{ 'referenceGenome': ?0, '$or': [ { 'geneName': { $regex: ?1, $options: 'i' } }, { 'description': { $regex: ?1, $options: 'i' } } ] }")
        Page<GeneLoci> findByReferenceGenomeAndGeneNameContaining(String referenceGenome, String searchQuery, Pageable pageable);

        //Exact Match
        @Query("{ 'referenceGenome': ?0, '$or': [ { 'geneName': { '$regex': ?1, '$options': 'i' } }, { 'description': { '$regex': ?2, '$options': 'i' } } ]}")
        Page<GeneLoci> findByReferenceGenomeAndGeneNameEquals(String referenceGenome, String searchQuery, String regexPattern, Pageable pageable);

        //Regex
        @Query("{ 'referenceGenome': ?0, '$or': [ { 'geneName': { '$regex': ?1 } }, { 'description': { '$regex': ?1 } } ] }")
        Page<GeneLoci> findByReferenceGenomeAndGeneNameRegex(String referenceGenome, String regexPattern, Pageable pageable);

        // Methods to support 'all' reference genome search
            //Whole word only
            @Query("{ '$or': [ { 'geneName': { $regex: ?0, '$options': 'i' } }, { 'description': { $regex: ?0, '$options': 'i' } } ] }")
            Page<GeneLoci> findByGeneName(String searchQuery, Pageable pageable);

            //Substring
            @Query("{ '$or': [ { 'geneName': { $regex: ?0, $options: 'i' } }, { 'description': { $regex: ?0, $options: 'i' } } ] }")
            Page<GeneLoci> findByGeneNameContaining(String searchQuery, Pageable pageable);

            //Exact Match
            @Query("{ '$or': [ { 'geneName': { '$regex': ?0, '$options': 'i' } }, { 'description': { '$regex': ?1, '$options': 'i' } } ] }")
            Page<GeneLoci> findByGeneNameEquals(String searchQuery, String regexPattern, Pageable pageable);

            //Regex
            @Query("{'$or': [ { 'geneName': { '$regex': ?0 } }, { 'description': { '$regex': ?0 } } ] }")
            Page<GeneLoci> findByGeneNameRegex(String regexPattern, Pageable pageable);

    // Checks the Description only
        //Whole word only
        @Query("{ 'referenceGenome': ?0,  'description': { $regex: ?1, '$options': 'i' } }")
        Page<GeneLoci> findByReferenceGenomeAndGeneDescription(String referenceGenome, String searchQuery, Pageable pageable);

        //Substring
        @Query("{ 'referenceGenome': ?0,  'description': { $regex: ?1, $options: 'i' } }")
        Page<GeneLoci> findByReferenceGenomeAndDescriptionContaining(String referenceGenome, String searchQuery, Pageable pageable);

        //Exact Match
        @Query("{ 'referenceGenome': ?0,  'description': { '$regex': ?1, '$options': 'i' } }")
        Page<GeneLoci> findByReferenceGenomeAndDescriptionEquals(String referenceGenome, String regexPattern, Pageable pageable);

        //Regex
        @Query("{ 'referenceGenome': ?0, 'description': { '$regex': ?1 } }")
        Page<GeneLoci> findByReferenceGenomeAndDescriptionRegex(String referenceGenome, String regexPattern, Pageable pageable);

        // Methods to support 'all' reference genome search
            //Whole word only
            @Query("{  'description': { $regex: ?0, '$options': 'i' } }")
            Page<GeneLoci> findByDescription(String searchQuery, Pageable pageable);

            //Substring
            @Query("{ 'description': { $regex: ?0, $options: 'i' } }")
            Page<GeneLoci> findByDescriptionContaining(String searchQuery, Pageable pageable);

            //Exact Match
            @Query("{ 'description': { '$regex': ?0, '$options': 'i' } }")
            Page<GeneLoci> findByDescriptionEquals(String regexPattern, Pageable pageable);

            //Regex
            @Query(" { 'description': { '$regex': ?0 } }")
            Page<GeneLoci> findByDescriptionRegex(String regexPattern, Pageable pageable);


    //Region Search
        @Query("{ 'referenceGenome': ?0, 'contig': ?1, 'start': { $lte: ?2 }, 'end': { $gte: ?3 } }")
        Page<GeneLoci> findByReferenceGenomeAndRegion(String referenceGenome, String contig, Integer end, Integer start, Pageable pageable);
        // For 'all' reference genome search
        @Query("{  'contig': ?0, 'start': { $lte: ?1 }, 'end': { $gte: ?2 } }")
        Page<GeneLoci> findByRegion(String contig, Integer end, Integer start, Pageable pageable);

    //ID Search
        @Query("{ '_id': { '$in': ?0 }, 'referenceGenome': ?1 }")
        Page<GeneLoci> findGeneByIdsWithReferenceGenome(List<String> geneIds, String referenceGenome, Pageable pageable);

        @Query("{ '_id': { '$in': ?0 }}")
        Page<GeneLoci> findGeneByIds(List<String> geneIds, Pageable pageable);

        @Query("{ '_id': { '$in': ?0 }}")
        List<GeneLoci> findGeneByIds(List<String> geneIds);

    // Case-insensitive query using $in with regex
    @Query(collation = "{'locale': 'en_US', 'strength': 2}")
    List<GeneLoci> findByGeneNameIn(List<String> items);

    // Get contig, start, and end of a gene by gene name
    @Aggregation(pipeline = {
            "{ $match: { geneName: { $regex: ?0, $options: 'i' } } }",  // Case-insensitive match
            "{ $project: { _id: 0, contig: 1, start: 1, end: 1 } }"    // Only include contig, start, and end
    })
    List<Map<String, Object>> getContigStartEndOfGene(String geneName);

    // Get contig, start, and end of genes by a list of IDs
    @Aggregation(pipeline = {
            "{ $match: { _id: { $in: ?0 } } }",  // Match documents based on the passed list of IDs
            "{ $project: { _id: 1, contig: 1, start: 1, end: 1 } }"
    })
    List<Map<String, Object>> getContigsStartsEndsOfGenesById(List<String> ids);

}