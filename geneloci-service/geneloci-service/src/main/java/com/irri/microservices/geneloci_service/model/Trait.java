package com.irri.microservices.geneloci_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(value = "traits")
public class Trait {
    @Id
    private String id;
    private String category;
    private String traitName;
    private String description;
    private List<String> geneIds;

    public Trait(String category, String traitName, String description, List<String> geneIds) {
        this.category = category;
        this.traitName = traitName;
        this.description = description;
        this.geneIds = geneIds;
    }

    //Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTraitName() {
        return traitName;
    }

    public void setTraitName(String traitName) {
        this.traitName = traitName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getGeneIds() {
        return geneIds;
    }

    public void setGeneIds(List<String> geneIds) {
        this.geneIds = geneIds;
    }
}



