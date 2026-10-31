package com.project.online_voting_system.config;

import com.project.online_voting_system.model.Role;
import com.project.online_voting_system.model.User;
import com.project.online_voting_system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initDefaultAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            com.project.online_voting_system.repository.ElectionRepository electionRepository,
            com.project.online_voting_system.repository.CandidateRepository candidateRepository
    ) {
        return args -> {
            if (!userRepository.existsByEmail("admin@gmail.com")) {
                User admin = new User(
                        "admin@gmail.com",
                        passwordEncoder.encode("Tejaswi@123"),
                        "Chief Election Administrator",
                        "IND-ADM00001",
                        "National Parliamentary HQ",
                        Role.ADMIN,
                        true
                );
                admin.setDob("1990-01-01");
                userRepository.save(admin);
                System.out.println("[BOOTSTRAP] Created default Admin: admin@gmail.com / Tejaswi@123");
            }

            if (!userRepository.existsByEmail("voter@gmail.com")) {
                User voter = new User(
                        "voter@gmail.com",
                        passwordEncoder.encode("Tejaswi@123"),
                        "Registered Elector",
                        "IND-VOT00001",
                        "Varanasi Parliamentary Constituency (UP-77)",
                        Role.VOTER,
                        true
                );
                voter.setDob("2000-01-01");
                userRepository.save(voter);
                System.out.println("[BOOTSTRAP] Created default Voter: voter@gmail.com / Tejaswi@123");
            }

            // Enforce that only admin@gmail.com and voter@gmail.com exist
            userRepository.findAll().forEach(u -> {
                if (!"admin@gmail.com".equalsIgnoreCase(u.getEmail()) && !"voter@gmail.com".equalsIgnoreCase(u.getEmail())) {
                    userRepository.delete(u);
                    System.out.println("[BOOTSTRAP] Removed non-target user: " + u.getEmail());
                }
            });

            if (electionRepository.count() == 0) {
                java.time.LocalDateTime now = java.time.LocalDateTime.now();

                // 1. Ongoing Election (Active for voting)
                com.project.online_voting_system.model.Election e1 = new com.project.online_voting_system.model.Election(
                        "18th Lok Sabha General Election 2026",
                        "Official Parliamentary General Election to elect the Member of Parliament (Lok Sabha). Secure digital ballot certified with cryptographic receipt.",
                        now.minusDays(5),
                        now.plusDays(30),
                        true,
                        false
                );
                com.project.online_voting_system.model.Election savedE1 = electionRepository.save(e1);

                com.project.online_voting_system.model.Candidate c1 = new com.project.online_voting_system.model.Candidate(
                        "Narendra Damodardas Modi", "Bharatiya Janata Party (BJP)",
                        "Viksit Bharat 2047, semiconductor manufacturing hubs, high-speed rail, and digital public infrastructure.",
                        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
                        savedE1
                );
                c1.setVoteCount(24520);

                com.project.online_voting_system.model.Candidate c2 = new com.project.online_voting_system.model.Candidate(
                        "Ajay Rai", "Indian National Congress (INC)",
                        "Yuva Nyay, rural employment expansion, legal MSP guarantee for farmers, and universal healthcare clinics.",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
                        savedE1
                );
                c2.setVoteCount(18430);

                com.project.online_voting_system.model.Candidate c3 = new com.project.online_voting_system.model.Candidate(
                        "Ather Jamal Lari", "Bahujan Samaj Party (BSP)",
                        "Social justice, constitutional equality, higher education scholarships for backward classes, and local urban sanitation.",
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
                        savedE1
                );
                c3.setVoteCount(9140);

                com.project.online_voting_system.model.Candidate c4 = new com.project.online_voting_system.model.Candidate(
                        "NOTA (None of the Above)", "Constitutional Option / Neutral",
                        "Exercise your fundamental democratic right to reject all nominated candidates in this constituency.",
                        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=400",
                        savedE1
                );
                c4.setVoteCount(1240);

                candidateRepository.saveAll(java.util.List.of(c1, c2, c3, c4));
                savedE1.setCandidates(java.util.List.of(c1, c2, c3, c4));

                // 2. Upcoming Election
                com.project.online_voting_system.model.Election e2 = new com.project.online_voting_system.model.Election(
                        "Maharashtra Legislative Assembly Election (Vidhan Sabha)",
                        "Upcoming state legislative election to elect the Member of the Legislative Assembly (MLA) for Maharashtra State Assembly.",
                        now.plusDays(10),
                        now.plusDays(25),
                        true,
                        false
                );
                com.project.online_voting_system.model.Election savedE2 = electionRepository.save(e2);

                com.project.online_voting_system.model.Candidate c5 = new com.project.online_voting_system.model.Candidate(
                        "Devendra Fadnavis", "Bharatiya Janata Party (BJP)",
                        "Infrastructure modernizations, industrial corridors across Vidarbha, agricultural power subsidies, and smart urban mobility.",
                        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
                        savedE2
                );
                com.project.online_voting_system.model.Candidate c6 = new com.project.online_voting_system.model.Candidate(
                        "Prafulla Gudadhe Patil", "Indian National Congress (Maha Vikas Aghadi)",
                        "Youth unemployment allowances, local industrial revival, affordable government schools, and farmer loan waivers.",
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
                        savedE2
                );
                candidateRepository.saveAll(java.util.List.of(c5, c6));
                savedE2.setCandidates(java.util.List.of(c5, c6));

                // 3. Completed Election
                com.project.online_voting_system.model.Election e3 = new com.project.online_voting_system.model.Election(
                        "Delhi Legislative Assembly Election (Vidhan Sabha)",
                        "Concluded state legislative assembly ballot. Official audited results have been certified by the Election Commission.",
                        now.minusDays(30),
                        now.minusDays(5),
                        true,
                        true
                );
                com.project.online_voting_system.model.Election savedE3 = electionRepository.save(e3);

                com.project.online_voting_system.model.Candidate c7 = new com.project.online_voting_system.model.Candidate(
                        "Arvind Kejriwal", "Aam Aadmi Party (AAP)",
                        "Universal subsidized green electricity, Mohalla Clinic healthcare, quality Delhi government schools, and free transit for women.",
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
                        savedE3
                );
                c7.setVoteCount(34200);

                com.project.online_voting_system.model.Candidate c8 = new com.project.online_voting_system.model.Candidate(
                        "Sunil Yadav", "Bharatiya Janata Party (BJP)",
                        "Clean Yamuna revitalization mission, slum rehabilitation with pucca housing, and metro phase-IV expansion.",
                        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
                        savedE3
                );
                c8.setVoteCount(22150);

                candidateRepository.saveAll(java.util.List.of(c7, c8));
                savedE3.setCandidates(java.util.List.of(c7, c8));

                System.out.println("[BOOTSTRAP] Initialized default democratic elections and candidates.");
            }
        };
    }
}
