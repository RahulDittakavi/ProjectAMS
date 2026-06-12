package com.apartmentapp.amenity;

import com.apartmentapp.exception.ResourceNotFoundException;
import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AmenityService {

    private final AmenityRepository amenityRepository;
    private final AmenityBookingRepository amenityBookingRepository;
    private final UserRepository userRepository;

    /**
     * Get all active amenities with caching (4 hour TTL)
     */
    @Cacheable(value = "amenities", key = "'list'")
    public List<AmenityDTO.AmenityResponse> getAllAmenities() {
        return amenityRepository.findByIsActiveTrue().stream()
                .map(this::mapAmenityToResponse).toList();
    }

    /**
     * Create amenity and invalidate list cache
     */
    @Transactional
    @CacheEvict(value = "amenities", key = "'list'")
    public AmenityDTO.AmenityResponse createAmenity(AmenityDTO.CreateAmenityRequest request) {
        Amenity amenity = Amenity.builder()
                .name(request.getName())
                .description(request.getDescription())
                .capacity(request.getCapacity())
                .openTime(request.getOpenTime())
                .closeTime(request.getCloseTime())
                .build();
        Amenity saved = amenityRepository.save(amenity);
        log.info("Amenity created: id={}, name={}", saved.getId(), saved.getName());
        return mapAmenityToResponse(saved);
    }

    /**
     * Book amenity and check availability
     */
    @Transactional
    public AmenityDTO.BookingResponse bookAmenity(Long amenityId, String email, AmenityDTO.BookingRequest request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }
        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new ResourceNotFoundException("Amenity not found with id: " + amenityId));
        if (!amenity.getIsActive()) {
            throw new RuntimeException("Amenity is not available for booking");
        }
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<AmenityBooking> conflicts = amenityBookingRepository.findConflictingBookings(
                amenityId, request.getBookingDate(), request.getStartTime(), request.getEndTime(),
                List.of(BookingStatus.REJECTED, BookingStatus.CANCELLED));
        if (!conflicts.isEmpty()) {
            log.warn("Booking conflict: amenityId={}, date={}, resident={}", amenityId, request.getBookingDate(), email);
            throw new RuntimeException("The requested time slot conflicts with an existing booking");
        }

        AmenityBooking booking = AmenityBooking.builder()
                .amenity(amenity)
                .resident(resident)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();
        AmenityBooking saved = amenityBookingRepository.save(booking);
        log.info("Amenity booked: bookingId={}, amenityId={}, residentId={}, date={}", saved.getId(), amenityId, resident.getId(), request.getBookingDate());
        return mapBookingToResponse(saved);
    }

    /**
     * Get user's bookings
     */
    public List<AmenityDTO.BookingResponse> getMyBookings(String email) {
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return amenityBookingRepository.findByResidentIdOrderByCreatedAtDesc(resident.getId())
                .stream().map(this::mapBookingToResponse).toList();
    }

    /**
     * Get all bookings
     */
    public List<AmenityDTO.BookingResponse> getAllBookings() {
        return amenityBookingRepository.findAll().stream()
                .map(this::mapBookingToResponse).toList();
    }

    /**
     * Update booking status and invalidate caches
     */
    @Transactional
    @CacheEvict(value = "amenity_slots", allEntries = true)
    public AmenityDTO.BookingResponse updateBookingStatus(Long bookingId,
                                                          AmenityDTO.BookingStatusUpdateRequest request) {
        AmenityBooking booking = amenityBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
        BookingStatus previous = booking.getStatus();
        booking.setStatus(request.getStatus());
        AmenityBooking saved = amenityBookingRepository.save(booking);
        log.info("Booking status updated: id={}, {} -> {}", bookingId, previous, saved.getStatus());
        return mapBookingToResponse(saved);
    }

    /**
     * Check availability with caching (30 minute TTL)
     */
    @Cacheable(value = "amenity_slots", key = "#amenityId + ':' + #date")
    public AmenityDTO.AvailabilityResponse checkAvailability(Long amenityId, LocalDate date) {
        amenityRepository.findById(amenityId)
                .orElseThrow(() -> new ResourceNotFoundException("Amenity not found with id: " + amenityId));
        List<AmenityBooking> bookings = amenityBookingRepository.findByAmenityIdAndBookingDate(amenityId, date);
        List<AmenityDTO.BookingResponse> responses = bookings.stream()
                .map(this::mapBookingToResponse).toList();
        boolean hasApproved = bookings.stream().anyMatch(b -> b.getStatus() == BookingStatus.APPROVED);
        return AmenityDTO.AvailabilityResponse.builder()
                .amenityId(amenityId)
                .date(date)
                .existingBookings(responses)
                .available(!hasApproved)
                .build();
    }

    private AmenityDTO.AmenityResponse mapAmenityToResponse(Amenity a) {
        return AmenityDTO.AmenityResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .description(a.getDescription())
                .capacity(a.getCapacity())
                .openTime(a.getOpenTime())
                .closeTime(a.getCloseTime())
                .isActive(a.getIsActive())
                .build();
    }

    private AmenityDTO.BookingResponse mapBookingToResponse(AmenityBooking b) {
        return AmenityDTO.BookingResponse.builder()
                .id(b.getId())
                .amenityId(b.getAmenity().getId())
                .amenityName(b.getAmenity().getName())
                .residentId(b.getResident().getId())
                .residentName(b.getResident().getName())
                .bookingDate(b.getBookingDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
