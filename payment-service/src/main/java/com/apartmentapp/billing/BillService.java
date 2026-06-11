package com.apartmentapp.billing;

import com.apartmentapp.config.CoreApiClient;
import com.apartmentapp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final MaintenanceConfigRepository configRepository;
    private final CoreApiClient coreApiClient;

    @Transactional
    public BillDTO.ConfigResponse setConfig(BillDTO.ConfigRequest request) {
        MaintenanceConfig config = MaintenanceConfig.builder()
                .block(request.getBlock())
                .monthlyAmount(request.getMonthlyAmount())
                .effectiveFrom(request.getEffectiveFrom())
                .build();
        MaintenanceConfig saved = configRepository.save(config);
        log.info("Maintenance config set: id={}, block={}, amount={}", saved.getId(), saved.getBlock(), saved.getMonthlyAmount());
        return mapConfig(saved);
    }

    @Transactional
    public int generateBills(String month) {
        log.info("Generating bills for month={}", month);
        YearMonth ym = YearMonth.parse(month);
        LocalDate dueDate = ym.atEndOfMonth().plusDays(15);

        List<CoreApiClient.ResidentInfo> residents = coreApiClient.getResidentsForBilling();
        int generated = 0;
        for (CoreApiClient.ResidentInfo resident : residents) {
            if (billRepository.existsByResidentIdAndBillingMonth(resident.getId(), month)) continue;
            Optional<BigDecimal> amount = resolveAmount(resident.getBlock());
            if (amount.isEmpty()) {
                log.warn("No maintenance config for block={}, skipping residentId={}", resident.getBlock(), resident.getId());
                continue;
            }
            billRepository.save(Bill.builder()
                    .residentId(resident.getId())
                    .residentName(resident.getName())
                    .residentEmail(resident.getEmail())
                    .flatNumber(resident.getFlatNumber())
                    .block(resident.getBlock())
                    .billingMonth(month)
                    .amount(amount.get())
                    .dueDate(dueDate)
                    .build());
            generated++;
        }
        log.info("Bills generated for {}: count={}", month, generated);
        return generated;
    }

    public List<BillDTO.BillResponse> getBillsByResident(Long residentId) {
        return billRepository.findByResidentIdOrderByBillingMonthDesc(residentId)
                .stream().map(this::mapBill).toList();
    }

    public List<BillDTO.BillResponse> getDuesByResident(Long residentId) {
        return billRepository.findByResidentIdAndStatusInOrderByBillingMonthDesc(
                        residentId, List.of(BillStatus.UNPAID, BillStatus.OVERDUE))
                .stream().map(this::mapBill).toList();
    }

    public BillDTO.BillResponse getReceipt(Long billId, Long residentId, boolean isAdmin) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));
        if (!isAdmin && !bill.getResidentId().equals(residentId)) {
            log.warn("Unauthorized receipt access: billId={}, requestedBy={}", billId, residentId);
            throw new RuntimeException("Access denied");
        }
        return mapBill(bill);
    }

    @Transactional
    public void markBillPaid(Long billId, LocalDateTime paidAt) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));
        bill.setStatus(BillStatus.PAID);
        bill.setPaidAt(paidAt);
        billRepository.save(bill);
        log.info("Bill marked paid: id={}, residentId={}, month={}", billId, bill.getResidentId(), bill.getBillingMonth());
    }

    public BillDTO.CollectionSummary getCollectionSummary(String month) {
        List<Bill> allBills = billRepository.findByBillingMonthOrderByBlockAscFlatNumberAsc(month);
        long paidCount = billRepository.countByBillingMonthAndStatus(month, BillStatus.PAID);
        BigDecimal collected = billRepository.sumAmountByBillingMonthAndStatus(month, BillStatus.PAID);
        List<BillDTO.BillResponse> defaulters = allBills.stream()
                .filter(b -> b.getStatus() != BillStatus.PAID)
                .map(this::mapBill).toList();

        return BillDTO.CollectionSummary.builder()
                .month(month)
                .totalBills(allBills.size())
                .paidCount(paidCount)
                .defaulterCount(defaulters.size())
                .collectedAmount(collected != null ? collected : BigDecimal.ZERO)
                .defaulters(defaulters)
                .build();
    }

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void markOverdueJob() {
        log.info("Running scheduled overdue-mark job");
        billRepository.markOverdue(BillStatus.OVERDUE, BillStatus.UNPAID, LocalDate.now());
    }

    @Scheduled(cron = "0 0 1 1 * *")
    public void autoGenerateBillsJob() {
        String month = YearMonth.now().toString();
        log.info("Running scheduled bill generation for {}", month);
        generateBills(month);
    }

    private Optional<BigDecimal> resolveAmount(String block) {
        return configRepository.findFirstByBlockOrderByEffectiveFromDesc(block)
                .map(MaintenanceConfig::getMonthlyAmount)
                .or(() -> configRepository.findFirstByBlockIsNullOrderByEffectiveFromDesc()
                        .map(MaintenanceConfig::getMonthlyAmount));
    }

    private BillDTO.BillResponse mapBill(Bill b) {
        return BillDTO.BillResponse.builder()
                .id(b.getId())
                .residentId(b.getResidentId())
                .residentName(b.getResidentName())
                .flatNumber(b.getFlatNumber())
                .block(b.getBlock())
                .billingMonth(b.getBillingMonth())
                .amount(b.getAmount())
                .dueDate(b.getDueDate())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .paidAt(b.getPaidAt())
                .build();
    }

    private BillDTO.ConfigResponse mapConfig(MaintenanceConfig c) {
        return BillDTO.ConfigResponse.builder()
                .id(c.getId())
                .block(c.getBlock())
                .monthlyAmount(c.getMonthlyAmount())
                .effectiveFrom(c.getEffectiveFrom())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
