package com.apartmentapp.amenity;

import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AmenityService {

    private final AmenityRepository amenityRepository;
    private final AmenityBookingRepository amenityBookingRepository;
    private final UserRepository userRepository;

    public List<AmenityDTO.AmenityResponse> getAllAmenities() {
        return amenityRepository.findByIsActiveTrue().stream()
                .map(this::mapAmenityToResponse).toList();
    }

    @Transactional
    public AmenityDTO.AmenityResponse createAmenity(AmenityDTO.CreateAmenityRequest request) {
        Amenity amenity = Amenity.builder()
                .name(request.getName())
                .description(request.getDescription())
                .capacity(request.getCapacity())
                .openTime(request.getOpenTime())
                .closeTime(request.getCloseTime())
                .build();
        return mapAmenityToResponse(amenityRepository.save(amenity));
    }

    @Transactional
    public AmenityDTO.BookingResponse bookAmenity(Long amenityId, String email, AmenityDTO.BookingRequest request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }
        Amenity amenity = amenityRepository.findById(amenityId)
                .orElseThrow(() -> new RuntimeException("Amenity not found with id: " + amenityId));
        if (!amenity.getIsActive()) {
            throw new RuntimeException("Amenity is not available for booking");
        }
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<AmenityBooking> conflicts = amenityBookingRepository.findConflictingBookings(
                amenityId, request.getBookingDate(), request.getStartTime(), request.getEndTime(),
                List.of(BookingStatus.REJECTED, BookingStatus.CANCELLED));
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("The requested time slot conflicts with an existing booking");
        }

        AmenityBooking booking = AmenityBooking.builder()
                .amenity(amenity)
                .resident(resident)
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();
        return mapBookingToResponse(amenityBookingRepository.save(booking));
    }

    public List<AmenityDTO.BookingResponse> getMyBookings(String email) {
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return amenityBookingRepository.findByResidentIdOrderByCreatedAtDesc(resident.getId())
                .stream().map(this::mapBookingToResponse).toList();
    }

    public List<AmenityDTO.BookingResponse> getAllBookings() {
        return amenityBookingRepository.findAll().stream()
                .map(this::mapBookingToResponse).toList();
    }

    @Transactional
    public AmenityDTO.BookingResponse updateBookingStatus(Long bookingId,
                                                          AmenityDTO.BookingStatusUpdateRequest request) {
        AmenityBooking booking = amenityBookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));
        booking.setStatus(request.getStatus());
        return mapBookingToResponse(amenityBookingRepository.save(booking));
    }

    public AmenityDTO.AvailabilityResponse checkAvailability(Long amenityId, LocalDate date) {
        amenityRepository.findById(amenityId)
                .orElseThrow(() -> new RuntimeException("Amenity not found with id: " + amenityId));
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
