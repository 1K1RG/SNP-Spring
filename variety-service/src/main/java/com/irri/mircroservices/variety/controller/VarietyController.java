package com.irri.mircroservices.variety.controller;

import com.irri.mircroservices.variety.dto.*;
import com.irri.mircroservices.variety.model.Variety;
import com.irri.mircroservices.variety.service.VarietyService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/variety")
public class VarietyController {
    private final VarietyService varietyService;



    public VarietyController(VarietyService varietyService) {
        this.varietyService = varietyService;
    }

    @PostMapping("/getAllSnpSetAndVarietySet")
    @ResponseStatus(HttpStatus.OK)
    public List<UtilsResponse> getAllSnpSetAndVarietySet() {
        return varietyService.getAllSnpSetAndVarietySet();
    }

    @PostMapping("/general/checkItemsExistence")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> checkItemsExistence(@RequestBody ItemsRequest itemsRequest) {
        return varietyService.checkItemsExistence(itemsRequest.items(), itemsRequest.varietySet());
    }

    @PostMapping("/getVarietiesByIds")
    @ResponseStatus(HttpStatus.OK)
    public List<Variety> getVarietiesByIds(@RequestBody VarietiesRequest varietiesRequest) {
        return varietyService.getVarietiesByIds(varietiesRequest.ids());
    }

    @PostMapping("/getVarietyNamesByIds")
    @ResponseStatus(HttpStatus.OK)
    public List<String> getVarietyNamesByIds(@RequestBody VarietiesRequest varietiesRequest) {
        return varietyService.getVarietyNamesByIds(varietiesRequest.ids());
    }

    @PostMapping("/general/checkPositions")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, List<String>>checkPositions(@RequestBody PositionsRequest positionsRequest) {
        return varietyService.checkGenomicPositions(positionsRequest.chromosomePositions(),positionsRequest.referenceName(), positionsRequest.snpSet());
    }

    @PostMapping("/getAllReferenceGenomeNames")
    @ResponseStatus(HttpStatus.OK)
    public List<String> getAllReferenceGenomeNames() {
        return varietyService.getAllReferenceGenomeNames();
    }

    @PostMapping("/genotypeSearchRange")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<Map<String,Object>>  genotypeSearchRange(@RequestBody GenotypeSearchRequest genotypeSearchRequest) {
        Map<String,Object> response = varietyService.searchByGenotypeRange(genotypeSearchRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/general/genotypeSearchSnpList")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<Map<String, Object>>  genotypeSearchSnpList(@RequestBody GenotypeSearchRequest genotypeSearchRequest) {

        Map<String, Object> response = varietyService.searchByGenotypeSnpList(genotypeSearchRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/general/genotypeSearchLocusList")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<Map<String, Object>> genotypeSearchLocusList(@RequestBody GenotypeSearchLocusListRequest genotypeSearchLocusListRequest) {
        Map<String, Object> response = varietyService.searchByGenotypeLocusList(genotypeSearchLocusListRequest);
        return ResponseEntity.ok(response);

    }

    @PostMapping("general/generateExcel")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<byte[]> exportVariety(@RequestBody ExcelRequest excelRequest) throws IOException {

        byte[] excelBytes = varietyService.generateExcel(excelRequest.genotypeSearchRequest(), excelRequest.varietyListIds());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=genotype.xlsx")
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelBytes);
    }

    @PostMapping("general/generateExcelLocus")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<byte[]> exportVarietyLocus(@RequestBody ExcelLocusRequest excelLocusRequest) throws IOException {

        byte[] excelBytes = varietyService.generateExcel(excelLocusRequest.genotypeSearchLocusListRequest(), excelLocusRequest.varietyListIds());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=genotype.xlsx")
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelBytes);
    }

}
