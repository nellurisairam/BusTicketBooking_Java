package com.bus.ticket.service;

import com.bus.ticket.model.Booking;
import com.bus.ticket.model.User;
import com.bus.ticket.repository.BookingRepository;
import com.bus.ticket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void cancelAndRefund(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        // Refund Logic: 80% if cancelled
        double refundAmount = booking.getTotalAmount() * 0.8;
        
        Optional<User> userOpt = userRepository.findByUsername(booking.getPassengerName());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setWalletBalance(user.getWalletBalance() + refundAmount);
            userRepository.save(user);
        }

        bookingRepository.delete(booking);
    }
}
