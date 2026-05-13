package com.apartmentapp.visitor;

import com.apartmentapp.user.User;
import com.apartmentapp.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VisitorService {

    private final VisitorRepository visitorRepository;
    private final UserRepository userRepository;

    @Transactional
    public VisitorDTO.Response logEntry(String email, VisitorDTO.CreateRequest request) {
        User security = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        Visitor visitor = Visitor.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .purpose(request.getPurpose())
                .flatToVisit(request.getFlatToVisit())
                .loggedBy(security)
                .entryTime(LocalDateTime.now())
                .build();
        return mapToResponse(visitorRepository.save(visitor));
    }

    @Transactional
    public VisitorDTO.Response logExit(Long id) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor not found with id: " + id));
        if (visitor.getExitTime() != null) {
            throw new RuntimeException("Exit time already recorded for this visitor");
        }
        visitor.setExitTime(LocalDateTime.now());
        return mapToResponse(visitorRepository.save(visitor));
    }

    public List<VisitorDTO.Response> getAllVisitors() {
        return visitorRepository.findAllByOrderByEntryTimeDesc()
                .stream().map(this::mapToResponse).toList();
    }

    public List<VisitorDTO.Response> getActiveVisitors() {
        return visitorRepository.findByExitTimeIsNullOrderByEntryTimeDesc()
                .stream().map(this::mapToResponse).toList();
    }

    private VisitorDTO.Response mapToResponse(Visitor v) {
        return VisitorDTO.Response.builder()
                .id(v.getId())
                .name(v.getName())
                .phone(v.getPhone())
                .purpose(v.getPurpose())
                .flatToVisit(v.getFlatToVisit())
                .loggedById(v.getLoggedBy().getId())
                .loggedByName(v.getLoggedBy().getName())
                .entryTime(v.getEntryTime())
                .exitTime(v.getExitTime())
                .build();
    }
}
