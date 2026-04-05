package com.bus.ticket.controller;

import com.bus.ticket.model.Booking;
import com.bus.ticket.model.Bus;
import com.bus.ticket.repository.BookingRepository;
import com.bus.ticket.repository.BusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BusRepository busRepository;

    @PostMapping("/create")
    public Booking createBooking(@RequestBody Booking booking) {
        // Calculate total amount with 20% discount for special passengers
        Bus bus = busRepository.findByDestination(booking.getDestination());
        if (bus == null) {
            throw new RuntimeException("Destination not found!");
        }

        // Logic refined: Fare based on model
        double fare = bus.getFare();
        double discountedFare = fare * 0.8;
        
        int totalPassengers = booking.getRegularPassengers() + booking.getDiscountedPassengers();
        double total = (booking.getRegularPassengers() * fare) + (booking.getDiscountedPassengers() * discountedFare);
        
        booking.setTotalAmount(total);
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("PAID");
        
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
        return bookingRepository.save(booking);
    }

    @GetMapping("/buses")
    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    @GetMapping("/history")
    public List<Booking> getHistory() {
        return bookingRepository.findAll();
    }

    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable Long id) {
        // Optional: restore seat availability logic here if desired
        bookingRepository.deleteById(id);
    }
}
