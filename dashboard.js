// ==========================================
// 0. ระบบขอสิทธิ์และการเปิด-ปิดการแจ้งเตือน
// ==========================================
function requestNotificationPermission() {
    if ("Notification" in window) {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }
}
requestNotificationPermission();

function getNotificationStatus() {
    return localStorage.getItem('rainNotification') !== 'disabled';
}

function toggleNotifications() {
    const isCurrentlyEnabled = getNotificationStatus();
    const bellIcon = document.getElementById('bell-icon');

    if (isCurrentlyEnabled) {
        localStorage.setItem('rainNotification', 'disabled');
        if (bellIcon) {
            bellIcon.className = "fa-solid fa-bell-slash text-xl cursor-pointer text-red-300 transition";
            bellIcon.title = "ปิดการแจ้งเตือนอยู่ (คลิกเพื่อเปิด)";
        }
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'ปิดการแจ้งเตือนฝนตกแล้ว',
            showConfirmButton: false,
            timer: 2000
        });
    } else {
        localStorage.setItem('rainNotification', 'enabled');
        if (bellIcon) {
            bellIcon.className = "fa-regular fa-bell text-xl cursor-pointer hover:text-emerald-200 transition";
            bellIcon.title = "เปิดการแจ้งเตือนอยู่ (คลิกเพื่อปิด)";
        }
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'เปิดการแจ้งเตือนฝนตกแล้ว',
            showConfirmButton: false,
            timer: 2000
        });
    }
}

// ==========================================
// 1. ระบบ Auth Guard & Logout
// ==========================================
async function checkAuthSession() {
    const { data: { session }, error } = await _supabase.auth.getSession();
    if (!session) {
        window.location.replace('index.html');
    }
}
checkAuthSession();

async function handleLogout() {
    Swal.fire({
        title: 'ออกจากระบบ?',
        text: "คุณต้องการออกจากระบบ Smart Rubber ใช่หรือไม่",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1b5e20',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, ออกจากระบบ',
        cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await _supabase.auth.signOut();
            window.location.replace('index.html');
        }
    });
}

// ==========================================
// 2. ตัวแปร & ฟังก์ชันช่วยเหลือสำหรับ UI
// ==========================================
let cardElementRef = null;

function scrollHourly(direction) {
    const container = document.getElementById('hourly-container');
    container.scrollBy({ left: direction * 160, behavior: 'smooth' });
}

function scrollToCurrentHour() {
    const container = document.getElementById('hourly-container');
    if (cardElementRef) {
        let offsetAdjustment = container.offsetWidth / 2 - cardElementRef.offsetWidth / 2;
        container.scrollTo({
            left: cardElementRef.offsetLeft - container.offsetLeft - offsetAdjustment,
            behavior: 'smooth'
        });
    }
}

function getWeatherIcon(rainProb) {
    if (rainProb > 60) return '<i class="fa-solid fa-cloud-bolt text-indigo-600 text-lg md:text-xl"></i>';
    if (rainProb > 30) return '<i class="fa-solid fa-cloud-rain text-blue-500 text-lg md:text-xl"></i>';
    if (rainProb > 10) return '<i class="fa-solid fa-cloud-sun text-yellow-600 text-lg md:text-xl"></i>';
    return '<i class="fa-solid fa-sun text-yellow-500 text-lg md:text-xl"></i>';
}

