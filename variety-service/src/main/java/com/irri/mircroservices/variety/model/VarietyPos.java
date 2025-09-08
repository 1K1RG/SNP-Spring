package com.irri.mircroservices.variety.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Document(value = "varietiesPos")
public class VarietyPos {
    @Id
    private String id;
    private String contig;
    private Integer start;
    private Integer end;
    private Map<Integer, String> positions;
    private String referenceId;

    // Constructor
    public VarietyPos(String contig, Integer start, Integer end, Map<Integer, String> positions, String referenceId) {
        this.contig = contig;
        this.start = start;
        this.end = end;
        this.positions = positions;
        this.referenceId = referenceId;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContig() {
        return contig;
    }

    public void setContig(String contig) {
        this.contig = contig;
    }

    public Integer getStart() {
        return start;
    }

    public void setStart(Integer start) {
        this.start = start;
    }

    public Integer getEnd() {
        return end;
    }

    public void setEnd(Integer end) {
        this.end = end;
    }

    public Map<Integer, String> getPositions() {
        return positions;
    }

    public void setPositions(Map<Integer, String> positions) {
        this.positions = positions;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }
}
