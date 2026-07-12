import socket
import struct

def main():
    print("Listening for UDP on 5005...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 5005))
    sock.settimeout(5.0)
    try:
        data, addr = sock.recvfrom(1024)
        print(f"Received {len(data)} bytes from {addr}")
        if len(data) >= 20:
            magic = struct.unpack_from('<I', data, 0)[0]
            if magic == 0xC5110001:
                print("Magic matches! ESP32 is working.")
            else:
                print(f"Unknown magic: {hex(magic)}")
    except socket.timeout:
        print("Timeout! No packets received. Firewall issue or AP isolation.")
    except OSError as e:
        print(f"OSError: {e}")

if __name__ == "__main__":
    main()
