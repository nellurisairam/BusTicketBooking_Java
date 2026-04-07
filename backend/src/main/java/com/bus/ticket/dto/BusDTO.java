package com.bus.ticket.dto;

import lombok.Data;
import java.util.List;

@Data
public class BusDTO {
    private Long id;
    private String source;
    private String destination;
    private double fare;
    private double dynamicFare;
    private int availableSeats;
    private String takenSeats;
    private String departureTime;
    private String busType; 
    private String plateNumber;
    private String weather;
    private String amenities;
    private String boardingPoints;
    private String droppingPoints;
    private int safetyScore;
    private String safetyFeatures;
}
