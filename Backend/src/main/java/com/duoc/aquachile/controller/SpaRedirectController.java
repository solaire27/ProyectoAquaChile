package com.duoc.aquachile.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaRedirectController {

    // Atrapa rutas de primer nivel y sub-rutas de /dashboard/* (sin punto) para que React Router no dé 404 al recargar
    @RequestMapping(value = {
            "/{path:[^\\.]*}",
            "/dashboard/{path:[^\\.]*}"
    })
    public String redirect() {
        return "forward:/index.html";
    }
}