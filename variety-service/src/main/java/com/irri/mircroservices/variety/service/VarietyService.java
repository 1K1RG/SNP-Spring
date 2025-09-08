package com.irri.mircroservices.variety.service;

import com.irri.mircroservices.variety.dto.GenotypeSearchLocusListRequest;
import com.irri.mircroservices.variety.dto.GenotypeSearchRequest;
import com.irri.mircroservices.variety.dto.UtilsResponse;
import com.irri.mircroservices.variety.model.ReferenceGenome;
import com.irri.mircroservices.variety.model.ReferenceGenomePos;
import com.irri.mircroservices.variety.model.Variety;
import com.irri.mircroservices.variety.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;


import java.util.*;

@Service
public class VarietyService {
    private static final Logger log = LoggerFactory.getLogger(VarietyService.class);
    private final UtilRepository utilRepository;
    private final VarietyRepository varietyRepository;
    private final ReferenceGenomePosRepository referenceGenomePosRepository;
    private final ReferenceGenomeRepository referenceGenomeRepository;
    private final VarietyPosRepository varietyPosRepository;
    private static final int PAGE_SIZE = 10; // Global page size



    public VarietyService(UtilRepository utilRepository, VarietyRepository varietyRepository, ReferenceGenomePosRepository referenceGenomePosRepository, ReferenceGenomeRepository referenceGenomeRepository, VarietyPosRepository varietyPosRepository) {
        this.utilRepository = utilRepository;
        this.varietyRepository = varietyRepository;
        this.referenceGenomePosRepository = referenceGenomePosRepository;
        this.referenceGenomeRepository = referenceGenomeRepository;
        this.varietyPosRepository = varietyPosRepository;
    }

    public List<UtilsResponse> getAllSnpSetAndVarietySet() {
        return utilRepository.getAllSnpSetAndVarietySet();
    }

    public List<Variety> getVarietiesByIds(List<String> ids) {
        return varietyRepository.findByIdIn(ids);
    }

    public List<String> getVarietyNamesByIds(List<String> ids) {
        List<Variety> varieties = varietyRepository.findByIdIn(ids);

        // Extract names of the varieties using stream and map
        return varieties.stream()
                .map(Variety::getName)  // Extract the 'name' from each Variety object
                .collect(Collectors.toList());  // Collect into a list of Strings
    }

    // Method to check if varieties exist by name, irisId or accession
    public Map<String, Object> checkItemsExistence(List<String> items, String varietySet) {
        // Retrieve all varieties that match the given items
        List<Variety> foundVarieties = varietyRepository.findByNameOrIrisIdOrAccessionIn(items, varietySet);

        // Create a set of all the items provided for comparison
        Set<String> allRequestedItems = new HashSet<>(items);

        // Extract the existing items (from found varieties)
        Set<String> existingItems = new HashSet<>();
        for (Variety variety : foundVarieties) {
            if (variety.getName() != null) existingItems.add(variety.getName());
            if (variety.getIrisId() != null) existingItems.add(variety.getIrisId());
            if (variety.getAccession() != null) existingItems.add(variety.getAccession());
        }

        // Identify the non-existing items
        Set<String> nonExistingItems = new HashSet<>(allRequestedItems);
        nonExistingItems.removeAll(existingItems);

        // If there are no non-existing items, return the found varieties
        if (nonExistingItems.isEmpty()) {
            return Map.of("existing", foundVarieties, "nonExisting", Collections.emptyList());
        } else {
            return Map.of("existing", foundVarieties, "nonExisting", nonExistingItems);
        }
    }

    // Method to check if genomic positions exist
    public Map<String, List<String>> checkGenomicPositions(List<String> chromosomePositions, String referenceName, String snpSet) {
        String genomeId = referenceGenomeRepository.findByNameAndSnpSet(referenceName, snpSet)
                .map(ReferenceGenome::getId)
                .orElseThrow(() -> new RuntimeException("Reference genome not found"));

        Map<String, List<String>> result = new HashMap<>();
        List<String> existingPositions = new ArrayList<>();
        List<String> nonExistingPositions = new ArrayList<>();

        // Group positions by contig
        Map<String, List<Integer>> groupedByContig = chromosomePositions.stream()
                .map(entry -> entry.split(" "))
                .filter(parts -> parts.length == 2)
                .collect(Collectors.groupingBy(
                        parts -> parts[0],  // Contig (chromosome)
                        Collectors.mapping(parts -> Integer.parseInt(parts[1]), Collectors.toList())
                ));

        for (Map.Entry<String, List<Integer>> entry : groupedByContig.entrySet()) {
            String contig = entry.getKey();
            List<Integer> positionsToCheck = entry.getValue();

            int minPos = Collections.min(positionsToCheck);
            int maxPos = Collections.max(positionsToCheck);



            // Build batch query conditions
            List<Map<String, Map<String, Integer>>> orConditions = positionsToCheck.stream()
                    .map(pos -> Map.of("start", Map.of("$lte", pos), "end", Map.of("$gte", pos)))
                    .collect(Collectors.toList());

            // Batch query to find all relevant genomic ranges
            List<ReferenceGenomePos> genomeDataList = referenceGenomePosRepository
                    .findByReferenceIdAndContigAndPositions(genomeId, contig, orConditions);


            // Store all existing positions in a set for quick lookup
            Set<Integer> existingPositionsSet = genomeDataList.stream()
                    .flatMap(pos -> pos.getPositions().keySet().stream())
                    .collect(Collectors.toSet());



            // Classify positions
            for (Integer pos : positionsToCheck) {
                String formattedEntry = contig + " " + pos;
                if (existingPositionsSet.contains(pos)) {
                    existingPositions.add(formattedEntry);
                } else {
                    nonExistingPositions.add(formattedEntry);
                }
            }
        }

        result.put("existing", existingPositions);
        result.put("nonExisting", nonExistingPositions);
        return result;
    }

    // Method to check if genomic positions exist
    public List<String> getAllReferenceGenomeNames(){
        return referenceGenomeRepository.findAllReferenceGenomeNames();
    }



//    ASYNC PROCESS
@Async
public CompletableFuture<ReferenceGenome> fetchReferenceGenome(String referenceGenomeName, String snpSet) {
    return CompletableFuture.supplyAsync(() ->
            referenceGenomeRepository.findByNameAndSnpSet(referenceGenomeName, snpSet)
                    .orElseThrow(() -> new RuntimeException("Reference genome not found"))
    );
}

