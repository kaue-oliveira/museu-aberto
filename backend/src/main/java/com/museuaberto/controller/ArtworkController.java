package com.museuaberto.controller;

import com.museuaberto.model.ArtworkDTO;
import com.museuaberto.model.ArtworkPageResponse;
import com.museuaberto.model.WikipediaInfo;
import com.museuaberto.service.MetApiService;
import com.museuaberto.service.WikipediaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/artworks")
@RequiredArgsConstructor
@Slf4j
public class ArtworkController {

    private final MetApiService metApiService;
    private final WikipediaService wikipediaService;

    @GetMapping
    public ResponseEntity<ArtworkPageResponse> getArtworks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        log.debug("GET /artworks?page={}&limit={}", page, limit);
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(Math.max(1, limit), 50);

        ArtworkPageResponse response = metApiService.getArtworks(safePage, safeLimit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<ArtworkPageResponse> searchArtworks(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        log.debug("GET /artworks/search?q={}&page={}&limit={}", q, page, limit);
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(Math.max(1, limit), 50);

        ArtworkPageResponse response = metApiService.searchArtworks(q, safePage, safeLimit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArtworkDTO> getArtworkById(@PathVariable Long id) {
        log.debug("GET /artworks/{}", id);

        ArtworkDTO artwork = metApiService.getArtworkById(id);
        if (artwork == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(artwork);
    }

    @GetMapping("/{id}/wikipedia")
    public ResponseEntity<WikipediaInfo> getArtworkWikipedia(@PathVariable Long id) {
        log.debug("GET /artworks/{}/wikipedia", id);

        ArtworkDTO artwork = metApiService.getArtworkById(id);
        if (artwork == null) {
            return ResponseEntity.notFound().build();
        }

        String context = String.join(" ",
                nullToEmpty(artwork.getArtworkTypeTitle()),
                nullToEmpty(artwork.getStyleTitle()),
                nullToEmpty(artwork.getDepartmentTitle()),
                nullToEmpty(artwork.getMediumDisplay())
        ).trim();

        WikipediaInfo info = wikipediaService.searchWikipediaWithContext(
                artwork.getTitle(),
                artwork.getArtistTitle(),
                context
        );
        return ResponseEntity.ok(info);
    }

    private String nullToEmpty(String v) {
        return v == null ? "" : v;
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<ArtworkPageResponse> getArtworksByDepartment(
            @PathVariable String department,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        log.debug("GET /artworks/department/{}?page={}&limit={}", department, page, limit);
        // MET API doesn't support department browsing in the same way; emulate with a search.
        String query = department == null ? "" : department;
        ArtworkPageResponse response = metApiService.searchArtworks(query, page, limit);
        return ResponseEntity.ok(response);
    }
}
