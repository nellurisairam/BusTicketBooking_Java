package com.bus.ticket.model;

import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@NoArgsConstructor
@AllArgsConstructor
public class Bus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Destination is required")
    private String destination;

    @NotBlank(message = "Source is required")
    private String source;

    @Positive(message = "Fare must be positive")
    private double fare;

    @Min(value = 0, message = "Available seats cannot be negative")
    private int availableSeats;

    private String takenSeats;
    private String departureTime;
    private String busType; 
    private String plateNumber;
    private String weather;
    private String amenities; 

    @Column(length = 1000)
    private String boardingPoints;
    
    @Column(length = 1000)
    private String droppingPoints;

    @OneToMany(mappedBy = "bus", cascade = CascadeType.ALL)
    private java.util.List<Review> reviews = new java.util.ArrayList<>();

    private int safetyScore = 5;

    @Column(length = 500)
    private String safetyFeatures;

    @Transient
    private double dynamicFare;

    // Manual Accessors to bypass Lombok environment issues
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
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
    public String getWeather() { return weather; }
    public void setWeather(String weather) { this.weather = weather; }
    public String getAmenities() { return amenities; }
    public void setAmenities(String amenities) { this.amenities = amenities; }
    public String getBoardingPoints() { return boardingPoints; }
    public void setBoardingPoints(String boardingPoints) { this.boardingPoints = boardingPoints; }
    public String getDroppingPoints() { return droppingPoints; }
    public void setDroppingPoints(String droppingPoints) { this.droppingPoints = droppingPoints; }
    public java.util.List<Review> getReviews() { return reviews; }
    public void setReviews(java.util.List<Review> reviews) { this.reviews = reviews; }
    public int getSafetyScore() { return safetyScore; }
    public void setSafetyScore(int safetyScore) { this.safetyScore = safetyScore; }
    public String getSafetyFeatures() { return safetyFeatures; }
    public void setSafetyFeatures(String safetyFeatures) { this.safetyFeatures = safetyFeatures; }
    public double getDynamicFare() { return dynamicFare; }
    public void setDynamicFare(double dynamicFare) { this.dynamicFare = dynamicFare; }
}
