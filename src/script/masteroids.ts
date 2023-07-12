import { error } from "./lib/util"

class TextClient {

    log: HTMLElement
    input: HTMLInputElement

    connection: RTCPeerConnection
    textChannel: RTCDataChannel

    protected constructor(
        log: HTMLElement,
        input: HTMLInputElement,
        connection: RTCPeerConnection,
        textChannel: RTCDataChannel,
    ) {
        this.log = log
        this.input = input
        this.connection = connection
        this.textChannel = textChannel
    }

    public static async initialize(log: HTMLElement, input: HTMLInputElement): Promise<TextClient> {
        const tc = new TextClient(log, input, ...(await TextClient.connect()))
        input.addEventListener("keypress", (e) => {
            if (e.key == "Enter") {
                tc.message("self", input.value)
            }
        })
        return tc
    }

    public message(author: string, message: string): void {
        this.log.textContent += `${author}: ${message}\n`
    }

    private static async connect(): Promise<[RTCPeerConnection, RTCDataChannel]> {
        const connection = new RTCPeerConnection()
        const channel = connection.createDataChannel("text")

        connection.addEventListener("icecandidate", handleIceCandidate)
        await connection.createOffer()

        return [connection, channel]
    }
}

async function handleIceCandidate(event: RTCPeerConnectionIceEvent) {
    const connection = event.target as RTCPeerConnection
    if (event.candidate) {
        try {
            connection.addIceCandidate(event.candidate)
        } catch (err) {
            error(err)
        }
    }
}

window.addEventListener("load", () => TextClient.initialize(
    document.querySelector("#log") ?? error("Could not find log"),
    document.querySelector("input#input") ?? error("Could not find input")
))
