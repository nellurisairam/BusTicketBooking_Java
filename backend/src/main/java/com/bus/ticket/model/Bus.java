package com.bus.ticket.model;

import jakarta.persistence.*;

@Entity
public class Bus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String destination;
    private double fare;
    private int availableSeats;
    private String takenSeats;
    private String departureTime;
    private String busType; // Luxury AC, Standard, Sleeper
    private String plateNumber;

    public Bus() {}

    public Bus(Long id, String destination, double fare, int availableSeats, String takenSeats, String departureTime, String busType, String plateNumber) {
        this.id = id;
        this.destination = destination;
        this.fare = fare;
        this.availableSeats = availableSeats;
        this.takenSeats = takenSeats;
        this.departureTime = departureTime;
        this.busType = busType;
        this.plateNumber = plateNumber;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public double getFare() { return fare; }
    public void setFare(double fare) { this.fare = fare; }
    public int getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(int availableSeats) { this.availableSeats = availableSeats; }
    public String getTakenSeats() { return takenSeats; }
    public void setTakenSeats(String takenSeats) { this.takenSeats = takenSeats; }
    public String getDepartureTime() { return departureTime; }
    public void setDepartureTime(String departureTime) { this.departureTime = departureTime; }
    public String getBusType() { return busType; }
    public void setBusType(String busType) { this.busType = busType; }
    public String getPlateNumber() { return plateNumber; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
}
