<?php

declare(strict_types=1);

/**
 * ค่าเชื่อมต่อ MySQL สำหรับ XAMPP (ค่าเริ่มต้น user root ไม่มีรหัสผ่าน)
 * แก้ให้ตรงกับเครื่องก่อนเรียก api_insert_sensor.php
 */
return [
    'host' => '127.0.0.1',
    'dbname' => 'smart_rubber',
    'user' => 'root',
    'pass' => '',
    'charset' => 'utf8mb4',
];
