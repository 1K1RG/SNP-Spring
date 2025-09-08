package com.irri.microservices.list.service;

import com.irri.microservices.list.dto.CreateListRequest;
import com.irri.microservices.list.dto.MyListResponse;
import com.irri.microservices.list.dto.UpdateListRequest;
import com.irri.microservices.list.model.MyList;
import com.irri.microservices.list.repository.MyListRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class MyListService {
    private static final int PAGE_SIZE = 10; // Global page size


    private final MyListRepository myListRepository;

    public MyListService(MyListRepository myListRepository) {
        this.myListRepository = myListRepository;
    }

    public void deleteListByName(String name, String userId) {
        myListRepository.deleteByName(name, userId);
    }

    public MyListResponse getListsByUser(String userId) {
        List<MyList> allLists = myListRepository.findByUserIdAndTypes(userId);

        // Filter lists by type and group them
        List<MyList> varietyList = allLists.stream()
                .filter(list -> "variety".equals(list.getType()))
                .toList();
        List<MyList> snpList = allLists.stream()
                .filter(list -> "snp".equals(list.getType()))
                .toList();

        List<MyList> locusList = allLists.stream()
                .filter(list -> "locus".equals(list.getType()))
                .toList();

        return new MyListResponse(varietyList, snpList, locusList);
    }

    // Create a new list
    public ResponseEntity<String> createList(CreateListRequest createListRequest) {
        MyList myList = new MyList(createListRequest.name(), createListRequest.description(), createListRequest.varietySet(), createListRequest.snpSet(), createListRequest.userId(), createListRequest.type(), createListRequest.content());
        myListRepository.save(myList);
        return ResponseEntity.ok("List created successfully!");
    }

    // Update a list
    public ResponseEntity<String> updateList(UpdateListRequest updateListRequest) {
        Optional<MyList> existingList = myListRepository.findById(updateListRequest.id());

        if (existingList.isPresent()) {
            MyList myList = existingList.get();
            myList.setName(updateListRequest.name());
            myList.setDescription(updateListRequest.description());
            myList.setVarietySet(updateListRequest.varietySet());
            myList.setSnpSet(updateListRequest.snpSet());
            myList.setUserId(updateListRequest.userId());
            myList.setType(updateListRequest.type());
            myList.setContent(updateListRequest.content());

            myListRepository.save(myList);
            return ResponseEntity.ok("List updated successfully!");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("List not found!");
        }
    }

    // Delete a list
    public ResponseEntity<String> deleteList(String id) {
        // Check if the list exists
        if (!myListRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("List not found!");
        }
        // Delete the list
        myListRepository.deleteById(id);

        // Verify deletion by checking if it still exists
        if (myListRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete list!");
        }
        // Return success response
        return ResponseEntity.ok("List deleted successfully!");

    }

    // Count the number of lists for a user
    public long countUserLists(String userId) {
        return myListRepository.countByUserId(userId);
    }

    // Get the content of a list by ID with pagination
    public Map<String, Object> getContent(String id, Integer pageNumber){

        Optional<MyList> myList = myListRepository.findByIdWithContent(id);
        // Check if the list exists
        if (!myList.isPresent()) {
            throw new RuntimeException("List with id " + id + " not found.");
        }

        List<String> contentList = myList.get().getContent();

        // Set up pagination
        int fromIndex = pageNumber * PAGE_SIZE;
        int toIndex = Math.min(fromIndex + PAGE_SIZE, contentList.size());

        List<String> paginatedContent = contentList.subList(fromIndex, toIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("content", paginatedContent);
        response.put("totalPages", (int) Math.ceil((double) contentList.size() / PAGE_SIZE));

        return response;

    }
    // Get all content of a list by ID
    public List<String> getAllContent(String id){

        Optional<MyList> myList = myListRepository.findByIdWithContent(id);
        // Check if the list exists
        if (!myList.isPresent()) {
            throw new RuntimeException("List with id " + id + " not found.");
        }

        return myList.get().getContent();

    }


}
