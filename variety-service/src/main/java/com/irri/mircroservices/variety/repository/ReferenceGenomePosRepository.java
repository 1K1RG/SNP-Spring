package com.irri.mircroservices.variety.repository;

import com.irri.mircroservices.variety.model.ReferenceGenomePos;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Map;

public interface ReferenceGenomePosRepository  extends MongoRepository<ReferenceGenomePos, String> {

    // Finds existing positions on the reference genome
    @Query("{ 'referenceId': ?0, 'contig': ?1, '$or': ?2 }")
    List<ReferenceGenomePos> findByReferenceIdAndContigAndPositions(
            String referenceId, String contig, List<Map<String, Map<String, Integer>>> orConditions);

    //For Range Genotype Search
    @Aggregation(pipeline = {
            // Step 1: Match document by referenceId, contig, and range
            "{ $match: { referenceId: ?0, contig: ?1, start: { $lte: ?3 }, end: { $gte: ?2 } } }",
            // Step 2: Convert positions to key-value pairs
            "{ $project: { _id: 0, filteredPositions: { $objectToArray: '$positions' } } }",
            // Step 3: Unwind to get individual key-value pairs
            "{ $unwind: '$filteredPositions' }",
            // Step 4: Convert key to integer
            "{ $addFields: { 'filteredPositions.k': { $toInt: '$filteredPositions.k' } } }",
            // Step 5: Filter only those positions that exist in the given range
            "{ $match: { 'filteredPositions.k': { $gte: ?2, $lte: ?3 } } }",

            "{ $sort: { 'filteredPositions.k': 1 } }",

            // Step 6: Group results into a key-value structure
            "{ $group: { _id: null, positions: { $push: { k: { $toString: '$filteredPositions.k' }, v: '$filteredPositions.v' } } } }"
    })
    List<Map<String, List<Map<String, String>>>> findFilteredPositions(String referenceId, String contig, int start, int end);

    //For SNP List Genotype Search
    @Aggregation(pipeline = {
            // Step 1: Match documents by referenceId and contig
            "{ $match: { referenceId: ?0, contig: { $in: ?1 } } }",
            // Step 2: Convert positions to key-value pairs
            "{ $project: { _id: 0, referenceId: 1, contig: 1, filteredPositions: { $objectToArray: '$positions' } } }",
            // Step 3: Unwind to get individual key-value pairs
            "{ $unwind: '$filteredPositions' }",
            // Step 4: Convert key to integer
            "{ $addFields: { 'filteredPositions.k': { $toInt: '$filteredPositions.k' } } }",
            // Step 5: Create a new field 'lookupKey' that combines contig and position
            "{ $addFields: { 'lookupKey': { $concat: [ '$contig', ' ', { $toString: '$filteredPositions.k' } ] } } }",
            // Step 6: Filter only those positions that exist in the given list
            "{ $match: { 'lookupKey': { $in: ?2 } } }",
            // Step 8: Group results into a key-value structure
            "{ $group: { _id: null, positions: { $push: { k: '$lookupKey', v: '$filteredPositions.v' } } } }"
    })
    List<Map<String, List<Map<String, String>>>> findFilteredPositionsByList(
            String referenceId,
            List<String> contigs,
            List<String> positionKeys);



}
