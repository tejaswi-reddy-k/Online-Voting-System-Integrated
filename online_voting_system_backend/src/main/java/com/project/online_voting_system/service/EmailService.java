package com.project.online_voting_system.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:tejaswireddykamjula2000@gmail.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);

            System.out.println("[JavaMailSender] Connecting to SMTP to send email from " + fromEmail + " to " + to + " | Subject: " + subject);
            mailSender.send(message);
            System.out.println("[JavaMailSender SUCCESS] Email delivered successfully to " + to);
        } catch (Exception ex) {
            System.err.println("[JavaMailSender ERROR] Failed to dispatch live SMTP email to " + to + ": " + ex.getMessage());
            ex.printStackTrace();
        }
    }

    public void sendRegistrationConfirmation(String to, String fullName, String epicNumber) {
        String body = "Official Voter Registration Confirmation\n"
                + "========================================\n"
                + "Dear " + fullName + ",\n\n"
                + "Welcome to the Secure Online Voting System. Your elector account has been successfully registered.\n\n"
                + "Elector Details:\n"
                + "----------------------------------------\n"
                + "• Full Name: " + fullName + "\n"
                + "• Voter ID (EPIC): " + epicNumber + "\n"
                + "• Registered Email: " + to + "\n"
                + "• Identity Status: VERIFIED ELECTOR\n\n"
                + "You can now log in, review live elections, and cast your secure encrypted ballot.\n\n"
                + "Election Commission Authority";
        sendEmail(to, "Voter Registration Confirmation - EPIC: " + epicNumber, body);
    }

    public void sendVoteReceipt(String to, String electionTitle, String candidateName, String ballotHash) {
        String body = "Official Ballot Receipt Confirmation\n"
                + "========================================\n"
                + "Election: " + electionTitle + "\n"
                + "Selected Candidate: " + candidateName + "\n"
                + "Cryptographic Ballot Hash: " + ballotHash + "\n"
                + "Date/Time: " + java.time.LocalDateTime.now() + "\n\n"
                + "Keep this hash safe to independently verify your vote in the public ledger without disclosing your identity.\n\n"
                + "Election Commission Authority";
        sendEmail(to, "Ballot Submission Receipt - " + electionTitle, body);
    }

    public void sendResultsNotification(String to, String electionTitle, String winnerName, String winnerParty, long winnerVotes, long totalVotes) {
        double percent = totalVotes > 0 ? ((double) winnerVotes / totalVotes) * 100.0 : 0.0;
        String body = "Official Certified Election Results\n"
                + "========================================\n"
                + "Election: " + electionTitle + "\n"
                + "Audit Status: COMPLETED & CERTIFIED\n\n"
                + "DECLARED WINNER:\n"
                + "----------------------------------------\n"
                + "• Candidate: " + winnerName + "\n"
                + "• Political Party: " + winnerParty + "\n"
                + "• Votes Won: " + winnerVotes + " (" + String.format("%.1f", percent) + "%)\n"
                + "• Total Ballots Audited: " + totalVotes + "\n\n"
                + "Certified by the Independent Digital Ledger and Election Commission.";
        sendEmail(to, "Official Election Results: " + electionTitle + " - Winner: " + winnerName, body);
    }
}

