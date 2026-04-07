package com.bus.ticket.service;

import com.bus.ticket.dto.BookingDTO;
import com.bus.ticket.model.Booking;
import com.bus.ticket.model.Bus;
import com.bus.ticket.model.User;
import com.bus.ticket.repository.BookingRepository;
import com.bus.ticket.repository.BusRepository;
import com.bus.ticket.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private BusService busService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Transactional
    public Booking createBooking(Booking booking) {
        if (booking.getDestination() == null || booking.getDestination().trim().isEmpty()) {
            throw new RuntimeException("ERROR: Destination is missing in your booking request!");
        }

        Bus bus = busRepository.findBySourceAndDestination(booking.getSource(), booking.getDestination())
                .or(() -> busRepository.findByDestination(booking.getDestination()))
                .orElseThrow(() -> new RuntimeException("Route Error: Destination '" + booking.getDestination() + "' not found."));

        // Calculate final fare if not provided
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
        
        // Update bus seats availability
        if (bus.getAvailableSeats() < totalPassengers) {
            throw new RuntimeException("Error: Not enough seats available.");
        }
        bus.setAvailableSeats(bus.getAvailableSeats() - totalPassengers);
        
        // Append new seats to the takenSeats string
        String currentTaken = bus.getTakenSeats() == null ? "" : bus.getTakenSeats();
        if (!currentTaken.isEmpty() && booking.getSelectedSeats() != null && !booking.getSelectedSeats().isEmpty()) {
            currentTaken += ", ";
        }
        currentTaken += booking.getSelectedSeats() != null ? booking.getSelectedSeats() : "";
        bus.setTakenSeats(currentTaken);

        // Apply Promo Code Logic (Senior Addition)
        if ("FESTIVE20".equalsIgnoreCase(booking.getBoardingPoint())) { 
             booking.setTotalAmount(booking.getTotalAmount() * 0.80);
        }

        // Wallet Integration Logic (Senior Fintech Addition)
        Optional<User> userOpt = userRepository.findByUsername(booking.getPassengerName());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getWalletBalance() < booking.getTotalAmount()) {
                throw new RuntimeException("INSUFFICIENT_FUNDS: Your wallet balance (₹" + user.getWalletBalance() + ") is too low.");
            }
            user.setWalletBalance(user.getWalletBalance() - booking.getTotalAmount());
            userRepository.save(user);
        }
        
        busRepository.save(bus);
        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Transactional
    public void cancelBooking(Long id) {
        bookingRepository.findById(id).ifPresent(booking -> {
            busRepository.findByDestination(booking.getDestination()).ifPresent(bus -> {
                int freedSeats = booking.getRegularPassengers() + booking.getDiscountedPassengers();
                bus.setAvailableSeats(bus.getAvailableSeats() + freedSeats);

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
            });
            bookingRepository.deleteById(id);
        });
    }
}
