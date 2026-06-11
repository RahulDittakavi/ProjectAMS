package com.apartmentapp.payment;

import com.apartmentapp.billing.BillRepository;
import com.apartmentapp.billing.BillService;
import com.apartmentapp.exception.ResourceNotFoundException;
import com.apartmentapp.kafka.PaymentEventProducer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock PaymentRepository paymentRepository;
    @Mock BillRepository billRepository;
    @Mock BillService billService;
    @Mock PaymentEventProducer eventProducer;

    @InjectMocks PaymentService paymentService;

    private static final String TEST_SECRET = "test-razorpay-secret";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "razorpayKeySecret", TEST_SECRET);
        ReflectionTestUtils.setField(paymentService, "razorpayKeyId", "rzp_test_dummy");
    }

    @Test
    void verifyPayment_validSignature_marksSuccessAndPublishesEvent() throws Exception {
        String orderId = "order_abc123";
        String paymentId = "pay_xyz789";
        String payload = orderId + "|" + paymentId;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(TEST_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String validSignature = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));

        Payment pending = Payment.builder()
                .id(1L).residentId(10L).residentName("Jane").residentEmail("jane@apt.com")
                .amount(BigDecimal.valueOf(2500)).razorpayOrderId(orderId)
                .status(PaymentStatus.PENDING).paymentType(PaymentType.MAINTENANCE).build();

        Payment saved = Payment.builder()
                .id(1L).residentId(10L).residentName("Jane").residentEmail("jane@apt.com")
                .amount(BigDecimal.valueOf(2500)).razorpayOrderId(orderId)
                .razorpayPaymentId(paymentId).status(PaymentStatus.SUCCESS)
                .paymentType(PaymentType.MAINTENANCE).build();

        when(paymentRepository.findByRazorpayOrderId(orderId)).thenReturn(Optional.of(pending));
        when(paymentRepository.save(any())).thenReturn(saved);

        PaymentDTO.VerifyPaymentRequest request = new PaymentDTO.VerifyPaymentRequest(orderId, paymentId, validSignature);
        PaymentDTO.Response response = paymentService.verifyPayment(request);

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        verify(eventProducer).publishPaymentCompleted(any());
    }

    @Test
    void verifyPayment_invalidSignature_marksFailedAndSkipsEvent() {
        String orderId = "order_abc123";

        Payment pending = Payment.builder()
                .id(1L).residentId(10L).residentName("Jane").residentEmail("jane@apt.com")
                .amount(BigDecimal.valueOf(2500)).razorpayOrderId(orderId)
                .status(PaymentStatus.PENDING).paymentType(PaymentType.MAINTENANCE).build();

        Payment failed = Payment.builder()
                .id(1L).residentId(10L).residentName("Jane").residentEmail("jane@apt.com")
                .amount(BigDecimal.valueOf(2500)).razorpayOrderId(orderId)
                .status(PaymentStatus.FAILED).paymentType(PaymentType.MAINTENANCE).build();

        when(paymentRepository.findByRazorpayOrderId(orderId)).thenReturn(Optional.of(pending));
        when(paymentRepository.save(any())).thenReturn(failed);

        PaymentDTO.VerifyPaymentRequest request = new PaymentDTO.VerifyPaymentRequest(
                orderId, "pay_xyz789", "invalid_signature_here");
        PaymentDTO.Response response = paymentService.verifyPayment(request);

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verifyNoInteractions(eventProducer);
    }

    @Test
    void verifyPayment_orderNotFound_throwsResourceNotFoundException() {
        when(paymentRepository.findByRazorpayOrderId("order_missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.verifyPayment(
                new PaymentDTO.VerifyPaymentRequest("order_missing", "pay_x", "sig")))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("order_missing");
    }
}
