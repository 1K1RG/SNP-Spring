package com.irri.microservices.geneloci_service.controller;

import com.irri.microservices.geneloci_service.dto.*;
import com.irri.microservices.geneloci_service.model.GeneLoci;
import com.irri.microservices.geneloci_service.model.Trait;
import com.irri.microservices.geneloci_service.service.GeneLociService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geneloci")
public class GeneLociController {
    private final GeneLociService geneLociService;

    public GeneLociController(GeneLociService geneLociService) {
        this.geneLociService = geneLociService;
    }

    @PostMapping("/searchByGeneName")
    @ResponseStatus(HttpStatus.OK)
    public PagedSearchResponse searchByGeneName(@RequestBody SearchByGeneNameRequest searchByGeneNameRequest) {
        return geneLociService.searchGeneLociByGeneName(searchByGeneNameRequest.searchMethod(), searchByGeneNameRequest.searchQuery(), searchByGeneNameRequest.referenceGenome(), searchByGeneNameRequest.pageNumber());
    }

    @PostMapping("/searchByRegion")
    @ResponseStatus(HttpStatus.OK)
    public PagedSearchResponse searchByRegion(@RequestBody SearchByRegionRequest searchByRegionRequest) {
        return geneLociService.searchGeneLociByRegion(searchByRegionRequest.referenceGenome(), searchByRegionRequest.contig(), searchByRegionRequest.start(), searchByRegionRequest.end(), searchByRegionRequest.pageNumber());
    }

    @PostMapping("/searchByAnnotation")
    @ResponseStatus(HttpStatus.OK)
    public PagedSearchResponse  searchByAnnotation(@RequestBody SearchByAnnotationRequest searchByAnnotationRequest) {
        return geneLociService.searchGeneLociByAnnotation(searchByAnnotationRequest.searchMethod(), searchByAnnotationRequest.searchQuery(), searchByAnnotationRequest.referenceGenome(), searchByAnnotationRequest.pageNumber());
    }

    @PostMapping("/searchByTrait")
    @ResponseStatus(HttpStatus.OK)
    public PagedSearchResponse searchByTrait(@RequestBody SearchByTraitRequest searchByTraitRequest) {
        return geneLociService.searchGeneLociByTrait(searchByTraitRequest.referenceGenome(), searchByTraitRequest.traitName(), searchByTraitRequest.pageNumber());
    }

    @PostMapping("/getTraitNames")
    @ResponseStatus(HttpStatus.OK)
    public List<String> getTraitNames(@RequestBody TraitRequest traitRequest) {
        return geneLociService.getTraitNamesByCategory(traitRequest.category())
                .stream()
                .map(Trait::getTraitName)
                .toList();
    }

    @PostMapping("general/checkItemsExistence")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> checkItemsExistence(@RequestBody ItemsRequest itemsRequest) {
        return geneLociService.checkItemsExistence(itemsRequest.items());
    }

    @PostMapping("/getGenesByIds")
    @ResponseStatus(HttpStatus.OK)
    public List<GeneLoci> getGenesByIds(@RequestBody ItemsRequest itemsRequest) {
        return geneLociService.getGenesByIds(itemsRequest.items());
    }


    @PostMapping("/getGeneNamesByIds")
    @ResponseStatus(HttpStatus.OK)
    public List<String> getGeneNamesByIds(@RequestBody ItemsRequest itemsRequest) {
        return geneLociService.getGeneNamesByIds(itemsRequest.items());
    }

    @PostMapping("/getContigStartEndOfGene")
    @ResponseStatus(HttpStatus.OK)
    public List<Map<String, Object>> getContigStartEndOfGene(@RequestBody ContigStartEndRequest contigStartEndRequest) {
        return geneLociService.getContigStartEndOfGene(contigStartEndRequest.geneName());
    }

    @PostMapping("general/getContigsStartsEndsOfGenesById")
    @ResponseStatus(HttpStatus.OK)
    public  Map<String, List<Object>> getContigsStartsEndsOfGenesById(@RequestBody ItemsRequest itemsRequest) {
        return geneLociService.getContigsStartsEndsOfGenesById(itemsRequest.items());
    }

    @PostMapping("general/generateExcel")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<byte[]> exportGeneLoci(@RequestBody ExportExcelRequest exportExcelRequest) throws IOException {

        byte[] excelBytes = geneLociService.generateExcel(exportExcelRequest);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=gene_loci.xlsx")
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelBytes);
    }

    @PostMapping("/getAllReferenceGenomes")
    @ResponseStatus(HttpStatus.OK)
    public List<String> getAllReferenceGenomes() {
        return geneLociService.getAllReferenceGenomes();
    }
}
