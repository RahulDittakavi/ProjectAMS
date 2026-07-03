package com.apartmentapp.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Get current user by email with caching (1 hour TTL)
     */
    @Cacheable(value = "users", key = "'email:' + #email", unless = "#result == null")
    public UserDTO.Response getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return mapToResponse(user);
    }

    /**
     * Update user profile and invalidate cache
     */
    @Transactional
    @CacheEvict(value = "users", key = "'email:' + #email")
    public UserDTO.Response updateProfile(String email, UserDTO.UpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setFlatNumber(request.getFlatNumber());
        user.setBlock(request.getBlock());
        User saved = userRepository.save(user);
        log.info("Profile updated: id={}, email={}", saved.getId(), email);
        return mapToResponse(saved);
    }

    public static UserDTO.Response mapToResponse(User user) {
        return UserDTO.Response.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .flatNumber(user.getFlatNumber())
                .block(user.getBlock())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
