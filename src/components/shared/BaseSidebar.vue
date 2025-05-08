<script setup>
// const sideBarItems = ref([
//   {
//     name : "Dashboard",

//   }
// ])
</script>

<template>
        <aside class="w-64 text-gray-800 shadow-md">
        <div class="p-4">
          <nav class="space-y-1">
            <a href="#" class="flex items-center p-3 bg-blue-800 text-white rounded-lg">
              <span class="mr-3">
                <i class="fas fa-home"></i>
              </span>
              Dashboard
            </a>

            <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <span class="mr-3">
                <i class="fas fa-building"></i>
              </span>
              Pemerintah Kota
            </a>

            <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <span class="mr-3">
                <i class="fas fa-hard-hat"></i>
              </span>
              Dinas Pekerjaan Umum (PU)
            </a>

            <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <span class="mr-3">
                <i class="fas fa-car"></i>
              </span>
              Dinas Perhubungan (Dishub)
            </a>

            <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <span class="mr-3">
                <i class="fas fa-chart-line"></i>
              </span>
              BPBD Jawa Timur
            </a>

            <div class="mt-auto pt-20">
              <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                <span class="mr-3">
                  <i class="fas fa-cog"></i>
                </span>
                Setting
              </a>
            </div>
          </nav>
        </div>
      </aside>
</template>
