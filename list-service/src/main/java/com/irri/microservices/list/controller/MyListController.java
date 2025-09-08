package com.irri.microservices.list.controller;


import com.irri.microservices.list.dto.*;
import com.irri.microservices.list.service.MyListService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/list")
public class MyListController {
    private final MyListService myListService;

    public MyListController(MyListService myListService) {
        this.myListService = myListService;
    }

    @PostMapping("/general/createList")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<String> createList(@RequestBody CreateListRequest createListRequest) {
        return myListService.createList(createListRequest);
    }


    @PostMapping("/general/deleteList")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<String> deleteList(@RequestBody DeleteRequest deleteRequest) {
        return myListService.deleteList(deleteRequest.id());
    }

    @PostMapping("/general/updateList")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<String> deleteList(@RequestBody UpdateListRequest updateListRequest) {
        return myListService.updateList(updateListRequest);
    }

    @PostMapping("/general/getList")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<MyListResponse> getList(@RequestBody GetListsRequest getListsRequest) {
        MyListResponse response = myListService.getListsByUser(getListsRequest.userId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/general/getListContent")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<Map<String, Object>> getListContent(@RequestBody GetContentRequest getContentRequest) {
        Map<String, Object> response = myListService.getContent(getContentRequest.id(), getContentRequest.pageNumber());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/general/getListAllContent")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<List<String>> getListAllContent(@RequestBody GetListAllContentRequest getListAllContentRequest) {
        List<String> response = myListService.getAllContent(getListAllContentRequest.id());
        return ResponseEntity.ok(response);
    }


    @PostMapping("/general/getMyListCount")
    @ResponseStatus(HttpStatus.OK)
    public long getMyListCount(@RequestBody GetListsRequest getListsRequest) {
        return myListService.countUserLists(getListsRequest.userId());
    }



}
