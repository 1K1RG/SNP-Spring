package com.irri.microservices.list.dto;

import com.irri.microservices.list.model.MyList;

import java.util.List;

public class MyListResponse {
    private final List<MyList> variety;
    private final List<MyList> snp;
    private final List<MyList> locus;

    public MyListResponse(List<MyList> variety, List<MyList> snp, List<MyList> locus) {
        this.variety = variety;
        this.snp = snp;
        this.locus = locus;
    }

    // Getters
    public List<MyList> getVariety() {
        return variety;
    }


    public List<MyList> getSnp() {
        return snp;
    }

    public List<MyList> getLocus() {
        return locus;
    }


}