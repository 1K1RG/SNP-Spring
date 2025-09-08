package com.irri.microservices.geneloci_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(value = "geneLoci")
public class GeneLoci {
    @Id
    private String id;
    private String geneName;
    private String referenceGenome;
    private Integer start;
    private Integer end;
    private String contig;
    private String strand;
    private String description;


    // Constructor
    public GeneLoci(String geneName, String referenceGenome, Integer start, Integer end, String contig, String strand, String description) {
        this.geneName = geneName;
        this.referenceGenome = referenceGenome;
        this.start = start;
        this.end = end;
        this.contig = contig;
        this.strand = strand;
        this.description = description;
    }

    //Getters and Setters
    public String getGeneName() {
        return geneName;
    }

    public void setGeneName(String geneName) {
        this.geneName = geneName;
    }

    public String getReferenceGenome() {
        return referenceGenome;
    }

    public void setReferenceGenome(String referenceGenome) {
        this.referenceGenome = referenceGenome;
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

    public String getContig() {
        return contig;
    }

    public void setContig(String contig) {
        this.contig = contig;
    }

    public String getStrand() {
        return strand;
    }

    public void setStrand(String strand) {
        this.strand = strand;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

}
