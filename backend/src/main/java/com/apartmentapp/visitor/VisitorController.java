package com.apartmentapp.visitor;

import com.apartmentapp.config.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitors")
@RequiredArgsConstructor
public class VisitorController {

    private final VisitorService visitorService;

    @PostMapping
    @PreAuthorize("hasRole('SECURITY')")
    public ResponseEntity<ApiResponse<VisitorDTO.Response>> logEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VisitorDTO.CreateRequest request) {
        VisitorDTO.Response response = visitorService.logEntry(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Visitor entry logged", response));
    }

    @PutMapping("/{id}/exit")
    @PreAuthorize("hasRole('SECURITY')")
    public ResponseEntity<ApiResponse<VisitorDTO.Response>> logExit(@PathVariable Long id) {
        VisitorDTO.Response response = visitorService.logExit(id);
        return ResponseEntity.ok(ApiResponse.success("Visitor exit logged", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<VisitorDTO.Response>>> getAllVisitors() {
        List<VisitorDTO.Response> response = visitorService.getAllVisitors();
        return ResponseEntity.ok(ApiResponse.success("All visitors fetched", response));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
    public ResponseEntity<ApiResponse<List<VisitorDTO.Response>>> getActiveVisitors() {
        List<VisitorDTO.Response> response = visitorService.getActiveVisitors();
        return ResponseEntity.ok(ApiResponse.success("Active visitors fetched", response));
    }
}
