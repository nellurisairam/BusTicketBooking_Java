package com.bus.ticket.controller;

import com.bus.ticket.model.Review;
import com.bus.ticket.repository.BusRepository;
import com.bus.ticket.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BusRepository busRepository;

    @PostMapping("/add")
    public ResponseEntity<?> addReview(@RequestBody Review review) {
        return busRepository.findByPlateNumber(review.getBusPlateNumber())
            .map(bus -> {
                review.setBus(bus);
                return ResponseEntity.ok(reviewRepository.save(review));
            })
            .orElse(ResponseEntity.badRequest().build());
    }

    @GetMapping("/{plateNumber}")
    public ResponseEntity<List<Review>> getReviewsByBus(@PathVariable String plateNumber) {
        return ResponseEntity.ok(reviewRepository.findByBusPlateNumber(plateNumber));
    }
}
