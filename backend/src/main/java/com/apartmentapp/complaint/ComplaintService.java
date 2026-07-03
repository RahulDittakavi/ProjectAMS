package com.apartmentapp.complaint;

import com.apartmentapp.exception.ResourceNotFoundException;
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
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    @Transactional
    public ComplaintDTO.Response createComplaint(String email, ComplaintDTO.CreateRequest request) {
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Complaint complaint = Complaint.builder()
                .resident(resident)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .build();
        Complaint saved = complaintRepository.save(complaint);
        log.info("Complaint created: id={}, residentId={}, category={}", saved.getId(), resident.getId(), saved.getCategory());
        return mapToResponse(saved);
    }

    public List<ComplaintDTO.Response> getMyComplaints(String email) {
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return complaintRepository.findByResidentIdOrderByCreatedAtDesc(resident.getId())
                .stream().map(this::mapToResponse).toList();
    }

    public List<ComplaintDTO.Response> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).toList();
    }

    public List<ComplaintDTO.Response> deleteComplaint(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
        complaintRepository.delete(complaint);
        log.info("Complaint deleted: id={}", id);
        return getAllComplaints();
    }

    @Transactional
    public ComplaintDTO.Response updateStatus(Long id, ComplaintDTO.StatusUpdateRequest request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
        ComplaintStatus previous = complaint.getStatus();
        complaint.setStatus(request.getStatus());
        Complaint saved = complaintRepository.save(complaint);
        log.info("Complaint status updated: id={}, {} -> {}", id, previous, saved.getStatus());
        return mapToResponse(saved);
    }

    private ComplaintDTO.Response mapToResponse(Complaint c) {
        return ComplaintDTO.Response.builder()
                .id(c.getId())
                .residentId(c.getResident().getId())
                .residentName(c.getResident().getName())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
