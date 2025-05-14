<template>
  <nav
    class="md:left-0 md:block md:fixed md:top-0 md:bottom-0 md:overflow-y-auto md:flex-row md:flex-nowrap md:overflow-hidden bg-transparent -ml-6 mt-10 flex flex-wrap items-center justify-between relative md:w-64 z-10 py-4 px-2"
  >
    <div
      class="md:flex-col md:items-stretch md:min-h-full md:flex-nowrap px-0 flex flex-wrap items-center justify-between w-full mx-auto"
    >
      <!-- Toggler -->

      <!-- Brand -->
      <!-- User -->

      <!-- Collapse -->
      <div
        class="md:flex md:flex-col md:items-stretch md:opacity-100 md:relative md:mt-4 md:shadow-none shadow absolute top-0 left-0 right-0 z-40 overflow-y-auto overflow-x-hidden h-auto items-center flex-1 rounded"
        v-bind:class="collapseShow"
      >
        <!-- Collapse header -->

        <!-- Form -->
        <div class="mt-6 mb-4 md:hidden">
          <div class="mb-3 pt-0">
            <h1>Dashboard Monitoring Banjir</h1>
          </div>
        </div>

        <!-- Divider -->
        <!-- Heading -->
        <!-- Navigation -->

        <ul class="md:flex-col md:min-w-full flex flex-col list-none mt-20">
          <li class="items-center mb-3">
            <router-link to="/admin/dashboard" v-slot="{ href, navigate, isActive }">
              <a
                :href="href"
                @click="navigate"
                class="text-sm pl-24 py-3 font-bold block"
                :class="[
                  isActive
                    ? 'text-white bg-[#274C77] rounded-2xl pl-24 hover:text-white hover:bg-[#6699D5]'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-tv mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                Dashboard
              </a>
            </router-link>
          </li>

          <li class="items-center mb-3">
            <router-link to="/admin/settings" v-slot="{ href, navigate, isActive }">
              <a
                :href="href"
                @click="navigate"
                class="text-sm pl-24 py-3 font-bold block"
                :class="[
                  isActive
                    ? 'text-white bg-[#274C77] rounded-2xl pl-24 hover:text-white hover:bg-[#6699D5]'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-tools mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                Pemerintah Kota
              </a>
            </router-link>
          </li>

          <li class="items-center">
            <router-link to="/admin/tables" v-slot="{ href, navigate, isActive }">
              <a
                :href="href"
                @click="navigate"
                class="text-sm pl-24 py-3 font-bold block"
                :class="[
                  isActive
                    ? 'text-white bg-[#274C77] rounded-2xl pl-24 hover:text-white hover:bg-[#6699D5]'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-table mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                Dinas PU
              </a>
            </router-link>
          </li>

          <li class="items-center">
            <router-link to="/admin/maps" v-slot="{ href, navigate, isActive }">
              <a
                :href="href"
                @click="navigate"
                class="text-sm pl-24 py-3 font-bold block"
                :class="[
                  isActive
                    ? 'text-white bg-[#274C77] rounded-2xl pl-24 hover:text-white hover:bg-[#6699D5]'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-map-marked mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                Dinas Perhubungan
                <span class="ml-2">(DISHUB)</span>
              </a>
            </router-link>
          </li>

          <li class="items-center">
            <router-link to="/admin/tables" v-slot="{ href, navigate, isActive }">
              <a
                :href="href"
                @click="navigate"
                class="text-sm pl-24 py-3 font-bold block"
                :class="[
                  isActive
                    ? 'text-white bg-[#274C77] rounded-2xl pl-24 hover:text-white hover:bg-[#6699D5]'
                    : 'text-blueGray-700 hover:text-blueGray-500',
                ]"
              >
                <i
                  class="fas fa-table mr-2 text-sm"
                  :class="[isActive ? 'opacity-75' : 'text-blueGray-300']"
                ></i>
                BPBD Jawa Timur
              </a>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
); }

<script>
// import NotificationDropdown from '@/components/Dropdowns/NotificationDropdown.vue'
// import UserDropdown from '@/components/Dropdowns/UserDropdown.vue'

// export default {
//   data() {
//     return {
//       collapseShow: 'hidden',
//     }
//   },
//   methods: {
//     toggleCollapseShow: function (classes) {
//       this.collapseShow = classes
//     },
//   },
//   components: {
//     NotificationDropdown,
//     UserDropdown,
//   },
// }
</script>
