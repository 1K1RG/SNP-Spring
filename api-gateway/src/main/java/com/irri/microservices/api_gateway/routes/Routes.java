package com.irri.microservices.api_gateway.routes;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions;
import org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.function.*;
import reactor.core.publisher.Mono;

import javax.swing.*;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;


@Configuration
public class Routes {

    private final RestTemplate restTemplate;

    public Routes(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    @Bean
     public RouterFunction<ServerResponse> PhgRoute() {
        return GatewayRouterFunctions.route("phg_service")
                .route(RequestPredicates.path("/PHG/**"), serverRequest -> {
                    String path = serverRequest.uri().getPath();
                    String query = serverRequest.uri().getQuery();
                    String forwardUrl = "http://127.0.0.1:7000" + path;

                    // Append query parameters if present
                    if (query != null && !query.isEmpty()) {
                        forwardUrl += "?" + query;
                    }

                    if ("POST".equalsIgnoreCase(serverRequest.methodName())) {
                        try {
                            // Read request body
                            String body = new BufferedReader(new InputStreamReader(serverRequest.servletRequest().getInputStream()))
                                    .lines().collect(Collectors.joining("\n"));

                            System.out.println("Request body: " + body);

                            // Set up connection
                            URL url = new URL(forwardUrl);
                            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                            connection.setRequestMethod("POST");
                            connection.setRequestProperty("Content-Type", "application/json");
                            connection.setDoOutput(true);

                            // Write body to connection
                            try (OutputStream os = connection.getOutputStream()) {
                                byte[] input = body.getBytes(StandardCharsets.UTF_8);
                                os.write(input, 0, input.length);
                            }

                            // Get response
                            int responseCode = connection.getResponseCode();
                            InputStream responseStream = (responseCode >= 400) ? connection.getErrorStream() : connection.getInputStream();

                            String contentType = connection.getContentType();
                            if (contentType == null) {
                                contentType = "application/octet-stream"; // fallback
                            }

                            if (isBinaryContent(contentType)) {
                                // Binary response
                                byte[] responseBytes = responseStream.readAllBytes();
                                return ServerResponse.status(HttpStatus.valueOf(responseCode))
                                        .contentType(MediaType.parseMediaType(contentType))
                                        .body(responseBytes);
                            } else {
                                // Text response
                                StringBuilder responseBody = new StringBuilder();
                                try (BufferedReader br = new BufferedReader(new InputStreamReader(responseStream, StandardCharsets.UTF_8))) {
                                    String responseLine;
                                    while ((responseLine = br.readLine()) != null) {
                                        responseBody.append(responseLine.trim());
                                    }
                                }
                                return ServerResponse.status(HttpStatus.valueOf(responseCode))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .body(responseBody.toString());
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .body("Error forwarding request: " + e.getMessage());
                        }
                    }

                    // Handle GET Requests
                    ResponseEntity<String> response = restTemplate.getForEntity(forwardUrl, String.class);
                    return ServerResponse.status(response.getStatusCode()).body(response.getBody());
                })
                .build();
    }

    private boolean isBinaryContent(String contentType) {
        return contentType.contains("application/octet-stream")
                || contentType.contains("application/zip")
                || contentType.contains("text/tab-separated-values")
                || contentType.contains("application/vnd.ms-excel");
    }


    // Routes for services created in Spring Boot
    @Bean
    public RouterFunction<ServerResponse> GeneLociRoute(){
        return GatewayRouterFunctions.route("gene_loci_service")
                .route(RequestPredicates.path("/api/geneloci/**"), HandlerFunctions.http("http://localhost:8081"))
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> ListRoute(){
        return GatewayRouterFunctions.route("list_service")
                .route(RequestPredicates.path("/api/list/**"), HandlerFunctions.http("http://localhost:8082"))
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> VarietyRoute(){
        return GatewayRouterFunctions.route("variety_service")
                .route(RequestPredicates.path("/api/variety/**"), HandlerFunctions.http("http://localhost:8083"))
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> UserServiceRoute(){
        return GatewayRouterFunctions.route("user_service")
                .route(RequestPredicates.path("/api/user/**"), HandlerFunctions.http("http://localhost:8084"))
                .build();
    }






}
