package com.apartmentapp.amenity;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class AmenityDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAmenityRequest {
        @NotNull(message = "Name is required")
        private String name;
        private String description;
        private Integer capacity;
        private LocalTime openTime;
        private LocalTime closeTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AmenityResponse {
        private Long id;
        private String name;
        private String description;
        private Integer capacity;
        private LocalTime openTime;
        private LocalTime closeTime;
        private Boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingRequest {
        @NotNull(message = "Booking date is required")
        private LocalDate bookingDate;

        @NotNull(message = "Start time is required")
        private LocalTime startTime;

        @NotNull(message = "End time is required")
        private LocalTime endTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingStatusUpdateRequest {
        @NotNull(message = "Status is required")
        private BookingStatus status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingResponse {
        private Long id;
        private Long amenityId;
        private String amenityName;
        private Long residentId;
        private String residentName;
        private LocalDate bookingDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private BookingStatus status;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityResponse {
        private Long amenityId;
        private LocalDate date;
        private List<BookingResponse> existingBookings;
        private boolean available;
    }
}
