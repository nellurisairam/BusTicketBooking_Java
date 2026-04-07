package com.bus.ticket.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Around("execution(* com.bus.ticket.service.*.*(..)) || execution(* com.bus.ticket.controller.*.*(..))")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        
        logger.info("Executing {}.{} with arguments: {}", className, methodName, joinPoint.getArgs());
        
        Object proceed;
        try {
            proceed = joinPoint.proceed();
        } catch (Exception e) {
            logger.error("Exception in {}.{} with cause: {}", className, methodName, e.getMessage());
            throw e;
        }
        
        long executionTime = System.currentTimeMillis() - start;
        logger.info("{}.{} executed in {} ms", className, methodName, executionTime);
        
        return proceed;
    }
}
