package com.duoc.aquachile.controller;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SpaRedirectControllerTest {
    @Test void redirect() {
        assertEquals("forward:/index.html", new SpaRedirectController().redirect());
    }
}
