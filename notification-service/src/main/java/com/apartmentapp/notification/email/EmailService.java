package com.apartmentapp.notification.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${notification.from-email}")
    private String fromEmail;

    public void sendPaymentReceipt(String toEmail, String residentName, Long paymentId,
                                   BigDecimal amount, String billingMonth,
                                   String razorpayPaymentId, LocalDateTime paidAt) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Payment Receipt — Apartment Management System");
            helper.setText(buildReceiptHtml(residentName, paymentId, amount,
                    billingMonth, razorpayPaymentId, paidAt), true);
            mailSender.send(message);
            log.info("Receipt email sent to {} for paymentId={}", toEmail, paymentId);
        } catch (MessagingException e) {
            log.error("Failed to send receipt email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildReceiptHtml(String name, Long paymentId, BigDecimal amount,
                                    String billingMonth, String txnId, LocalDateTime paidAt) {
        String formatted = paidAt != null
                ? paidAt.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
                : "—";
        return """
                <html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
                  <h2 style="color:#2563eb">Payment Receipt</h2>
                  <p>Dear <strong>%s</strong>,</p>
                  <p>Your payment has been received successfully. Here are the details:</p>
                  <table style="width:100%%;border-collapse:collapse;margin:16px 0">
                    <tr style="background:#f3f4f6">
                      <td style="padding:10px;border:1px solid #e5e7eb">Payment ID</td>
                      <td style="padding:10px;border:1px solid #e5e7eb"><strong>%d</strong></td>
                    </tr>
                    <tr>
                      <td style="padding:10px;border:1px solid #e5e7eb">Transaction ID</td>
                      <td style="padding:10px;border:1px solid #e5e7eb">%s</td>
                    </tr>
                    <tr style="background:#f3f4f6">
                      <td style="padding:10px;border:1px solid #e5e7eb">Amount</td>
                      <td style="padding:10px;border:1px solid #e5e7eb"><strong>₹%s</strong></td>
                    </tr>
                    <tr>
                      <td style="padding:10px;border:1px solid #e5e7eb">Billing Month</td>
                      <td style="padding:10px;border:1px solid #e5e7eb">%s</td>
                    </tr>
                    <tr style="background:#f3f4f6">
                      <td style="padding:10px;border:1px solid #e5e7eb">Paid On</td>
                      <td style="padding:10px;border:1px solid #e5e7eb">%s</td>
                    </tr>
                  </table>
                  <p style="color:#6b7280;font-size:12px">This is an auto-generated receipt. Please do not reply to this email.</p>
                </body></html>
                """.formatted(name, paymentId, txnId != null ? txnId : "—",
                amount.toPlainString(), billingMonth != null ? billingMonth : "—", formatted);
    }
}
