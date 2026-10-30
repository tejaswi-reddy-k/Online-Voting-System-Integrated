package com.project.online_voting_system.controller;

import com.project.online_voting_system.dto.ElectionRequest;
import com.project.online_voting_system.dto.ElectionResultResponse;
import com.project.online_voting_system.model.Election;
import com.project.online_voting_system.service.ElectionService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/elections")
public class ElectionController {

    private final ElectionService electionService;

    public ElectionController(ElectionService electionService) {
        this.electionService = electionService;
    }

    @GetMapping("/public/published")
    public ResponseEntity<List<Election>> getPublishedElections() {
        return ResponseEntity.ok(electionService.getPublishedElections());
    }

    @GetMapping("/public/all")
    public ResponseEntity<List<Election>> getAllPublicElections() {
        return ResponseEntity.ok(electionService.getAllElections());
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<Election> getElectionById(@PathVariable Long id) {
        return ResponseEntity.ok(electionService.getElectionById(id));
    }

    @GetMapping("/public/results/{id}")
    public ResponseEntity<ElectionResultResponse> getResults(@PathVariable Long id) {
        return ResponseEntity.ok(electionService.getElectionResults(id));
    }

    @PostMapping("/public/{id}/email-results")
    public ResponseEntity<Map<String, String>> emailResults(
            @PathVariable Long id,
            @RequestParam String email
    ) {
        electionService.emailElectionResults(id, email);
        return ResponseEntity.ok(Map.of("message", "Official election results dispatched to " + email));
    }

    @GetMapping(value = "/public/stream-results/{id}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamResults(@PathVariable Long id) {
        return electionService.subscribeToResults(id);
    }

    @GetMapping(value = "/public/stream-all", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAllResults() {
        return electionService.subscribeToAllResults();
    }

    // Admin operations
    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Election>> getAllElections() {
        return ResponseEntity.ok(electionService.getAllElections());
    }

    @PostMapping("/admin/create")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Election> createElection(
            @Valid @RequestBody ElectionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(electionService.createElection(request, authentication.getName()));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Election> updateElection(
            @PathVariable Long id,
            @Valid @RequestBody ElectionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(electionService.updateElection(id, request, authentication.getName()));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> deleteElection(
            @PathVariable Long id,
            Authentication authentication
    ) {
        electionService.deleteElection(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Election deleted successfully with ID: " + id));
    }
}
