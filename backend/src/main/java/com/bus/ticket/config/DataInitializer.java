package com.bus.ticket.config;

import com.bus.ticket.model.Bus;
import com.bus.ticket.model.User;
import com.bus.ticket.repository.BusRepository;
import com.bus.ticket.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(BusRepository busRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Scale: Elite Travelers & Seeded Admins with High Liquidity
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole("ADMIN");
                admin.setWalletBalance(100000.0); // Admin High Liquidity
                userRepository.save(admin);

                User user = new User();
                user.setUsername("john.doe");
                user.setPassword(passwordEncoder.encode("password123"));
                user.setRole("USER");
                user.setWalletBalance(20000.0); // Seeded traveler funds
                userRepository.save(user);
            }

            if (busRepository.count() == 0) {
                // Fleet 1: The Mumbai Connect
                Bus b1 = new Bus();
                b1.setSource("Pune"); b1.setDestination("Mumbai");
                b1.setFare(750.0); b1.setAvailableSeats(40);
                b1.setTakenSeats(""); b1.setDepartureTime("08:00 AM");
                b1.setBusType("AC Sleeper"); b1.setPlateNumber("MH12-BT-9001");
                b1.setWeather("Sunny 32°C"); b1.setAmenities("WiFi,AC,Water,Charging");
                b1.setSafetyScore(95); b1.setSafetyFeatures("GPS,CCTV,FireExt");
                busRepository.save(b1);

                // Fleet 2: Southern Link
                Bus b2 = new Bus();
                b2.setSource("Bangalore"); b2.setDestination("Chennai");
                b2.setFare(1200.0); b2.setAvailableSeats(36);
                b2.setTakenSeats("1,2,5"); b2.setDepartureTime("10:30 PM");
                b2.setBusType("Scania Multi-Axle"); b2.setPlateNumber("KA01-BT-1122");
                b2.setWeather("Rainy 24°C"); b2.setAmenities("WiFi,AC,Blanket,Snacks");
                b2.setSafetyScore(98); b2.setSafetyFeatures("GPS,CCTV,Emergency-Exit");
                busRepository.save(b2);

                // Fleet 3: The Capital Express
                Bus b3 = new Bus();
                b3.setSource("Chandigarh"); b3.setDestination("Delhi - ISBT");
                b3.setFare(1200.0);
                b3.setAvailableSeats(20);
                b3.setTakenSeats("");
                b3.setDepartureTime("02:15 PM");
                b3.setBusType("Intercity Express");
                b3.setPlateNumber("DL-01-CX-1123");
                b3.setWeather("Hazy 28°C");
                b3.setAmenities("AC,Water");
                b3.setBoardingPoints("ISBT: 02:15 PM, Airport: 03:00 PM");
                b3.setDroppingPoints("Ludhiana: 07:00 PM, Ambala: 08:30 PM");
                b3.setSafetyScore(4);
                b3.setSafetyFeatures("GPS,First Aid");
                busRepository.save(b3);

                System.out.println(">>> Database Seeded: Professional Fleet Initialized <<<");
            }
        };
    }
}
