package com.apartmentapp.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {

    private String eventType;
    private Long paymentId;
    private Long residentId;
    private String residentName;
    private String residentEmail;
    private BigDecimal amount;
    private String billingMonth;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;
}
