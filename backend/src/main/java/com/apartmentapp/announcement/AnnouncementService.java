package com.apartmentapp.announcement;

import com.apartmentapp.kafka.AnnouncementCreatedEvent;
import com.apartmentapp.kafka.AnnouncementEventProducer;
import com.apartmentapp.user.Role;
import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final AnnouncementEventProducer eventProducer;

    @Transactional
    public AnnouncementDTO.Response createAnnouncement(String email, AnnouncementDTO.CreateRequest request) {
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Announcement announcement = Announcement.builder()
                .admin(admin)
                .title(request.getTitle())
                .content(request.getContent())
                .priority(request.getPriority() != null ? request.getPriority() : AnnouncementPriority.NORMAL)
                .build();
        Announcement saved = announcementRepository.save(announcement);
        log.info("Announcement created: id={}, priority={}, admin={}", saved.getId(), saved.getPriority(), email);

        if (saved.getPriority() == AnnouncementPriority.URGENT) {
            List<String> emails = userRepository.findByRoleAndIsActiveTrue(Role.RESIDENT)
                    .stream().map(User::getEmail).toList();
            if (!emails.isEmpty()) {
                log.info("URGENT announcement: publishing Kafka event to {} residents", emails.size());
                eventProducer.publishAnnouncementCreated(AnnouncementCreatedEvent.builder()
                        .eventType("announcement.created")
                        .title(saved.getTitle())
                        .content(saved.getContent())
                        .priority(saved.getPriority().name())
                        .adminName(admin.getName())
                        .recipientEmails(emails)
                        .build());
            } else {
                log.warn("URGENT announcement created but no active residents found to notify");
            }
        }

        return mapToResponse(saved);
    }

    public List<AnnouncementDTO.Response> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).toList();
    }

    private AnnouncementDTO.Response mapToResponse(Announcement a) {
        return AnnouncementDTO.Response.builder()
                .id(a.getId())
                .adminId(a.getAdmin().getId())
                .adminName(a.getAdmin().getName())
                .title(a.getTitle())
                .content(a.getContent())
                .priority(a.getPriority())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
