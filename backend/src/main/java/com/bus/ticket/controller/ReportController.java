package com.bus.ticket.controller;

import com.bus.ticket.model.Booking;
import com.bus.ticket.model.Bus;
import com.bus.ticket.repository.BookingRepository;
import com.bus.ticket.repository.BusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BusRepository busRepository;

    @GetMapping("/master")
    public Map<String, Object> getMasterReport() {
        List<Booking> bookings = bookingRepository.findAll();
        List<Bus> buses = busRepository.findAll();
        
        double totalRevenue = bookings.stream().mapToDouble(Booking::getTotalAmount).sum();
        long totalTickets = bookings.size();
        
        Map<String, Object> report = new HashMap<>();
        report.put("systemStatus", "OPERATIONAL");
        report.put("totalRevenue", totalRevenue);
        report.put("totalTickets", totalTickets);
        report.put("activeFleetCount", buses.size());
        report.put("manifestDump", bookings);
        report.put("fleetConfiguration", buses);
        report.put("generatedAt", java.time.LocalDateTime.now().toString());
        report.put("version", "v3.2.0 Elite Archive");
        
        return report;
    }
}
