package com.apartmentapp.payment;

import com.apartmentapp.config.ApiResponse;
import com.apartmentapp.security.JwtPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<PaymentDTO.OrderResponse>> createOrder(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody PaymentDTO.CreateOrderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Razorpay order created",
                paymentService.createOrder(principal, request)));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<PaymentDTO.Response>> verifyPayment(
            @RequestBody PaymentDTO.VerifyPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Payment verification complete",
                paymentService.verifyPayment(request)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<List<PaymentDTO.Response>>> getMyPayments(
            @AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Payment history fetched",
                paymentService.getMyPayments(principal.getUserId())));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PaymentDTO.Response>>> getPendingPayments() {
        return ResponseEntity.ok(ApiResponse.success("Pending payments fetched",
                paymentService.getPendingPayments()));
    }
}
