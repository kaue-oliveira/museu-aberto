package com.museuaberto.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.util.concurrent.TimeUnit;

@RestController
public class ImageProxyController {

    @GetMapping("/api/proxy-image")
    public ResponseEntity<byte[]> proxyImage(@RequestParam String url) {
        try {
            URL imageUrl = new URL(url);
            java.net.HttpURLConnection connection =
                    (java.net.HttpURLConnection) imageUrl.openConnection();
            connection.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            connection.setRequestProperty("Referer", "https://www.artic.edu/");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(15000);

            int status = connection.getResponseCode();
            if (status != 200) {
                return ResponseEntity.status(status).build();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (InputStream is = connection.getInputStream()) {
                byte[] buffer = new byte[8192];
                int n;
                while ((n = is.read(buffer)) > 0) {
                    baos.write(buffer, 0, n);
                }
            }

            String contentType = connection.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = guessContentType(url);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic());

            return new ResponseEntity<>(baos.toByteArray(), headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String guessContentType(String url) {
        if (url.contains(".png")) return "image/png";
        if (url.contains(".gif")) return "image/gif";
        return "image/jpeg";
    }
}