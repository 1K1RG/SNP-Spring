package com.irri.mircroservices.variety.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(value = "varieties")
public class Variety {
    @Id
    private String id;
    private String name;
    private String irisId;
    private String accession;
    private String subpopulation;
    private String country;
    private String snpSet;
    private String varietySet;

    public Variety(String name, String irisId, String accession, String subpopulation, String country, String snpSet, String varietySet) {
        this.name = name;
        this.irisId = irisId;
        this.accession = accession;
        this.subpopulation = subpopulation;
        this.country = country;
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

    public String getIrisId() {
        return irisId;
    }

    public void setIrisId(String irisId) {
        this.irisId = irisId;
    }

    public String getAccession() {
        return accession;
    }

    public void setAccession(String accession) {
        this.accession = accession;
    }

    public String getSubpopulation() {
        return subpopulation;
    }

    public void setSubpopulation(String subpopulation) {
        this.subpopulation = subpopulation;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
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
