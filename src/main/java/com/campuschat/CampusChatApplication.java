package com.campuschat;

import com.campuschat.service.NetworkService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class CampusChatApplication {

    private static final Logger logger = LoggerFactory.getLogger(CampusChatApplication.class);

    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(CampusChatApplication.class, args);
        try {
            NetworkService networkService = context.getBean(NetworkService.class);
            String lanIp = networkService.getLocalIpAddress();
            int port = networkService.getServerPort();

            logger.info("======================================================================");
            logger.info(" CampusChat Server Started Successfully!");
            logger.info(" --------------------------------------------------------------------");
            logger.info(" Local Access (This Laptop):");
            logger.info("    http://localhost:{}", port);
            logger.info("");
            logger.info(" External Mobile / Network Access (Devices on Same Wi-Fi):");
            logger.info("    http://{}:{}", lanIp, port);
            logger.info("");
            logger.info(" Tip: Scan the QR code in the UI or click 📡 in the header to share!");
            logger.info("======================================================================");
        } catch (Exception e) {
            logger.info("=================================================");
            logger.info(" CampusChat Server Started Successfully!");
            logger.info(" Access locally: http://localhost:8080");
            logger.info("=================================================");
        }
    }
}

