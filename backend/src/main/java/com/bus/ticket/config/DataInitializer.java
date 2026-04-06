package com.bus.ticket.config;

import com.bus.ticket.model.Bus;
import com.bus.ticket.repository.BusRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

import com.bus.ticket.model.User;
import com.bus.ticket.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(BusRepository repository, UserRepository userRepository) {
        return args -> {
            if (repository.count() == 0) {
                Bus b1 = new Bus();
                b1.setSource("Mumbai - Dadar");
                b1.setDestination("Pune - Swargate");
                b1.setFare(1250.0);
                b1.setAvailableSeats(20);
                b1.setTakenSeats("1,2");
                b1.setDepartureTime("08:30 AM");
                b1.setBusType("Volvo AC Sleeper");
                b1.setPlateNumber("MH-01-AX-7741");
                b1.setWeather("Sunny 32°C");
                b1.setAmenities("WiFi,AC,Water,Charging");
                b1.setBoardingPoints("Dadar: 08:30 AM, Panvel: 09:30 AM");
                b1.setDroppingPoints("Swargate: 12:30 PM, Katraj: 01:00 PM");
                b1.setSafetyScore(5);
                b1.setSafetyFeatures("CCTV,GPS,Sanitized,Emergency Exit");
                repository.save(b1);

                Bus b2 = new Bus();
                b2.setSource("Bangalore - Majestic");
                b2.setDestination("Hyderabad - Miyapur");
                b2.setFare(1500.0);
                b2.setAvailableSeats(20);
                b2.setTakenSeats("5,6,10");
                b2.setDepartureTime("11:45 AM");
                b2.setBusType("Scania Multi-Axle");
                b2.setPlateNumber("KA-05-BX-9902");
                b2.setWeather("Cloudy 24°C");
                b2.setAmenities("WiFi,AC,Blanket,Charging");
                b2.setBoardingPoints("Majestic: 11:45 AM, Hebbal: 12:30 PM");
                b2.setDroppingPoints("MGBS: 08:00 PM, Miyapur: 09:00 PM");
                b2.setSafetyScore(5);
                b2.setSafetyFeatures("CCTV,GPS,Speed Limit");
                repository.save(b2);

                Bus b3 = new Bus();
                b3.setSource("Chandigarh - Sector 17");
                b3.setDestination("Delhi - ISBT");
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
                repository.save(b3);

                System.out.println(">>> Database Seeded: Professional Fleet Initialized <<<");
            }
            
            if (userRepository.count() == 0) {
                userRepository.saveAll(Arrays.asList(
                    new User("admin", "admin", "ADMIN"),
                    new User("john.doe", "password123", "USER")
                ));
                System.out.println(">>> Database Seeded: Default Admin and User Accounts Initialized <<<");
            }
        };
    }
}

