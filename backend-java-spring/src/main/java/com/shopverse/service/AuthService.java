package com.shopverse.service;

import com.shopverse.domain.User;
import com.shopverse.dto.AuthDtos;
import com.shopverse.exception.BadRequestException;
import com.shopverse.exception.ConflictException;
import com.shopverse.exception.UnauthorizedException;
import com.shopverse.repository.UserRepository;
import com.shopverse.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (request.full_name() == null || request.full_name().isBlank()) {
            throw new BadRequestException("full_name: must not be blank");
        }
        if (request.email() == null || !request.email().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new BadRequestException("email: must be a valid email");
        }
        if (request.password() == null || request.password().length() < 6) {
            throw new BadRequestException("password: must be at least 6 characters");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("This email is already registered");
        }
        User user = new User();
        user.setFullName(request.full_name().trim());
        user.setEmail(request.email().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(com.shopverse.domain.Role.ROLE_CUSTOMER);
        userRepository.save(user);
        return buildResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        if (request.email() == null || request.password() == null) {
            throw new UnauthorizedException("Invalid email or password");
        }
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        return buildResponse(user);
    }

    private AuthDtos.AuthResponse buildResponse(User user) {
        String token = jwtTokenProvider.generateToken(user);
        AuthDtos.UserDto dto = new AuthDtos.UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
        return new AuthDtos.AuthResponse(token, dto);
    }
}