const SUPABASE_URL = 'https://uewcexwiavfpkgrxvfvj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FreYl_7eN2XkkJ4gGbHmjw_YSCxjvq3';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. ฟังก์ชันสำหรับดึงข้อมูลล่าสุดมาแสดงผล
async function fetchSensorData() {
    try {
        const { data, error } = await _supabase
            .from('sensor_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Supabase Error:", error.message);
            return;
        }

        if (data) {
            console.log("ข้อมูลเซ็นเซอร์ล่าสุด:", data);
            
            // อัปเดตค่าอุณหภูมิบนหน้าเว็บ
            const tempDisplay = document.getElementById('temp-display');
            if (tempDisplay && data.temperature) {
                tempDisplay.innerText = Math.round(data.temperature);
            }

            // (ถ้ามี element ความชื้นหรือน้ำยาง สามารถเพิ่มตรงนี้ได้เลย)
        }
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลจาก Supabase:", err);
    }
}

// 2. เรียกใช้งานฟังก์ชันครั้งแรกตอนโหลดหน้าเว็บ
fetchSensorData();

// 3. ตั้งค่าระบบ Realtime ฟังการเปลี่ยนแปลงของตาราง sensor_logs
const channel = _supabase
    .channel('table-db-changes')
    .on(
        'postgres_changes',
        {
            event: 'INSERT', // รอฟังเหตุการณ์เมื่อมีข้อมูลใหม่ถูกเพิ่มเข้ามา
            schema: 'public',
            table: 'sensor_logs'
        },
        (payload) => {
            console.log('มีข้อมูลใหม่เข้ามาแบบ Realtime!', payload.new);
            
            // เมื่อมีข้อมูลใหม่เข้ามา ให้ดึงข้อมูลล่าสุดมาแสดงผลทันที
            fetchSensorData();
        }
    )
    .subscribe();