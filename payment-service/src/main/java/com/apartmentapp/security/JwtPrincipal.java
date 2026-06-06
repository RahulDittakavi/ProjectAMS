package com.apartmentapp.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class JwtPrincipal {
    private final Long userId;
    private final String email;
    private final String name;
    private final String role;
}
