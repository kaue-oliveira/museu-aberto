package com.museuaberto.service;

import com.museuaberto.model.ArtworkDTO;
import com.museuaberto.model.Collection;
import com.museuaberto.model.CollectionDTO;
import com.museuaberto.repository.CollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final ArticApiService articApiService;

    public List<CollectionDTO> getCollectionsBySession(String sessionId) {
        return collectionRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<CollectionDTO> getCollectionById(Long id, String sessionId) {
        return collectionRepository.findByIdAndSessionId(id, sessionId)
                .map(this::toDTO);
    }

    public CollectionDTO createCollection(CollectionDTO dto, String sessionId) {
        Collection collection = Collection.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .sessionId(sessionId)
                .build();

        Collection saved = collectionRepository.save(collection);
        log.info("Created collection '{}' for session {}", saved.getName(), sessionId);
        return toDTO(saved);
    }

    public Optional<CollectionDTO> updateCollection(Long id, CollectionDTO dto, String sessionId) {
        return collectionRepository.findByIdAndSessionId(id, sessionId)
                .map(collection -> {
                    collection.setName(dto.getName());
                    collection.setDescription(dto.getDescription());
                    Collection saved = collectionRepository.save(collection);
                    log.info("Updated collection {} for session {}", id, sessionId);
                    return toDTO(saved);
                });
    }

    public boolean deleteCollection(Long id, String sessionId) {
        Optional<Collection> collection = collectionRepository.findByIdAndSessionId(id, sessionId);
        if (collection.isPresent()) {
            collectionRepository.delete(collection.get());
            log.info("Deleted collection {} for session {}", id, sessionId);
            return true;
        }
        return false;
    }

    public Optional<CollectionDTO> addArtworkToCollection(Long collectionId, Long artworkId, String sessionId) {
        return collectionRepository.findByIdAndSessionId(collectionId, sessionId)
                .map(collection -> {
                    if (!collection.getArtworkIds().contains(artworkId)) {
                        collection.getArtworkIds().add(artworkId);
                        collectionRepository.save(collection);
                        log.info("Added artwork {} to collection {} for session {}", artworkId, collectionId, sessionId);
                    }
                    return toDTO(collection);
                });
    }

    public Optional<CollectionDTO> removeArtworkFromCollection(Long collectionId, Long artworkId, String sessionId) {
        return collectionRepository.findByIdAndSessionId(collectionId, sessionId)
                .map(collection -> {
                    collection.getArtworkIds().remove(artworkId);
                    collectionRepository.save(collection);
                    log.info("Removed artwork {} from collection {} for session {}", artworkId, collectionId, sessionId);
                    return toDTO(collection);
                });
    }

    public List<ArtworkDTO> getArtworksInCollection(Long collectionId, String sessionId) {
        return collectionRepository.findByIdAndSessionId(collectionId, sessionId)
                .map(collection -> {
                    if (collection.getArtworkIds().isEmpty()) {
                        return List.<ArtworkDTO>of();
                    }
                    return articApiService.getArtworksByIds(collection.getArtworkIds());
                })
                .orElse(List.of());
    }

    public List<CollectionDTO> getCollectionsContainingArtwork(Long artworkId, String sessionId) {
        return collectionRepository.findBySessionIdAndArtworkId(sessionId, artworkId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private CollectionDTO toDTO(Collection collection) {
        return CollectionDTO.builder()
                .id(collection.getId())
                .name(collection.getName())
                .description(collection.getDescription())
                .sessionId(collection.getSessionId())
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .artworkIds(collection.getArtworkIds())
                .artworkCount(collection.getArtworkIds().size())
                .build();
    }
}
