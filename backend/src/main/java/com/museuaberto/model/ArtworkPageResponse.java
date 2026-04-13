package com.museuaberto.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtworkPageResponse {

    private List<ArtworkDTO> artworks;
    private int currentPage;
    private int totalPages;
    private long totalItems;
    private int itemsPerPage;
    private boolean hasNext;
    private boolean hasPrevious;
}
