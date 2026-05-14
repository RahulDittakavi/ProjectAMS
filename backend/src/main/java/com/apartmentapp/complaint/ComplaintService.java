package com.apartmentapp.complaint;

import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        return mapToResponse(complaintRepository.save(complaint));
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

    @Transactional
    public ComplaintDTO.Response updateStatus(Long id, ComplaintDTO.StatusUpdateRequest request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
        complaint.setStatus(request.getStatus());
        return mapToResponse(complaintRepository.save(complaint));
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
