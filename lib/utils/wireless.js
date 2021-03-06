const spawnSync = require("child_process").spawnSync;
const os = require("os");
const ValetudoWifiConfiguration = require("../entities/core/ValetudoWifiConfiguration");

/**
 * @param {string} iface - network interface to get params for
 * @returns {ValetudoWifiConfiguration}
 */
function getEmbeddedWirelessConfiguration(iface) {
    const output = {
        details: {
            state: ValetudoWifiConfiguration.STATE.UNKNOWN
        }
    };

    /*
        root@rockrobo:~# iw
        Usage:  iw [options] command
        Do NOT screenscrape this tool, we don't consider its output stable.

        :-)
     */
    const iwOutput = spawnSync("iw", ["dev", iface, "link"]).stdout;

    if (iwOutput) {
        const WIFI_CONNECTED_IW_REGEX = /^Connected to (?<bssid>[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (?<ssid>.*)\s*freq: (?<freq>[0-9]*)\s*signal: (?<signal>-[0-9]{1,3}) dBm\s*tx bitrate: (?<txbitrate>[0-9.]*).*/;

        const extractedWifiData = iwOutput.toString().match(WIFI_CONNECTED_IW_REGEX);
        if (extractedWifiData) {
            output.details.state = ValetudoWifiConfiguration.STATE.CONNECTED;
            output.details.upspeed = parseFloat(extractedWifiData.groups.txbitrate);
            output.details.signal = parseInt(extractedWifiData.groups.signal);
            output.ssid = extractedWifiData.groups.ssid.trim();
            output.details.ips = Object.values(os.networkInterfaces()).map(i => i.map(l => l.address)).flat().sort().filter(ip => ip !== "127.0.0.1" && ip !== "::1"); //lol this line
            output.details.frequency = ValetudoWifiConfiguration.FREQUENCY_TYPE.W2_4Ghz;
        }
    } else {
        output.details.state = ValetudoWifiConfiguration.STATE.NOT_CONNECTED;
    }
    return new ValetudoWifiConfiguration(output);
}

module.exports = {
    getEmbeddedWirelessConfiguration: getEmbeddedWirelessConfiguration,
};