// ==========================================
// 3. ระบบแจ้งเตือนฝนตกอัจฉริยะ (Rain Alert)
// ==========================================
function checkRainAlert(hourlyData, currentHourIndex) {
    if (!getNotificationStatus()) return;
    if (sessionStorage.getItem('rainAlertShown')) return;

    let willRain = false;
    let maxRainChance = 0;
    let rainTime = "";

    for (let i = currentHourIndex; i < currentHourIndex + 3; i++) {
        if (hourlyData.precipitation_probability[i] > 60) {
            willRain = true;
            if (hourlyData.precipitation_probability[i] > maxRainChance) {
                maxRainChance = hourlyData.precipitation_probability[i];
                rainTime = hourlyData.time[i].split('T')[1]; 
            }
        }
    }

    if (willRain) {
        Swal.fire({
            title: '⚠️ แจ้งเตือนพายุฝน!',
            html: `ระบบตรวจพบโอกาสเกิดฝน <b>${maxRainChance}%</b><br>ในช่วงเวลา <b>${rainTime} น.</b><br><br><span style="color:#d32f2f; font-size:14px;">แนะนำให้งดกรีดยาง หรือเตรียมทายากันน้ำหล่อเลี้ยงหน้ายาง</span>`,
            icon: 'warning',
            confirmButtonColor: '#1b5e20',
            confirmButtonText: 'รับทราบ',
            backdrop: `rgba(0,0,0,0.6)`
        });
        
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🌧️ Smart Rubber เตือนภัยฝนตก!", {
                body: `ตรวจพบโอกาสเกิดฝน ${maxRainChance}% ในช่วงเวลา ${rainTime} น. แนะนำให้งดกรีดยาง`,
                icon: "https://cdn-icons-png.flaticon.com/512/1146/1146869.png"
            });
        }

        sessionStorage.setItem('rainAlertShown', 'true');
    }
}

// ==========================================
// 4. ระบบดึงข้อมูลสภาพอากาศ (Weather API)
// ==========================================
function initLocationWeather() {
    const gpsIcon = document.getElementById('gps-icon');
    if(gpsIcon) gpsIcon.className = "fa-solid fa-spinner fa-spin";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchOpenMeteoWeather(position.coords.latitude, position.coords.longitude);
                setTimeout(() => { if(gpsIcon) gpsIcon.className = "fa-solid fa-location-crosshairs"; }, 1000);
            },
            (error) => {
                fetchOpenMeteoWeather(16.4322, 103.5065, "กาฬสินธุ์");
                if(gpsIcon) gpsIcon.className = "fa-solid fa-location-crosshairs";
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        fetchOpenMeteoWeather(16.4322, 103.5065, "กาฬสินธุ์");
    }
}

