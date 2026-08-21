package com.campuschat.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

@Service
public class NetworkService {

    private static final Logger logger = LoggerFactory.getLogger(NetworkService.class);

    @Value("${server.port:8080}")
    private int serverPort;

    private String cachedLocalIp;

    public String getLocalIpAddress() {
        if (cachedLocalIp != null && !cachedLocalIp.equals("127.0.0.1")) {
            return cachedLocalIp;
        }

        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            InetAddress fallbackAddress = null;
            String fallbackInterfaceName = null;

            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();
                String name = iface.getName().toLowerCase();

                // Ignore loopback, inactive, point-to-point, or known virtual/tunnel interfaces
                if (iface.isLoopback() || !iface.isUp() || iface.isPointToPoint() ||
                    name.startsWith("utun") || name.startsWith("docker") || 
                    name.startsWith("vbox") || name.startsWith("vmnet")  || 
                    name.startsWith("veth") || name.startsWith("awdl")   || 
                    name.startsWith("llw")  || name.startsWith("ap")     || 
                    name.startsWith("bridge")) {
                    continue;
                }

                Enumeration<InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                        String ip = addr.getHostAddress();
                        if (isPrivateIp(ip)) {
                            // Priority: physical Wi-Fi or Ethernet interfaces (en, wlan, eth)
                            if (name.startsWith("en") || name.startsWith("wlan") || name.startsWith("eth") || name.contains("wi-fi")) {
                                cachedLocalIp = ip;
                                logger.info("Detected primary LAN IP address on interface '{}': {}", name, cachedLocalIp);
                                return cachedLocalIp;
                            }
                            if (fallbackAddress == null) {
                                fallbackAddress = addr;
                                fallbackInterfaceName = name;
                            }
                        }
                    }
                }
            }

            if (fallbackAddress != null) {
                cachedLocalIp = fallbackAddress.getHostAddress();
                logger.info("Detected fallback LAN IP address on interface '{}': {}", fallbackInterfaceName, cachedLocalIp);
                return cachedLocalIp;
            }

            // Fallback to local host address
            InetAddress localHost = InetAddress.getLocalHost();
            if (!localHost.isLoopbackAddress() && isPrivateIp(localHost.getHostAddress())) {
                cachedLocalIp = localHost.getHostAddress();
                logger.info("Detected local host LAN IP address: {}", cachedLocalIp);
                return cachedLocalIp;
            }
        } catch (Exception e) {
            logger.warn("Could not determine local network IP: {}", e.getMessage());
        }

        cachedLocalIp = "127.0.0.1";
        return cachedLocalIp;
    }

    private boolean isPrivateIp(String ip) {
        if (ip == null) return false;
        return ip.startsWith("192.168.") || ip.startsWith("10.") ||
               (ip.startsWith("172.") && is172Private(ip));
    }

    private boolean is172Private(String ip) {
        try {
            String[] parts = ip.split("\\.");
            int secondByte = Integer.parseInt(parts[1]);
            return secondByte >= 16 && secondByte <= 31;
        } catch (Exception e) {
            return false;
        }
    }

    public int getServerPort() {
        return serverPort;
    }

    public String getServerUrl() {
        return "http://" + getLocalIpAddress() + ":" + getServerPort();
    }

    public byte[] generateQrCodeImage(String text, int width, int height) throws Exception {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);
        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        return pngOutputStream.toByteArray();
    }
}

