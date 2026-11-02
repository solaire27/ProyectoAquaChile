package com.duoc.aquachile.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaRedirectController {

    // Atrapa cualquier ruta de primer nivel que no sea un archivo (ej: /dashboard, /login)
    // y la redirige internamente a React sin interferir con tus endpoints del backend.
    @RequestMapping(value = "/{path:[^\\.]*}")
    public String redirect() {
        return "forward:/index.html";
    }
}