package com.apartmentapp.complaint;

import com.apartmentapp.exception.ResourceNotFoundException;
import com.apartmentapp.user.Role;
import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock ComplaintRepository complaintRepository;
    @Mock UserRepository userRepository;

    @InjectMocks ComplaintService complaintService;

    private User resident;

    @BeforeEach
    void setUp() {
        resident = User.builder()
                .id(1L).name("John Doe").email("john@apt.com").role(Role.RESIDENT).build();
    }

    @Test
    void createComplaint_success_returnsMappedResponse() {
        ComplaintDTO.CreateRequest request = new ComplaintDTO.CreateRequest(
                "Leaking pipe", "Water dripping from ceiling", ComplaintCategory.PLUMBING);

        Complaint saved = Complaint.builder()
                .id(5L).resident(resident).title("Leaking pipe")
                .description("Water dripping from ceiling").category(ComplaintCategory.PLUMBING)
                .status(ComplaintStatus.OPEN).build();

        when(userRepository.findByEmail("john@apt.com")).thenReturn(Optional.of(resident));
        when(complaintRepository.save(any())).thenReturn(saved);

        ComplaintDTO.Response response = complaintService.createComplaint("john@apt.com", request);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getTitle()).isEqualTo("Leaking pipe");
        assertThat(response.getStatus()).isEqualTo(ComplaintStatus.OPEN);
        assertThat(response.getResidentName()).isEqualTo("John Doe");
    }

    @Test
    void updateStatus_success_changesStatus() {
        Complaint complaint = Complaint.builder()
                .id(5L).resident(resident).title("Leaking pipe")
                .category(ComplaintCategory.PLUMBING).status(ComplaintStatus.OPEN).build();

        Complaint updated = Complaint.builder()
                .id(5L).resident(resident).title("Leaking pipe")
                .category(ComplaintCategory.PLUMBING).status(ComplaintStatus.IN_PROGRESS).build();

        ComplaintDTO.StatusUpdateRequest request = new ComplaintDTO.StatusUpdateRequest(ComplaintStatus.IN_PROGRESS);

        when(complaintRepository.findById(5L)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any())).thenReturn(updated);

        ComplaintDTO.Response response = complaintService.updateStatus(5L, request);

        assertThat(response.getStatus()).isEqualTo(ComplaintStatus.IN_PROGRESS);
    }

    @Test
    void updateStatus_notFound_throwsResourceNotFoundException() {
        when(complaintRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.updateStatus(99L,
                new ComplaintDTO.StatusUpdateRequest(ComplaintStatus.RESOLVED)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void getMyComplaints_returnOnlyResidentComplaints() {
        Complaint c1 = Complaint.builder().id(1L).resident(resident).title("C1")
                .category(ComplaintCategory.ELECTRICAL).status(ComplaintStatus.OPEN).build();
        Complaint c2 = Complaint.builder().id(2L).resident(resident).title("C2")
                .category(ComplaintCategory.PLUMBING).status(ComplaintStatus.RESOLVED).build();

        when(userRepository.findByEmail("john@apt.com")).thenReturn(Optional.of(resident));
        when(complaintRepository.findByResidentIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(c1, c2));

        List<ComplaintDTO.Response> result = complaintService.getMyComplaints("john@apt.com");

        assertThat(result).hasSize(2);
        verify(complaintRepository).findByResidentIdOrderByCreatedAtDesc(1L);
    }
}
