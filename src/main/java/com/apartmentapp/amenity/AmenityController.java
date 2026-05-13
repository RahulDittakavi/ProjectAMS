package com.apartmentapp.amenity;

import com.apartmentapp.config.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService amenityService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AmenityDTO.AmenityResponse>>> getAllAmenities() {
        return ResponseEntity.ok(ApiResponse.success("Amenities fetched", amenityService.getAllAmenities()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AmenityDTO.AmenityResponse>> createAmenity(
            @Valid @RequestBody AmenityDTO.CreateAmenityRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Amenity created", amenityService.createAmenity(request)));
    }

    @PostMapping("/{id}/book")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<AmenityDTO.BookingResponse>> bookAmenity(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AmenityDTO.BookingRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Amenity booked successfully",
                amenityService.bookAmenity(id, userDetails.getUsername(), request)));
    }

    @GetMapping("/bookings/my")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<List<AmenityDTO.BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Bookings fetched",
                amenityService.getMyBookings(userDetails.getUsername())));
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AmenityDTO.BookingResponse>>> getAllBookings() {
        return ResponseEntity.ok(ApiResponse.success("All bookings fetched", amenityService.getAllBookings()));
    }

    @PutMapping("/bookings/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AmenityDTO.BookingResponse>> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody AmenityDTO.BookingStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Booking status updated",
                amenityService.updateBookingStatus(id, request)));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<AmenityDTO.AvailabilityResponse>> checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success("Availability checked",
                amenityService.checkAvailability(id, date)));
    }
}
