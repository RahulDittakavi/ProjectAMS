package com.apartmentapp.amenity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface AmenityBookingRepository extends JpaRepository<AmenityBooking, Long> {

    List<AmenityBooking> findByResidentIdOrderByCreatedAtDesc(Long residentId);

    List<AmenityBooking> findByAmenityIdAndBookingDate(Long amenityId, LocalDate bookingDate);

    @Query("SELECT ab FROM AmenityBooking ab " +
           "WHERE ab.amenity.id = :amenityId " +
           "AND ab.bookingDate = :date " +
           "AND ab.status NOT IN :excludedStatuses " +
           "AND ab.startTime < :endTime " +
           "AND ab.endTime > :startTime")
    List<AmenityBooking> findConflictingBookings(
            @Param("amenityId") Long amenityId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludedStatuses") Collection<BookingStatus> excludedStatuses);
}
