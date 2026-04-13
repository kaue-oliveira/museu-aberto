package com.museuaberto.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.museuaberto.model.ArtworkDTO;
import com.museuaberto.model.ArtworkPageResponse;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetApiService {
    private static final String BASE_URL = "https://collectionapi.metmuseum.org/public/collection/v1";
    private static final int PAGE_SCAN_FACTOR = 5;

    private final RestTemplate restTemplate;

    @Cacheable(value = "search-results", key = "'met-search:' + #query", unless = "#result == null || #result.isEmpty()")
    public List<Long> searchObjectIds(String query) {
        String q = (query == null || query.trim().isEmpty()) ? "art" : query.trim();

        String url = UriComponentsBuilder
                .fromHttpUrl(BASE_URL + "/search")
                .queryParam("q", q)
                .queryParam("hasImages", true)
                .toUriString();

        try {
            MetSearchResponse response = restTemplate.getForObject(url, MetSearchResponse.class);
            if (response == null || response.getObjectIDs() == null) {
                return Collections.emptyList();
            }
            return response.getObjectIDs().stream()
                    .filter(Objects::nonNull)
                    .map(Long::valueOf)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("MET search failed (q='{}'): {}", q, e.getMessage());
            return Collections.emptyList();
        }
    }

    @Cacheable(
            value = "artworks",
            key = "'met-page:' + #page + '-' + #limit",
            unless = "#result == null || #result.getArtworks() == null || #result.getArtworks().isEmpty()"
    )
    public ArtworkPageResponse getArtworks(int page, int limit) {
        // MET doesn't have a true "browse" endpoint; we use a stable default query.
        return searchArtworks("art", page, limit);
    }

    public ArtworkPageResponse searchArtworks(String query, int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(Math.max(1, limit), 50);

        List<Long> allIds = searchObjectIds(query);
        // Embaralha a lista para garantir aleatoriedade a cada requisição
        Collections.shuffle(allIds);
        int totalItems = allIds.size();
        int scanWindowSize = safeLimit * PAGE_SCAN_FACTOR;
        int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / scanWindowSize);

        int windowFrom = Math.min((safePage - 1) * scanWindowSize, totalItems);
        int windowTo = Math.min(windowFrom + scanWindowSize, totalItems);
        List<Long> pageIds = windowFrom < windowTo ? allIds.subList(windowFrom, windowTo) : Collections.emptyList();

        // Scan within a wider, non-overlapping window to avoid empty pages and avoid duplicates across pages.
        List<ArtworkDTO> artworks = new ArrayList<>(safeLimit);
        for (Long id : pageIds) {
            if (artworks.size() >= safeLimit) break;
            ArtworkDTO a = getArtworkById(id);
            if (a != null && a.getImageUrl() != null && !a.getImageUrl().isBlank()) {
                artworks.add(a);
            }
        }

        return ArtworkPageResponse.builder()
                .artworks(artworks)
                .currentPage(safePage)
                .totalPages(totalPages)
                .totalItems(totalItems)
                .itemsPerPage(safeLimit)
                .hasNext(safePage < totalPages)
                .hasPrevious(safePage > 1)
                .build();
    }

    @Cacheable(value = "artwork-detail", key = "'met:' + #id")
    public ArtworkDTO getArtworkById(Long id) {
        if (id == null) return null;

        String url = BASE_URL + "/objects/" + id;
        try {
            MetObject object = restTemplate.getForObject(url, MetObject.class);
            if (object == null || object.getObjectID() == null) {
                return null;
            }
            return mapToArtwork(object);
        } catch (Exception e) {
            log.debug("MET object fetch failed (id={}): {}", id, e.getMessage());
            return null;
        }
    }

    private ArtworkDTO mapToArtwork(MetObject o) {
        ArtworkDTO dto = new ArtworkDTO();
        dto.setId(o.getObjectID());
        dto.setTitle(nullToEmpty(o.getTitle()));

        dto.setArtistTitle(normalizeUnknown(o.getArtistDisplayName()));
        dto.setArtistDisplay(nullToEmpty(o.getArtistDisplayBio()));

        dto.setDateDisplay(nullToEmpty(o.getObjectDate()));
        dto.setMediumDisplay(nullToEmpty(o.getMedium()));
        dto.setDimensions(nullToEmpty(o.getDimensions()));

        dto.setPlaceOfOrigin(firstNonBlank(o.getCountry(), o.getCulture()));
        dto.setStyleTitle(nullToEmpty(o.getPeriod()));
        dto.setClassificationTitle(nullToEmpty(o.getClassification()));
        dto.setArtworkTypeTitle(nullToEmpty(o.getObjectName()));
        dto.setDepartmentTitle(nullToEmpty(o.getDepartment()));

        dto.setPublicDomain(Boolean.TRUE.equals(o.getIsPublicDomain()));

        dto.setImageUrl(nullToEmpty(o.getPrimaryImage()));
        dto.setThumbnailUrl(nullToEmpty(o.getPrimaryImageSmall()));
        dto.setArticulUrl(nullToEmpty(o.getObjectURL()));

        dto.setDescription(buildDescription(o));
        dto.setColor(computeColorFromImageUrl(dto.getThumbnailUrl() != null && !dto.getThumbnailUrl().isBlank()
                ? dto.getThumbnailUrl()
                : dto.getImageUrl()));
        dto.setThumbnail(null);
        dto.setImageId(null);

        return dto;
    }

    private String buildDescription(MetObject o) {
        List<String> parts = new ArrayList<>();
        addIfPresent(parts, o.getCreditLine());
        addIfPresent(parts, o.getCulture());
        addIfPresent(parts, o.getPeriod());
        addIfPresent(parts, o.getDynasty());
        addIfPresent(parts, o.getReign());
        addIfPresent(parts, o.getObjectDate());
        addIfPresent(parts, o.getMedium());
        addIfPresent(parts, o.getDimensions());

        String joined = String.join(" · ", parts);
        return joined.isBlank() ? "" : joined;
    }

    private void addIfPresent(List<String> parts, String value) {
        if (value == null) return;
        String v = value.trim();
        if (!v.isEmpty()) parts.add(v);
    }

    private String normalizeUnknown(String artist) {
        String a = nullToEmpty(artist).trim();
        if (a.isEmpty()) return "";
        String lower = a.toLowerCase();
        if (lower.equals("unknown") || lower.equals("unknown artist") || lower.equals("unidentified")
                || lower.equals("unknown maker") || lower.equals("anonymous")) {
            return "";
        }
        return a;
    }

    private String firstNonBlank(String a, String b) {
        String aa = nullToEmpty(a).trim();
        if (!aa.isEmpty()) return aa;
        String bb = nullToEmpty(b).trim();
        return bb;
    }

    private String nullToEmpty(String v) {
        return v == null ? "" : v;
    }

    private ArtworkDTO.ColorInfo computeColorFromImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return null;

        try {
            URLConnection conn = new URL(imageUrl).openConnection();
            conn.setConnectTimeout(2500);
            conn.setReadTimeout(3500);
            conn.setRequestProperty("User-Agent", "MuseuAberto/1.0");

            try (InputStream in = conn.getInputStream()) {
                BufferedImage img = ImageIO.read(in);
                if (img == null) return null;

                int width = img.getWidth();
                int height = img.getHeight();
                if (width <= 0 || height <= 0) return null;

                // Sample pixels in a grid to keep it fast.
                int stepX = Math.max(1, width / 64);
                int stepY = Math.max(1, height / 64);

                long rSum = 0, gSum = 0, bSum = 0, count = 0;
                for (int y = 0; y < height; y += stepY) {
                    for (int x = 0; x < width; x += stepX) {
                        int argb = img.getRGB(x, y);
                        int a = (argb >>> 24) & 0xFF;
                        if (a < 32) continue; // ignore near-transparent
                        int r = (argb >>> 16) & 0xFF;
                        int g = (argb >>> 8) & 0xFF;
                        int b = (argb) & 0xFF;
                        rSum += r;
                        gSum += g;
                        bSum += b;
                        count++;
                    }
                }
                if (count == 0) return null;

                double r = (rSum / (double) count) / 255.0;
                double g = (gSum / (double) count) / 255.0;
                double b = (bSum / (double) count) / 255.0;

                int[] hsl = rgbToHsl(r, g, b);

                ArtworkDTO.ColorInfo color = new ArtworkDTO.ColorInfo();
                color.setH(hsl[0]);
                color.setS(hsl[1]);
                color.setL(hsl[2]);
                color.setPercentage(1.0);
                color.setPopulation((int) Math.min(Integer.MAX_VALUE, count));
                return color;
            }
        } catch (Exception e) {
            log.debug("Failed to compute color from image: {}", e.getMessage());
            return null;
        }
    }

    // Returns [h(0-359), s(0-100), l(0-100)]
    private int[] rgbToHsl(double r, double g, double b) {
        double max = Math.max(r, Math.max(g, b));
        double min = Math.min(r, Math.min(g, b));
        double h, s, l;
        l = (max + min) / 2.0;

        if (max == min) {
            h = 0;
            s = 0;
        } else {
            double d = max - min;
            s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min);

            if (max == r) {
                h = ((g - b) / d + (g < b ? 6.0 : 0.0));
            } else if (max == g) {
                h = ((b - r) / d + 2.0);
            } else {
                h = ((r - g) / d + 4.0);
            }
            h /= 6.0;
        }

        int hi = (int) Math.round(h * 360.0) % 360;
        int si = (int) Math.round(s * 100.0);
        int li = (int) Math.round(l * 100.0);
        return new int[]{hi, clamp0to100(si), clamp0to100(li)};
    }

    private int clamp0to100(int v) {
        if (v < 0) return 0;
        if (v > 100) return 100;
        return v;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MetSearchResponse {
        private Integer total;

        @JsonProperty("objectIDs")
        private List<Integer> objectIDs;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MetObject {
        private Long objectID;
        private String title;
        private String objectName;
        private String objectDate;
        private String medium;
        private String dimensions;
        private String country;
        private String culture;
        private String period;
        private String dynasty;
        private String reign;
        private String department;
        private String classification;
        private Boolean isPublicDomain;
        private String primaryImage;
        private String primaryImageSmall;
        private String objectURL;
        private String creditLine;
        private String artistDisplayName;
        private String artistDisplayBio;
    }
}
