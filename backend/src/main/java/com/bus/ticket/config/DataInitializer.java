package com.bus.ticket.config;

import com.bus.ticket.model.Bus;
import com.bus.ticket.repository.BusRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(BusRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.saveAll(Arrays.asList(
                    new Bus(null, "Tokyo Central", 12.0, 20, "1,2", "08:30 AM", "Standard AC", "BUS-7741-A"),
                    new Bus(null, "Osaka Express", 15.0, 20, "5,6,10", "11:45 AM", "Luxury Sleeper", "BUS-9902-B"),
                    new Bus(null, "Kyoto Heritage", 12.0, 20, "", "02:15 PM", "Executive Coach", "BUS-1123-C"),
                    new Bus(null, "Fukuoka South", 18.5, 20, "15,16,17,18", "06:00 PM", "Ultra Premium", "BUS-5566-D"),
                    new Bus(null, "Kanazawa West", 22.0, 20, "", "10:30 PM", "Overnight Luxury", "BUS-8877-E")
                ));
                System.out.println(">>> Database Seeded: 5 Real-world Routes Initialized <<<");
            }
        };
    }
}
