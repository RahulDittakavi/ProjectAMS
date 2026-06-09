package com.apartmentapp.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnnouncementEventProducer {

    private static final String TOPIC = "ams.events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishAnnouncementCreated(AnnouncementCreatedEvent event) {
        kafkaTemplate.send(TOPIC, event.getEventType(), event);
        log.info("Published announcement.created event: title={}, recipients={}",
                event.getTitle(), event.getRecipientEmails().size());
    }
}
