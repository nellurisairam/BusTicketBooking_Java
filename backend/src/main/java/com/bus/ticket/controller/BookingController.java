package com.bus.ticket.controller;

import com.bus.ticket.model.Booking;
import com.bus.ticket.model.Bus;
import com.bus.ticket.repository.BookingRepository;
import com.bus.ticket.repository.BusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import com.bus.ticket.service.BusService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private BusService busService;

    @PostMapping("/create")
    public Booking createBooking(@RequestBody Booking booking) {
        System.out.println(">>> Booking request for: " + booking.getDestination());
        
        if (booking.getDestination() == null || booking.getDestination().trim().isEmpty()) {
            throw new RuntimeException("ERROR: Destination is missing in your booking request!");
        }

        Bus bus = busRepository.findBySourceAndDestination(booking.getSource(), booking.getDestination());
        if (bus == null) {
            bus = busRepository.findByDestination(booking.getDestination()); // fallback
        }
        
        if (bus == null) {
            System.err.println("!!! DB Error: Route '" + booking.getSource() + " -> " + booking.getDestination() + "' not found.");
            throw new RuntimeException("Route Error: Destination not found.");
        }

        // We respect the totalAmount sent by frontend (which includes promo discounts)
        // unless it's missing, in which case we calculate it.
        if (booking.getTotalAmount() <= 0) {
            busService.calculateDynamicFare(bus);
            double dynamicFare = bus.getDynamicFare();
            double discountedFare = dynamicFare * 0.8;
            double calculatedTotal = (booking.getRegularPassengers() * dynamicFare) + (booking.getDiscountedPassengers() * discountedFare);
            booking.setTotalAmount(Math.round(calculatedTotal * 100.0) / 100.0);
        }
        
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("PAID");
        
        int totalPassengers = booking.getRegularPassengers() + booking.getDiscountedPassengers();
        
        // Update bus seats availability AND track exactly which seats are taken
        bus.setAvailableSeats(bus.getAvailableSeats() - totalPassengers);
        
        // Append new seats to the takenSeats string
        String currentTaken = bus.getTakenSeats() == null ? "" : bus.getTakenSeats();
        if (!currentTaken.isEmpty() && !booking.getSelectedSeats().isEmpty()) {
            currentTaken += ", ";
        }
        currentTaken += booking.getSelectedSeats();
        bus.setTakenSeats(currentTaken);
        
        busRepository.save(bus);
        System.out.println(">>> Booking Successful for " + booking.getPassengerName());
        return bookingRepository.save(booking);
    }

    @GetMapping("/buses")
    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    @PostMapping("/buses")
    public Bus addBusRoute(@RequestBody Bus bus) {
        if (bus.getAvailableSeats() <= 0) {
            bus.setAvailableSeats(20); // Default capacity
        }
        return busRepository.save(bus);
    }

    @GetMapping("/history")
    public List<Booking> getHistory() {
        return bookingRepository.findAll();
    }

    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable Long id) {
        bookingRepository.findById(id).ifPresent(booking -> {
            Bus bus = busRepository.findByDestination(booking.getDestination());
            if (bus != null) {
                int freedSeats = booking.getRegularPassengers() + booking.getDiscountedPassengers();
                bus.setAvailableSeats(bus.getAvailableSeats() + freedSeats);

                // Sophisticated seat removal logic
                String[] currentTaken = bus.getTakenSeats() != null ? bus.getTakenSeats().split(",\\s*") : new String[0];
                String[] cancelledSeats = booking.getSelectedSeats() != null ? booking.getSelectedSeats().split(",\\s*") : new String[0];
                
                StringBuilder updatedTaken = new StringBuilder();
                for (String seat : currentTaken) {
                    boolean wasCancelled = false;
                    for (String cancelled : cancelledSeats) {
                        if (seat.trim().equals(cancelled.trim())) {
                            wasCancelled = true;
                            break;
                        }
                    }
                    if (!wasCancelled) {
                        if (updatedTaken.length() > 0) updatedTaken.append(", ");
                        updatedTaken.append(seat);
                    }
                }
                bus.setTakenSeats(updatedTaken.toString());
                busRepository.save(bus);
            }
            bookingRepository.deleteById(id);
            System.out.println(">>> Record Synchronized: Seats restored for route " + booking.getDestination());
        });
    }

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics() {
        List<Booking> all = bookingRepository.findAll();
        double totalRevenue = all.stream().mapToDouble(Booking::getTotalAmount).sum();
        long totalTickets = all.size();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalTickets", totalTickets);
        stats.put("fleetCount", busRepository.count());
        return stats;
    }
}
