package com.apartmentapp.user;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class UserDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Name is required")
        private String name;
        private String phone;
        private String flatNumber;
        private String block;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private Role role;
        private String flatNumber;
        private String block;
        private Boolean isActive;
        private LocalDateTime createdAt;
    }
}
