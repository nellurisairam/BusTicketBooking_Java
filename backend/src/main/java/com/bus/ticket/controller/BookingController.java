package com.bus.ticket.controller;

import com.bus.ticket.dto.BusDTO;
import com.bus.ticket.model.Booking;
import com.bus.ticket.model.Bus;
import com.bus.ticket.service.BookingService;
import com.bus.ticket.service.BusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BusService busService;

    @PostMapping("/create")
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking) {
        return ResponseEntity.ok(bookingService.createBooking(booking));
    }

    @GetMapping("/buses")
    public ResponseEntity<List<BusDTO>> getAllBuses() {
        return ResponseEntity.ok(busService.getAllActiveBuses());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/buses")
    public ResponseEntity<BusDTO> addBusRoute(@RequestBody BusDTO busDTO) {
        return ResponseEntity.ok(busService.saveBus(busDTO));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Booking>> getHistory() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<Booking> all = bookingService.getAllBookings();
        
        // Senior Level Logic: Only Admins see global history, users see personal history
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.ok(all);
        }
        
        String username = auth != null ? auth.getName() : null;
        List<Booking> personal = all.stream()
                .filter(b -> b.getPassengerName() != null && b.getPassengerName().equals(username))
                .collect(Collectors.toList());
        return ResponseEntity.ok(personal);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        List<Booking> all = bookingService.getAllBookings();
        double totalRevenue = all.stream().mapToDouble(Booking::getTotalAmount).sum();
        long totalTickets = all.size();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalTickets", totalTickets);
        stats.put("fleetCount", busService.getAllActiveBuses().size());
        return ResponseEntity.ok(stats);
    }
}
