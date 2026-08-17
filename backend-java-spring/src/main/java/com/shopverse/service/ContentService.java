package com.shopverse.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.shopverse.domain.StoreContent;
import com.shopverse.repository.StoreContentRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ContentService {

    private static final long CONTENT_ID = 1L;

    private final StoreContentRepository repository;
    private final Gson gson;

    public ContentService(StoreContentRepository repository, Gson gson) {
        this.repository = repository;
        this.gson = gson;
    }

    @Transactional
    public Map<String, Object> get() {
        StoreContent c = ensure();
        return parse(c.getContentJson());
    }

    /** Deep-merge the patch (mirrors the mock's deepMerge) and store. */
    @Transactional
    public Map<String, Object> update(Map<String, Object> patch) {
        StoreContent c = ensure();
        Map<String, Object> existing = parse(c.getContentJson());
        Map<String, Object> merged = deepMerge(existing, patch == null ? Map.of() : patch);
        c.setContentJson(write(merged));
        c.setUpdatedAt(LocalDateTime.now());
        repository.save(c);
        return merged;
    }

    @Transactional
    public void reset() {
        repository.deleteAll();
    }

    public StoreContent ensure() {
        return repository.findById(CONTENT_ID).orElseGet(() -> {
            try {
                ClassPathResource resource = new ClassPathResource("default-content.json");
                String json = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                StoreContent c = new StoreContent();
                c.setId(CONTENT_ID);
                c.setContentJson(json);
                c.setUpdatedAt(LocalDateTime.now());
                try {
                    return repository.save(c);
                } catch (Exception e) {
                    return repository.findById(CONTENT_ID).orElse(c);
                }
            } catch (IOException e) {
                throw new IllegalStateException("default-content.json is missing from classpath", e);
            }
        });
    }

    /** Same as {@link #ensure()}, but runs in its own transaction (see SettingsService#ensureIsolated). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public StoreContent ensureIsolated() {
        return ensure();
    }

    private Map<String, Object> parse(String json) {
        try {
            return gson.fromJson(json, new TypeToken<LinkedHashMap<String, Object>>() {}.getType());
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private String write(Object value) {
        return gson.toJson(value);
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> deepMerge(Map<String, Object> base, Map<String, Object> patch) {
        Map<String, Object> out = new LinkedHashMap<>(base);
        for (Map.Entry<String, Object> entry : patch.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map) {
                Object existing = out.get(entry.getKey());
                if (existing instanceof Map) {
                    out.put(entry.getKey(), deepMerge((Map<String, Object>) existing, (Map<String, Object>) value));
                } else {
                    out.put(entry.getKey(), new LinkedHashMap<>((Map<String, Object>) value));
                }
            } else if (value instanceof List) {
                out.put(entry.getKey(), new ArrayList<>((List<Object>) value));
            } else {
                out.put(entry.getKey(), value);
            }
        }
        return out;
    }
}