    @Async
    public CompletableFuture<List<Map<String, List<Map<String, String>>>>> fetchReferenceGenomePositions(
            String referenceGenomeId, String contig, int start, int end) {
        return CompletableFuture.supplyAsync(() ->
                referenceGenomePosRepository.findFilteredPositions(referenceGenomeId, contig, start, end)
        );
    }


@Async
public CompletableFuture<Map<String, Object>> fetchVarietyIds(GenotypeSearchRequest genotypeSearchRequest) {
    return CompletableFuture.supplyAsync(() -> {
        Pageable pageable = PageRequest.of(genotypeSearchRequest.page(), PAGE_SIZE, Sort.by("_id").ascending());

        Page<Variety> varietyPage;
        // If All
        if (Objects.equals(genotypeSearchRequest.subpopulation(), "All")) {
            varietyPage = varietyRepository.findVarietyIdsBySnpAndVarietySet(
                    genotypeSearchRequest.snpSet(),
                    genotypeSearchRequest.varietySet(),
                    pageable
            );
        } else if (!Objects.equals(genotypeSearchRequest.subpopulation(), "")) {
            varietyPage = varietyRepository.findVarietyIdsBySnpAndVarietySetAndSubpopulation(
                    genotypeSearchRequest.snpSet(),
                    genotypeSearchRequest.varietySet(),
                    genotypeSearchRequest.subpopulation(),
                    pageable
            );
        } else {
            return Collections.emptyMap(); // Handle unexpected cases
        }

        // Extract variety IDs
        List<String> varietyIds = varietyPage.getContent().stream().map(Variety::getId).toList();

        // Get total pages directly from Page object
        Integer totalPages = genotypeSearchRequest.askTotalPages() ? varietyPage.getTotalPages() : null;

        // Create response
        Map<String, Object> response = new HashMap<>();
        response.put("varietyIds", varietyIds);
        response.put("totalPages", totalPages);
        return response;
    });
}


    @Async
    public CompletableFuture<Map<String, Object>> fetchVarietyIds(GenotypeSearchLocusListRequest genotypeSearchLocusListRequest) {
        return CompletableFuture.supplyAsync(() -> {
            Pageable pageable = PageRequest.of(genotypeSearchLocusListRequest.page(), PAGE_SIZE, Sort.by("_id").ascending());

            Page<Variety> varietyPage;
            // If All
            if (Objects.equals(genotypeSearchLocusListRequest.subpopulation(), "All")) {
                varietyPage = varietyRepository.findVarietyIdsBySnpAndVarietySet(
                        genotypeSearchLocusListRequest.snpSet(),
                        genotypeSearchLocusListRequest.varietySet(),
                        pageable
                );
            } else if (!Objects.equals(genotypeSearchLocusListRequest.subpopulation(), "")) {
                varietyPage = varietyRepository.findVarietyIdsBySnpAndVarietySetAndSubpopulation(
                        genotypeSearchLocusListRequest.snpSet(),
                        genotypeSearchLocusListRequest.varietySet(),
                        genotypeSearchLocusListRequest.subpopulation(),
                        pageable
                );
            } else {
                return Collections.emptyMap(); // Handle unexpected cases
            }

            // Extract variety IDs
            List<String> varietyIds = varietyPage.getContent().stream().map(Variety::getId).toList();

            // Get total pages directly from Page object
            Integer totalPages = genotypeSearchLocusListRequest.askTotalPages() ? varietyPage.getTotalPages() : null;

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("varietyIds", varietyIds);
            response.put("totalPages", totalPages);

            return response;
        });
    }

    // Gets the positions of the varieties
    @Async
    public CompletableFuture<List<Map<String, List<Map<String, String>>>>> fetchVarietyPositions(
            List<String> varietyIds, String contig, int start, int end) {
        return CompletableFuture.supplyAsync(() ->
                varietyPosRepository.findFilteredPositionsBatch(varietyIds, contig, start, end)
        );
    }

    // Gets the positions of the reference genome using SNP List
    @Async
    public CompletableFuture<Map<String, String>> fetchReferenceGenomePositionsWithSnpList(GenotypeSearchRequest genotypeSearchRequest, String referenceGenomeId, List<String> contigs) {
        if (!genotypeSearchRequest.askReferenceGenome()) {
            return CompletableFuture.completedFuture(Collections.emptyMap());
        }

        // Fetch reference genome positions
        List<Map<String, List<Map<String, String>>>> unOrderedreferenceGenomePositions =
                referenceGenomePosRepository.findFilteredPositionsByList(referenceGenomeId, contigs, genotypeSearchRequest.snpList());

        // Flatten the results
        Map<String, String> resultMap = unOrderedreferenceGenomePositions.stream()
                .filter(Objects::nonNull)
                .flatMap(map -> map.values().stream().filter(Objects::nonNull))  // Extract list of positions
                .flatMap(List::stream)                  // Flatten list of maps
                .filter(Objects::nonNull)               // Ensure no null maps in flattened stream
                .collect(Collectors.toMap(
                        entry -> entry.get("k"), // Get Key
                        entry -> entry.get("v")  // Get Value
                ));

        // Sort and Clean
        List<Map<String, String>> sortedReferenceGenomePositions = genotypeSearchRequest.snpList().stream()
                .filter(resultMap::containsKey) // Ensure only existing positions are included
                .map(key -> Map.of("k", key, "v", resultMap.get(key))) // Map to required structure
                .toList();

        // Create the final Map with sorted keys
        Map<String, String> cleanedReferenceGenomePositions = new LinkedHashMap<>();
        for (Map<String, String> pos : sortedReferenceGenomePositions) {
            cleanedReferenceGenomePositions.put(pos.get("k"), pos.get("v"));
        }


        return CompletableFuture.completedFuture(cleanedReferenceGenomePositions);

    }

