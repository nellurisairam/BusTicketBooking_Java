package com.bus.ticket.repository;

import com.bus.ticket.model.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    Optional<Bus> findByDestination(String destination);
    Optional<Bus> findBySourceAndDestination(String source, String destination);
    Optional<Bus> findByPlateNumber(String plateNumber);
}
