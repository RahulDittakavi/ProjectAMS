package com.apartmentapp.user;

import com.apartmentapp.config.ApiResponse;
import jakarta.validation.Valid;
import lombok.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

record ResidentInfo(Long id, String name, String email, String flatNumber, String block) {}

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @Value("${internal.service.secret}")
    private String internalSecret;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO.Response>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserDTO.Response response = userService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", response));
    }

    @GetMapping("/internal/residents")
    public ResponseEntity<ApiResponse<List<ResidentInfo>>> getResidentsForBilling(
            @RequestHeader(value = "X-Service-Secret", required = false) String secret) {
        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden"));
        }
        List<ResidentInfo> residents = userRepository
                .findByRoleAndIsActiveTrueAndFlatNumberIsNotNullAndBlockIsNotNull(Role.RESIDENT)
                .stream()
                .map(u -> new ResidentInfo(u.getId(), u.getName(), u.getEmail(), u.getFlatNumber(), u.getBlock()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Residents fetched", residents));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO.Response>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserDTO.UpdateRequest request) {
        UserDTO.Response response = userService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }
}
