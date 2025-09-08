package com.irri.microservices.geneloci_service.service;

import com.irri.microservices.geneloci_service.dto.ExportExcelRequest;
import com.irri.microservices.geneloci_service.dto.PagedSearchResponse;
import com.irri.microservices.geneloci_service.dto.SearchResponse;
import com.irri.microservices.geneloci_service.model.GeneLoci;
import com.irri.microservices.geneloci_service.model.Trait;
import com.irri.microservices.geneloci_service.repository.GeneLociRepository;
import com.irri.microservices.geneloci_service.repository.TraitRepository;
import com.irri.microservices.geneloci_service.repository.UtilRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class GeneLociService {
    private static final Logger logger = LoggerFactory.getLogger(GeneLociService.class);
    private static final int PAGE_SIZE = 10; // Global page size

    private final GeneLociRepository geneLociRepository;
    private final TraitRepository traitRepository;
    private  final UtilRepository utilRepository;

    public GeneLociService(GeneLociRepository geneLociRepository, TraitRepository traitRepository, UtilRepository utilRepository) {
        this.geneLociRepository = geneLociRepository;
        this.traitRepository = traitRepository;
        this.utilRepository = utilRepository;
    }

    // Generate Excel file for results download
    public byte[] generateExcel(ExportExcelRequest exportExcelRequest) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Gene Loci");

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Gene Name", "Reference Genome", "Start", "End", "Contig", "Strand", "Description"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(getHeaderCellStyle(workbook));
            }

            int rowNum = 1;
            int pageNumber = 0;
            Page<GeneLoci> pageResults = null;

            // Fetch data in pages
            do {
                PageRequest pageable = PageRequest.of(pageNumber, 500);
                
                if(Objects.equals(exportExcelRequest.searchBy(), "Annotation (by Source)")){
                    pageResults = fetchGeneLociByAnnotation(exportExcelRequest.searchMethod(), exportExcelRequest.searchQuery(), exportExcelRequest.referenceGenome(), pageable);
                } else if (Objects.equals(exportExcelRequest.searchBy(), "Gene Name/Symbol/Function")) {
                    pageResults = fetchGeneLociByGeneName(exportExcelRequest.searchMethod(), exportExcelRequest.searchQuery(), exportExcelRequest.referenceGenome(), pageable);
                } else if (Objects.equals(exportExcelRequest.searchBy(), "Region")) {
                    pageResults = fetchGeneLociByRegion(exportExcelRequest.referenceGenome(), exportExcelRequest.contig(), exportExcelRequest.start(), exportExcelRequest.end(), pageable);
                }else {
                    pageResults = fetchGeneLociByTrait(exportExcelRequest.referenceGenome(), exportExcelRequest.traitName(), pageable);
                }

                for (GeneLoci gene : pageResults.getContent()) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(gene.getGeneName());
                    row.createCell(1).setCellValue(gene.getReferenceGenome());
                    row.createCell(2).setCellValue(gene.getStart());
                    row.createCell(3).setCellValue(gene.getEnd());
                    row.createCell(4).setCellValue(gene.getContig());
                    row.createCell(5).setCellValue(gene.getStrand());
                    row.createCell(6).setCellValue(gene.getDescription());
                }

                pageNumber++;
            } while (pageResults.hasNext());

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private CellStyle getHeaderCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }
    // Get gene loci by annotation
    private Page<GeneLoci> fetchGeneLociByAnnotation(String searchMethod, String searchQuery, String referenceGenome, PageRequest pageable) {
        boolean searchAllGenomes = "All".equalsIgnoreCase(referenceGenome);

        // Switch for choosing repository method based on search method
        return switch (searchMethod) {
            case "Whole word only" -> {
                String wholeWordPattern = "(?<!\\w)" + searchQuery + "(?!\\w)";
                yield searchAllGenomes
                        ? geneLociRepository.findByDescription(wholeWordPattern, pageable)
                        : geneLociRepository.findByReferenceGenomeAndGeneDescription(referenceGenome, wholeWordPattern, pageable);
            }
            case "Substring" -> searchAllGenomes
                    ? geneLociRepository.findByDescriptionContaining(searchQuery, pageable)
                    : geneLociRepository.findByReferenceGenomeAndDescriptionContaining(referenceGenome, searchQuery, pageable);
            case "Exact Match" -> {
                String regexPattern = "^\\(" + Pattern.quote(searchQuery) + "\\).*";
                yield searchAllGenomes
                        ? geneLociRepository.findByDescriptionEquals(regexPattern, pageable)
                        : geneLociRepository.findByReferenceGenomeAndDescriptionEquals(referenceGenome, regexPattern, pageable);
            }
            case "RegEx" -> searchAllGenomes
                    ? geneLociRepository.findByDescriptionRegex(searchQuery, pageable)
                    : geneLociRepository.findByReferenceGenomeAndDescriptionRegex(referenceGenome, searchQuery, pageable);
            default -> throw new IllegalArgumentException("Invalid search method");
        };
    }

    // Get gene loci by gene name
    public Page<GeneLoci> fetchGeneLociByGeneName(String searchMethod, String searchQuery, String referenceGenome, PageRequest pageable) {
        
        boolean searchAllGenomes = "All".equalsIgnoreCase(referenceGenome);

        // Switch for choosing repository method based on search method
        return switch (searchMethod) {
            case "Whole word only" ->{
                String wholeWordPattern = "(?<!\\w)" + searchQuery + "(?!\\w)"; // Ensures whole-word matching

                yield  searchAllGenomes
                        ? geneLociRepository.findByGeneName(wholeWordPattern, pageable)
                        : geneLociRepository.findByReferenceGenomeAndGeneName(referenceGenome, wholeWordPattern, pageable);
            }


            case "Substring" ->
                    searchAllGenomes
                            ? geneLociRepository.findByGeneNameContaining(searchQuery, pageable)
                            : geneLociRepository.findByReferenceGenomeAndGeneNameContaining(referenceGenome, searchQuery, pageable);

            case "Exact Match" ->{
                String geneNamePattern = "^" + Pattern.quote(searchQuery) + "$"; // Exact match, case-insensitive
                String regexPattern = "^\\(" + Pattern.quote(searchQuery) + "\\).*"; // First match in description with () brackets
                yield searchAllGenomes
                        ? geneLociRepository.findByGeneNameEquals(geneNamePattern, regexPattern, pageable)
                        : geneLociRepository.findByReferenceGenomeAndGeneNameEquals(referenceGenome, geneNamePattern, regexPattern, pageable);
            }

            case "RegEx" ->
                    searchAllGenomes
                            ? geneLociRepository.findByGeneNameRegex(searchQuery, pageable)
                            : geneLociRepository.findByReferenceGenomeAndGeneNameRegex(referenceGenome, searchQuery, pageable);

            default -> throw new IllegalArgumentException("Invalid search method");
        };

        
    }

    // Get gene loci by region
    public Page<GeneLoci> fetchGeneLociByRegion(String referenceGenome, String contig, Integer start, Integer end, Pageable pageable) {

        boolean searchAllGenomes = "All".equalsIgnoreCase(referenceGenome);

        return searchAllGenomes
                ? geneLociRepository.findByRegion(contig, end, start, pageable)
                : geneLociRepository.findByReferenceGenomeAndRegion(referenceGenome, contig, end, start, pageable);
    }

    // Get gene loci by trait
    public Page<GeneLoci> fetchGeneLociByTrait(String referenceGenome, String traitName, Pageable pageable) {

        boolean searchAllGenomes = "All".equalsIgnoreCase(referenceGenome);

        Trait trait  = traitRepository.findGeneIdsByTraitName(traitName);
        List<String> geneIds =  trait.getGeneIds();


        return searchAllGenomes
                ? geneLociRepository.findGeneByIds(geneIds, pageable)
                : geneLociRepository.findGeneByIdsWithReferenceGenome(geneIds, referenceGenome, pageable);
    }

    // Pagination for search by annotation
    public PagedSearchResponse  searchGeneLociByAnnotation(String searchMethod, String searchQuery, String referenceGenome, Integer pageNumber) {
        Pageable pageable = PageRequest.of(pageNumber - 1, PAGE_SIZE); // Convert 1-based to 0-based

        Page<GeneLoci> results;

        boolean searchAllGenomes = "All".equalsIgnoreCase(referenceGenome);

        results = switch (searchMethod) {
            case "Whole word only" ->{
                String wholeWordPattern = "(?<!\\w)" + searchQuery + "(?!\\w)"; // Ensures whole-word matching

                yield  searchAllGenomes
                        ? geneLociRepository.findByDescription(wholeWordPattern,pageable)
                        : geneLociRepository.findByReferenceGenomeAndGeneDescription(referenceGenome, wholeWordPattern, pageable);
            }

            case "Substring" ->
                    searchAllGenomes
                            ? geneLociRepository.findByDescriptionContaining(searchQuery, pageable)
                            : geneLociRepository.findByReferenceGenomeAndDescriptionContaining(referenceGenome, searchQuery, pageable);

            case "Exact Match" ->{
                String regexPattern = "^\\(" + Pattern.quote(searchQuery) + "\\).*"; // First match in description with () brackets
                yield searchAllGenomes
                        ? geneLociRepository.findByDescriptionEquals(regexPattern, pageable)
                        : geneLociRepository.findByReferenceGenomeAndDescriptionEquals(referenceGenome, regexPattern, pageable);
            }

            case "RegEx" ->
                    searchAllGenomes
                            ? geneLociRepository.findByDescriptionRegex(searchQuery, pageable)
                            : geneLociRepository.findByReferenceGenomeAndDescriptionRegex(referenceGenome, searchQuery, pageable);

            default -> throw new IllegalArgumentException("Invalid search method");
        };

        List<SearchResponse> searchResponses = results.getContent().stream()
                .map(geneLoci -> new SearchResponse(
                        geneLoci.getGeneName(), geneLoci.getReferenceGenome(),
                        geneLoci.getStart(), geneLoci.getEnd(), geneLoci.getContig(),
                        geneLoci.getStrand(), geneLoci.getDescription()))
                .toList();

        return new PagedSearchResponse(searchResponses, results.getTotalPages());
    }

    // Pagination for search by gene name
    public PagedSearchResponse searchGeneLociByGeneName(String searchMethod, String searchQuery, String referenceGenome, Integer pageNumber) {
        Pageable pageable = PageRequest.of(pageNumber - 1, PAGE_SIZE);
        Page<GeneLoci> results;

        boolean searchAllGenomes = "All".equalsIgnoreCase(referenceGenome);

        results = switch (searchMethod) {
            case "Whole word only" ->{
                String wholeWordPattern = "(?<!\\w)" + searchQuery + "(?!\\w)"; // Ensures whole-word matching

                yield  searchAllGenomes
                        ? geneLociRepository.findByGeneName(wholeWordPattern, pageable)
                        : geneLociRepository.findByReferenceGenomeAndGeneName(referenceGenome, wholeWordPattern, pageable);
            }


            case "Substring" ->
                    searchAllGenomes
                            ? geneLociRepository.findByGeneNameContaining(searchQuery, pageable)
                            : geneLociRepository.findByReferenceGenomeAndGeneNameContaining(referenceGenome, searchQuery, pageable);

            case "Exact Match" ->{
                String geneNamePattern = "^" + Pattern.quote(searchQuery) + "$"; // Exact match, case-insensitive
                String regexPattern = "^\\(" + Pattern.quote(searchQuery) + "\\).*"; // First match in description with () brackets
                yield searchAllGenomes
                        ? geneLociRepository.findByGeneNameEquals(geneNamePattern, regexPattern, pageable)
                        : geneLociRepository.findByReferenceGenomeAndGeneNameEquals(referenceGenome, geneNamePattern, regexPattern, pageable);
            }

            case "RegEx" ->
                    searchAllGenomes
                        ? geneLociRepository.findByGeneNameRegex(searchQuery, pageable)
                        : geneLociRepository.findByReferenceGenomeAndGeneNameRegex(referenceGenome, searchQuery, pageable);

            default -> throw new IllegalArgumentException("Invalid search method");
        };

        List<SearchResponse> searchResponses = results.getContent().stream()
                .map(geneLoci -> new SearchResponse(
                        geneLoci.getGeneName(), geneLoci.getReferenceGenome(),
                        geneLoci.getStart(), geneLoci.getEnd(), geneLoci.getContig(),
                        geneLoci.getStrand(), geneLoci.getDescription()))
                .toList();

        return new PagedSearchResponse(searchResponses, results.getTotalPages());
    }

    // Pagination for search by region
    public PagedSearchResponse searchGeneLociByRegion(String referenceGenome, String contig, Integer start, Integer end, Integer pageNumber) {
        Pageable pageable = PageRequest.of(pageNumber - 1, PAGE_SIZE);

        boolean searchAllGenomes = "All".equalsIgnoreCase(referenceGenome);

        Page<GeneLoci> results = searchAllGenomes
                ? geneLociRepository.findByRegion(contig, end, start, pageable)
                : geneLociRepository.findByReferenceGenomeAndRegion(referenceGenome, contig, end, start, pageable);

        List<SearchResponse> searchResponses = results.getContent().stream()
                .map(geneLoci -> new SearchResponse(
                        geneLoci.getGeneName(), geneLoci.getReferenceGenome(),
                        geneLoci.getStart(), geneLoci.getEnd(), geneLoci.getContig(),
                        geneLoci.getStrand(), geneLoci.getDescription()))
                .toList();

        return new PagedSearchResponse(searchResponses, results.getTotalPages());
    }

    // Pagination for search by trait
    public PagedSearchResponse searchGeneLociByTrait(String referenceGenome, String traitName, Integer pageNumber) {
        Pageable pageable = PageRequest.of(pageNumber - 1, PAGE_SIZE);

        boolean searchAllGenomes = "All".equalsIgnoreCase(referenceGenome);

        Trait trait  = traitRepository.findGeneIdsByTraitName(traitName);
        List<String> geneIds =  trait.getGeneIds();

        System.out.println("Trait object: " + trait);
        System.out.println("Gene IDs: " + geneIds);


        Page<GeneLoci> results = searchAllGenomes
                ? geneLociRepository.findGeneByIds(geneIds, pageable)
                : geneLociRepository.findGeneByIdsWithReferenceGenome(geneIds, referenceGenome, pageable);



        List<SearchResponse> searchResponses = results.getContent().stream()
                .map(geneLoci -> new SearchResponse(
                        geneLoci.getGeneName(), geneLoci.getReferenceGenome(),
                        geneLoci.getStart(), geneLoci.getEnd(), geneLoci.getContig(),
                        geneLoci.getStrand(), geneLoci.getDescription()))
                .toList();

        return new PagedSearchResponse(searchResponses, results.getTotalPages());
    }

    // Get trait names by category
    public List<Trait> getTraitNamesByCategory(String category) {
        return traitRepository.findTraitsByCategory(category);
    }

    // Check if the gene loci exist
    public Map<String, Object> checkItemsExistence(List<String> items) {
        // Get all geneloci that match the given items
        List<GeneLoci> foundGeneLoci = geneLociRepository.findByGeneNameIn(items);


        // Create a set of all the items provided for comparison
        Set<String> allRequestedItems = new HashSet<>(items);

        Set<String> existingItems = new HashSet<>();

        for(GeneLoci geneLoci: foundGeneLoci){
            existingItems.add(geneLoci.getGeneName().toUpperCase());
        }

        Set<String> nonExistingItems = new HashSet<>(allRequestedItems);
        nonExistingItems.removeAll(existingItems);

        if (nonExistingItems.isEmpty()) {
            return Map.of("existing", foundGeneLoci, "nonExisting", Collections.emptyList());
        } else {
            return Map.of("existing", foundGeneLoci, "nonExisting", nonExistingItems);
        }
    }


    public List<GeneLoci> getGenesByIds(List<String> items) {
        return geneLociRepository.findGeneByIds(items);
    }

    public List<String> getGeneNamesByIds(List<String> items) {
        // Fetch GeneLoci objects by their IDs
        List<GeneLoci> geneLociList = geneLociRepository.findGeneByIds(items);

        // Extract gene names using stream and map
        return geneLociList.stream()
                .map(GeneLoci::getGeneName)  // Extract the 'geneName' from each GeneLoci object
                .collect(Collectors.toList());  // Collect into a list of Strings
    }



    public List<Map<String, Object>> getContigStartEndOfGene(String geneName){
        List<Map<String, Object>> result = geneLociRepository.getContigStartEndOfGene(geneName);

        return result;

    }

    public Map<String, List<Object>> getContigsStartsEndsOfGenesById(List<String> ids) {
        List<Map<String, Object>> results = geneLociRepository.getContigsStartsEndsOfGenesById(ids);

        //  output lists
        List<String> contigs = new ArrayList<>();
        List<Integer> starts = new ArrayList<>();
        List<Integer> ends = new ArrayList<>();

        // lookup map from ID to data
        Map<String, Map<String, Object>> geneMap = results.stream()
                .collect(Collectors.toMap(
                        gene -> {
                            Object idObj = gene.get("_id"); // Use _id as key
                            return idObj.toString();
                        },
                        gene -> gene
                ));

        // Preserve order based on input IDs
        for (String id : ids) {
            Map<String, Object> geneData = geneMap.get(id);
            if (geneData != null) {
                contigs.add((String) geneData.get("contig"));
                starts.add((Integer) geneData.get("start"));
                ends.add((Integer) geneData.get("end"));
            }
        }

        // Return structured response
        Map<String, List<Object>> orderedResult = new HashMap<>();
        orderedResult.put("contigs", new ArrayList<>(contigs));
        orderedResult.put("starts", new ArrayList<>(starts));
        orderedResult.put("ends", new ArrayList<>(ends));
        return orderedResult;
    }

    public List<String> getAllReferenceGenomes() {
        return utilRepository.findAllReferenceGenomes()
                .stream()
                .flatMap(util -> util.getReferenceGenomes().stream()) // Flatten the list of lists
                .distinct()
                .collect(Collectors.toList());
    }


}
