

package com.museuaberto.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.CrossOriginResourcePolicyHeaderWriter;
import org.springframework.security.config.Customizer;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/**").permitAll()
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable())
            .headers(headers -> headers
                .defaultsDisabled()
                .cacheControl(cache -> {})
                .frameOptions(frame -> {})
                .httpStrictTransportSecurity(hsts -> {})
                .contentTypeOptions(contentType -> {})
                .xssProtection(xss -> {})
                .referrerPolicy(referrer -> {})
                .crossOriginResourcePolicy(cors -> cors.policy(CrossOriginResourcePolicyHeaderWriter.CrossOriginResourcePolicy.CROSS_ORIGIN))
            );
        return http.build();
    }
}
