package com.bus.ticket.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookingDTO {
    private Long id;
    private Long busId;
    private Long userId;
    private String passengerName;
    private String passengerEmail;
    private List<Integer> seatNumbers;
    private Double totalAmount;
    private String status; // CONFIRMED, CANCELLED
    private LocalDateTime bookingTime;
}
