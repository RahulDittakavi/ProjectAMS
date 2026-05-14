package com.apartmentapp.announcement;

import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

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
        return mapToResponse(announcementRepository.save(announcement));
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