    @Async
    public CompletableFuture<Map<String, Map<String, String>>> fetchSortedVarietyPositions(
            List<String> varietyIds, List<String> contigs, GenotypeSearchRequest genotypeSearchRequest) {

        // Fetch variety positions
        List<Map<String, List<Map<String, String>>>> unOrderedVarietyPositions =
                varietyPosRepository.findFilteredPositionsByList(varietyIds, contigs, genotypeSearchRequest.snpList());


        Map<String, Map<String, String>> results = new ConcurrentHashMap<>();

        unOrderedVarietyPositions.parallelStream().forEach(varietyMap -> {
            // Extract variety ID
            Object varietyIdObj = varietyMap.get("_id");
            // Convert ID to String safely
            String varietyId = varietyIdObj != null ? varietyIdObj.toString() : "UNKNOWN_ID";

            // Extract positions safely
            List<Map<String, String>> positions = (List<Map<String, String>>) varietyMap.getOrDefault("positions", List.of());

            // Group by contig
            Map<String, List<Map<String, String>>> chromosomeGrouped = positions.stream()
                    .collect(Collectors.groupingBy(pos -> pos.get("k").split(" ")[0]));

            // Sort chromosomes numerically in parallel
            List<String> sortedChromosomes = chromosomeGrouped.keySet().parallelStream()
                    .sorted(Comparator.comparingInt(chr -> {
                        try { return Integer.parseInt(chr.replace("chr", "")); }
                        catch (NumberFormatException e) { return Integer.MAX_VALUE; }
                    }))
                    .toList();

            // Process chromosomes in parallel
            Map<String, String> cleanPositions = sortedChromosomes.parallelStream()
                    .flatMap(chromosome -> {
                        List<Map<String, String>> chromosomePositions = chromosomeGrouped.get(chromosome);

                        // Sort positions within chromosome
                        chromosomePositions.sort(Comparator.comparingInt(pos -> {
                            return Integer.parseInt(pos.get("k").split(" ")[1]);
                        }));

                        return chromosomePositions.stream();
                    })
                    .collect(Collectors.toMap(
                            pos -> pos.get("k"),
                            pos -> pos.get("v"),
                            (existing, replacement) -> existing, // Keep first occurrence
                            LinkedHashMap::new // Preserve order
                    ));

            results.put(varietyId, cleanPositions);
        });

        // Add empty maps for any variety IDs that no positions were found
        varietyIds.forEach(varietyId -> {
            results.putIfAbsent(varietyId, new LinkedHashMap<>());
        });

        return CompletableFuture.completedFuture(results);
    }

