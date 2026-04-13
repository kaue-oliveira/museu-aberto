package com.museuaberto.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ArtworkDTO {

    private Long id;
    private String title;

    @JsonProperty("artist_title")
    private String artistTitle;

    @JsonProperty("artist_display")
    private String artistDisplay;

    @JsonProperty("date_display")
    private String dateDisplay;

    @JsonProperty("medium_display")
    private String mediumDisplay;

    private String dimensions;
    private String description;

    @JsonProperty("place_of_origin")
    private String placeOfOrigin;

    @JsonProperty("style_title")
    private String styleTitle;

    @JsonProperty("classification_title")
    private String classificationTitle;

    @JsonProperty("artwork_type_title")
    private String artworkTypeTitle;

    @JsonProperty("department_title")
    private String departmentTitle;

    @JsonProperty("is_public_domain")
    private boolean publicDomain; // backing field

    @JsonProperty("image_id")
    private String imageId;

    private ColorInfo color;
    private ThumbnailInfo thumbnail;

    // Campos enriquecidos — sem @JsonProperty, serializam normalmente em camelCase
    private String imageUrl;
    private String thumbnailUrl;
    private String articulUrl;

    @JsonProperty("isPublicDomain")
    public boolean isPublicDomain() {
        return publicDomain;
    }

    @JsonProperty("isPublicDomain")
    public void setIsPublicDomain(boolean value) {
        this.publicDomain = value;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ColorInfo {
        private int h;
        private int l;
        private int s;
        private double percentage;
        private int population;
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ThumbnailInfo {
        private String lqip;
        private Integer width;
        private Integer height;

        @JsonProperty("alt_text")
        private String altText;
    }
}