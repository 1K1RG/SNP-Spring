package com.irri.microservices.geneloci_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(value = "utils")
public class Util {
    @Id
    private String id;
    private List<String> referenceGenomes;

    public Util(List<String> referenceGenomes){
        this.referenceGenomes = referenceGenomes;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<String> getReferenceGenomes() {
        return referenceGenomes;
    }

    public void setReferenceGenomes(List<String> referenceGenomes) {
        this.referenceGenomes = referenceGenomes;
    }
}