async function fetchOpenMeteoWeather(lat, lon, customName = "") {
    try {
        const windyMap = document.getElementById('windy-map');
        if(windyMap) windyMap.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=8&level=surface&overlay=rain&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

        if (!customName) {
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=th`);
                const geoData = await geoRes.json();
                const address = geoData.address;
                document.getElementById('location-name').innerText = address.suburb || address.village || address.district || address.city || "ตำแหน่งของคุณ";
            } catch (e) {
                document.getElementById('location-name').innerText = `พิกัด: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
            }
        } else {
            document.getElementById('location-name').innerText = customName;
        }

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto`);
        const data = await response.json();

        if (data && data.current) {
            const now = new Date();
            const currentHour = now.getHours();
            const todayDateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            const currentHourIndex = data.hourly.time.findIndex(t => t.startsWith(todayDateString) && parseInt(t.split('T')[1].split(':')[0], 10) === currentHour);
            const currentRainChance = currentHourIndex !== -1 ? data.hourly.precipitation_probability[currentHourIndex] : 0;
            
            document.getElementById('temp-display').innerText = Math.round(data.current.temperature_2m);
            document.getElementById('desc-display').innerText = currentRainChance > 60 ? "ฝนฟ้าคะนอง" : (currentRainChance > 30 ? "มีฝนตก" : "แจ่มใส");
            document.getElementById('weather-fa-icon').className = currentRainChance > 60 ? "fa-solid fa-cloud-bolt text-indigo-600" : (currentRainChance > 30 ? "fa-solid fa-cloud-rain text-blue-500" : "fa-solid fa-sun text-yellow-500");
            document.getElementById('rain-text').innerText = `โอกาสเกิดฝน ${currentRainChance}%`;

            const alertBox = document.getElementById('rain-alert-box');
            const statusText = document.getElementById('rain-status');
            if (currentRainChance <= 30) {
                alertBox.className = "bg-emerald-600 text-white text-xs md:text-sm px-3.5 py-2 rounded-xl flex justify-between items-center shadow-sm";
                statusText.innerText = "ปลอดภัย";
            } else if (currentRainChance <= 60) {
                alertBox.className = "bg-amber-500 text-white text-xs md:text-sm px-3.5 py-2 rounded-xl flex justify-between items-center shadow-sm";
                statusText.innerText = "เฝ้าระวัง";
            } else {
                alertBox.className = "bg-red-600 text-white text-xs md:text-sm px-3.5 py-2 rounded-xl flex justify-between items-center shadow-sm animate-pulse";
                statusText.innerText = "อันตราย/งดกรีด";
            }

            if(currentHourIndex !== -1) {
                checkRainAlert(data.hourly, currentHourIndex);
            }

            const hourlyContainer = document.getElementById('hourly-container');
            hourlyContainer.innerHTML = "";
            cardElementRef = null;

            data.hourly.time.forEach((timeStr, index) => {
                const [datePart, timePart] = timeStr.split('T');
                const hourPart = parseInt(timePart.split(':')[0], 10);
                const itemTime = new Date(timeStr.replace(' ', 'T'));
                const timeString = `${String(hourPart).padStart(2, '0')}:00`;
                const dateString = itemTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                const rainProb = data.hourly.precipitation_probability[index] || 0;
                const isExactCurrent = (datePart === todayDateString && hourPart === currentHour);

                const card = document.createElement('div');
                card.className = `flex flex-col items-center justify-center px-4 py-3.5 rounded-2xl min-w-[80px] shrink-0 border transition ${
                    isExactCurrent ? 'bg-emerald-50/90 border-emerald-300 shadow-sm ring-2 ring-emerald-400' : 'bg-gray-50/60 border-gray-100 hover:bg-gray-100'
                }`;

                card.innerHTML = `
                    <span class="text-[10px] ${isExactCurrent ? 'text-emerald-700 font-bold animate-pulse' : 'text-gray-400'} mb-0.5">${isExactCurrent ? '● ตอนนี้' : dateString}</span>
                    <span class="text-xs font-semibold text-gray-700 mb-1">${timeString}</span>
                    ${getWeatherIcon(rainProb)}
                    <span class="text-xs md:text-sm font-bold text-gray-800 my-1">${Math.round(data.hourly.temperature_2m[index])}°</span>
                    <span class="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full"><i class="fa-solid fa-droplet text-[8px]"></i> ${rainProb}%</span>
                `;

                if (isExactCurrent) cardElementRef = card;
                hourlyContainer.appendChild(card);
            });

            setTimeout(scrollToCurrentHour, 150);

            const dailyContainer = document.getElementById('daily-container');
            dailyContainer.innerHTML = "";
            const daysOfWeek = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์"];

            data.daily.time.forEach((dayStr, i) => {
                if (i >= 7) return;
                const dateObj = new Date(dayStr);
                const pop = data.daily.precipitation_probability_max[i] || 0;
                const row = document.createElement('div');
                row.className = "flex justify-between items-center text-xs md:text-sm py-2 border-b border-gray-50";
                row.innerHTML = `
                    <span class="w-24 font-medium text-gray-800">${i === 0 ? "วันนี้" : daysOfWeek[dateObj.getDay()]}</span>
                    <span class="text-blue-500 text-xs md:text-sm"><i class="fa-solid fa-droplet text-[10px]"></i> ${pop}%</span>
                    <div>${getWeatherIcon(pop)}</div>
                    <span class="text-gray-700 font-medium">${Math.round(data.daily.temperature_2m_max[i])}° / <span class="text-gray-400">${Math.round(data.daily.temperature_2m_min[i])}°</span></span>
                `;
                dailyContainer.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Weather Fetch Error: ", error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const bellIcon = document.getElementById('bell-icon');
    if (bellIcon) {
        if (getNotificationStatus()) {
            bellIcon.className = "fa-regular fa-bell text-xl cursor-pointer hover:text-emerald-200 transition";
            bellIcon.title = "เปิดการแจ้งเตือนอยู่ (คลิกเพื่อปิด)";
        } else {
            bellIcon.className = "fa-solid fa-bell-slash text-xl cursor-pointer text-red-300 transition";
            bellIcon.title = "ปิดการแจ้งเตือนอยู่ (คลิกเพื่อเปิด)";
        }
    }
    initLocationWeather();
});