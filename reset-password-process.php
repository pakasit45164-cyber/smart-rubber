<?php
// เชื่อมต่อฐานข้อมูล
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $phone = $_POST['phone'];
    $newPassword = $_POST['newPassword'];

    // เพื่อความปลอดภัย แนะนำให้เข้ารหัสผ่านด้วย password_hash (ถ้าต้องการ)
    // แต่ถ้าแบบธรรมดา สามารถใช้ตัวแปร $newPassword ตรงๆ ได้เลยครับ
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // คำสั่ง SQL อัปเดตรหัสผ่านใหม่ โดยใช้เบอร์โทรเป็นตัวค้นหาบัญชี
    $sql = "UPDATE users SET password = ? WHERE phone = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $hashedPassword, $phone);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "เปลี่ยนรหัสผ่านสำเร็จ รหัสเก่าถูกยกเลิกแล้ว"]);
    } else {
        echo json_encode(["status" => "error", "message" => "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน"]);
    }

    $stmt->close();
    $conn->close();
}
?>