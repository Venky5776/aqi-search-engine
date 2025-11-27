package com.aqi;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class AqiService {

    private final String API_KEY = "ccfec22099894468b64288c63de2e2a3eac670a4";

    public JsonNode getAqi(String city) {

        try {
            String url = "https://api.waqi.info/feed/" + city + "/?token=" + API_KEY;

            String result = WebClient.create()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readTree(result);

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
