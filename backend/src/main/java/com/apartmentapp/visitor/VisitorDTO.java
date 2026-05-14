package com.apartmentapp.visitor;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

public class VisitorDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Visitor name is required")
        private String name;

        private String phone;
        private String purpose;

        @NotBlank(message = "Flat to visit is required")
        private String flatToVisit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String name;
        private String phone;
        private String purpose;
        private String flatToVisit;
        private Long loggedById;
        private String loggedByName;
        private LocalDateTime entryTime;
        private LocalDateTime exitTime;
    }
}
