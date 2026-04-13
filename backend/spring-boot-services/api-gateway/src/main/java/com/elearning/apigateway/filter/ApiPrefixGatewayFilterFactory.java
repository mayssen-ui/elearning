package com.elearning.apigateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
public class ApiPrefixGatewayFilterFactory extends AbstractGatewayFilterFactory<ApiPrefixGatewayFilterFactory.Config> {

    public ApiPrefixGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();
            
            // Add /api prefix if not present
            if (!path.startsWith("/api/")) {
                String newPath = "/api" + path;
                ServerHttpRequest newRequest = request.mutate()
                    .path(newPath)
                    .build();
                return chain.filter(exchange.mutate().request(newRequest).build());
            }
            
            return chain.filter(exchange);
        };
    }

    public static class Config {
        // Empty config
    }
}
