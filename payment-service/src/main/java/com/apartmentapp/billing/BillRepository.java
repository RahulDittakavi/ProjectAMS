package com.apartmentapp.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findByResidentIdOrderByBillingMonthDesc(Long residentId);

    List<Bill> findByResidentIdAndStatusInOrderByBillingMonthDesc(Long residentId, List<BillStatus> statuses);

    List<Bill> findByBillingMonthOrderByBlockAscFlatNumberAsc(String billingMonth);

    boolean existsByResidentIdAndBillingMonth(Long residentId, String billingMonth);

    long countByBillingMonthAndStatus(String billingMonth, BillStatus status);

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM Bill b WHERE b.billingMonth = :month AND b.status = :status")
    BigDecimal sumAmountByBillingMonthAndStatus(@Param("month") String month, @Param("status") BillStatus status);

    @Modifying
    @Query("UPDATE Bill b SET b.status = :overdue WHERE b.status = :unpaid AND b.dueDate < :today")
    int markOverdue(@Param("overdue") BillStatus overdue, @Param("unpaid") BillStatus unpaid, @Param("today") LocalDate today);
}
