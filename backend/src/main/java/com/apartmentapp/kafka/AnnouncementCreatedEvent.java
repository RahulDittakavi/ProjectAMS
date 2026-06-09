package com.apartmentapp.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementCreatedEvent {

    private String eventType;
    private String title;
    private String content;
    private String priority;
    private String adminName;
    private List<String> recipientEmails;
}
