package com.apartmentapp.payment;

import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Transactional
    public PaymentDTO.OrderResponse createOrder(String email, PaymentDTO.CreateOrderRequest request) {
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject options = new JSONObject();
            options.put("amount", request.getAmount().multiply(BigDecimal.valueOf(100)).intValue());
            options.put("currency", "INR");
            options.put("receipt", "rcpt_" + System.currentTimeMillis());
            Order razorpayOrder = client.orders.create(options);
            String rzpOrderId = razorpayOrder.get("id");

            Payment payment = Payment.builder()
                    .resident(resident)
                    .amount(request.getAmount())
                    .paymentType(request.getPaymentType())
                    .razorpayOrderId(rzpOrderId)
                    .month(request.getMonth())
                    .build();
            Payment saved = paymentRepository.save(payment);

            return PaymentDTO.OrderResponse.builder()
                    .paymentId(saved.getId())
                    .razorpayOrderId(rzpOrderId)
                    .amount(request.getAmount())
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
            } else {
                payment.setStatus(PaymentStatus.FAILED);
            }
            return mapToResponse(paymentRepository.save(payment));
        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed: " + e.getMessage());
        }
    }

    public List<PaymentDTO.Response> getMyPayments(String email) {
        User resident = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return paymentRepository.findByResidentIdOrderByCreatedAtDesc(resident.getId())
                .stream().map(this::mapToResponse).toList();
    }

    public List<PaymentDTO.Response> getPendingPayments() {
        return paymentRepository.findByStatusOrderByCreatedAtDesc(PaymentStatus.PENDING)
                .stream().map(this::mapToResponse).toList();
    }

    private PaymentDTO.Response mapToResponse(Payment p) {
        return PaymentDTO.Response.builder()
                .id(p.getId())
                .residentId(p.getResident().getId())
                .residentName(p.getResident().getName())
                .amount(p.getAmount())
                .paymentType(p.getPaymentType())
                .status(p.getStatus())
                .razorpayOrderId(p.getRazorpayOrderId())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .month(p.getMonth())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
