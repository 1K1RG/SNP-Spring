package com.irri.mircroservices.variety.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(value = "referenceGenomes")
public class ReferenceGenome {
    @Id
    private String id;
    private String name;
    private String snpSet;
    private String varietySet;

    public ReferenceGenome(String name, String snpSet, String varietySet) {
        this.name = name;
        this.snpSet = snpSet;
        this.varietySet = varietySet;
    }

    //Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSnpSet() {
        return snpSet;
    }

    public void setSnpSet(String snpSet) {
        this.snpSet = snpSet;
    }

    public String getVarietySet() {
        return varietySet;
    }

    public void setVarietySet(String varietySet) {
        this.varietySet = varietySet;
    }
}