    // Generate excel for the results
    public byte[] generateExcel(GenotypeSearchRequest genotypeSearchRequest, List<String> varietyListIds) {
        genotypeSearchRequest = new GenotypeSearchRequest(
                genotypeSearchRequest.referenceGenome(),
                genotypeSearchRequest.varietySet(),
                genotypeSearchRequest.snpSet(),
                genotypeSearchRequest.subpopulation(),
                varietyListIds,
                genotypeSearchRequest.snpList(),
                genotypeSearchRequest.locusList(),
                genotypeSearchRequest.contig(),
                genotypeSearchRequest.start(),
                genotypeSearchRequest.end(),
                0, // Start page at 0
                true,
                true
        );
        Map<String, Object> result = null;

        // Method checker for which search to use
        if(!genotypeSearchRequest.snpList().isEmpty()){
            result = searchByGenotypeSnpList(genotypeSearchRequest);
        }else{
            result = searchByGenotypeRange(genotypeSearchRequest);
        }

        if(varietyListIds.isEmpty()){
            int totalPages = (int) result.getOrDefault("totalPages", 1);

            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Genotype Data");

                // Get reference genome positions directly from the result
                Object  objReferenceGenomePositions = result.get("referenceGenomePositions");
                Map<Object,String> mapReferenceGenomePositions = (Map<Object,String>) objReferenceGenomePositions;
                Set<Object> referenceGenomePositions = mapReferenceGenomePositions.keySet();

                // Create header row
                Row headerRow = sheet.createRow(0);
                String[] fixedHeaders = {"Variety Name", "IRIS ID", "Accession", "Subpopulation", "Data Set", "Mismatch"};
                int columnIndex = 0;
                for (String header : fixedHeaders) {
                    headerRow.createCell(columnIndex++).setCellValue(header);
                }

                // Add reference genome positions to header row
                Map<String, Integer> positionColumnIndex = new HashMap<>();
                for (Object position : referenceGenomePositions) {
                    headerRow.createCell(columnIndex).setCellValue(position.toString());
                    positionColumnIndex.put(position.toString(), columnIndex++);
                }

                // Create the "Japonica Nipponbare" row
                Row referenceRow = sheet.createRow(1);
                referenceRow.createCell(0).setCellValue("Japonica Nipponbare");

                int refColumnIndex = 6;  // Start from column 5
                for (Object key : referenceGenomePositions) {
                    String value = mapReferenceGenomePositions.get(key);  // Get the value for the key
                    referenceRow.createCell(refColumnIndex++).setCellValue(value);  // Set the value in the cell
                }

                // Cell style for mismatch
                CellStyle mismatchStyle = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setColor(IndexedColors.RED.getIndex());
                mismatchStyle.setFont(font);

                int rowNum = 2;  // Start from row 2 as row 1 is already occupied by the "Japonica Nipponbare"
                for (int page = 0; page < totalPages; page++) {
                    genotypeSearchRequest = new GenotypeSearchRequest(
                            genotypeSearchRequest.referenceGenome(),
                            genotypeSearchRequest.varietySet(),
                            genotypeSearchRequest.snpSet(),
                            genotypeSearchRequest.subpopulation(),
                            genotypeSearchRequest.varietyList(),
                            genotypeSearchRequest.snpList(),
                            genotypeSearchRequest.locusList(),
                            genotypeSearchRequest.contig(),
                            genotypeSearchRequest.start(),
                            genotypeSearchRequest.end(),
                            page,
                            false,
                            false
                    );

                    if(!genotypeSearchRequest.snpList().isEmpty()){
                        result = searchByGenotypeSnpList(genotypeSearchRequest);
                    }else{
                        result = searchByGenotypeRange(genotypeSearchRequest);
                    }

                    Map<String, Map<Object, String>> varietyPositions = (Map<String, Map<Object, String>>) result.get("varietyPositions");
                    Map<Object, Variety> varieties = (Map<Object, Variety>) result.get("varieties");

                    // Iterate through the variety positions
                    for (Map.Entry<String, Map<Object, String>> varietyEntry : varietyPositions.entrySet()) {
                        String varietyId = varietyEntry.getKey();
                        Variety varietyInfo = varieties.get(varietyId);

                        Row row = sheet.createRow(rowNum++);
                        row.createCell(0).setCellValue((String) varietyInfo.getName());
                        row.createCell(1).setCellValue((String) varietyInfo.getIrisId());
                        row.createCell(2).setCellValue((String) varietyInfo.getAccession());
                        row.createCell(3).setCellValue((String) varietyInfo.getSubpopulation());
                        row.createCell(4).setCellValue((String) varietyInfo.getVarietySet());

                        double mismatchCount = 0;

                        // Fill genotype data using reference genome positions
                        for (Map.Entry<Object, String> positionEntry : varietyEntry.getValue().entrySet()) {
                            String varietyValue = positionEntry.getValue();
                            String positionKey = String.valueOf(positionEntry.getKey());
                            Integer posIndex = positionColumnIndex.get(positionKey);

                            if (posIndex != null && varietyValue != null && !varietyValue.isEmpty()) {
                                // Get the reference genome value for this position
                                String referenceValue = mapReferenceGenomePositions.get(positionEntry.getKey());

                                // Mismatch check
                                if (!varietyValue.equals(referenceValue)) {

                                    if (varietyValue.contains(referenceValue)) {
                                        mismatchCount += 0.5;                           // if partial mismatch
                                    } else {
                                        mismatchCount++;                                // if full mismatch
                                    }

                                    // Set red color for mismatch
                                    row.createCell(posIndex).setCellValue(varietyValue);
                                    row.getCell(posIndex).setCellStyle(mismatchStyle);
                                } else {
                                    // If no mismatch, set the correct value without color
                                    row.createCell(posIndex).setCellValue(varietyValue);
                                }
                            } else {
                                // If there's no value for this variety at this position
                                row.createCell(posIndex).setCellValue("");  // Empty cell
                            }
                        }
                        row.createCell(5).setCellValue(mismatchCount); // Set mismatch count
                    }
                }

                workbook.write(outputStream);
                return outputStream.toByteArray();
            } catch (IOException e) {
                throw new RuntimeException("Error generating Excel file", e);
            }
        }else{
            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Genotype Data");

                // Get reference genome positions directly from the result
                Object  objReferenceGenomePositions = result.get("referenceGenomePositions");
                Map<Object,String> mapReferenceGenomePositions = (Map<Object,String>) objReferenceGenomePositions;
                Set<Object> referenceGenomePositions = mapReferenceGenomePositions.keySet();

                // Create header row
                Row headerRow = sheet.createRow(0);
                String[] fixedHeaders = {"Variety Name", "IRIS ID", "Accession", "Subpopulation", "Data Set", "Mismatch"};
                int columnIndex = 0;
                for (String header : fixedHeaders) {
                    headerRow.createCell(columnIndex++).setCellValue(header);
                }

                // Add reference genome positions to header row
                Map<String, Integer> positionColumnIndex = new HashMap<>();
                for (Object position : referenceGenomePositions) {
                    headerRow.createCell(columnIndex).setCellValue(position.toString());
                    positionColumnIndex.put(position.toString(), columnIndex++);
                }

                // Create the "Japonica Nipponbare" row at index 1
                Row referenceRow = sheet.createRow(1);
                referenceRow.createCell(0).setCellValue("Japonica Nipponbare");

                int refColumnIndex = 6;  // Start from column 5
                for (Object key : referenceGenomePositions) {
                    String value = mapReferenceGenomePositions.get(key);  // Get the value for the key
                    referenceRow.createCell(refColumnIndex++).setCellValue(value);  // Set the value in the cell
                }

                // Cellstyle for mismatch
                CellStyle mismatchStyle = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setColor(IndexedColors.RED.getIndex());
                mismatchStyle.setFont(font);

                int rowNum = 2;  // Start from row 2 as row 1 is already occupied by the "Japonica Nipponbare"
                    Map<String, Map<Object, String>> varietyPositions = (Map<String, Map<Object, String>>) result.get("varietyPositions");
                    Map<Object, Variety> varieties = (Map<Object, Variety>) result.get("varieties");

                    for (Map.Entry<String, Map<Object, String>> varietyEntry : varietyPositions.entrySet()) {
                        String varietyId = varietyEntry.getKey();
                        Variety varietyInfo = varieties.get(varietyId);

                        Row row = sheet.createRow(rowNum++);
                        row.createCell(0).setCellValue((String) varietyInfo.getName());
                        row.createCell(1).setCellValue((String) varietyInfo.getIrisId());
                        row.createCell(2).setCellValue((String) varietyInfo.getAccession());
                        row.createCell(3).setCellValue((String) varietyInfo.getSubpopulation());
                        row.createCell(4).setCellValue((String) varietyInfo.getVarietySet());

                        double mismatchCount = 0;

                        // Fill genotype data using reference genome positions
                        for (Map.Entry<Object, String> positionEntry : varietyEntry.getValue().entrySet()) {
                            String varietyValue = positionEntry.getValue();
                            String positionKey = String.valueOf(positionEntry.getKey());
                            Integer posIndex = positionColumnIndex.get(positionKey);

                            if (posIndex != null && varietyValue != null && !varietyValue.isEmpty()) {
                                // Get the reference genome value for this position
                                String referenceValue = mapReferenceGenomePositions.get(positionEntry.getKey());

                                // Mismatch check
                                if (!varietyValue.equals(referenceValue)) {

                                    if (varietyValue.contains(referenceValue)) {
                                        mismatchCount += 0.5;                       // Partial mismatch
                                    } else {
                                        mismatchCount++;                            // Full mismatch
                                    }

                                    // Set red color for mismatch
                                    row.createCell(posIndex).setCellValue(varietyValue);
                                    row.getCell(posIndex).setCellStyle(mismatchStyle);
                                } else {
                                    // If no mismatch, set the correct value without color
                                    row.createCell(posIndex).setCellValue(varietyValue);
                                }
                            } else {
                                // If there's no value for this variety at this position
                                row.createCell(posIndex).setCellValue("");  // Empty cell
                            }
                        }
                        row.createCell(5).setCellValue(mismatchCount); // Set the mismatch
                    }


                workbook.write(outputStream);
                return outputStream.toByteArray();
            } catch (IOException e) {
                throw new RuntimeException("Error generating Excel file", e);
            }

        }




    }



    public byte[] generateExcel(GenotypeSearchLocusListRequest genotypeSearchLocusListRequest, List<String> varietyListIds) {
        genotypeSearchLocusListRequest = new GenotypeSearchLocusListRequest(
                genotypeSearchLocusListRequest.referenceGenome(),
                genotypeSearchLocusListRequest.varietySet(),
                genotypeSearchLocusListRequest.snpSet(),
                genotypeSearchLocusListRequest.subpopulation(),
                varietyListIds,
                genotypeSearchLocusListRequest.snpList(),
                genotypeSearchLocusListRequest.locusList(),
                genotypeSearchLocusListRequest.contigs(),
                genotypeSearchLocusListRequest.starts(),
                genotypeSearchLocusListRequest.ends(),
                0, // Start page at 0
                true,
                true
        );
        Map<String, Object> result = null;
        result = searchByGenotypeLocusList(genotypeSearchLocusListRequest);
        if(varietyListIds.isEmpty()){
            int totalPages = (int) result.getOrDefault("totalPages", 1);

            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Genotype Data");

                // Get reference genome positions directly from the result
                Object  objReferenceGenomePositions = result.get("referenceGenomePositions");
                Map<Object,String> mapReferenceGenomePositions = (Map<Object,String>) objReferenceGenomePositions;
                Set<Object> referenceGenomePositions = mapReferenceGenomePositions.keySet();

                // Create header row
                Row headerRow = sheet.createRow(0);
                String[] fixedHeaders = {"Variety Name", "IRIS ID", "Accession", "Subpopulation", "Data Set", "Mismatch"};
                int columnIndex = 0;
                for (String header : fixedHeaders) {
                    headerRow.createCell(columnIndex++).setCellValue(header);
                }

                // Add reference genome positions to header row
                Map<String, Integer> positionColumnIndex = new HashMap<>();
                for (Object position : referenceGenomePositions) {
                    headerRow.createCell(columnIndex).setCellValue(position.toString());
                    positionColumnIndex.put(position.toString(), columnIndex++);
                }

                // Create the "Japonica Nipponbare" row
                Row referenceRow = sheet.createRow(1);
                referenceRow.createCell(0).setCellValue("Japonica Nipponbare");

                int refColumnIndex = 6;  // Start from column 5
                for (Object key : referenceGenomePositions) {
                    String value = mapReferenceGenomePositions.get(key);  // Get the value for the key
                    referenceRow.createCell(refColumnIndex++).setCellValue(value);  // Set the value in the cell
                }

                // Create CellStyle for mismatch
                CellStyle mismatchStyle = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setColor(IndexedColors.RED.getIndex());
                mismatchStyle.setFont(font);

                int rowNum = 2;  // Start from row 2 as row 1 is already occupied by the "Japonica Nipponbare"
                for (int page = 0; page < totalPages; page++) {
                    genotypeSearchLocusListRequest = new GenotypeSearchLocusListRequest(
                            genotypeSearchLocusListRequest.referenceGenome(),
                            genotypeSearchLocusListRequest.varietySet(),
                            genotypeSearchLocusListRequest.snpSet(),
                            genotypeSearchLocusListRequest.subpopulation(),
                            genotypeSearchLocusListRequest.varietyList(),
                            genotypeSearchLocusListRequest.snpList(),
                            genotypeSearchLocusListRequest.locusList(),
                            genotypeSearchLocusListRequest.contigs(),
                            genotypeSearchLocusListRequest.starts(),
                            genotypeSearchLocusListRequest.ends(),
                            page,
                            false,
                            false
                    );


                    result = searchByGenotypeLocusList(genotypeSearchLocusListRequest);

                    Map<String, Map<Object, String>> varietyPositions = (Map<String, Map<Object, String>>) result.get("varietyPositions");
                    Map<Object, Variety> varieties = (Map<Object, Variety>) result.get("varieties");

                    for (Map.Entry<String, Map<Object, String>> varietyEntry : varietyPositions.entrySet()) {
                        String varietyId = varietyEntry.getKey();
                        Variety varietyInfo = varieties.get(varietyId);

                        Row row = sheet.createRow(rowNum++);
                        row.createCell(0).setCellValue((String) varietyInfo.getName());
                        row.createCell(1).setCellValue((String) varietyInfo.getIrisId());
                        row.createCell(2).setCellValue((String) varietyInfo.getAccession());
                        row.createCell(3).setCellValue((String) varietyInfo.getSubpopulation());
                        row.createCell(4).setCellValue((String) varietyInfo.getVarietySet());

                        double mismatchCount = 0;

                        // Fill genotype data using reference genome positions
                        for (Map.Entry<Object, String> positionEntry : varietyEntry.getValue().entrySet()) {
                            String varietyValue = positionEntry.getValue();
                            String positionKey = String.valueOf(positionEntry.getKey());
                            Integer posIndex = positionColumnIndex.get(positionKey);

                            if (posIndex != null && varietyValue != null && !varietyValue.isEmpty()) {
                                // Get the reference genome value for this position
                                String referenceValue = mapReferenceGenomePositions.get(positionEntry.getKey());

                                // Mismatch check
                                if (!varietyValue.equals(referenceValue)) {

                                    if (varietyValue.contains(referenceValue)) {
                                        mismatchCount += 0.5;                       // Partial mismatch
                                    } else {
                                        mismatchCount++;                            // Full mismatch
                                    }

                                    // Set red color for mismatch
                                    row.createCell(posIndex).setCellValue(varietyValue);
                                    row.getCell(posIndex).setCellStyle(mismatchStyle);
                                } else {
                                    // If no mismatch, set the correct value without color
                                    row.createCell(posIndex).setCellValue(varietyValue);
                                }
                            } else {
                                // If there's no value for this variety at this position
                                row.createCell(posIndex).setCellValue("");  // Empty cell
                            }
                        }
                        row.createCell(5).setCellValue(mismatchCount); // Set the mismatch count
                    }
                }

                workbook.write(outputStream);
                return outputStream.toByteArray();
            } catch (IOException e) {
                throw new RuntimeException("Error generating Excel file", e);
            }
        }else{
            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet("Genotype Data");

                // Get reference genome positions directly from the result
                Object  objReferenceGenomePositions = result.get("referenceGenomePositions");
                Map<Object,String> mapReferenceGenomePositions = (Map<Object,String>) objReferenceGenomePositions;
                Set<Object> referenceGenomePositions = mapReferenceGenomePositions.keySet();

                // Create header row
                Row headerRow = sheet.createRow(0);
                String[] fixedHeaders = {"Variety Name", "IRIS ID", "Accession", "Subpopulation", "Data Set", "Mismatch"};
                int columnIndex = 0;
                for (String header : fixedHeaders) {
                    headerRow.createCell(columnIndex++).setCellValue(header);
                }

                // Add reference genome positions to header row
                Map<String, Integer> positionColumnIndex = new HashMap<>();
                for (Object position : referenceGenomePositions) {
                    headerRow.createCell(columnIndex).setCellValue(position.toString());
                    positionColumnIndex.put(position.toString(), columnIndex++);
                }

                // Create the "Japonica Nipponbare" row at index 1
                Row referenceRow = sheet.createRow(1);
                referenceRow.createCell(0).setCellValue("Japonica Nipponbare");

                int refColumnIndex = 6;  // Start from column 5
                for (Object key : referenceGenomePositions) {
                    String value = mapReferenceGenomePositions.get(key);  // Get the value for the key
                    referenceRow.createCell(refColumnIndex++).setCellValue(value);  // Set the value in the cell
                }

                // Create a CellStyle for mismatch
                CellStyle mismatchStyle = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setColor(IndexedColors.RED.getIndex());
                mismatchStyle.setFont(font);

                int rowNum = 2;  // Start from row 2 as row 1 is already occupied by the "Japonica Nipponbare"
                Map<String, Map<Object, String>> varietyPositions = (Map<String, Map<Object, String>>) result.get("varietyPositions");
                Map<Object, Variety> varieties = (Map<Object, Variety>) result.get("varieties");

                for (Map.Entry<String, Map<Object, String>> varietyEntry : varietyPositions.entrySet()) {
                    String varietyId = varietyEntry.getKey();
                    Variety varietyInfo = varieties.get(varietyId);

                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue((String) varietyInfo.getName());
                    row.createCell(1).setCellValue((String) varietyInfo.getIrisId());
                    row.createCell(2).setCellValue((String) varietyInfo.getAccession());
                    row.createCell(3).setCellValue((String) varietyInfo.getSubpopulation());
                    row.createCell(4).setCellValue((String) varietyInfo.getVarietySet());

                    double mismatchCount = 0;

                    // Fill genotype data using reference genome positions
                    for (Map.Entry<Object, String> positionEntry : varietyEntry.getValue().entrySet()) {
                        String varietyValue = positionEntry.getValue();
                        String positionKey = String.valueOf(positionEntry.getKey());
                        Integer posIndex = positionColumnIndex.get(positionKey);

                        if (posIndex != null && varietyValue != null && !varietyValue.isEmpty()) {
                            // Get the reference genome value for this position
                            String referenceValue = mapReferenceGenomePositions.get(positionEntry.getKey());

                            // Mismatch check
                            if (!varietyValue.equals(referenceValue)) {

                                if (varietyValue.contains(referenceValue)) {
                                    mismatchCount += 0.5;                       // Partial mismatch
                                } else {
                                    mismatchCount++;                            // Full mismatch
                                }

                                // Set red color for mismatch
                                row.createCell(posIndex).setCellValue(varietyValue);
                                row.getCell(posIndex).setCellStyle(mismatchStyle);
                            } else {
                                // If no mismatch, set the correct value without color
                                row.createCell(posIndex).setCellValue(varietyValue);
                            }
                        } else {
                            // If there's no value for this variety at this position
                            row.createCell(posIndex).setCellValue("");  // Empty cell
                        }
                    }
                    row.createCell(5).setCellValue(mismatchCount);
                }

                workbook.write(outputStream);
                return outputStream.toByteArray();
            } catch (IOException e) {
                throw new RuntimeException("Error generating Excel file", e);
            }

        }


    }




    public Map<String, Object> searchByGenotypeRange(GenotypeSearchRequest genotypeSearchRequest) {
    boolean fetchReferenceGenome = genotypeSearchRequest.askReferenceGenome();

    // Fetch Reference Genome if needed
    CompletableFuture<ReferenceGenome> referenceGenomeFuture = fetchReferenceGenomeIfNeeded(genotypeSearchRequest, fetchReferenceGenome);

    // Fetch variety IDs asynchronously
    CompletableFuture<Map<String, Object>> varietyDataFuture = fetchVarietyIdsIfNeeded(genotypeSearchRequest);

    // Process variety IDs
    CompletableFuture<List<String>> varietyIdsFuture = varietyDataFuture.thenApply(varietyData ->
            (List<String>) varietyData.get("varietyIds"));

    CompletableFuture<Integer> totalPagesFuture = varietyDataFuture.thenApply(varietyData ->
            varietyData.get("totalPages") != null ? (int) varietyData.get("totalPages") : 0);

    // Fetch Reference Genome Positions & Variety Positions in Parallel
    CompletableFuture<List<Map<String, List<Map<String, String>>>>> referenceGenomePositionsFuture =
            fetchReferenceGenomePositionsIfNeeded(referenceGenomeFuture, genotypeSearchRequest, fetchReferenceGenome);

    CompletableFuture<List<Map<String, List<Map<String, String>>>>> varietyPositionsFuture =
            varietyIdsFuture.thenCompose(varietyIds ->
                    fetchVarietyPositions(varietyIds, genotypeSearchRequest.contig(), genotypeSearchRequest.start(), genotypeSearchRequest.end())
            );

    // Process Reference Genome & Variety Positions Together
    CompletableFuture<Map<Integer, String>> cleanedReferenceGenomePositionsFuture = referenceGenomePositionsFuture.thenApply(referenceGenomePositions -> {
        Map<Integer, String> cleanedReferenceGenomePositions = new LinkedHashMap<>();
        if (fetchReferenceGenome && !referenceGenomePositions.isEmpty() && referenceGenomePositions.get(0).containsKey("positions")) {
            for (Map<String, String> pos : referenceGenomePositions.get(0).get("positions")) {
                cleanedReferenceGenomePositions.put(Integer.parseInt(pos.get("k")), pos.get("v"));
            }
        }
        return cleanedReferenceGenomePositions;
    });


        CompletableFuture<Map<String, Map<Integer, String>>> cleanedVarietyPositionsFuture = varietyPositionsFuture.thenApply(varietyPositions -> {
            // Initialize the cleanedVarietyPositions map from the varietyPositions
            Map<String, Map<Integer, String>> cleanedVarietyPositions = varietyPositions.parallelStream()
                    .filter(result -> result.containsKey("positions"))
                    .collect(Collectors.toConcurrentMap(
                            result -> {
                                Object idObject = result.get("_id");
                                return (String) idObject ;
                            },
                            result -> {
                                Map<Integer, String> cleanedPositions = new LinkedHashMap<>();
                                result.get("positions").forEach(position ->
                                        cleanedPositions.put(Integer.parseInt(position.get("k")), position.get("v")));
                                return cleanedPositions;
                            }
                    ));

            // Get varietyIds from varietyIdsFuture
            List<String> varietyIds = varietyIdsFuture.join();

            // Check if each varietyId is in cleanedVarietyPositions; if not, add it with an empty map
            varietyIds.forEach(varietyId -> {
                cleanedVarietyPositions.putIfAbsent(varietyId, new LinkedHashMap<>());
            });

            return cleanedVarietyPositions;
        });

    // Fetch Variety Details
    CompletableFuture<List<Variety>> varietiesFuture = cleanedVarietyPositionsFuture.thenCompose(cleanedVarietyPositions ->
            CompletableFuture.supplyAsync(() -> varietyRepository.findByIdIn(cleanedVarietyPositions.keySet()))
    );

    // Assemble Final Response
    return CompletableFuture.allOf(
                    referenceGenomeFuture,
                    cleanedReferenceGenomePositionsFuture,
                    cleanedVarietyPositionsFuture,
                    varietiesFuture,
                    totalPagesFuture)
            .thenApply(v -> {
                Map<String, Object> response = new HashMap<>();

                if (fetchReferenceGenome) {
                    response.put("referenceGenomePositions", cleanedReferenceGenomePositionsFuture.join());
                }
                if (genotypeSearchRequest.askTotalPages()) {
                    response.put("totalPages", totalPagesFuture.join());
                }


                response.put("varietyPositions", cleanedVarietyPositionsFuture.join());

                // Convert variety list to a map
                Map<String, Object> cleanedVarieties = varietiesFuture.join().stream()
                        .collect(Collectors.toMap(Variety::getId, variety -> variety));

                response.put("varieties", cleanedVarieties);

                return response;
            }).join();
}

    // Helper Methods
    private CompletableFuture<ReferenceGenome> fetchReferenceGenomeIfNeeded(GenotypeSearchRequest request, boolean fetch) {
        return fetch ? fetchReferenceGenome(request.referenceGenome(), request.snpSet()) : CompletableFuture.completedFuture(null);
    }

    private CompletableFuture<List<Map<String, List<Map<String, String>>>>> fetchReferenceGenomePositionsIfNeeded(
            CompletableFuture<ReferenceGenome> referenceGenomeFuture, GenotypeSearchRequest request, boolean fetch) {
        return fetch ? referenceGenomeFuture.thenCompose(referenceGenome ->
                fetchReferenceGenomePositions(referenceGenome.getId(), request.contig(), request.start(), request.end()))
                : CompletableFuture.completedFuture(Collections.emptyList());
    }

    private CompletableFuture<Map<String, Object>> fetchVarietyIdsIfNeeded(GenotypeSearchRequest request) {
        return (request.varietyList() != null && !request.varietyList().isEmpty())
                ? CompletableFuture.completedFuture(Map.of("varietyIds", request.varietyList(), "totalPages", 0))
                : fetchVarietyIds(request);
    }



