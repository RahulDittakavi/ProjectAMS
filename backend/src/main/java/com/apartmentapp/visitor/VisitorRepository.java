package com.apartmentapp.visitor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {

    List<Visitor> findByExitTimeIsNullOrderByEntryTimeDesc();

    List<Visitor> findAllByOrderByEntryTimeDesc();
}
