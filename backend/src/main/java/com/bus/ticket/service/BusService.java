package com.bus.ticket.service;

import com.bus.ticket.model.Bus;
import com.bus.ticket.repository.BusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;

    public List<Bus> getAllActiveBuses() {
        return busRepository.findAll().stream()
                .map(this::calculateDynamicFare)
                .collect(Collectors.toList());
    }

    public Bus calculateDynamicFare(Bus bus) {
        // High-level Engineering: Dynamic Surge Pricing Algorithm
        // Fare increases by 2% for every 10% occupancy after 50%
        int bookedSeats = 20 - bus.getAvailableSeats();
        double occupancyFactor = (double) bookedSeats / 20.0;
        
        double finalFare = bus.getFare();
        if (occupancyFactor > 0.5) {
            double surge = (occupancyFactor - 0.5) * 0.2 * bus.getFare(); // Simple linear surge
            finalFare += surge;
        }
        
        bus.setDynamicFare(Math.round(finalFare * 100.0) / 100.0);
        return bus;
    }
    
    public Bus saveBus(Bus bus) {
        return busRepository.save(bus);
    }
}
