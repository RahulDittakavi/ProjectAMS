package com.apartmentapp.billing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MaintenanceConfigRepository extends JpaRepository<MaintenanceConfig, Long> {

    Optional<MaintenanceConfig> findFirstByBlockOrderByEffectiveFromDesc(String block);

    Optional<MaintenanceConfig> findFirstByBlockIsNullOrderByEffectiveFromDesc();
}
