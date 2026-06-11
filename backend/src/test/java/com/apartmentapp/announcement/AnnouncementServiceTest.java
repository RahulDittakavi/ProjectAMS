package com.apartmentapp.announcement;

import com.apartmentapp.kafka.AnnouncementCreatedEvent;
import com.apartmentapp.kafka.AnnouncementEventProducer;
import com.apartmentapp.user.Role;
import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceTest {

    @Mock AnnouncementRepository announcementRepository;
    @Mock UserRepository userRepository;
    @Mock AnnouncementEventProducer eventProducer;

    @InjectMocks AnnouncementService announcementService;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = User.builder()
                .id(1L).name("Admin User").email("admin@ams.com").role(Role.ADMIN).build();
    }

    @Test
    void createAnnouncement_normal_doesNotPublishKafkaEvent() {
        AnnouncementDTO.CreateRequest request = new AnnouncementDTO.CreateRequest(
                "Test Title", "Test Content", AnnouncementPriority.NORMAL);

        Announcement saved = Announcement.builder()
                .id(10L).admin(admin).title("Test Title").content("Test Content")
                .priority(AnnouncementPriority.NORMAL).build();

        when(userRepository.findByEmail("admin@ams.com")).thenReturn(Optional.of(admin));
        when(announcementRepository.save(any())).thenReturn(saved);

        AnnouncementDTO.Response response = announcementService.createAnnouncement("admin@ams.com", request);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getPriority()).isEqualTo(AnnouncementPriority.NORMAL);
        verifyNoInteractions(eventProducer);
    }

    @Test
    void createAnnouncement_urgent_publishesKafkaEventWithRecipients() {
        AnnouncementDTO.CreateRequest request = new AnnouncementDTO.CreateRequest(
                "Urgent Notice", "Emergency info", AnnouncementPriority.URGENT);

        Announcement saved = Announcement.builder()
                .id(11L).admin(admin).title("Urgent Notice").content("Emergency info")
                .priority(AnnouncementPriority.URGENT).build();

        User resident1 = User.builder().id(2L).email("r1@test.com").role(Role.RESIDENT).isActive(true).build();
        User resident2 = User.builder().id(3L).email("r2@test.com").role(Role.RESIDENT).isActive(true).build();

        when(userRepository.findByEmail("admin@ams.com")).thenReturn(Optional.of(admin));
        when(announcementRepository.save(any())).thenReturn(saved);
        when(userRepository.findByRoleAndIsActiveTrue(Role.RESIDENT)).thenReturn(List.of(resident1, resident2));

        announcementService.createAnnouncement("admin@ams.com", request);

        ArgumentCaptor<AnnouncementCreatedEvent> captor = ArgumentCaptor.forClass(AnnouncementCreatedEvent.class);
        verify(eventProducer).publishAnnouncementCreated(captor.capture());
        AnnouncementCreatedEvent event = captor.getValue();
        assertThat(event.getEventType()).isEqualTo("announcement.created");
        assertThat(event.getRecipientEmails()).containsExactlyInAnyOrder("r1@test.com", "r2@test.com");
        assertThat(event.getAdminName()).isEqualTo("Admin User");
    }

    @Test
    void createAnnouncement_urgent_noResidents_doesNotPublishKafkaEvent() {
        AnnouncementDTO.CreateRequest request = new AnnouncementDTO.CreateRequest(
                "Urgent Notice", "Emergency info", AnnouncementPriority.URGENT);

        Announcement saved = Announcement.builder()
                .id(12L).admin(admin).title("Urgent Notice").content("Emergency info")
                .priority(AnnouncementPriority.URGENT).build();

        when(userRepository.findByEmail("admin@ams.com")).thenReturn(Optional.of(admin));
        when(announcementRepository.save(any())).thenReturn(saved);
        when(userRepository.findByRoleAndIsActiveTrue(Role.RESIDENT)).thenReturn(List.of());

        announcementService.createAnnouncement("admin@ams.com", request);

        verifyNoInteractions(eventProducer);
    }

    @Test
    void getAllAnnouncements_returnsMappedResponseList() {
        Announcement a1 = Announcement.builder()
                .id(1L).admin(admin).title("A1").content("C1").priority(AnnouncementPriority.NORMAL).build();
        Announcement a2 = Announcement.builder()
                .id(2L).admin(admin).title("A2").content("C2").priority(AnnouncementPriority.URGENT).build();

        when(announcementRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(a1, a2));

        List<AnnouncementDTO.Response> result = announcementService.getAllAnnouncements();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTitle()).isEqualTo("A1");
        assertThat(result.get(1).getPriority()).isEqualTo(AnnouncementPriority.URGENT);
    }
}
