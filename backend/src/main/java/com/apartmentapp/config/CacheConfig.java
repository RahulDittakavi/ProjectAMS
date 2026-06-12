package com.apartmentapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.cache.RedisCacheWriter;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Enhanced Cache Configuration with per-cache TTL settings
 */
@Configuration
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(LettuceConnectionFactory connectionFactory) {
        Map<String, RedisCacheConfiguration> configs = new HashMap<>();

        // 30 minutes - time-sensitive data
        configs.put("amenity_slots",
            buildCacheConfig(Duration.ofMinutes(30)));

        // 1 hour - user data
        configs.put("users",
            buildCacheConfig(Duration.ofHours(1)));

        // 2 hours - announcements
        configs.put("announcements",
            buildCacheConfig(Duration.ofHours(2)));

        // 4 hours - amenities
        configs.put("amenities",
            buildCacheConfig(Duration.ofHours(4)));

        // 4 hours - complaints
        configs.put("complaints",
            buildCacheConfig(Duration.ofHours(4)));

        // 30 minutes - visitors (time-sensitive)
        configs.put("visitors",
            buildCacheConfig(Duration.ofMinutes(30)));

        // 6 hours - bills (payment service)
        configs.put("bills",
            buildCacheConfig(Duration.ofHours(6)));

        // 6 hours - user bills (payment service)
        configs.put("user_bills",
            buildCacheConfig(Duration.ofHours(6)));

        // 24 hours - maintenance config (payment service)
        configs.put("maintenance_config",
            buildCacheConfig(Duration.ofHours(24)));

        return RedisCacheManager.builder(RedisCacheWriter.create(connectionFactory))
            .cacheDefaults(buildCacheConfig(Duration.ofHours(1)))
            .withInitialCacheConfigurations(configs)
            .build();
    }

    /**
     * Build cache configuration with JSON serialization
     */
    private RedisCacheConfiguration buildCacheConfig(Duration ttl) {
        return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(ttl)
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();
    }
}
