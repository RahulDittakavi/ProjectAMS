package com.apartmentapp.billing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class BillDTO {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ConfigRequest {
        @NotNull(message = "Monthly amount is required")
        @Positive(message = "Amount must be positive")
        private BigDecimal monthlyAmount;
        private String block;
        @NotNull(message = "Effective from date is required")
        private LocalDate effectiveFrom;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ConfigResponse {
        private Long id;
        private String block;
        private BigDecimal monthlyAmount;
        private LocalDate effectiveFrom;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BillResponse {
        private Long id;
        private Long residentId;
        private String residentName;
        private String flatNumber;
        private String block;
        private String billingMonth;
        private BigDecimal amount;
        private LocalDate dueDate;
        private BillStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime paidAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CollectionSummary {
        private String month;
        private long totalBills;
        private long paidCount;
        private long defaulterCount;
        private BigDecimal collectedAmount;
        private List<BillResponse> defaulters;
    }
}
