package com.project.online_voting_system.service;

import com.project.online_voting_system.dto.ElectionResultResponse;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class ElectionStreamService {

    private static final Long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    private final Map<Long, List<SseEmitter>> electionEmitters = new ConcurrentHashMap<>();
    private final List<SseEmitter> globalEmitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(Long electionId, ElectionResultResponse initialData) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        List<SseEmitter> emitters = electionEmitters.computeIfAbsent(electionId, k -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);

        emitter.onCompletion(() -> removeEmitter(electionId, emitter));
        emitter.onTimeout(() -> removeEmitter(electionId, emitter));
        emitter.onError(e -> removeEmitter(electionId, emitter));

        // Push current results immediately upon subscribing
        if (initialData != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("results")
                        .data(initialData)
                        .id(String.valueOf(System.currentTimeMillis())));
            } catch (IOException e) {
                System.err.println("[WARN] Failed to send initial SSE payload for election " + electionId + ": " + e.getMessage());
                emitter.complete();
            }
        }

        System.out.println("[INFO] Client subscribed to SSE stream for election ID: " + electionId + ". Active subscribers: " + emitters.size());
        return emitter;
    }

    public SseEmitter subscribeGlobal(List<ElectionResultResponse> initialData) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        globalEmitters.add(emitter);

        emitter.onCompletion(() -> globalEmitters.remove(emitter));
        emitter.onTimeout(() -> globalEmitters.remove(emitter));
        emitter.onError(e -> globalEmitters.remove(emitter));

        if (initialData != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("all-results")
                        .data(initialData)
                        .id(String.valueOf(System.currentTimeMillis())));
            } catch (IOException e) {
                emitter.complete();
            }
        }

        return emitter;
    }

    public void broadcastResults(Long electionId, ElectionResultResponse results) {
        List<SseEmitter> emitters = electionEmitters.get(electionId);
        if (emitters != null && !emitters.isEmpty()) {
            System.out.println("[INFO] Broadcasting live results for election " + electionId + " to " + emitters.size() + " SSE clients");
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("results")
                            .data(results)
                            .id(String.valueOf(System.currentTimeMillis())));
                } catch (Exception ex) {
                    deadEmitters.add(emitter);
                }
            }

            emitters.removeAll(deadEmitters);
        }

        // Also broadcast to global stream subscribers
        if (!globalEmitters.isEmpty()) {
            List<SseEmitter> deadGlobal = new CopyOnWriteArrayList<>();
            for (SseEmitter emitter : globalEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("results")
                            .data(results)
                            .id(String.valueOf(System.currentTimeMillis())));
                } catch (Exception ex) {
                    deadGlobal.add(emitter);
                }
            }
            globalEmitters.removeAll(deadGlobal);
        }
    }

    private void removeEmitter(Long electionId, SseEmitter emitter) {
        List<SseEmitter> emitters = electionEmitters.get(electionId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                electionEmitters.remove(electionId);
            }
        }
        System.out.println("[INFO] SSE emitter removed for election ID: " + electionId);
    }

    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        // Send heartbeat comment to keep HTTP connections alive
        electionEmitters.forEach((id, emitters) -> {
            List<SseEmitter> dead = new CopyOnWriteArrayList<>();
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception ex) {
                    dead.add(emitter);
                }
            }
            emitters.removeAll(dead);
        });

        List<SseEmitter> deadGlobal = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : globalEmitters) {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (Exception ex) {
                deadGlobal.add(emitter);
            }
        }
        globalEmitters.removeAll(deadGlobal);
    }
}

