package com.bus.ticket.repository;

import com.bus.ticket.model.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    Bus findByDestination(String destination);
    Bus findBySourceAndDestination(String source, String destination);
}
