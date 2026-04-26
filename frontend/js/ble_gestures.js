const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

async function connectTWatch() {
    try {
        console.log('Requesting T-Watch S3 Bluetooth Device...');
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'FRANK_TWATCH' }],
            optionalServices: [SERVICE_UUID]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleGesture);
        console.log('T-Watch Connected & Listening for Gestures');
    } catch (error) {
        console.error('BLE Connection failed', error);
    }
}

function handleGesture(event) {
    const value = new TextDecoder().decode(event.target.value);
    console.log(`Gesture Received: ${value}`);
    
    // Send to backend
    fetch('http://localhost:8000/swarm/gesture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imu_data: { gesture: value }, user_id: 'admin' })
    });
}

document.getElementById('btnBle').addEventListener('click', connectTWatch);
