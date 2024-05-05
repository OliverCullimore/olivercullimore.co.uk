---
title: "How to adopt a UniFi access point with a remote controller"
date: 2024-05-04
tags: ["post","UniFi","WiFi","Networking"]
thumbnail: "/images/posts/50241f6c-how-to-adopt-a-unifi-access-point-with-a-remote-controller-thumbnail.png"
---

## The Challenge


I was recently asked how you can adopt a UniFi access point onto a UniFi controller that is located on a different network. Here’s a step-by-step guide on how to achieve this.


## Prerequisites


Before proceeding, ensure the following are in place first:

- A UniFi access point ready for deployment
- A UniFi controller with a public domain or static IP, port 8080 port-forwarded, and the “Inform Host” setting correctly configured
- A device connected to the same network as the access point

## Step 1 - Acquire the Necessary Tool


Begin by downloading and installing the [HostiFi Device Discovery Tool](https://www.hostifi.com/hostifi-device-discovery-tool) for your device.


## Step 2 - Configure the Tool


Launch the HostiFi Device Discovery Tool and navigate to the settings via the cog icon.


![HostiFi Device Discovery Tool](/images/posts/50241f6c-hostifi-device-discovery-tool.png)


Input your controller’s public inform URL into the Default inform URL field and save your changes followed by closing the pop-up at the top-right.


![HostiFi Device Discovery Tool settings](/images/posts/50241f6c-hostifi-device-discovery-tool-settings.png)


## Step 3 - Device Adoption


Power on the UniFi access point and use the “Scan” function of the tool to detect it.


![HostiFi Device Discovery Tool scan list](/images/posts/50241f6c-hostifi-device-discovery-tool-scan-list.png)


Once identified, click “Adopt” next to it, then re-verify the Inform URL is correct and click “Adopt”.


![HostiFi Device Discovery Tool adopt inform URL](/images/posts/50241f6c-hostifi-device-discovery-tool-adopt-inform-url.png)


A confirmation message will then be displayed.


![HostiFi Device Discovery Tool adoption results](/images/posts/50241f6c-hostifi-device-discovery-tool-adoption-results.png)


The device will now appear in the controller’s device tab for you to proceed with its setup.


## References


[https://www.hostifi.com/blog/introducing-the-hostifi-discovery-tool](https://www.hostifi.com/blog/introducing-the-hostifi-discovery-tool)

