package com.museuaberto.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.museuaberto.model.WikipediaInfo;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WikipediaService {

    private final RestTemplate restTemplate;

    @Value("${wikipedia.api.base-url}")
    private String baseUrl;

    @Cacheable(value = "wikipedia", key = "#title + '-' + #artist")
    public WikipediaInfo searchWikipedia(String title, String artist) {
        log.debug("Searching Wikipedia for: title={}, artist={}", title, artist);

        String safeTitle = title == null ? "" : title.trim();
        String safeArtist = artist == null ? "" : artist.trim();

        // Try searching for the artwork title first
        WikipediaInfo result = fetchWikipediaSummary(safeTitle);

        // If not found, try with artist name
        if (!result.isFound() && !safeArtist.isEmpty()) {
            result = fetchWikipediaSummary(safeArtist);
        }

        // If still not found, try combined search (or title-only fallback when artist is missing)
        if (!result.isFound() && !safeArtist.isEmpty()) {
            result = searchWikipediaFallback(safeTitle, safeArtist);
        } else if (!result.isFound()) {
            result = searchWikipediaFallbackTitleOnly(safeTitle);
        }

        return result;
    }

    @Cacheable(value = "wikipedia", key = "#title + '-' + #artist + '-' + #context")
    public WikipediaInfo searchWikipediaWithContext(String title, String artist, String context) {
        String safeTitle = title == null ? "" : title.trim();
        String safeArtist = artist == null ? "" : artist.trim();
        String safeContext = context == null ? "" : context.trim();

        // 1) Try exact title summary first.
        WikipediaInfo result = fetchWikipediaSummary(safeTitle);

        // 2) If it fails, search with additional context (type/period/department) to bias results away from people/places.
        if (!result.isFound() && !safeContext.isEmpty()) {
            result = searchByQuery(safeTitle + " " + safeContext + " artwork");
        }

        // 3) If we have an artist, try artist page and combined fallback.
        if (!result.isFound() && !safeArtist.isEmpty()) {
            result = fetchWikipediaSummary(safeArtist);
        }
        if (!result.isFound() && !safeArtist.isEmpty()) {
            result = searchWikipediaFallback(safeTitle, safeArtist);
        }

        // 4) Last resort: title-only fallback.
        if (!result.isFound()) {
            result = searchWikipediaFallbackTitleOnly(safeTitle);
        }

        return result;
    }

    private WikipediaInfo fetchWikipediaSummary(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return buildNotFoundResponse();
        }

        try {
            // Try direct summary first
            return fetchPageSummary(searchTerm);
        } catch (Exception e) {
            log.debug("Wikipedia search failed for '{}': {}", searchTerm, e.getMessage());
            return buildNotFoundResponse();
        }
    }

    private WikipediaInfo fetchPageSummary(String pageTitle) {
        try {
            String encodedTitle = URLEncoder.encode(
                    pageTitle.replace(" ", "_"),
                    StandardCharsets.UTF_8
            );

            String url = baseUrl + "/page/summary/" + encodedTitle;
            WikipediaSummaryResponse response = restTemplate.getForObject(url, WikipediaSummaryResponse.class);

            if (response != null && response.getExtract() != null) {
                String thumbnailUrl = null;
                if (response.getThumbnail() != null) {
                    thumbnailUrl = response.getThumbnail().getSource();
                }

                String pageUrl = "https://en.wikipedia.org/wiki/" + encodedTitle;
                if (response.getContentUrls() != null && response.getContentUrls().getDesktop() != null) {
                    pageUrl = response.getContentUrls().getDesktop().getPage();
                }

                return WikipediaInfo.builder()
                        .title(response.getTitle())
                        .displayTitle(response.getDisplaytitle())
                        .extract(response.getExtract())
                        .pageUrl(pageUrl)
                        .thumbnailUrl(thumbnailUrl)
                        .description(response.getDescription())
                        .found(true)
                        .build();
            }
        } catch (HttpClientErrorException.NotFound e) {
            log.debug("Wikipedia page not found for: {}", pageTitle);
        } catch (Exception e) {
            log.debug("Error fetching Wikipedia summary for '{}': {}", pageTitle, e.getMessage());
        }

        return buildNotFoundResponse();
    }

    private WikipediaInfo searchWikipediaFallback(String title, String artist) {
        try {
            String query = title + " " + artist + " painting";
            String searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="
                    + URLEncoder.encode(query, StandardCharsets.UTF_8)
                    + "&format=json&srlimit=1";

            WikipediaSearchApiResponse response = restTemplate.getForObject(searchUrl, WikipediaSearchApiResponse.class);

            if (response != null && response.getQuery() != null
                    && response.getQuery().getSearch() != null
                    && !response.getQuery().getSearch().isEmpty()) {

                String pageTitle = response.getQuery().getSearch().get(0).getTitle();
                return fetchPageSummary(pageTitle);
            }
        } catch (Exception e) {
            log.debug("Wikipedia fallback search failed: {}", e.getMessage());
        }

        return buildNotFoundResponse();
    }

    private WikipediaInfo searchWikipediaFallbackTitleOnly(String title) {
        if (title == null || title.trim().isEmpty()) {
            return buildNotFoundResponse();
        }

        // When we don't have an artist (common in the MET), search for the object title as an artwork/object.
        // This often returns a relevant subject page even if the piece itself doesn't have a dedicated article.
        String[] queries = new String[] {
                title + " artwork",
                title + " sculpture",
                title + " painting",
                title + " museum object"
        };

        for (String q : queries) {
            WikipediaInfo info = searchByQuery(q);
            if (info.isFound()) return info;
        }

        return buildNotFoundResponse();
    }

    private WikipediaInfo searchByQuery(String query) {
        try {
            String searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="
                    + URLEncoder.encode(query, StandardCharsets.UTF_8)
                    + "&format=json&srlimit=1";

            WikipediaSearchApiResponse response = restTemplate.getForObject(searchUrl, WikipediaSearchApiResponse.class);
            if (response != null && response.getQuery() != null
                    && response.getQuery().getSearch() != null
                    && !response.getQuery().getSearch().isEmpty()) {
                String pageTitle = response.getQuery().getSearch().get(0).getTitle();
                return fetchPageSummary(pageTitle);
            }
        } catch (Exception e) {
            log.debug("Wikipedia query search failed (q='{}'): {}", query, e.getMessage());
        }

        return buildNotFoundResponse();
    }

    private WikipediaInfo buildNotFoundResponse() {
        return WikipediaInfo.builder()
                .found(false)
                .build();
    }

    // Response classes
    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WikipediaSummaryResponse {
        private String title;
        private String displaytitle;
        private String extract;
        private String description;
        private ThumbnailInfo thumbnail;

        @JsonProperty("content_urls")
        private ContentUrls contentUrls;

        @Data
        @NoArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ThumbnailInfo {
            private String source;
            private Integer width;
            private Integer height;
        }

        @Data
        @NoArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ContentUrls {
            private DesktopUrls desktop;

            @Data
            @NoArgsConstructor
            @JsonIgnoreProperties(ignoreUnknown = true)
            public static class DesktopUrls {
                private String page;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WikipediaSearchApiResponse {
        private QueryResult query;

        @Data
        @NoArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class QueryResult {
            private List<SearchResult> search;

            @Data
            @NoArgsConstructor
            @JsonIgnoreProperties(ignoreUnknown = true)
            public static class SearchResult {
                private String title;
                private String snippet;
            }
        }
    }
}
