package com.apartmentapp.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentDTO {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CreateOrderRequest {
        private BigDecimal amount;

        @NotNull(message = "Payment type is required")
        private PaymentType paymentType;

        private String month;
        private Long billId;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VerifyPaymentRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderResponse {
        private Long paymentId;
        private String razorpayOrderId;
        private BigDecimal amount;
        private String currency;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long residentId;
        private String residentName;
        private BigDecimal amount;
        private PaymentType paymentType;
        private PaymentStatus status;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String month;
        private Long billId;
        private LocalDateTime paidAt;
        private LocalDateTime createdAt;
    }
}
