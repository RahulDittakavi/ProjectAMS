package com.apartmentapp.payment;

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
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<PaymentDTO.OrderResponse>> createOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PaymentDTO.CreateOrderRequest request) {
        PaymentDTO.OrderResponse response = paymentService.createOrder(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Razorpay order created", response));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<PaymentDTO.Response>> verifyPayment(
            @Valid @RequestBody PaymentDTO.VerifyPaymentRequest request) {
        PaymentDTO.Response response = paymentService.verifyPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Payment verification complete", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<List<PaymentDTO.Response>>> getMyPayments(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<PaymentDTO.Response> response = paymentService.getMyPayments(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Payment history fetched", response));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PaymentDTO.Response>>> getPendingPayments() {
        List<PaymentDTO.Response> response = paymentService.getPendingPayments();
        return ResponseEntity.ok(ApiResponse.success("Pending payments fetched", response));
    }
}
