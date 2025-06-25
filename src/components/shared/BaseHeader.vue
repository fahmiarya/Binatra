<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { createPopper } from '@popperjs/core'

const dropdownPopoverShow = ref(false)
const btnDropdownRef = ref(null)
const popoverDropdownRef = ref(null)

// ✅ Reactive data untuk jam dan tanggal
const currentTime = ref('')
const currentDate = ref('')
let timeInterval = null

// ✅ Function untuk format waktu dan tanggal
const updateDateTime = () => {
  const now = new Date()

  currentTime.value = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  currentDate.value = now.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const toggleDropdown = (event) => {
  event.preventDefault()
  if (dropdownPopoverShow.value) {
    dropdownPopoverShow.value = false
  } else {
    dropdownPopoverShow.value = true
    createPopper(btnDropdownRef.value, popoverDropdownRef.value, {
      placement: 'bottom-start',
    })
  }
}

onMounted(() => {
  // Update immediately
  updateDateTime()

  // Update setiap menit
  timeInterval = setInterval(updateDateTime, 60000)
})

// ✅ Cleanup interval saat component unmounted
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<template>
  <header class="w-full bg-white shadow p-4 z-10">
    <div class="w-full flex justify-between items-center">
      <div class="flex items-center justify-between w-[30%]">
        <img src="../../assets/images/binatra.jpeg" alt="Binatra Logo" class="h-10 mr-3" />
        <div class="flex gap-x-2 items-center">
          <!-- ✅ Gunakan data reactive untuk jam dan tanggal -->
          <p class="text-[#274C77] ml-4">{{ currentTime }}</p>
          <p class="text-[#274C77] ml-2">{{ currentDate }}</p>
        </div>
      </div>
      <div class="flex items-center">
        <h1 class="mr-10 text-[#274C77]">Dashboard Monitoring Banjir</h1>

        <div class="relative mr-4">
          <button class="flex items-center text-[#274C77]" @click="toggleDropdown" ref="btnDropdownRef">
            <i class="fa-solid fa-caret-down mr-2"></i>
            <span>Hi Binatra</span>
          </button>

          <!-- ⬇ Dropdown Menu -->
          <div
            ref="popoverDropdownRef"
            v-show="dropdownPopoverShow"
            class="z-50 bg-white text-sm text-left shadow rounded mt-2 py-2 min-w-[10rem] border"
          >
            <a href="#" class="block px-4 py-2 hover:bg-gray-100">Profil</a>
            <a href="#" class="block px-4 py-2 hover:bg-gray-100">Pengaturan</a>
            <a href="/" class="block px-4 py-2 hover:bg-gray-100">Logout</a>
          </div>
        </div>
        <div class="rounded-full bg-gray-300 overflow-hidden">
          <img src="../../assets/images/user.png" alt="User Avatar" />
        </div>
        <button class="ml-4">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </div>
  </header>
</template>
