package com.apartmentapp.billing;

import com.apartmentapp.config.CoreApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

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
        return mapConfig(configRepository.save(config));
    }

    @Transactional
    public int generateBills(String month) {
        YearMonth ym = YearMonth.parse(month);
        LocalDate dueDate = ym.atEndOfMonth().plusDays(15);

        List<CoreApiClient.ResidentInfo> residents = coreApiClient.getResidentsForBilling();
        int generated = 0;
        for (CoreApiClient.ResidentInfo resident : residents) {
            if (billRepository.existsByResidentIdAndBillingMonth(resident.getId(), month)) continue;
            Optional<BigDecimal> amount = resolveAmount(resident.getBlock());
            if (amount.isEmpty()) continue;

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
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (!isAdmin && !bill.getResidentId().equals(residentId)) {
            throw new RuntimeException("Access denied");
        }
        return mapBill(bill);
    }

    @Transactional
    public void markBillPaid(Long billId, LocalDateTime paidAt) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        bill.setStatus(BillStatus.PAID);
        bill.setPaidAt(paidAt);
        billRepository.save(bill);
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
        billRepository.markOverdue(BillStatus.OVERDUE, BillStatus.UNPAID, LocalDate.now());
    }

    @Scheduled(cron = "0 0 1 1 * *")
    public void autoGenerateBillsJob() {
        generateBills(YearMonth.now().toString());
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
