<script setup>
import { ref, computed } from 'vue'
import { createPopper } from '@popperjs/core'
import { useAccountStore } from '@/stores/accountStore'
import { useRouter } from 'vue-router'

const dropdownPopoverShow = ref(false)
const btnDropdownRef = ref(null)
const popoverDropdownRef = ref(null)

const accountStore = useAccountStore()
const router = useRouter()

const userName = computed(() => accountStore.user?.name || 'Pengguna')

const toggleDropdown = (event) => {
  event.preventDefault()
  dropdownPopoverShow.value = !dropdownPopoverShow.value
  if (dropdownPopoverShow.value) {
    createPopper(btnDropdownRef.value, popoverDropdownRef.value, {
      placement: 'bottom-start',
    })
  }
}

const handleLogout = () => {
  accountStore.logout()
  router.push('/')
}
</script>

<template>
  <header class="w-full bg-white shadow p-4 z-10">
    <div class="w-full flex justify-between items-center">
      <div class="flex items-center justify-between w-[30%]">
        <img src="../../assets/images/binatra.jpeg" alt="Binatra Logo" class="h-10 mr-3" />
        <div class="flex gap-x-2 items-center">
          <p class="text-[#274C77] ml-4">11:13 PM</p>
          <p class="text-[#274C77] ml-2">Rabu, 29 January, 2025</p>
        </div>
      </div>
      <div class="flex items-center">
        <h1 class="mr-10 text-[#274C77]">Dashboard Monitoring Banjir</h1>

        <div class="relative mr-4">
          <button
            class="flex items-center text-[#274C77]"
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
            <a href="#" class="block px-4 py-2 hover:bg-gray-100">Profil</a>
            <a href="#" class="block px-4 py-2 hover:bg-gray-100">Pengaturan</a>
            <a href="#" class="block px-4 py-2 hover:bg-gray-100" @click.prevent="handleLogout"
              >Logout</a
            >
          </div>
        </div>
        <div class="rounded-full bg-gray-300 overflow-hidden">
          <img src="../../assets/images/user.png" alt="User Avatar" />
        </div>
        <button class="ml-4 cursor-pointer" @click="handleLogout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </div>
  </header>
</template>
