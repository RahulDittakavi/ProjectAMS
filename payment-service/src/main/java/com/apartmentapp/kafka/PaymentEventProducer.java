package com.apartmentapp.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventProducer {

    private static final String TOPIC = "ams.events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishPaymentCompleted(PaymentCompletedEvent event) {
        kafkaTemplate.send(TOPIC, event.getEventType(), event);
        log.info("Published payment.completed event for paymentId={}", event.getPaymentId());
    }
}
