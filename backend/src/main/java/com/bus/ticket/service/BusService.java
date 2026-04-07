package com.bus.ticket.service;

import com.bus.ticket.dto.BusDTO;
import com.bus.ticket.model.Bus;
import com.bus.ticket.repository.BusRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private ModelMapper modelMapper;

    public List<BusDTO> getAllActiveBuses() {
        return busRepository.findAll().stream()
                .map(this::calculateDynamicFare)
                .map(bus -> modelMapper.map(bus, BusDTO.class))
                .collect(Collectors.toList());
    }

    public Bus calculateDynamicFare(Bus bus) {
        // High-level Engineering: Dynamic Surge Pricing Algorithm
        // Fare increases by 2% for every 10% occupancy after 50%
        // Using standard capacity of 40 for a professional bus
        int totalSeats = 40; 
        int bookedSeats = totalSeats - bus.getAvailableSeats();
        double occupancyFactor = (double) bookedSeats / (double) totalSeats;
        
        double finalFare = bus.getFare();
        if (occupancyFactor > 0.5) {
            double surge = (occupancyFactor - 0.5) * 0.2 * bus.getFare(); // Simple linear surge
            finalFare += surge;
        }
        
        bus.setDynamicFare(Math.round(finalFare * 100.0) / 100.0);
        return bus;
    }
    
    public BusDTO getBusById(Long id) {
        Bus bus = busRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Bus not found with id: " + id));
        return modelMapper.map(calculateDynamicFare(bus), BusDTO.class);
    }
    
    public BusDTO saveBus(BusDTO busDTO) {
        Bus bus = modelMapper.map(busDTO, Bus.class);
        Bus savedBus = busRepository.save(bus);
        return modelMapper.map(savedBus, BusDTO.class);
    }
}
