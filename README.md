# 🌐 WUABO Nexus Browser Bridge

The **WUABO Nexus Browser Bridge** is a companion extension for the WUABO Nexus Blender pipeline. It allows you to find GTA V assets on the web and send them directly to your Blender instance with a single click.

---

## ✨ Features

* **One-Click Export**: Adds "Send to Blender" capabilities to popular GTA V asset websites.
* **Direct Integration**: Communicates directly with the WUABO Nexus API.
* **Live Notifications**: Get instant feedback in your browser when an asset is successfully sent to the pipeline.
* **Supported Platforms**:
    * [Pleb Masters Forge](https://forge.plebmasters.de/)

---

## 🚀 Installation

Since this is a development extension, follow these steps to install it in your browser (Chrome, Edge, or Brave):

1. **Download/Clone** this folder to your machine.
2. Open your browser and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click on **"Load unpacked"**.
5. Select the `wuabo_nexus_extension` folder.
6. The WUABO icon should now appear in your extensions list.

---

## 🛠️ How it Works

1. **Start the Bridge**: Ensure your **WUABO Nexus Bridge** is running inside Blender.
2. **Browse Assets**: Visit a supported site like Pleb Masters Forge.
3. **Send to Blender**: Look for the WUABO integration buttons or use the extension popup to send the asset name/path to your local API.
4. **Instant Import**: The Blender addon will receive the request and start the indexing/import process automatically.

---

## 🛠️ Tech Stack

* **Manifest V3**: Using the latest Chrome extension standards.
* **Content Scripts**: Dynamic injection into supported asset galleries.
* **Background Service Worker**: Handles communication between the web page and the local `localhost:5556` (or configured) API.

---

## ⚖️ Credits

* **Developer**: WUABO Team
* **Purpose**: Enhancing the asset discovery and import workflow for GTA V developers.

---
<p align="center">
  <b>Bridging the Web and Blender with ❤️</b>
</p>
