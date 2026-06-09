package com.apartmentapp.config;

import lombok.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class CoreApiClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${core.api.url}")
    private String coreApiUrl;

    @Value("${internal.service.secret}")
    private String serviceSecret;

    public List<ResidentInfo> getResidentsForBilling() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Service-Secret", serviceSecret);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<ApiResponse<List<ResidentInfo>>> response = restTemplate.exchange(
                coreApiUrl + "/api/users/internal/residents",
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<>() {}
        );
        if (response.getBody() != null && response.getBody().getData() != null) {
            return response.getBody().getData();
        }
        return List.of();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResidentInfo {
        private Long id;
        private String name;
        private String email;
        private String flatNumber;
        private String block;
    }
}
