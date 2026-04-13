package com.museuaberto.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WikipediaInfo {

    private String title;
    private String displayTitle;
    private String extract;
    private String pageUrl;
    private String thumbnailUrl;
    private String description;
    private boolean found;
}
