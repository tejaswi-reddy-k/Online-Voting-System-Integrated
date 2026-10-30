package com.project.online_voting_system.repository;

import com.project.online_voting_system.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    boolean existsByUserIdAndElectionId(Long userId, Long electionId);
    Optional<Vote> findByUserIdAndElectionId(Long userId, Long electionId);
    Optional<Vote> findByBallotHash(String ballotHash);
    List<Vote> findByElectionId(Long electionId);
    long countByElectionId(Long electionId);
    void deleteByElectionId(Long electionId);
    void deleteByCandidateId(Long candidateId);
    List<Vote> findByUserId(Long userId);
}