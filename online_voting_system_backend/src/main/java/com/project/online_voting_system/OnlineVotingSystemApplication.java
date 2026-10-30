package com.project.online_voting_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableCaching
@EnableScheduling
@SpringBootApplication
public class OnlineVotingSystemApplication {

	public static void main(String[] args) {

		SpringApplication.run(OnlineVotingSystemApplication.class, args);
	}

}
