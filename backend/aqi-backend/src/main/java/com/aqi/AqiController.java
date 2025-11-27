package com.aqi;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin("*")
public class AqiController {

    private final AqiService aqiService;

    public AqiController(AqiService aqiService) {
        this.aqiService = aqiService;
    }

    @GetMapping("/aqi/{city}")
    public JsonNode getAqi(@PathVariable String city) {
        JsonNode response = aqiService.getAqi(city);
        return response;   // send whole JSON to frontend
    }
}
