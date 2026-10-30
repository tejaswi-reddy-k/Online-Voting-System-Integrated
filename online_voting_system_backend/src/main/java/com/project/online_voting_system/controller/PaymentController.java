package com.project.online_voting_system.controller;

import com.project.online_voting_system.dto.PaymentOrderRequest;
import com.project.online_voting_system.dto.PaymentOrderResponse;
import com.project.online_voting_system.dto.PaymentReceiptResponse;
import com.project.online_voting_system.dto.PaymentVerificationRequest;
import com.project.online_voting_system.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Create an official Electoral Security Deposit payment order for candidate nomination
     */
    @PostMapping("/create-order")
    public ResponseEntity<PaymentOrderResponse> createOrder(
            @Valid @RequestBody PaymentOrderRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "candidate@citizen.in";
        return ResponseEntity.ok(paymentService.createOrder(request, userEmail));
    }

    /**
     * Verify payment transaction and generate official Treasury Receipt
     */
    @PostMapping("/verify")
    public ResponseEntity<PaymentReceiptResponse> verifyPayment(
            @Valid @RequestBody PaymentVerificationRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : "candidate@citizen.in";
        return ResponseEntity.ok(paymentService.verifyPayment(request, userEmail));
    }

    /**
     * View statutory nomination payment receipt
     */
    @GetMapping("/receipt/{transactionId}")
    public ResponseEntity<PaymentReceiptResponse> getReceipt(@PathVariable String transactionId) {
        return ResponseEntity.ok(paymentService.getReceipt(transactionId));
    }
}
