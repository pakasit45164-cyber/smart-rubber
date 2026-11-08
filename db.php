<?php
$host = "localhost";
$username = "root";
$password = ""; // ค่าเริ่มต้นของ XAMPP รหัสผ่านจะว่างไว้
$database = "smart_rubber_db";

// สร้างการเชื่อมต่อ
$conn = new mysqli($host,$username, $password,$database);

// ตรวจสอบการเชื่อมต่อ
if ($conn->connect_error) {
    die("เชื่อมต่อฐานข้อมูลล้มเหลว: " . $conn->connect_error);
}

// กำหนดรองรับภาษาไทย (UTF-8)
$conn->set_charset("utf8mb4");
?>