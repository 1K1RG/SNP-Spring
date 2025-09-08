package com.irri.microservices.list.repository;

import com.irri.microservices.list.model.MyList;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MyListRepository extends MongoRepository<MyList, String> {
    //Delete list by name and user id
    @Query("{ 'name' : ?0, 'userId' : ?1 }")
    void deleteByName(String name, String userId);

    //Find list by type and user id
    @Query(value = "{ 'type' : { $in: ['variety', 'snp', 'locus'] }, 'userId' : ?0 }", fields = "{ 'content' : 0 }")
    List<MyList> findByUserIdAndTypes(String userId);

    //Get the content of the list by id
    @Query(value = "{ '_id' : ?0 }", fields = "{ 'content' : 1, '_id' : 0 }")
    Optional<MyList> findByIdWithContent(String id);

    //Get the count of lists by user id
    @Query(value = "{ 'userId' : ?0 }", count = true)
    long countByUserId(String userId);
}
