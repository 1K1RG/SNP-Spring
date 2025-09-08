package com.irri.mircroservices.variety.repository;

import com.irri.mircroservices.variety.model.VarietyPos;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Map;

public interface VarietyPosRepository extends MongoRepository<VarietyPos, String> {
    // Finds the positions of the variety given a range and contig
    @Aggregation(pipeline = {
            // Step 1: Match based on referenceId, contig, and start-end ranges
            "{ $match: { referenceId: { $in: ?0 }, contig: ?1, start: { $lte: ?3 }, end: { $gte: ?2 } } }",
            // Step 2: Project positions and convert them to key-value pairs
            "{ $project: { _id: 0, referenceId: 1, filteredPositions: { $objectToArray: '$positions' } } }",
            // Step 3: Unwind the filtered positions array
            "{ $unwind: '$filteredPositions' }",
            // Step 4: Convert the key from string to integer for easier filtering
            "{ $addFields: { 'filteredPositions.k': { $toInt: '$filteredPositions.k' } } }",
            // Step 5: Match positions based on the given start and end range
            "{ $match: { 'filteredPositions.k': { $gte: ?2, $lte: ?3 } } }",
            // Step 7: Group by referenceId and collect positions into an array
            "{ $group: { _id: '$referenceId', positions: { $push: { k: { $toString: '$filteredPositions.k' }, v: '$filteredPositions.v' } } } }"
    })
    List<Map<String, List<Map<String, String>>>> findFilteredPositionsBatch(List<String> referenceIds, String contig, int start, int end);

    // Finds the positions of the variety given a ranges and contigs
    @Aggregation(pipeline = {
            // Step 1: Match documents by referenceIds and contigs
            "{ $match: { referenceId: { $in: ?0 }, contig: { $in: ?1 } } }",

            // Step 2: Convert 'positions' object to an array
            "{ $project: { " +
                    "_id: 0, referenceId: 1, contig: 1, " +
                    "filteredPositions: { $objectToArray: '$positions' } " +
                    "} }",

            // Step 3: Unwind to process individual key-value pairs
            "{ $unwind: '$filteredPositions' }",

            // Step 4: Convert the key from string to integer
            "{ $set: { " +
                    "'filteredPositions.k': { " +
                    "$cond: { " +
                    "if: { $isArray: '$filteredPositions.k' }, " +
                    "then: { $arrayElemAt: ['$filteredPositions.k', 0] }, " +
                    "else: '$filteredPositions.k' " +
                    "} " +
                    "} " +
                    "} }",

            "{ $set: { " +
                    "'filteredPositions.k': { " +
                    "$convert: { " +
                    "input: '$filteredPositions.k', " +
                    "to: 'int', " +
                    "onError: 0, " +   // Default value if conversion fails
                    "onNull: 0 " +    // Default value if the field is null
                    "} " +
                    "} " +
                    "} }",

            // Step 5: Create a new field 'lookupKey' that combines contig and position
            "{ $set: { 'lookupKey': { $concat: [ '$contig', ' ', { $toString: '$filteredPositions.k' } ] } } }",

            // Step 6: Filter only those positions that exist in the given list
            "{ $match: { 'lookupKey': { $in: ?2 } } }",

            // Step 7: Group results by referenceId and collect positions
            "{ $group: { " +
                    "_id: '$referenceId', " +
                    "positions: { $push: { k: '$lookupKey', v: '$filteredPositions.v' } } " +
                    "} }"
    })
    List<Map<String, List<Map<String, String>>>> findFilteredPositionsByList(
            List<String> referenceIds,
            List<String> contigs,
            List<String> positionKeys);


}
