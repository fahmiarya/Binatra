<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { createPopper } from '@popperjs/core'
import { useAccountStore } from '@/stores/accountStore'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'

const dropdownPopoverShow = ref(false)
const btnDropdownRef = ref(null)
const popoverDropdownRef = ref(null)
const isLoggingOut = ref(false)

const currentTime = ref('')
const currentDate = ref('')
let timeInterval = null

//  Function untuk format waktu dan tanggal
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

const accountStore = useAccountStore()
const router = useRouter()

const userName = computed(() => accountStore.user?.name || 'Pengguna')

const toggleDropdown = (event) => {
  event.preventDefault()
  if (isLoggingOut.value) return

  dropdownPopoverShow.value = !dropdownPopoverShow.value
  if (dropdownPopoverShow.value) {
    createPopper(btnDropdownRef.value, popoverDropdownRef.value, {
      placement: 'bottom-start',
    })
  }
}

// TAMBAH: Close dropdown ketika click outside
const closeDropdown = () => {
  dropdownPopoverShow.value = false
}

onMounted(() => {
  // Update immediately
  updateDateTime()
  // Update setiap menit
  timeInterval = setInterval(updateDateTime, 60000)

  // TAMBAH: Close dropdown saat click outside
  document.addEventListener('click', (e) => {
    if (!btnDropdownRef.value?.contains(e.target) && !popoverDropdownRef.value?.contains(e.target)) {
      closeDropdown()
    }
  })
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

const handleLogout = async () => {
  if (isLoggingOut.value) return

  isLoggingOut.value = true
  dropdownPopoverShow.value = false

  try {

    await accountStore.logout()

    // ✅ Redirect setelah logout selesai
    await router.replace('/sign-in')

  } catch (error) {
    toast.error('Logout gagal, silakan coba lagi')
    isLoggingOut.value = false
    throw error
  }
}
</script>

<template>
  <header class="w-full bg-white shadow p-4 z-10">
    <div class="w-full flex justify-between items-center">
      <div class="flex items-center justify-between w-[30%]">
        <img src="../../assets/images/binatra.jpeg" alt="Binatra Logo" class="h-10 mr-3" />
        <div class="flex gap-x-2 items-center">
          <p class="text-[#274C77] ml-4">{{ currentTime }}</p>
          <p class="text-[#274C77] ml-2">{{ currentDate }}</p>
        </div>
      </div>
      <div class="flex items-center">
        <h1 class="mr-10 text-[#274C77]">Dashboard Monitoring Banjir</h1>

        <div class="relative mr-4">
          <button
            class="flex items-center text-[#274C77] transition-opacity"
            :class="{ 'opacity-50 cursor-not-allowed': isLoggingOut }"
            :disabled="isLoggingOut"
            @click="toggleDropdown"
            ref="btnDropdownRef"
          >
            <i class="fa-solid fa-caret-down mr-2"></i>
            <span>Hi {{ userName }}</span>
          </button>

          <!-- ⬇ Dropdown Menu -->
          <div
            ref="popoverDropdownRef"
            v-show="dropdownPopoverShow"
            class="z-50 bg-white text-sm text-left shadow rounded mt-2 py-2 min-w-[10rem] border"
          >
            <button
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
              @click="handleProfile"
            >
              Profil
            </button>
            <button
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
              @click="handleSettings"
            >
              Pengaturan
            </button>
            <button
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-red-600"
              :class="{ 'opacity-50 cursor-not-allowed': isLoggingOut }"
              :disabled="isLoggingOut"
              @click="handleLogout"
            >
              <span v-if="isLoggingOut">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                Logging out...
              </span>
              <span v-else>Logout</span>
            </button>
          </div>
        </div>

        <div class="rounded-full bg-gray-300 overflow-hidden">
          <img src="../../assets/images/user.png" alt="User Avatar" />
        </div>

        <!-- <button
          class="ml-4 cursor-pointer transition-colors hover:text-red-600"
          :class="{ 'opacity-50 cursor-not-allowed': isLoggingOut }"
          :disabled="isLoggingOut"
          @click="handleLogout"
        >
          <i v-if="isLoggingOut" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-arrow-right-from-bracket"></i>
        </button> -->
      </div>
    </div>
  </header>
</template>
