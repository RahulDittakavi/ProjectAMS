package com.apartmentapp.auth;

import com.apartmentapp.user.Role;
import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import com.apartmentapp.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration attempt with already-registered email: {}", request.getEmail());
            throw new RuntimeException("Email already registered");
        }
        Role role = request.getRole() != null ? request.getRole() : Role.RESIDENT;
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .flatNumber(request.getFlatNumber())
                .block(request.getBlock())
                .build();
        user = userRepository.save(user);
        log.info("New user registered: id={}, email={}, role={}", user.getId(), user.getEmail(), user.getRole());
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId(), user.getName());
        return new AuthDTO.AuthResponse(token, UserService.mapToResponse(user));
    }

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        log.info("User logged in: id={}, email={}, role={}", user.getId(), user.getEmail(), user.getRole());
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId(), user.getName());
        return new AuthDTO.AuthResponse(token, UserService.mapToResponse(user));
    }
}
