<?php
// รวมไฟล์เชื่อมต่อฐานข้อมูล
include 'db.php';

// ตั้งค่าให้รองรับการรับข้อมูลแบบ JSON (ที่อุปกรณ์ IoT มักจะส่งมา)
header('Content-Type: application/json; charset=utf-8');

// ตรวจสอบว่าเป็น Method POST หรือไม่
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // รับข้อมูลแบบ JSON หรือแบบ Form-data
    $inputJSON = file_get_contents('php://input');
    $data = json_decode($inputJSON, true);

    // ถ้าส่งมาเป็นแบบ Form-data ปกติ ให้ดึงผ่าน $_POST แทน
    $device_id = $data['device_id'] ?? $_POST['device_id'] ?? '';
    $temperature = $data['temperature'] ?? $_POST['temperature'] ?? null;
    $humidity = $data['humidity'] ?? $_POST['humidity'] ?? null;
    $rubber_flow = $data['rubber_flow'] ?? $_POST['rubber_flow'] ?? null; // ตัวอย่างเช่น ค่าจากเซ็นเซอร์น้ำยาง

    // ตรวจสอบว่ามีข้อมูลสำคัญครบถ้วนไหม
    if (!empty($device_id)) {
        // เตรียมคำสั่ง SQL สำหรับบันทึกลงตาราง (สมมติว่ามีตารางชื่อ sensor_logs)
        $sql = "INSERT INTO sensor_logs (device_id, temperature, humidity, rubber_flow) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sddd", $device_id, $temperature, $humidity, $rubber_flow);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "บันทึกข้อมูล IoT สำเร็จ"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้"]);
        }

        $stmt->close();
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ข้อมูลไม่ครบถ้วน (ต้องมี device_id)"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method ไม่ถูกต้อง (ต้องใช้ POST เท่านั้น)"]);
}

$conn->close();
?>