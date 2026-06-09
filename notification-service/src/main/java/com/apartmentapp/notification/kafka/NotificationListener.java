package com.apartmentapp.notification.kafka;

import com.apartmentapp.notification.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final EmailService emailService;

    @KafkaListener(topics = "ams.events", groupId = "notification-service")
    public void onEvent(AmsEvent event) {
        if (event == null || event.getEventType() == null) return;

        switch (event.getEventType()) {
            case "payment.completed" -> handlePaymentCompleted(event);
            case "announcement.created" -> handleAnnouncementCreated(event);
            default -> log.debug("Unhandled event type: {}", event.getEventType());
        }
    }

    private void handleAnnouncementCreated(AmsEvent event) {
        if (event.getRecipientEmails() == null || event.getRecipientEmails().isEmpty()) {
            log.warn("announcement.created event has no recipients");
            return;
        }
        for (String email : event.getRecipientEmails()) {
            emailService.sendAnnouncementEmail(email, event.getTitle(),
                    event.getContent(), event.getAdminName());
        }
        log.info("Announcement emails sent to {} residents", event.getRecipientEmails().size());
    }

    private void handlePaymentCompleted(AmsEvent event) {
        if (event.getResidentEmail() == null) {
            log.warn("payment.completed event missing residentEmail, paymentId={}", event.getPaymentId());
            return;
        }
        emailService.sendPaymentReceipt(
                event.getResidentEmail(),
                event.getResidentName(),
                event.getPaymentId(),
                event.getAmount(),
                event.getBillingMonth(),
                event.getRazorpayPaymentId(),
                event.getPaidAt()
        );
    }
}
