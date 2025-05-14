<template>
  <div class="min-h-screen bg-[#E7ECEF] overflow-hidden">
    <sidebar />
    <admin-navbar />

    <div class="relative md:ml-80 mt-36 border-1">
      <div class="px-4 md:px-10 mx-auto w-full">
        <router-view />
      </div>
    </div>
  </div>
</template>
<script>
import AdminNavbar from '@/components/Navbars/AdminNavbar.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
export default {
  name: 'admin-layout',
  components: {
    AdminNavbar,
    Sidebar,
  },
}
</script>
