package com.apartmentapp.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Listens for AMS events from Kafka and invalidates corresponding caches
 * Implements smart cache invalidation strategy:
 * 1. Payment completed -> invalidate bill caches
 * 2. User updated -> invalidate user cache
 * 3. Amenity updated -> invalidate amenity cache
 * 4. Booking status changed -> invalidate slots cache
 */
@Slf4j
@Component
public class CacheInvalidationListener {

    @Autowired
    private CacheManager cacheManager;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Listen to ams.events Kafka topic
     */
    @KafkaListener(topics = "ams.events", groupId = "cache-invalidation-group")
    public void handleCacheInvalidation(String message) {
        try {
            Map<String, Object> event = objectMapper.readValue(message, Map.class);
            String eventType = (String) event.get("eventType");

            log.debug("Processing cache invalidation for event: {}", eventType);

            switch (eventType) {
                case "payment.completed":
                    invalidatePaymentCaches(event);
                    break;

                case "amenity.updated":
                    invalidateAmenityCaches(event);
                    break;

                case "user.updated":
                    invalidateUserCaches(event);
                    break;

                case "announcement.created":
                    invalidateAnnouncementCaches();
                    break;

                case "booking.status.changed":
                    invalidateSlotsCaches(event);
                    break;

                default:
                    log.debug("No cache invalidation handler for event type: {}", eventType);
                    break;
            }
        } catch (Exception e) {
            // Log error but don't fail - cache invalidation should not crash the service
            log.error("Error processing cache invalidation event: {}", message, e);
        }
    }

    /**
     * Invalidate bill-related caches when payment is completed
     */
    private void invalidatePaymentCaches(Map<String, Object> event) {
        try {
            Long userId = ((Number) event.get("userId")).longValue();
            
            var billsCache = cacheManager.getCache("bills");
            if (billsCache != null) {
                billsCache.clear();
                log.info("Invalidated bills cache");
            }

            var userBillsCache = cacheManager.getCache("user_bills");
            if (userBillsCache != null) {
                userBillsCache.evict(userId);
                log.info("Invalidated user_bills cache for userId: {}", userId);
            }
        } catch (Exception e) {
            log.error("Error invalidating payment caches", e);
        }
    }

    /**
     * Invalidate amenity-related caches when amenity is updated
     */
    private void invalidateAmenityCaches(Map<String, Object> event) {
        try {
            Long amenityId = ((Number) event.get("amenityId")).longValue();
            
            var amenitiesCache = cacheManager.getCache("amenities");
            if (amenitiesCache != null) {
                amenitiesCache.evict(amenityId);
                amenitiesCache.evict("list");
                log.info("Invalidated amenities cache for amenityId: {}", amenityId);
            }

            // Also invalidate slots cache as amenity change affects availability
            var slotsCache = cacheManager.getCache("amenity_slots");
            if (slotsCache != null) {
                slotsCache.clear();
                log.info("Invalidated amenity_slots cache due to amenity update");
            }
        } catch (Exception e) {
            log.error("Error invalidating amenity caches", e);
        }
    }

    /**
     * Invalidate user cache when user profile is updated
     */
    private void invalidateUserCaches(Map<String, Object> event) {
        try {
            String email = (String) event.get("email");
            Long userId = ((Number) event.get("userId")).longValue();
            
            var usersCache = cacheManager.getCache("users");
            if (usersCache != null) {
                usersCache.evict("email:" + email);
                usersCache.evict(userId);
                log.info("Invalidated users cache for email: {} and userId: {}", email, userId);
            }
        } catch (Exception e) {
            log.error("Error invalidating user caches", e);
        }
    }

    /**
     * Invalidate announcement cache when new announcement is created
     */
    private void invalidateAnnouncementCaches() {
        try {
            var announcementsCache = cacheManager.getCache("announcements");
            if (announcementsCache != null) {
                announcementsCache.clear();
                log.info("Invalidated announcements cache");
            }
        } catch (Exception e) {
            log.error("Error invalidating announcement caches", e);
        }
    }

    /**
     * Invalidate slots cache when booking status changes (affects availability)
     */
    private void invalidateSlotsCaches(Map<String, Object> event) {
        try {
            var slotsCache = cacheManager.getCache("amenity_slots");
            if (slotsCache != null) {
                // Clear all slots cache as booking status change affects multiple dates/amenities
                slotsCache.clear();
                log.info("Invalidated amenity_slots cache due to booking status change");
            }
        } catch (Exception e) {
            log.error("Error invalidating slots caches", e);
        }
    }
}
