package com.irri.mircroservices.variety.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(value = "utils")
public class Util {
    @Id
    private String id;
    private String varietySet;
    private List<String> snpSets;
    private List<String> subpopulations;

    public Util(String varietySet, List<String> snpSets, List<String> subpopulations) {
        this.varietySet = varietySet;
        this.snpSets = snpSets;
        this.subpopulations = subpopulations;
    }

    //Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getVarietySet() {
        return varietySet;
    }

    public void setVarietySet(String varietySet) {
        this.varietySet = varietySet;
    }

    public List<String> getSnpSets() {
        return snpSets;
    }

    public void setSnpSets(List<String> snpSets) {
        this.snpSets = snpSets;
    }

    public List<String> getSubpopulations() {
        return subpopulations;
    }

    public void setSubpopulations(List<String> subpopulations) {
        this.subpopulations = subpopulations;
    }

    public void addSnpSet(String snpSet) {
        this.snpSets.add(snpSet);
    }

    public void addSubpopulation(String subpopulation) {
        this.subpopulations.add(subpopulation);
    }

    public void removeSnpSet(String snpSet) {
        this.snpSets.remove(snpSet);
    }

    public void removeSubpopulation(String subpopulation) {
        this.subpopulations.remove(subpopulation);
    }
}
