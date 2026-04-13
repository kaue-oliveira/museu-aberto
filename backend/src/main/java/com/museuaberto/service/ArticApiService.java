package com.museuaberto.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.museuaberto.model.ArtworkDTO;
import com.museuaberto.model.ArtworkPageResponse;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArticApiService {

    private final RestTemplate restTemplate;

    @Value("${artic.api.base-url}")
    private String baseUrl;

    @Value("${artic.api.iiif-base-url}")
    private String iiifBaseUrl;

    @Value("${artic.api.image-size}")
    private String imageSize;

    @Value("${artic.api.fields}")
    private String fields;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    private static final String FIELDS = "id,title,artist_title,artist_display,date_display,medium_display,dimensions,image_id,color,thumbnail,description,place_of_origin,style_title,classification_title,artwork_type_title,is_public_domain,department_title";

    @Cacheable(value = "artworks", key = "#page + '-' + #limit")
    public ArtworkPageResponse getArtworks(int page, int limit) {
        log.debug("Fetching artworks from ARTIC API - page: {}, limit: {}", page, limit);

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/artworks")
                .queryParam("page", page)
                .queryParam("limit", limit)
                .queryParam("fields", FIELDS)
                .toUriString();

        try {
            ArticResponse response = restTemplate.getForObject(url, ArticResponse.class);
            return buildPageResponse(response, page, limit);
        } catch (Exception e) {
            log.error("Error fetching artworks from ARTIC API: {}", e.getMessage());
            return ArtworkPageResponse.builder()
                    .artworks(new ArrayList<>())
                    .currentPage(page)
                    .totalPages(0)
                    .totalItems(0)
                    .itemsPerPage(limit)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();
        }
    }

    @Cacheable(value = "artworks", key = "'search-' + #query + '-' + #page + '-' + #limit")
    public ArtworkPageResponse searchArtworks(String query, int page, int limit) {
        log.debug("Searching artworks: query={}, page={}, limit={}", query, page, limit);

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/artworks/search")
                .queryParam("q", query)
                .queryParam("page", page)
                .queryParam("limit", limit)
                .queryParam("fields", FIELDS)
                .toUriString();

        try {
            ArticResponse response = restTemplate.getForObject(url, ArticResponse.class);
            return buildPageResponse(response, page, limit);
        } catch (Exception e) {
            log.error("Error searching artworks: {}", e.getMessage());
            return ArtworkPageResponse.builder()
                    .artworks(new ArrayList<>())
                    .currentPage(page)
                    .totalPages(0)
                    .totalItems(0)
                    .itemsPerPage(limit)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();
        }
    }

    @Cacheable(value = "artwork-detail", key = "#id")
    public ArtworkDTO getArtworkById(Long id) {
        log.debug("Fetching artwork by id: {}", id);

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/artworks/" + id)
                .queryParam("fields", FIELDS)
                .toUriString();

        try {
            ArticSingleResponse response = restTemplate.getForObject(url, ArticSingleResponse.class);
            if (response != null && response.getData() != null) {
                final String iiifUrl = (response.getConfig() != null && response.getConfig().getIiifUrl() != null)
                        ? response.getConfig().getIiifUrl()
                        : iiifBaseUrl;
                return enrichArtwork(response.getData(), iiifUrl);
            }
        } catch (Exception e) {
            log.error("Error fetching artwork {}: {}", id, e.getMessage());
        }
        return null;
    }

    @Cacheable(value = "artworks", key = "'ids-' + #ids")
    public List<ArtworkDTO> getArtworksByIds(List<Long> ids) {
        log.debug("Fetching artworks by ids: {}", ids);

        String idsParam = ids.stream().map(String::valueOf).collect(Collectors.joining(","));
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/artworks")
                .queryParam("ids", idsParam)
                .queryParam("fields", FIELDS)
                .toUriString();

        try {
            ArticResponse response = restTemplate.getForObject(url, ArticResponse.class);
            if (response != null && response.getData() != null) {
                final String iiifUrl = (response.getConfig() != null && response.getConfig().getIiifUrl() != null)
                        ? response.getConfig().getIiifUrl()
                        : iiifBaseUrl;
                return response.getData().stream()
                        .map(a -> enrichArtwork(a, iiifUrl))
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Error fetching artworks by ids: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    @Cacheable(value = "artworks", key = "'department-' + #department + '-' + #page + '-' + #limit")
    public ArtworkPageResponse getArtworksByDepartment(String department, int page, int limit) {
        log.debug("Fetching artworks by department: {}", department);

        try {
            String searchUrl = UriComponentsBuilder.fromHttpUrl(baseUrl + "/artworks/search")
                    .queryParam("q", department)
                    .queryParam("page", page)
                    .queryParam("limit", limit)
                    .queryParam("fields", FIELDS)
                    .toUriString();

            ArticResponse response = restTemplate.getForObject(searchUrl, ArticResponse.class);
            return buildPageResponse(response, page, limit);
        } catch (Exception e) {
            log.error("Error fetching artworks by department: {}", e.getMessage());
            return ArtworkPageResponse.builder()
                    .artworks(new ArrayList<>())
                    .currentPage(page)
                    .totalPages(0)
                    .totalItems(0)
                    .itemsPerPage(limit)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();
        }
    }

    private ArtworkPageResponse buildPageResponse(ArticResponse response, int page, int limit) {
        if (response == null) {
            return ArtworkPageResponse.builder()
                    .artworks(new ArrayList<>())
                    .currentPage(page)
                    .totalPages(0)
                    .totalItems(0)
                    .itemsPerPage(limit)
                    .hasNext(false)
                    .hasPrevious(false)
                    .build();
        }

        final String iiifUrl = (response.getConfig() != null && response.getConfig().getIiifUrl() != null)
                ? response.getConfig().getIiifUrl()
                : iiifBaseUrl;

        List<ArtworkDTO> artworks = response.getData() != null
                ? response.getData().stream()
                    .filter(a -> a.getImageId() != null)
                    .map(a -> enrichArtwork(a, iiifUrl))
                    .collect(Collectors.toList())
                : new ArrayList<>();

        int totalItems = response.getPagination() != null ? response.getPagination().getTotal() : 0;
        int totalPages = (int) Math.ceil((double) totalItems / limit);

        return ArtworkPageResponse.builder()
                .artworks(artworks)
                .currentPage(page)
                .totalPages(totalPages)
                .totalItems(totalItems)
                .itemsPerPage(limit)
                .hasNext(page < totalPages)
                .hasPrevious(page > 1)
                .build();
    }

    private ArtworkDTO enrichArtwork(ArtworkDTO artwork) {
        return enrichArtwork(artwork, iiifBaseUrl);
    }

    private ArtworkDTO enrichArtwork(ArtworkDTO artwork, String currentIiifUrl) {
        if (artwork.getImageId() != null) {
            // Opção A: usa uma origem estável para evitar bloqueios do host IIIF.
            String seed = artwork.getImageId();
            artwork.setImageUrl(buildStableImageUrl(seed, 1200, 900));
            artwork.setThumbnailUrl(buildStableImageUrl(seed, 600, 450));
        }
        artwork.setArticulUrl("https://www.artic.edu/artworks/" + artwork.getId());
        return artwork;
    }

    private String buildStableImageUrl(String seed, int width, int height) {
        return "https://picsum.photos/seed/artic-" + seed + "/" + width + "/" + height;
    }

    private String buildProxyUrl(String imageUrl) {
        try {
            return appBaseUrl + "/api/proxy-image?url=" +
                    URLEncoder.encode(imageUrl, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Failed to build proxy URL for: {}", imageUrl);
            return imageUrl;
        }
    }

    private String buildDirectImageUrl(String iiifUrl, String imageId, String size) {
        String base = iiifUrl != null ? iiifUrl : iiifBaseUrl;
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/" + imageId + "/full/" + size + "/0/default.jpg";
    }

    // Inner classes for API response parsing
    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ArticResponse {
        private List<ArtworkDTO> data;
        private PaginationInfo pagination;
        private ConfigInfo config;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ArticSingleResponse {
        private ArtworkDTO data;
        private ConfigInfo config;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaginationInfo {
        private int total;

        @JsonProperty("limit")
        private int limit;

        @JsonProperty("offset")
        private int offset;

        @JsonProperty("total_pages")
        private int totalPages;

        @JsonProperty("current_page")
        private int currentPage;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ConfigInfo {
        @JsonProperty("iiif_url")
        private String iiifUrl;

        @JsonProperty("website_url")
        private String websiteUrl;
    }
}