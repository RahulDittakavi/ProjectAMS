package com.apartmentapp.billing;

import com.apartmentapp.config.ApiResponse;
import com.apartmentapp.security.JwtPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    @PostMapping("/api/maintenance-config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BillDTO.ConfigResponse>> setConfig(
            @Valid @RequestBody BillDTO.ConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Config saved", billService.setConfig(request)));
    }

    @PostMapping("/api/bills/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> generateBills(@RequestParam String month) {
        int count = billService.generateBills(month);
        return ResponseEntity.ok(ApiResponse.success("Bills generated", count + " bills created"));
    }

    @GetMapping("/api/bills/my")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<List<BillDTO.BillResponse>>> getMyBills(
            @AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Bills fetched",
                billService.getBillsByResident(principal.getUserId())));
    }

    @GetMapping("/api/bills/dues")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<List<BillDTO.BillResponse>>> getMyDues(
            @AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Dues fetched",
                billService.getDuesByResident(principal.getUserId())));
    }

    @GetMapping("/api/bills/{id}/receipt")
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<BillDTO.BillResponse>> getReceipt(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtPrincipal principal,
            Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(ApiResponse.success("Receipt fetched",
                billService.getReceipt(id, principal.getUserId(), isAdmin)));
    }

    @GetMapping("/api/admin/collections")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BillDTO.CollectionSummary>> getCollections(@RequestParam String month) {
        return ResponseEntity.ok(ApiResponse.success("Collection summary fetched",
                billService.getCollectionSummary(month)));
    }
}
