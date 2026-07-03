package com.apartmentapp.complaint;

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
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<ComplaintDTO.Response>> createComplaint(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ComplaintDTO.CreateRequest request) {
        ComplaintDTO.Response response = complaintService.createComplaint(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Complaint raised successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<List<ComplaintDTO.Response>>> getMyComplaints(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ComplaintDTO.Response> response = complaintService.getMyComplaints(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Complaints fetched", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ComplaintDTO.Response>>> getAllComplaints() {
        List<ComplaintDTO.Response> response = complaintService.getAllComplaints();
        return ResponseEntity.ok(ApiResponse.success("All complaints fetched", response));
    }       

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintDTO.Response>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintDTO.StatusUpdateRequest request) {
        ComplaintDTO.Response response = complaintService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESIDENT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ComplaintDTO.Response>>> deleteComplaint(@PathVariable Long id) {
        List<ComplaintDTO.Response> response = complaintService.deleteComplaint(id);
        return ResponseEntity.ok(ApiResponse.success("Complaint deleted successfully", response));
    }
}
