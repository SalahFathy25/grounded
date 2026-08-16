package com.shopverse.service;

import com.shopverse.domain.User;
import com.shopverse.dto.AuthDtos;
import com.shopverse.exception.ConflictException;
import com.shopverse.repository.UserRepository;
import com.shopverse.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("This email is already registered");
        }
        User user = new User();
        user.setFullName(request.full_name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(com.shopverse.domain.Role.ROLE_CUSTOMER);
        userRepository.save(user);
        return buildResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ConflictException("This email is already registered"));
        return buildResponse(user);
    }

    private AuthDtos.AuthResponse buildResponse(User user) {
        String token = jwtTokenProvider.generateToken(user);
        AuthDtos.UserDto dto = new AuthDtos.UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
        return new AuthDtos.AuthResponse(token, dto);
    }
}
