package com.bus.ticket.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String passengerName;
    private String source;
    private String destination;
    private String boardingPoint;
    private String droppingPoint;
    private double totalAmount;
    private int regularPassengers;
    private int discountedPassengers;
    private String selectedSeats;
    private LocalDateTime bookingTime;
    private String status; // PAID or UNPAID

    public Booking() {}

    public Booking(Long id, String passengerName, String destination, double totalAmount, 
                   int regularPassengers, int discountedPassengers, String selectedSeats, 
                   LocalDateTime bookingTime, String status) {
        this.id = id;
        this.passengerName = passengerName;
        this.destination = destination;
        this.totalAmount = totalAmount;
        this.regularPassengers = regularPassengers;
        this.discountedPassengers = discountedPassengers;
        this.selectedSeats = selectedSeats;
        this.bookingTime = bookingTime;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public String getBoardingPoint() { return boardingPoint; }
    public void setBoardingPoint(String boardingPoint) { this.boardingPoint = boardingPoint; }
    public String getDroppingPoint() { return droppingPoint; }
    public void setDroppingPoint(String droppingPoint) { this.droppingPoint = droppingPoint; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public int getRegularPassengers() { return regularPassengers; }
    public void setRegularPassengers(int regularPassengers) { this.regularPassengers = regularPassengers; }
    public int getDiscountedPassengers() { return discountedPassengers; }
    public void setDiscountedPassengers(int discountedPassengers) { this.discountedPassengers = discountedPassengers; }
    public String getSelectedSeats() { return selectedSeats; }
    public void setSelectedSeats(String selectedSeats) { this.selectedSeats = selectedSeats; }
    public LocalDateTime getBookingTime() { return bookingTime; }
    public void setBookingTime(LocalDateTime bookingTime) { this.bookingTime = bookingTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
