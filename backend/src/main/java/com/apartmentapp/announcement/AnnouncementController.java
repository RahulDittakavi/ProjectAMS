package com.apartmentapp.announcement;

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
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementDTO.Response>> createAnnouncement(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AnnouncementDTO.CreateRequest request) {
        AnnouncementDTO.Response response = announcementService.createAnnouncement(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Announcement created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT', 'SECURITY')")
    public ResponseEntity<ApiResponse<List<AnnouncementDTO.Response>>> getAllAnnouncements() {
        List<AnnouncementDTO.Response> response = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(ApiResponse.success("Announcements fetched", response));
    }
}