public Map<String, Object> searchByGenotypeSnpList(GenotypeSearchRequest genotypeSearchRequest) {
    boolean fetchReferenceGenome = genotypeSearchRequest.askReferenceGenome();

    // Fetch Reference Genome
    CompletableFuture<ReferenceGenome> referenceGenomeFuture = fetchReferenceGenomeIfNeeded(genotypeSearchRequest, fetchReferenceGenome);

    // Fetch variety IDs asynchronously
    CompletableFuture<Map<String, Object>> varietyDataFuture = fetchVarietyIdsIfNeeded(genotypeSearchRequest);

    CompletableFuture<List<String>> varietyIdsFuture = varietyDataFuture.thenApply(varietyData ->
            (List<String>) varietyData.get("varietyIds"));

    // Get the total pages from the variety data
    CompletableFuture<Integer> totalPagesFuture = varietyDataFuture.thenApply(varietyData ->
            varietyData.get("totalPages") != null ? (int) varietyData.get("totalPages") : 0);

    // Extract Contigs
    List<String> contigs = genotypeSearchRequest.snpList().stream()
            .map(s -> s.split(" ")[0]) // Extract "chr1", "chr2"
            .distinct()
            .toList();

    // Fetch Reference Genome Positions & Variety Positions in Parallel
    CompletableFuture<Map<String, String>> referenceGenomePositionsFuture = referenceGenomeFuture.thenCompose(referenceGenome ->
            fetchReferenceGenomePositionsWithSnpList(genotypeSearchRequest, referenceGenome != null ? referenceGenome.getId() : null, contigs));

    CompletableFuture<Map<String, Map<String, String>>> varietyPositionsFuture = varietyIdsFuture.thenCompose(varietyIds ->
            fetchSortedVarietyPositions(varietyIds, contigs, genotypeSearchRequest));

    // Fetch Varieties based on IDs
    CompletableFuture<List<Variety>> varietiesFuture = varietyPositionsFuture.thenCompose(varietyPositions ->
            CompletableFuture.supplyAsync(() -> varietyRepository.findByIdIn(varietyPositions.keySet())));

    // Assemble Final Response
    return CompletableFuture.allOf(referenceGenomePositionsFuture, varietyPositionsFuture, varietiesFuture, totalPagesFuture)
            .thenApply(v -> {
                Map<String, Object> response = new HashMap<>();

                if (fetchReferenceGenome) {
                    response.put("referenceGenomePositions", referenceGenomePositionsFuture.join());
                }

                if (genotypeSearchRequest.askTotalPages()) {
                    response.put("totalPages", totalPagesFuture.join());
                }

                response.put("varietyPositions", varietyPositionsFuture.join());

                // Convert variety list to a map
                Map<String, Object> cleanedVarieties = varietiesFuture.join().stream()
                        .collect(Collectors.toMap(Variety::getId, variety -> variety));

                response.put("varieties", cleanedVarieties);

                return response;
            }).join();
}




    public Map<String, Object> searchByGenotypeLocusList(GenotypeSearchLocusListRequest genotypeSearchLocusListRequest) {

        boolean fetchReferenceGenome = genotypeSearchLocusListRequest.askReferenceGenome();
        CompletableFuture<ReferenceGenome> referenceGenomeFuture = null;

        // Fetch reference genome if needed
        if (fetchReferenceGenome) {
            referenceGenomeFuture = fetchReferenceGenome(
                    genotypeSearchLocusListRequest.referenceGenome(),
                    genotypeSearchLocusListRequest.snpSet()
            );
        }

        // Fetch variety IDs asynchronously
        CompletableFuture<Map<String, Object>> varietyDataFuture = null;
        if (genotypeSearchLocusListRequest.varietyList() == null || genotypeSearchLocusListRequest.varietyList().isEmpty()) {
            varietyDataFuture = fetchVarietyIds(genotypeSearchLocusListRequest);
        }

        // Get variety ids if passed
        List<String> varietyIds = genotypeSearchLocusListRequest.varietyList();
        int totalPages = 0;

        // If variety IDs are not provided, fetch them from the future
        if (varietyDataFuture != null) {
            try {
                Map<String, Object> varietyData = varietyDataFuture.get();
                varietyIds = (List<String>) varietyData.get("varietyIds");
                totalPages = varietyData.get("totalPages") != null ? (int) varietyData.get("totalPages") : 0;
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Error fetching variety IDs", e);
            }
        }

        ReferenceGenome referenceGenome = null;
        String referenceGenomeId = null;

        // If reference genome is needed, get it
        if (fetchReferenceGenome) {
            try {
                referenceGenome = referenceGenomeFuture.get();
                referenceGenomeId = referenceGenome.getId();
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Error fetching reference genome", e);
            }
        }

        // Batch processing size
        int batchSize = 10;
        List<String> contigs = genotypeSearchLocusListRequest.contigs();
        List<Integer> starts = genotypeSearchLocusListRequest.starts();
        List<Integer> ends = genotypeSearchLocusListRequest.ends();

        Map<String, Map<String, String>> cleanedVarietyPositions = new LinkedHashMap<>();
        Map<String, String> cleanedReferenceGenomePositions = new LinkedHashMap<>();
        List<CompletableFuture<Void>> batchFutures = new ArrayList<>();

        for (int batchStart = 0; batchStart < contigs.size(); batchStart += batchSize) {
            int batchEnd = Math.min(batchStart + batchSize, contigs.size());

            // Get the current batch of contigs, starts, and ends
            List<String> batchContigs = contigs.subList(batchStart, batchEnd);
            List<Integer> batchStarts = starts.subList(batchStart, batchEnd);
            List<Integer> batchEnds = ends.subList(batchStart, batchEnd);

            List<CompletableFuture<List<Map<String, List<Map<String, String>>>>>> varietyPositionFutures = new ArrayList<>();
            List<CompletableFuture<List<Map<String, List<Map<String, String>>>>>> referenceGenomePositionFutures = new ArrayList<>();

            // Fetch variety positions
            for (int i = 0; i < batchContigs.size(); i++) {
                varietyPositionFutures.add(fetchVarietyPositions(varietyIds, batchContigs.get(i), batchStarts.get(i), batchEnds.get(i)));
            }

            // Fetch reference genome positions
            if (fetchReferenceGenome) {
                for (int i = 0; i < batchContigs.size(); i++) {
                    referenceGenomePositionFutures.add(fetchReferenceGenomePositions(referenceGenomeId, batchContigs.get(i), batchStarts.get(i), batchEnds.get(i)));
                }
            }

            // Process variety positions
            CompletableFuture<Void> batchFuture = CompletableFuture.allOf(
                    varietyPositionFutures.toArray(new CompletableFuture[0])
            ).thenAccept(v -> {
                for (int i = 0; i < varietyPositionFutures.size(); i++) {
                    try {
                        List<Map<String, List<Map<String, String>>>> varietyResults = varietyPositionFutures.get(i).get();
                        String contig = batchContigs.get(i);

                        for (Map<String, List<Map<String, String>>> result : varietyResults) {
                            if (result != null && result.containsKey("positions")) {
                                Object idObj = result.get("_id");
                                String id = idObj.toString();
                                cleanedVarietyPositions.computeIfAbsent(id, k -> new LinkedHashMap<>());

                                for (Map<String, String> position : result.get("positions")) {
                                    String compositeKey = contig + " " + position.get("k");
                                    cleanedVarietyPositions.get(id).merge(compositeKey, position.get("v"),
                                            (oldValue, newValue) -> oldValue.equals(newValue) ? oldValue : oldValue + "/" + newValue);
                                }
                            }
                        }
                    } catch (InterruptedException | ExecutionException e) {
                        throw new RuntimeException("Error fetching variety positions", e);
                    }
                }
            });

            batchFutures.add(batchFuture);

            // Process reference genome positions
            if (fetchReferenceGenome) {
                CompletableFuture<Void> referenceGenomeBatchFuture = CompletableFuture.allOf(
                        referenceGenomePositionFutures.toArray(new CompletableFuture[0])
                ).thenAccept(v -> {
                    for (int i = 0; i < referenceGenomePositionFutures.size(); i++) {
                        try {
                            List<Map<String, List<Map<String, String>>>> referenceGenomeResults = referenceGenomePositionFutures.get(i).get();
                            String contig = batchContigs.get(i);

                            for (Map<String, List<Map<String, String>>> result : referenceGenomeResults) {
                                if (result != null && result.containsKey("positions")) {
                                    for (Map<String, String> position : result.get("positions")) {
                                        String compositeKey = contig + " " + position.get("k");
                                        cleanedReferenceGenomePositions.put(compositeKey, position.get("v"));
                                    }
                                }
                            }
                        } catch (InterruptedException | ExecutionException e) {
                            throw new RuntimeException("Error fetching reference genome positions", e);
                        }
                    }
                });

                batchFutures.add(referenceGenomeBatchFuture);
            }
        }

        // Wait for all batch operations to complete
        CompletableFuture.allOf(batchFutures.toArray(new CompletableFuture[0])).join();

        // Add missing variety IDs to cleanedVarietyPositions
        if (varietyIds != null) {
            varietyIds.forEach(varietyId -> {
                cleanedVarietyPositions.putIfAbsent(varietyId, new LinkedHashMap<>());
            });
        }

        // Fetch varieties
        List<Variety> varieties = varietyRepository.findByIdIn(cleanedVarietyPositions.keySet());

        // Build Response
        Map<String, Object> response = new LinkedHashMap<>();
        if (fetchReferenceGenome) {
            response.put("referenceGenomePositions", cleanedReferenceGenomePositions);
        }

        response.put("totalPages", totalPages);
        response.put("varietyPositions", cleanedVarietyPositions);

        // Cleaned variety data
        Map<String, Object> cleanedVarieties = new LinkedHashMap<>();
        for (Variety variety : varieties) {
            cleanedVarieties.put(variety.getId(), variety);
        }

        response.put("varieties", cleanedVarieties);
        return response;
    }




    }


