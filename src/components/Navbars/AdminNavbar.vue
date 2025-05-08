<template>
  <!-- Navbar -->
  <nav
    class="absolute top-0 left-0 w-full z-10 bg-white md:flex-row md:flex-nowrap md:justify-start flex items-center p-2 rounded-b-4xl shadow-lg"
  >
    <router-link class="md:block md:pb-2 mr-0 ml-10 inline-block whitespace-nowrap p-4 px-0" to="/">
      <span>
        <img class="w-30 h-12" src="@/assets/logo Bina.svg" alt="Logo Binatra" />
      </span>
    </router-link>
    <div class="ml-60 flex flex-row items-center whitespace-nowrap">
      <span class="text-md font-medium text-gray-700">00:00</span>
      <span class="text-md font-medium text-gray-700 ml-5">Jumat, 9 Mei 2025</span>
    </div>
    <div
      class="w-full mx-auto items-center flex justify-between md:flex-nowrap flex-wrap md:px-10 px-4"
    >
      <!-- Brand -->
      <a
        class="text-white text-sm uppercase hidden lg:inline-block font-semibold"
        href="javascript:void(0)"
      >
        Dashboard
      </a>
      <!-- Form -->
      <form class="md:flex hidden flex-row flex-wrap items-center lg:ml-auto mr-3">
        <div class="relative flex w-full flex-wrap items-stretch">
          <span
            class="z-10 h-full leading-snug font-normal absolute text-center text-blueGray-300 absolute bg-transparent rounded text-base items-center justify-center w-8 pl-3 py-3"
          >
            <i class="fas fa-search"></i>
          </span>
          <h1 class="font-semibold">Dashboard Monitoring Banjir</h1>
        </div>
      </form>
      <!-- User -->
      <ul class="flex-col md:flex-row list-none items-center hidden md:flex">
        <user-dropdown />
      </ul>
    </div>
  </nav>
  <!-- End Navbar -->
</template>

<script>
import UserDropdown from '@/components/Dropdowns/UserDropdown.vue'

export default {
  components: {
    UserDropdown,
  },
}
</script>
