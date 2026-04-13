package com.museuaberto.controller;

import com.museuaberto.model.ArtworkDTO;
import com.museuaberto.model.CollectionDTO;
import com.museuaberto.service.CollectionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
@Slf4j
public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ResponseEntity<List<CollectionDTO>> getCollections(HttpServletRequest request) {
        String sessionId = getOrCreateSessionId(request);
        List<CollectionDTO> collections = collectionService.getCollectionsBySession(sessionId);
        return ResponseEntity.ok(collections);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CollectionDTO> getCollection(
            @PathVariable Long id,
            HttpServletRequest request) {

        String sessionId = getOrCreateSessionId(request);
        return collectionService.getCollectionById(id, sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CollectionDTO> createCollection(
            @Valid @RequestBody CollectionDTO dto,
            HttpServletRequest request) {

        String sessionId = getOrCreateSessionId(request);
        CollectionDTO created = collectionService.createCollection(dto, sessionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CollectionDTO> updateCollection(
            @PathVariable Long id,
            @Valid @RequestBody CollectionDTO dto,
            HttpServletRequest request) {

        String sessionId = getOrCreateSessionId(request);
        return collectionService.updateCollection(id, dto, sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(
            @PathVariable Long id,
            HttpServletRequest request) {

        String sessionId = getOrCreateSessionId(request);
        boolean deleted = collectionService.deleteCollection(id, sessionId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/artworks/{artworkId}")
    public ResponseEntity<CollectionDTO> addArtworkToCollection(
            @PathVariable Long id,
            @PathVariable Long artworkId,
            HttpServletRequest request) {

        String sessionId = getOrCreateSessionId(request);
        return collectionService.addArtworkToCollection(id, artworkId, sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/artworks/{artworkId}")
    public ResponseEntity<CollectionDTO> removeArtworkFromCollection(
            @PathVariable Long id,
            @PathVariable Long artworkId,
            HttpServletRequest request) {

        String sessionId = getOrCreateSessionId(request);
        return collectionService.removeArtworkFromCollection(id, artworkId, sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/artworks")
    public ResponseEntity<List<ArtworkDTO>> getArtworksInCollection(
            @PathVariable Long id,
            HttpServletRequest request) {

        String sessionId = getOrCreateSessionId(request);
        List<ArtworkDTO> artworks = collectionService.getArtworksInCollection(id, sessionId);
        return ResponseEntity.ok(artworks);
    }

    @GetMapping("/artwork/{artworkId}")
    public ResponseEntity<List<CollectionDTO>> getCollectionsForArtwork(
            @PathVariable Long artworkId,
            HttpServletRequest request) {

        String sessionId = getOrCreateSessionId(request);
        List<CollectionDTO> collections = collectionService.getCollectionsContainingArtwork(artworkId, sessionId);
        return ResponseEntity.ok(collections);
    }

    @GetMapping("/session")
    public ResponseEntity<Map<String, String>> getSessionId(HttpServletRequest request) {
        String sessionId = getOrCreateSessionId(request);
        return ResponseEntity.ok(Map.of("sessionId", sessionId));
    }

    private String getOrCreateSessionId(HttpServletRequest request) {
        // Check for session ID in header (from Angular frontend)
        String headerSessionId = request.getHeader("X-Session-Id");
        if (headerSessionId != null && !headerSessionId.isEmpty()) {
            return headerSessionId;
        }

        // Fall back to HTTP session
        HttpSession session = request.getSession(true);
        return session.getId();
    }
}
