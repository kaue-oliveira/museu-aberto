package com.museuaberto.repository;

import com.museuaberto.model.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {

    List<Collection> findBySessionIdOrderByCreatedAtDesc(String sessionId);

    Optional<Collection> findByIdAndSessionId(Long id, String sessionId);

    @Query("SELECT c FROM Collection c WHERE c.sessionId = :sessionId AND :artworkId MEMBER OF c.artworkIds")
    List<Collection> findBySessionIdAndArtworkId(@Param("sessionId") String sessionId,
                                                  @Param("artworkId") Long artworkId);

    long countBySessionId(String sessionId);
}
