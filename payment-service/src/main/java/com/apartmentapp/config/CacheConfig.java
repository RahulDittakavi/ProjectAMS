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
 * Enhanced Cache Configuration for Payment Service
 */
@Configuration
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(LettuceConnectionFactory connectionFactory) {
        Map<String, RedisCacheConfiguration> configs = new HashMap<>();

        // 6 hours - bills
        configs.put("bills",
            buildCacheConfig(Duration.ofHours(6)));

        // 6 hours - user bills
        configs.put("user_bills",
            buildCacheConfig(Duration.ofHours(6)));

        // 24 hours - maintenance config
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
