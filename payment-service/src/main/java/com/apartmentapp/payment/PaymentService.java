package com.apartmentapp.payment;

import com.apartmentapp.billing.Bill;
import com.apartmentapp.billing.BillRepository;
import com.apartmentapp.billing.BillService;
import com.apartmentapp.billing.BillStatus;
import com.apartmentapp.kafka.PaymentCompletedEvent;
import com.apartmentapp.kafka.PaymentEventProducer;
import com.apartmentapp.security.JwtPrincipal;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BillRepository billRepository;
    private final BillService billService;
    private final PaymentEventProducer eventProducer;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Transactional
    public PaymentDTO.OrderResponse createOrder(JwtPrincipal principal, PaymentDTO.CreateOrderRequest request) {
        Bill bill = null;
        BigDecimal amount = request.getAmount();

        if (request.getBillId() != null) {
            bill = billRepository.findById(request.getBillId())
                    .orElseThrow(() -> new RuntimeException("Bill not found"));
            if (!bill.getResidentId().equals(principal.getUserId())) {
                throw new RuntimeException("Bill does not belong to this resident");
            }
            if (bill.getStatus() == BillStatus.PAID) {
                throw new RuntimeException("Bill is already paid");
            }
            amount = bill.getAmount();
        }
        if (amount == null) throw new RuntimeException("Amount is required");

        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject options = new JSONObject();
            options.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
            options.put("currency", "INR");
            options.put("receipt", "rcpt_" + System.currentTimeMillis());
            Order razorpayOrder = client.orders.create(options);
            String rzpOrderId = razorpayOrder.get("id");

            Payment payment = Payment.builder()
                    .residentId(principal.getUserId())
                    .residentName(principal.getName())
                    .residentEmail(principal.getEmail())
                    .amount(amount)
                    .paymentType(request.getPaymentType())
                    .razorpayOrderId(rzpOrderId)
                    .month(request.getMonth() != null ? request.getMonth()
                            : (bill != null ? bill.getBillingMonth() : null))
                    .bill(bill)
                    .build();
            Payment saved = paymentRepository.save(payment);

            return PaymentDTO.OrderResponse.builder()
                    .paymentId(saved.getId())
                    .razorpayOrderId(rzpOrderId)
                    .amount(amount)
                    .currency("INR")
                    .build();
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage());
        }
    }

    @Transactional
    public PaymentDTO.Response verifyPayment(PaymentDTO.VerifyPaymentRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment order not found"));
        try {
            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String computed = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));

            if (computed.equals(request.getRazorpaySignature())) {
                payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaidAt(LocalDateTime.now());
                if (payment.getBill() != null) {
                    billService.markBillPaid(payment.getBill().getId(), payment.getPaidAt());
                }
                Payment saved = paymentRepository.save(payment);
                eventProducer.publishPaymentCompleted(PaymentCompletedEvent.builder()
                        .eventType("payment.completed")
                        .paymentId(saved.getId())
                        .residentId(saved.getResidentId())
                        .residentName(saved.getResidentName())
                        .residentEmail(saved.getResidentEmail())
                        .amount(saved.getAmount())
                        .billingMonth(saved.getMonth())
                        .razorpayPaymentId(saved.getRazorpayPaymentId())
                        .paidAt(saved.getPaidAt())
                        .build());
                return mapToResponse(saved);
            } else {
                payment.setStatus(PaymentStatus.FAILED);
            }
            return mapToResponse(paymentRepository.save(payment));
        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed: " + e.getMessage());
        }
    }

    public List<PaymentDTO.Response> getMyPayments(Long residentId) {
        return paymentRepository.findByResidentIdOrderByCreatedAtDesc(residentId)
                .stream().map(this::mapToResponse).toList();
    }

    public List<PaymentDTO.Response> getPendingPayments() {
        return paymentRepository.findByStatusOrderByCreatedAtDesc(PaymentStatus.PENDING)
                .stream().map(this::mapToResponse).toList();
    }

    private PaymentDTO.Response mapToResponse(Payment p) {
        return PaymentDTO.Response.builder()
                .id(p.getId())
                .residentId(p.getResidentId())
                .residentName(p.getResidentName())
                .amount(p.getAmount())
                .paymentType(p.getPaymentType())
                .status(p.getStatus())
                .razorpayOrderId(p.getRazorpayOrderId())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .month(p.getMonth())
                .billId(p.getBill() != null ? p.getBill().getId() : null)
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
