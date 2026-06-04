package com.apartmentapp.complaint;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByResidentIdOrderByCreatedAtDesc(Long residentId);

    List<Complaint> findAllByOrderByCreatedAtDesc();
}
