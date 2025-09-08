package com.irri.microservices.list.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(value = "lists")
public class MyList {
    @Id
    private String id;
    private String name;
    private String description;
    private String varietySet;
    private String snpSet;
    private String userId;
    private String type;
    private List<String> content;

    public MyList(String name, String description, String varietySet, String snpSet, String userId, String type, List<String> content) {
        this.name = name;
        this.description = description;
        this.varietySet = varietySet;
        this.snpSet = snpSet;
        this.userId = userId;
        this.type = type;
        this.content = content;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVarietySet() {
        return varietySet;
    }

    public void setVarietySet(String varietySet) {
        this.varietySet = varietySet;
    }

    public String getSnpSet() {
        return snpSet;
    }

    public void setSnpSet(String snpSet) {
        this.snpSet = snpSet;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<String> getContent() {
        return content;
    }

    public void setContent(List<String> content) {
        this.content = content;
    }



}

