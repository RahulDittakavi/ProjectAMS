package com.apartmentapp.notification.kafka;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AmsEvent {

    private String eventType;

    // payment.completed fields
    private Long paymentId;
    private Long residentId;
    private String residentName;
    private String residentEmail;
    private BigDecimal amount;
    private String billingMonth;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;

    // announcement.created fields (Phase 5)
    private String title;
    private String content;
    private String priority;
    private String adminName;
    private java.util.List<String> recipientEmails;
}
