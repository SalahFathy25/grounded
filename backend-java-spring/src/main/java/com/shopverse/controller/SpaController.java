package com.shopverse.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    @GetMapping(value = {
            "/{path:^(?!api|assets|h2-console)[^.]*$}",
            "/{path:^(?!api|assets|h2-console)[^.]*$}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}